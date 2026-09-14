---
title: "执行工具"
sidebarTitle: "执行工具"
description: "OpenClaw exec 工具：运行 shell 命令、选择 sandbox/Gateway/Node、处理后台进程，并配置审批与安全边界。"
---

# 执行工具（Exec Tool）

`exec` 在工作区运行 shell 命令。它是可变更能力：只要所选 host 或 sandbox 的文件系统权限允许，命令就能创建、修改或删除文件。即使禁用了 `write`、`edit`、`apply_patch` 等文件工具，也不会把 `exec` 自动变成只读。

前台和后台运行通过 `process` 配合；如果策略禁用了 `process`，`exec` 会同步执行并忽略 `yieldMs` / `background`。后台会话按 Agent 隔离，另一个 Agent 看不到这些进程。

## 常用参数

| 参数 | 默认值 | 作用 |
|------|--------|------|
| `command` | 必填 | 要执行的 shell 命令 |
| `workdir` | 当前目录 | 命令工作目录 |
| `env` | 继承环境 | 额外环境变量 |
| `yieldMs` | `10000` | 超过多少毫秒后自动转后台 |
| `background` | `false` | 立即转后台 |
| `timeoutSeconds` | `tools.exec.timeoutSeconds` | 本次命令超时，单位秒；`0` 表示不设进程超时 |
| `pty` | `false` | 为 TTY-only CLI 或终端 UI 分配伪终端 |
| `host` | `auto` | `auto` / `sandbox` / `gateway` / `node` |
| `node` | 未设置 | `host=node` 时选择配对 Node |
| `elevated` | `false` | 在已授权时从沙箱逃逸到配置的 host 路径 |

注意 `timeoutSeconds` 是秒，而 `yieldMs` 和 `process` 的 timeout 是毫秒；脚本中应显式写参数名，避免单位混淆。

## 命令实际运行在哪里

`tools.exec.host` 只接受 `auto`、`sandbox`、`gateway` 或 `node`，不是任意主机名选择器：

- `auto`：有活跃沙箱就进入 sandbox，没有沙箱才落到 Gateway。
- `sandbox`：必须有可用沙箱；没有时失败关闭，不会偷偷改跑 Gateway。
- `gateway`：在 Gateway 主机执行并受 host approvals 控制。
- `node`：在已配对 Node 上执行；多个 Node 时要设置 `tools.exec.node` 或本次 `node`。

工具调用省略 `host` 或传 `auto` 时，先继承配置、Agent 与会话的执行位置；只有继承结果仍为 `auto`，才按上面的沙箱/Gateway 规则选择。被要求在沙箱中运行的会话始终留在沙箱，不会因配置 host 而越界。

有活跃沙箱时，单次调用不能用 `host=gateway` 或 `host=node` 绕出去，两种覆盖都会被拒绝。确实需要固定位置，应在配置中显式设置：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.mode auto
openclaw gateway restart
```

Node shell 只走 `exec host=node`；旧的 `nodes.run` 已删除。

::: warning 默认沙箱是关闭的
没有额外配置时，`host=auto` 通常会落到 Gateway。需要隔离时应显式启用 sandbox，而不是仅依赖 `auto` 这个名字。
:::

## 审批模式

`tools.exec.mode` 是持久化的主策略：

| 模式 | 行为 |
|------|------|
| `deny` | 禁止 exec |
| `allowlist` | 只运行 allowlist / safe-bin 命令，不询问其他命令 |
| `ask` | allowlist 直接运行，其余询问人工 |
| `auto` | allowlist 直接运行，其余先交自动审查，必要时再询问人工 |
| `full` | 不经过审批门控 |

推荐普通开发环境从 `auto` 开始：

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw exec-policy show
```

普通模型工具调用不再接受 `security` 参数；安全策略来自 `tools.exec.mode`、会话权限和宿主审批。`ask` 也不是自由降级开关。`elevated full` 只有在有效策略已允许 `full` / `off` 时才跳过审批，不能覆盖更严格的要求。

完整审批语义见 [Permission Modes](/tutorials/tools/permission-modes) 与 [执行审批](/tutorials/tools/exec-approvals)。

## `/exec`：位置可持久化，安全参数只管本条消息

```text
/exec host=node node=worker-1
/exec security=allowlist ask=always 检查构建输出
```

第一条保存当前会话的 `host` / `node` 位置；第二条只收紧这一次任务的安全与审批要求，不影响后续消息。单独发送 `/exec security=deny` 不会启动 Agent，也不会禁止下一条消息执行命令。需要跨消息保留限制时，设置 [会话权限模式](/tutorials/gateway/permission-modes)。

