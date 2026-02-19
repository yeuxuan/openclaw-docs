# 04 工具与审批安全框架（tool policy + exec approval）

## 小白先懂（30秒）

- 这套模块就是“工具防火墙 + 人工闸门”。  
- 先决定哪些工具可用，再决定高风险命令是否需要人工同意。  
- 没被明确允许的能力，默认不要放行。

## 你先照着做（不求全懂）

1. 先实现工具白名单过滤（不做审批也行）。  
2. 再实现 `needsApproval(command)`。  
3. 需要审批时，先创建审批记录再返回“等待中”。  
4. 收到 `approve/deny` 后再继续执行或拒绝。

对应核心代码：
- `src/agents/pi-tools.ts`
- `src/agents/tool-policy-pipeline.ts`
- `src/infra/exec-approvals.ts`
- `src/gateway/exec-approval-manager.ts`
- `src/gateway/server-methods/exec-approval.ts`

## 步骤一：执行链路拆解（具体到函数）

1. 构建工具全集  
`createOpenClawCodingTools(...)` 先聚合 core + channel + plugin 工具。
2. 策略过滤  
`applyToolPolicyPipeline(...)` 按多层策略逐步过滤最终可用工具。
3. 执行前审批判定  
`resolveExecApprovals(...)` + `requiresExecApproval(...)` 判断是否必须审批。
4. 网关审批流程  
`exec.approval.request` -> `ExecApprovalManager.register(...)` -> 等待决策。
5. 决策回传  
审批端调用 `exec.approval.resolve`，网关唤醒等待方继续执行/拒绝。

## 步骤二：实现细节（真正会踩坑的点）

1. 工具策略流水线顺序（核心）
- `tools.profile`
- `tools.providerProfiles`
- `tools.allow`
- `tools.providers.*`
- `agents.*.tools`
- `group tools.allow`
- `sandbox tools.allow`
- `subagent tools.allow`

顺序错了会出现“上层规则被下层意外放开”。

2. `ExecApprovalManager` 的状态机
- `create(...)`：生成 `id/createdAtMs/expiresAtMs`
- `register(...)`：同步放入 pending map，返回 decision Promise
- `resolve(...)`：写入决策并 resolve Promise
- timeout：自动 resolve `null`

3. 两阶段调用为什么要保留宽限期
- `request` 先返回 accepted，客户端可能稍后才 `waitDecision`。
- 立即删除会导致 `waitDecision` 偶发查不到。
- 所以源码里用 `RESOLVED_ENTRY_GRACE_MS` 短暂保留。

4. 审批协议（简化示例）

```json
// request
{ "method": "exec.approval.request", "params": { "command": "rm -rf /tmp/x", "timeoutMs": 120000 } }
```

```json
// resolve
{ "method": "exec.approval.resolve", "params": { "id": "approval-123", "decision": "deny" } }
```

5. 安全默认值
- `security=deny` 是最安全起点。
- `ask=on-miss` 常用于 allowlist 模式。
- 审批链路异常时走 fallback，不应默认放行。

## 最小复刻骨架（含幂等与超时）

```ts
type Decision = "allow" | "deny" | null;
type Entry = { done: (d: Decision) => void; resolved: boolean; timer: NodeJS.Timeout };
const pending = new Map<string, Entry>();

function registerApproval(id: string, timeoutMs: number): Promise<Decision> {
  const existing = pending.get(id);
  if (existing && !existing.resolved) {
    return new Promise((resolve) => {
      const prevDone = existing.done;
      existing.done = (d) => {
        prevDone(d);
        resolve(d);
      };
    });
  }
  return new Promise((resolve) => {
    const entry: Entry = {
      resolved: false,
      done: (d) => resolve(d),
      timer: setTimeout(() => {
        if (entry.resolved) return;
        entry.resolved = true;
        entry.done(null);
      }, timeoutMs),
    };
    pending.set(id, entry);
  });
}
```


