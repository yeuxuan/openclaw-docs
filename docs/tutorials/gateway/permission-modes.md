---
title: "会话权限模式"
sidebarTitle: "会话权限模式"
description: "区分 OpenClaw 会话文件边界、exec 审查者、全局策略和原生运行时限制。"
---

# 会话权限模式

会话的 `permissionMode` 决定该会话的文件系统边界和 exec 升权审查者。它不同于全局 `tools.exec.mode`，也不等同于 ACPX 插件的同名字段。

| 模式 | OpenClaw 托管文件工具 | Exec 审查 |
|---|---|---|
| `read-only` | 只读 `sessionRoot` 内文件，不提供托管修改工具 | 拒绝 exec |
| `guarded` | 可读写 `sessionRoot` 内文件 | allowlist 快速路径后由人工审查 |
| `workspace` | 可读写 `sessionRoot` 内文件 | LLM 审查，必要时回退人工 |
| `full` | 不限制文件系统范围 | 不审批 |

设置 `full` 需要 `operator.admin`，其他模式需要 `operator.write`。表中工具行为指 OpenClaw 托管工具；原生 Harness 可有自己的工具面和权限控制，不能单凭此表推断全部运行时能力。

## sessionRoot 和默认值

边界优先使用会话记录的规范 `sessionRoot`，没有记录时在准备运行时使用所选 Agent 的规范工作区。显式工作目录会固定根路径；managed worktree 以整个 checkout 为根，内部子目录只影响运行时 `cwd`，不缩小整个 checkout 的边界。

工具可识别可信根和工作目录的别名，但不会因此允许根外的符号链接或 `symlink/..` 逃逸。新建 worktree 不会自动选择权限模式：未显式设置时仍继承全局/Agent 的工具与 exec 策略。

Control UI 的 **Default (Guarded)** 等标签是依据 Agent 策略计算的显示提示，不是文件权限保证。涉及沙箱、仅 allowlist 或无法等价映射的组合时可能只显示 **Default**。选择 Default 会清除会话覆盖，不会把括号中的模式固化到会话。

## 单次 /exec 与旧字段迁移

会话长期 exec 策略由 `permissionMode` 管理。`/exec security=... ask=...` 仅作用于它所在的消息，且只能收紧显式会话模式；`host`、`node` 仍是会话放置默认值。

升级含旧会话 exec 策略的存储后，恢复工作前先运行 `openclaw doctor --fix`。限制性策略会迁移到 `read-only` 或 `guarded`，已有模式保持不变；旧 full-access 策略被移除并提示，让配置重新生效，不会被转成新的 `full` 授权。

协议 v4 仍声明旧 `execSecurity`、`execAsk` 字段，但 `sessions.patch` / `sessions.patchMany` 只要收到其中一个（包括 `null`）就返回 `INVALID_REQUEST`。客户端应写 `permissionMode`，或为单次运行使用 `/exec`，不要继续保存旧字段。

## full 的明确例外

显式 `full` 是管理员授权的 host 审批文件下限例外：OpenClaw exec 保持 full、关闭审批，除非本轮覆盖进一步收紧。未设置模式和其他模式仍受 host approvals 文件收紧。

对 full 会话收紧 `security` 会重新启用审批文件下限；只收紧 `ask` 不会。沙箱、工具 allow/deny 仍独立生效，原生 Harness 还可收紧不支持的策略，Codex 的外部 `requirements.toml` 限制也不会被绕过。

继续阅读：[Exec](/tutorials/tools/exec)、[Host Exec 模式](/tutorials/tools/permission-modes)、[沙箱、工具策略与提权](/tutorials/gateway/sandbox-vs-tool-policy-vs-elevated)。

上游来源：[Session permission modes](https://github.com/openclaw/openclaw/blob/2e3bf941b7848fa9dfcbcfc8c9a89d99e2feeb30/docs/gateway/permission-modes.md)。
