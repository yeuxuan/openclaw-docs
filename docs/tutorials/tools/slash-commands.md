---
title: "斜杠命令"
sidebarTitle: "斜杠命令"
description: "OpenClaw 工具系统：斜杠命令。理解命令、指令、内联快捷键的区别，以及 /model default 等高频排障点。"
---

# 斜杠命令（Slash Commands）

现在的 OpenClaw 里，斜杠命令不只是“发一条 `/xxx`，得到一个回复”。

你会同时遇到三类东西：

- 命令：整条消息就是 `/...`
- 指令：像 `/think`、`/model`，既能单独发，也能夹在普通消息里
- 内联快捷键：像 `/status`、`/help`，会优先被 Gateway 当场处理

理解这三者的区别后，很多“为什么设置没持久化”“为什么命令没走到模型”之类的问题就好排查了。

## 三种命令形态

| 类型 | 典型例子 | 行为 |
|------|------|------|
| 命令 | `/new`、`/reset`、`/commands` | 作为独立消息发送，由 Gateway 直接处理 |
| 指令 | `/think`、`/fast`、`/verbose`、`/model` | 单独发送时会写入当前会话；和正文一起发时通常只影响当前这条消息 |
| 内联快捷键 | `/help`、`/status`、`/whoami` | 优先本地处理，再决定剩余正文是否继续发给模型 |

## 快速上手

```text
/think high
/verbose on
/model
/model default
/status
```

## 最值得先记住的 4 个点

1. `/model xxx -s` 明确只固定当前会话；不带范围则按配置与身份决定是否也改默认模型。
2. 想恢复继承默认配置，要用 `/model default`。
3. 指令混在普通消息里时，通常只影响这一条，不会永久改会话。
4. `! <cmd>` 和 `/bash <cmd>` 属于主机命令，仍受权限和审批控制。

## 高用量命令

| 命令 | 作用 |
|------|------|
| `/status` | 查看当前执行/运行时状态、Gateway 健康、模型与配额摘要 |
| `/new` | 新建会话 |
| `/reset` | 原地重置当前会话 |
| `/compact` | 压缩上下文 |
| `/think <level>` | 调整思考深度 |
| `/verbose on\|off\|full` | 切换详细输出 |
| `/trace on\|off` | 只显示插件 trace / debug 输出 |
| `/fast [status\|auto\|on\|off\|default]` | 调整快速模式 |
| `/model [name\|default\|list\|status] [-s\|-a\|-g]` | 查看或切换模型，并明确会话/Agent/全局范围 |
| `/model default -s` | 清除当前会话固定模型 |
| `/elevated` | 临时提升权限 |
| `/exec ...` | host/node 可保存到会话；security/ask 只作用于同一条任务消息 |
| `/session unbind` | 解除当前对话绑定，不关闭底层 Agent 会话 |

## `/model` 现在该怎么理解

最实用的记法：

```text
/model xxx -s       = 只固定当前会话
/model xxx -a       = 当前会话 + 更新当前 Agent 默认模型
/model xxx -g       = 当前会话 + 更新全局默认模型
/model status       = 看当前会话到底在用什么
/model default -s   = 取消会话固定，恢复继承默认配置
```

长参数分别是 `--session`、`--agent`、`--global`。不带范围时，若配置了
`agents.defaults.modelSelectionScope` 就按它执行；未配置则保留既有行为：
owner/admin 会尝试更新 Agent 的显式默认模型，Agent 没有显式默认时更新全局
fallback，普通用户仍只改当前会话。

文本命令用 `provider/model` 或已配置别名，不再支持 `/model 3` 这样的数字选择。`/model` 显示当前模型和用法，`/model list` 与 `/models` 浏览提供商，`/models openai` 查看该提供商的模型。Discord 原生选择器用下拉框并点击 Submit；Telegram 按钮选择仍只作用于当前会话。

如果你已经改了 `agents.defaults.model.primary`，但某个旧会话还是继续用之前的模型，优先怀疑这个会话之前被 `/model ...` 固定过。

## 会话级和配置级不是一回事

`-s` 明确只改当前会话；`-a`、`-g` 需要 owner/admin 权限并会请求写入配置。
如果希望所有不带参数的选择默认只改会话，可设置：

```json5
{
  agents: {
    defaults: {
      modelSelectionScope: "session",
    },
  },
}
```

## 一个常见场景

```text
/think high 帮我分析这个报错
```

这种写法更像“这次请深想一点”，而不是永久把会话改成高思考模式。

## 升级后容易误用的命令

- `/exec security=... ask=...` 即使单独发送也不会保存到后续消息；把任务正文写在同一条消息。跨消息权限改用 [会话权限模式](/tutorials/gateway/permission-modes)。
- 旧 `/focus`、`/unfocus` 和 `/dock-*` 不再作为当前操作入口；当前对话解绑用 `/session unbind`，模型/会话路由不要套用旧 dock 教程。
- `enforceOwnerForCommands` 是通道插件策略，不是可写入 `openclaw.json` 的通用字段。通配 allowlist 不绕过 owner-only 限制。
- 不强制 owner-only 的通道中，已获通道授权的发送者可使用 `/new`、`/reset`；但适用的 `commands.allowFrom` 拒绝或空列表仍优先。内部 Gateway 显式 scope 调用重置仍需 `operator.admin`。

## 相关页面

- [模型 CLI](/tutorials/concepts/models)
- [openclaw status](/tutorials/cli/status)
- [Web 网络工具](/tutorials/tools/web)
