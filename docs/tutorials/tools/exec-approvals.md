---
title: "执行审批"
sidebarTitle: "执行审批"
description: "OpenClaw Exec 审批的宿主策略、精确 allowlist、工作目录绑定和自动化 standing grants。"
---

# 执行审批（Exec Approvals）

执行审批决定 Agent 的命令是否直接运行、需要人工确认，或被拒绝。它和
`tools.exec` 的目标宿主、沙箱、会话权限模式与单轮 `/exec` 安全限制共同生效。

## 先看当前实际策略

```bash
openclaw approvals get
openclaw exec-policy show
```

不要再找 `~/.openclaw/approvals.json`：当前本机和 Gateway 的 OpenClaw 审批
记录存放在共享 SQLite 的 `exec_approvals_config` 行中。节点可能使用 OpenClaw
策略，也可能由 Windows companion 等宿主提供原生策略。

## 三个核心开关

| 字段 | 常见值 | 含义 |
|------|--------|------|
| `security` | `deny` / `allowlist` / `full` | 哪些命令具备执行资格 |
| `ask` | `off` / `on-miss` / `always` | 何时弹出审批 |
| `askFallback` | `deny` / `allowlist` / `full` | 没有可用审批界面时怎么处理 |

请求策略与宿主策略通常按更严格的一侧合并。未配置的 Node 与 Gateway 默认基线均为 `full` / `off`，但派发前仍检查目标策略：调用方 `allowlist` / `off` 不允许未匹配命令，目标 `ask=always` 仍需审批。

会话 `full` 模式有一个例外：有效 security 保持 `full` 时可跳过宿主审批下限；单轮 `/exec security=deny <任务>` 仍可禁止执行。只收紧 `ask` 会提高询问等级，但不会恢复该下限。需要硬性禁用时用工具策略拒绝 `exec`，完整边界见 [Exec 工具](/tutorials/tools/exec)。调整审批不会改变执行位置或自动逃离沙箱。

## “允许一次”和“总是允许”

- 允许一次：只允许当前请求。
- 总是允许这里：为精确 argv 和当前工作目录生成规则。
- 拒绝：不执行当前请求。

目录绑定很重要：你在 `/srv/app-a` 批准的 `npm test`，不会自动授权
`/srv/app-b` 的同名命令。升级前生成的 argv-only 规则会失效，可运行：

```bash
openclaw doctor --fix
```

然后在正确目录重新批准。手写 allowlist 不受这次清理影响。

## 自动化任务的 Standing Grants

隔离自动化里的 Gateway-host Exec 可以把审批卡发给已连接的 Control UI、macOS/iOS/Android App，或声明 `approvals` / `exec-approvals` 能力的 API 客户端。TUI 不渲染 Exec 审批卡，聊天通道也不会收到自动化审批；没有可用审批界面时，请求会立即拒绝并给出策略修复建议。

对自动化选择“总是允许”不会写普通 JSON allowlist，而会创建绑定以下内容的
standing grant：

- Agent 和自动化任务
- 当前任务配置版本
- 精确命令、工作目录和请求环境

任一内容变化、任务被编辑/删除、授权被撤销或到期，下一次运行都会重新询问。
可变文件操作数、heredoc、严格 inline eval 等仍可能要求逐次审批。

```bash
openclaw approvals grants list
openclaw approvals grants revoke <grant-id>
```

默认授权一直有效，直到撤销。托管环境可用 `tools.exec.grantExpiryDays` 为未来新授权设
默认期限；现有授权不会被配置变更追溯修改。

## Allowlist 不等于通配符放行一切

精确 allowlist 可以绑定二进制、参数和目录。优先通过 UI 或真实审批流程生成，
不要手写内部编码的 argv 规则。命令解析失败、参数不匹配或目录不同都会按
allowlist miss 处理。

添加简单的手写路径规则：

```bash
openclaw approvals allowlist add "/usr/bin/uptime"
openclaw approvals allowlist add --agent main "~/Projects/**/bin/rg"
openclaw approvals allowlist remove "/usr/bin/uptime"
```

所谓 safe bins 只是在严格校验参数、stdin、重定向和路径后降低审批摩擦；它们
不是任意参数都安全的万能白名单，也不会绕过显式 deny。

## YOLO / 永不询问

```bash
openclaw exec-policy preset yolo
```

这只适合你完全信任的个人宿主。它放宽审批，不代表命令会逃离沙箱，也不会绕过
通道、Agent、节点或操作系统自身的权限。生产、多用户和公开聊天环境应保持
`allowlist` 或逐次审批。

## 常用排查顺序

```bash
openclaw approvals get --gateway
openclaw approvals pending
openclaw approvals grants list
openclaw doctor
```

如果命令仍未执行，再确认：

1. 实际 `host` 是 sandbox、gateway 还是 node。
2. 请求策略和宿主策略合并后的 `security` / `ask`。
3. argv、工作目录和环境是否与已批准内容完全一致。
4. 自动化 grant 是否因编辑、到期或撤销而失效。

交互式 Node 审批会在原工具调用中等待，并在那里返回命令输出。原回合已关闭或取消时，迟到的批准不能重新启动执行；`SYSTEM_RUN_DENIED` 表示节点拒绝执行，不表示命令可能已经跑过。

相关命令：[openclaw approvals](/tutorials/cli/approvals)、[Exec 工具](/tutorials/tools/exec)。
