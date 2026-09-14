---
title: "个人助手设置"
sidebarTitle: "个人助手设置"
description: "OpenClaw 快速入门：使用 OpenClaw 构建个人助手。用 Gateway、Web 控制 UI、频道、模型和工具搭建自己的全天候 AI 助手。"
---

# 使用 OpenClaw 构建个人助手

OpenClaw 可以把 Telegram、WhatsApp、Discord、Slack、Signal、BlueBubbles/WebChat 等入口连接到同一个 AI 助手。
本指南讲的是“个人助手”方案：先跑通 Gateway 和 Web 控制 UI，再选一个你常用的频道，让它变成你的全天候 AI 助手。

准备让多位可信成员共用 Gateway？请看[团队设置](/tutorials/getting-started/teams)，先处理逐人身份、共享会话和角色边界。

---

## ⚠️ 安全第一

你正在让一个智能体具备以下能力：

- 在你的机器上运行命令（取决于工具权限和审批设置）
- 在你的工作区（Workspace）中读写文件
- 通过 Telegram、WhatsApp、Discord、Slack、WebChat 等频道发送消息

保守起步：

- 第一次建议先用 Web 控制 UI 或 Telegram 跑通，不要一上来开放给所有人。
- 如果使用 WhatsApp，尽量为助手准备专用号码，不要直接接入你的私人主号。
- 自动化和心跳先从关闭或低频开始，确认行为可靠后再放开。

---

## 前置条件

- OpenClaw 已安装并完成入门引导 : 如果尚未完成，请参阅 [快速入门](/tutorials/getting-started/getting-started)
- 一个聊天入口。新手建议先用 Telegram；如果选择 WhatsApp，最好准备第二个手机号（SIM/eSIM/预付费）。

---

## 双手机设置（推荐）

你需要的配置如下：

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac / Server<br></b><br>OpenClaw Gateway"]
```

如果你将个人 WhatsApp 链接到 OpenClaw，你收到的每条消息都会变成"智能体输入"。这通常不是你想要的。

---

## 5 分钟快速开始

1. 先确保 Gateway 和控制 UI 跑起来：

```bash
openclaw onboard --install-daemon
openclaw dashboard
```

2. 选择一个频道。新手建议先用 Telegram；如果你要用 WhatsApp，再登录 WhatsApp Web：

```bash
openclaw channels login --channel whatsapp
```

3. 给频道加白名单。以 WhatsApp 为例，在 `~/.openclaw/openclaw.json` 中放入一个最简配置：

```json5
{
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

现在从你的白名单手机向助手号码发送消息。

入门引导完成后，我们会自动打开仪表盘并打印一个干净的（非 Token 化的）链接。如果提示认证，请将 `gateway.auth.token` 中的 Token 粘贴到控制面板 UI 设置中。稍后重新打开：`openclaw dashboard`。

---

## 为智能体提供工作区（AGENTS）

OpenClaw 从其工作区（Workspace）目录读取操作指令和"记忆"。

默认情况下，OpenClaw 使用 `~/.openclaw/workspace` 作为智能体工作区，并会在设置/首次运行时自动创建它（以及初始的 `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`）。环境相关工具说明写入 `AGENTS.md` 的 `## Tools`。`BOOTSTRAP.md` 仅在工作区全新时创建（删除后不会再出现）。`MEMORY.md` 是可选的（不会自动创建）；存在时会为普通会话加载。子智能体会话只注入 `AGENTS.md`。

提示：将此文件夹视为 OpenClaw 的"记忆"，并将其作为 git 仓库（最好是私有的），这样你的 `AGENTS.md` + 记忆文件就有了备份。如果安装了 git，全新的工作区会自动初始化。

```bash
openclaw setup
```

完整的工作区布局和备份指南：[智能体（Agent）工作区](/tutorials/concepts/agent-workspace)
记忆工作流：[记忆](/tutorials/concepts/memory)

可选：通过 `agents.defaults.workspace` 选择不同的工作区（支持 `~`）。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

如果你已经从仓库提供了自己的工作区文件，可以完全禁用引导文件的创建：

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

---

## 将其变成"助手"的配置

OpenClaw 默认就是一个不错的助手设置，但你通常需要调整：

- `SOUL.md` 中的角色/指令
- 思考默认值（如需要）
- 心跳（在你信任它之后）

示例：

```json5
{
  logging: { level: "info" },
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      workspace: "~/.openclaw/workspace",
      thinkingDefault: "high",
      timeoutSeconds: 1800,
      // Start with 0; enable later.
      heartbeat: { every: "0m" },
    },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

---

## 会话（Session）与记忆

- 当前会话行与转录：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- `~/.openclaw/agents/<agentId>/sessions/` 下的 `sessions.json` / JSONL 仅用于旧版迁移或归档；
  升级时先停止 Gateway、备份，再运行 `openclaw doctor --fix`
- `/new` 或 `/reset` 为该聊天启动新会话（可通过 `resetTriggers` 配置）。如果单独发送，智能体会回复一个简短的问候以确认重置。
- `/compact [instructions]` 压缩会话上下文并报告剩余的上下文预算。

---

## 心跳（主动模式）

默认情况下，OpenClaw 每 30 分钟运行一次心跳，提示词为：
`Follow the heartbeat monitor scratch context when provided. Recurring tasks are automations; create or change their schedules with the automations tool, not heartbeat scratch. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply NO_REPLY.`
设置 `agents.defaults.heartbeat.every: "0m"` 只禁用周期节拍；后台 exec 完成等定向事件仍可唤醒一次。

- 心跳清单保存在系统 monitor 的 cron scratch；`openclaw doctor --fix` 会迁移旧工作区 `HEARTBEAT.md`。
- scratch 实际为空时会跳过心跳以节省调用；缺少 scratch 时仍会运行。
- 没有需要投递的内容时回复 `NO_REPLY`；旧 `HEARTBEAT_OK` 仅作兼容。
- 心跳运行完整的智能体回合 : 更短的间隔会消耗更多 Token。

```json5
{
  agents: { defaults: { heartbeat: { every: "30m" } } },
}
```

---

## 媒体输入输出

入站附件（图片/音频/文档）可以通过模板传递给你的命令：

- `\{\{MediaPath\}\}`（本地临时文件路径）
- `\{\{MediaUrl\}\}`（伪 URL）
- `\{\{Transcript\}\}`（如果启用了音频转录）

来自智能体的出站附件：在单独一行包含 `MEDIA:<path-or-url>`（无空格）。示例：

```text
Here's the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw 会提取这些内容并随文本一起作为媒体发送。

---

## 运维清单

```bash
openclaw gateway status  # 查看 Gateway 是否在运行
openclaw dashboard       # 打开 Web 控制 UI
openclaw doctor          # 自动诊断常见问题
openclaw logs --follow   # 查看实时日志
```

日志存放在 `/tmp/openclaw/`（默认：`openclaw-YYYY-MM-DD.log`）。

---

## 后续步骤

- WebChat：[WebChat](/tutorials/web/)
- 网关运维：[网关运维手册](/tutorials/gateway/)
- 定时任务与唤醒：[定时任务](/tutorials/automation/cron-jobs)
- macOS 菜单栏配套应用：[OpenClaw macOS 应用](/tutorials/getting-started/onboarding)
- iOS 节点应用：[iOS 应用](/tutorials/nodes/)
- Android 节点应用：[Android 应用](/tutorials/nodes/)
- Windows 状态：[Windows (WSL2)](/tutorials/installation/)
- Linux 状态：[Linux 应用](/tutorials/installation/)
- 安全：[安全](/tutorials/gateway/security)