`/exec` 不写配置文件。已授权的通道发送者可以保存位置；内部 Gateway/WebChat 客户端保存位置需要 `operator.admin`，单轮 `security` / `ask` 不需要这项持久化权限。有会话权限模式时，单轮覆盖只能收紧，不能放宽。

集成方注意：`sessions.patch` / `sessions.patchMany` 的 `execSecurity`、`execAsk` 已退役；即使传 `null` 也会返回 `INVALID_REQUEST`。会话级改用 `permissionMode`（`read-only` / `guarded` / `workspace` / `full`），单轮限制则放在任务消息的 `/exec` 指令中。

## 主要配置

```json5
{
  tools: {
    exec: {
      host: "auto",
      mode: "auto",
      timeoutSeconds: 1800,
      notifyOnExit: true,
      reviewer: {
        timeoutMs: 30000,
      },
      pathPrepend: ["~/bin"],
      strictInlineEval: true,
    },
  },
}
```

高信号字段：

- `timeoutSeconds`：默认 `1800` 秒；本次 `timeoutSeconds: 0` 可关闭进程超时。
- `notifyOnExit`：默认 `true`，后台命令结束后写系统事件并请求一次事件驱动 heartbeat。
- `reviewer.model` / `reviewer.timeoutMs`：`mode=auto` 的审查模型和超时。
- `pathPrepend`：Gateway 与 sandbox 命令的 PATH 前缀；host exec 不接受本次 `env.PATH` 覆盖。
- `strictInlineEval`：让 `python -c`、`node -e` 等内联解释器执行继续经过 reviewer 或明确审批。
- `approvalRunningNoticeMs`：审批后长时间运行时发送一次“正在运行”提示。
- `commandHighlighting`：在审批 UI 中高亮解析出的命令片段，不改变策略。

## 前台、后台与 process

前台：

```json
{ "command": "npm test", "workdir": "/srv/app" }
```

等待 1 秒后转后台：

```json
{ "command": "npm run build", "yieldMs": 1000 }
```

立即后台：

```json
{ "command": "npm run dev", "background": true, "pty": true }
```

返回 session ID 后，用 `process` 查看日志、输入或中断。对于现在启动、稍后完成的命令，只启动一次并依赖完成唤醒；不要用 sleep/poll 循环模拟等待。真正要在未来或固定时间执行的工作，应使用 [Automations](/tutorials/automation/cron-jobs)。

## Allowlist 与 safe bins

两者用途不同：

- allowlist：显式信任某个可执行文件路径或通过 PATH 调用的命令名。
- `tools.exec.safeBins`：只适合少量、仅从 stdin 读取的低风险流过滤器。
- `safeBinTrustedDirs`：为 safe bin 明确增加可信可执行目录；PATH 目录不会自动被信任。
- `safeBinProfiles`：限制自定义 safe bin 的位置参数和 flag。

不要把 `python3`、`node`、`ruby`、`bash` 等解释器加入 safe bins；需要它们时使用明确 allowlist 并保持审批。链式命令和各个 pipeline 段都要分别满足策略；allowlist 模式不支持 shell 重定向（如 `>`），不能因为每段命令都命中规则就认为重定向已获许可。持久 `allow-always` 不会绕过这些边界。

## Shell 与环境注意事项

- 非 Windows Gateway 优先使用 `SHELL`；如果是 fish，会优先从 PATH 找 bash/sh，避免 bash 语法不兼容。
- Windows 优先 PowerShell 7，再回退 Windows PowerShell 5.1。
- Gateway/Node host exec 拒绝 `env.PATH` 与 `LD_*` / `DYLD_*` loader 覆盖，防止二进制劫持。
- sandbox 和 Node 不使用 Gateway 的 shell startup snapshot。
- `openclaw channels login` 和 `/approve` 不能通过 exec 运行；前者应在 Gateway 终端执行，后者必须走审批命令处理器。

## apply_patch

`apply_patch` 是 exec 的结构化多文件编辑子工具，默认启用。需要限制时：

```json5
{
  tools: {
    exec: {
      applyPatch: {
        workspaceOnly: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

工具策略仍然生效：`allow: ["write"]` 会隐式允许 `apply_patch`；但 `deny: ["write"]` 不会单独拒绝它，需要显式 deny `apply_patch`，或使用 `deny: ["group:fs"]` 一起关闭文件写入组。

## 安全检查

- 不要在公共频道给陌生发送者开放 host exec。
- 生产环境优先 sandbox、严格 sender allowlist 与人工审批。
- 定期运行 `openclaw security audit`、`openclaw doctor`，并检查 approvals 文件。
- `elevated` 是从沙箱到 host 的逃生通道，不是普通“重试一下”选项。
