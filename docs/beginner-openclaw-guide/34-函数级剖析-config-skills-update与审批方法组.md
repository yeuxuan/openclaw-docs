# 34 函数级剖析 config skills update 与审批方法组

核心文件：
- `src/gateway/server-methods/config.ts`
- `src/gateway/server-methods/skills.ts`
- `src/gateway/server-methods/update.ts`
- `src/gateway/server-methods/exec-approvals.ts`
- `src/gateway/server-methods/exec-approval.ts`

## 步骤一：执行链路拆解（控制开关）

1. 配置读取：`config.get` / `config.schema`
2. 配置写入：`config.set` / `config.patch` / `config.apply`
3. 技能管理：`skills.status` / `skills.bins` / `skills.install` / `skills.update`
4. 更新执行：`update.run`
5. 审批配置：`exec.approvals.get/set`、`exec.approvals.node.get/set`
6. 运行时审批流：`exec.approval.request/waitDecision/resolve`

## 步骤二：细粒度拆解（为什么安全）

### A. `config.*` 的并发保护：`baseHash`

写配置前会检查调用方提供的 `baseHash` 是否与当前文件一致：
- 一致：允许写
- 不一致：拒绝并提示“重新拉取 config.get”

这是标准的乐观并发控制，防止多人覆盖彼此配置。

### B. `config.patch` vs `config.apply` vs `config.set`

1. `config.set`
- 整体替换（raw 配置）

2. `config.patch`
- merge-patch 到现有配置，再做迁移和校验

3. `config.apply`
- 类似 set，但走 apply 语义（统一恢复脱敏字段 + 校验 + 写入）

共同点：
- 都会先恢复 redacted 字段
- 都会经过插件增强 schema 校验
- 成功后可写 restart sentinel 并调度重启

### C. `skills.*`

`skills.status`：按 agent workspace 汇总技能状态。  
`skills.bins`：收集技能依赖命令。  
`skills.install`：走安装流程（含超时）。  
`skills.update`：更新 enabled/apiKey/env 并写回配置。

### D. `update.run`

更新不是直接“改版本号”，而是调用更新执行器：
- 记录 step 级执行结果
- 生成 restart sentinel（携带 before/after/steps）
- 安排网关重启

### E. exec approvals 两条线

1. 配置线（`exec.approvals.*`）
- 管理审批配置文件（含 hash 并发保护）

2. 运行时审批线（`exec.approval.*`）
- `request` 创建待审批项并广播
- `waitDecision` 挂起等待
- `resolve` 由授权方给出 allow/deny

`ExecApprovalManager` 用 pending map + timeout + grace period 保证：
- 不会无限挂起
- 迟到查询仍能拿到短时间缓存结果


