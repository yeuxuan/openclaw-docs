---
title: "Discord Activities"
sidebarTitle: "Discord Activities"
description: "让 Discord Bot 发送可在频道内打开的自包含 HTML Widget。"
---

# Discord Activities

Discord Activities 允许 Agent 在当前频道发送自包含 Widget；用户点击 `Open widget` 后在 Discord 内打开。功能默认关闭，配置 `channels.discord.activities` 且能解析 Client Secret 后才注册路由与 `show_widget`。

## 准备和配置

你需要现有 Discord Bot、能访问 Gateway 的公共 HTTPS Host，以及 Discord Developer Portal 的 Activities/OAuth2 管理权限。可以用命名 Cloudflare Tunnel 把稳定域名代理到回环地址的 Gateway。

在 Developer Portal 的 Activities 中添加：

- Prefix：`ROOT`
- Target：`openclaw.example.com/discord/activity`，不要尾部斜杠

配置 OpenClaw：

```json5
{
  channels: {
    discord: {
      token: "${DISCORD_BOT_TOKEN}",
      activities: {
        clientSecret: "${DISCORD_CLIENT_SECRET}",
        applicationId: "YOUR_DISCORD_APPLICATION_ID",
      },
    },
  },
}
```

保持正常 Gateway 认证。Activity 插件会另外核对 Discord OAuth、Activity 实例成员、频道绑定和一次性文档授权。频道里有权限的人都可打开已经发布的 Widget，受众范围应使用 Discord 频道权限控制。

Widget HTML 由 Agent 生成，不要嵌入秘密。它运行在 `sandbox="allow-scripts"` 与严格 CSP 中，外部网络和资源默认被拦截。Discord Forum Thread 不能启动 Activity，请改在普通文字频道测试。

上游来源：[`docs/channels/discord-activities.md`](https://github.com/openclaw/openclaw/blob/main/docs/channels/discord-activities.md)。
