---
title: "X / Twitter 通道"
sidebarTitle: "X / Twitter"
description: "把 X 提及接入 OpenClaw，配置 OAuth、数字 ID allowlist、事件模式、访客只读边界和费用上限。"
---

# X / Twitter：让提及触发 Agent 回复

X 插件把对机器人账号的提及变成 Agent 会话，并把答案发成公开回复。默认只有 allowlist 中的作者能触发；未知作者会静默丢弃，除非明确开启受限的 guest mode。

插件会把触发提及、可用的祖先回复、同一对话帖子和引用帖作为上下文。原始提及仍是当前输入，线程内容不应被当成可信指令。

## 安装与配置

包含 `extensions/x` 的构建会 bundled 此插件。对于 2026.9.8 的本地源码 checkout，可链接安装：

```bash
openclaw plugins install --link ./extensions/x
```

准备 X OAuth2 client ID、client secret、用户上下文 refresh token；需要 Activity API streaming 时再准备独立 app-only bearer token。把允许发起请求的作者写成数字 X user ID：

```json5
{
  channels: {
    x: {
      enabled: true,
      username: "your_bot",
      userId: "123456789",
      clientId: { source: "env", provider: "default", id: "X_CLIENT_ID" },
      clientSecret: { source: "env", provider: "default", id: "X_CLIENT_SECRET" },
      refreshToken: { source: "env", provider: "default", id: "X_REFRESH_TOKEN" },
      bearerToken: { source: "env", provider: "default", id: "X_BEARER_TOKEN" },
      allowFrom: ["987654321"],
      groupPolicy: "allowlist",
      events: { mode: "auto", pollSeconds: 60 },
      spendLimits: { dailyUsd: 100, billingCycleUsd: 1000 },
    },
  },
}
```

`bearerToken` 不使用 streaming 时可以省略。真实 Secret 也可使用其他受支持 SecretRef，但不要提交明文。

```bash
openclaw config validate
openclaw channels status
```

然后从 allowlist 账号提及机器人，确认产生 Agent 回合和公开回复。X 通道没有 pairing；allowlist 为空时默认拒绝所有作者。

## 事件模式

| 模式 | 行为 |
|------|------|
| `auto` | 有 bearer token 且 Activity subscription 成功时使用 stream，否则轮询。 |
| `stream` | 请求 Activity API；缺 bearer token 或部分鉴权失败时按规则回退轮询。 |
| `poll` | 使用用户上下文 token 轮询 mentions。 |

轮询默认 60 秒，最小 15 秒。stream 建连后仍会从持久 cursor 回补遗漏提及，并定期补扫；事件与轮询按 post ID 去重。不要为了“更实时”把轮询压得过低，X API 调用会计费。

## Allowlist 与访客模式

Control UI 的 X replies 页面和配置中的 `allowFrom` 取并集；管理员 RPC `x.allowlist.list/add/remove` 需要 `operator.admin`。授权时使用数字 ID，显示名或 handle 不能作为身份边界。

访客模式允许 allowlist 之外的人询问仓库问题：

```bash
openclaw config set channels.x.guests.enabled true
```

访客默认每个作者每天 5 次，独立会话，不能复用维护者的历史或权限；不会在公开回复中附工作会话链接。它的安全前提很严格：

- `tools.fs.workspaceOnly` 必须为 true，并把 workspace 指向专用只读仓库 clone。
- 禁用 Skills 与 sandbox/remote mount，避免通过额外读路径越出仓库。
- 通道队列使用不会 steer/interrupt 活跃回合的模式，例如 `followup` 或 `collect`。
- guest tools allow 只能缩小宿主默认能力；deny 优先，不能借配置增加更强工具。
- 访客不能编辑文件、执行命令、浏览/抓取网页、使用记忆、发消息或查看无关会话。

条件不满足时插件会阻止 guest admission，并在 `guestModeBlockedReason` 说明原因；维护者 allowlist 提及仍可工作。

## 费用上限不是可选提醒

默认每账号每天 100 美元、每计费周期 1000 美元，只计算 X API，模型 token 另计。`0` 会阻止付费请求，没有真正的“无限”；确需更高额度时显式设置更大的数。

线程读取、用户查询、回复发布和 Activity 事件都可能计费。状态页会显示已用、上限和重置时间；修改上限不会清空已记录费用。

## 常见故障

- 没回复：检查数字 bot ID、allowlist、channel status 的 dropped author；不要等 pairing code。
- Stream 不工作：查看实际 event mode、subscription/stream 鉴权和回退信息；`401/403` 可能切回 poll。
- Token 刷新失败：核对 client ID、secret、refresh token 和 OAuth scope；不要在日志里输出 Secret。
- 回复被拒绝：目标作者必须提及或引用 App，普通任意 post 不能直接回复。
- 达到费用上限：等重置或在理解真实成本后调整；不要通过删除状态文件绕过记账。

上游来源：[`docs/channels/x.md`](https://github.com/openclaw/openclaw/blob/fb4653dbea6650c0fae516151fa87fda5ee4aaf9/docs/channels/x.md)。
