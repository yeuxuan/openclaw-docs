---
title: "连接聊天软件（通道）"
sidebarTitle: "连接聊天软件"
---

# 连接聊天软件::让 AI 助手住进你的聊天 App

OpenClaw 里的“通道”就是聊天入口。

你可以在浏览器控制 UI 里聊天，也可以把 OpenClaw 接到 Telegram、WhatsApp、Discord、Slack、飞书、iMessage 等地方。消息从哪里来，Gateway 就从哪里回。

---

## 先用生活话理解

如果 Gateway 是总服务台，那么通道就是不同的来电方式：

- Telegram 像一部电话。
- WhatsApp 像另一部电话。
- Discord、Slack 像办公室前台。
- Web 控制 UI 像你直接走到服务台前说话。

不管你从哪个入口说话，最后都要先到 Gateway，再交给 AI。

---

## 新手先选哪个？

建议按这个顺序：

1. 控制 UI
   先运行 `openclaw dashboard`，确认 AI 能回复。

2. Telegram
   最适合新手。只需要 Bot Token，配置快，排查也简单。

3. Discord 或 Slack
   适合社区、团队或工作空间。

4. WhatsApp / iMessage / 企业通道
   更贴近日常使用，但配置步骤更多。

---

## 常用通道

| 通道 | 难度 | 适合场景 |
|------|------|----------|
| [Telegram](/tutorials/channels/telegram) | 简单 | 新手第一站 |
| [Discord](/tutorials/channels/discord) | 简单 | 社区、服务器、私信 |
| [Slack](/tutorials/channels/slack) | 中等 | 工作空间 |
| [WhatsApp](/tutorials/channels/whatsapp) | 中等 | 手机日常聊天 |
| [SMS / Twilio](/tutorials/channels/sms) | 中等 | 手机短信入口 |
| [Google Chat](/tutorials/channels/googlechat) | 中等 | Google Workspace |
| [企业微信 WeCom](/tutorials/channels/wecom) | 中等 | 企业微信组织与机器人 |
| [Buzz](/tutorials/channels/buzz) | 中等 | 托管或自托管团队房间 |
| [Reef](/tutorials/channels/reef) | 较复杂 | 不同所有者 Agent 间的加密通信 |
| [A2A](/tutorials/channels/a2a) | 较复杂 | 让外部 Agent 通过 Agent2Agent 1.0 调用 OpenClaw |
| [Signal](/tutorials/channels/signal) | 中等 | 隐私优先 |
| [iMessage（imsg）](/tutorials/channels/imessage) | 较复杂 | 当前官方 macOS 原生路线 |
| [BlueBubbles（已移除）](/tutorials/channels/bluebubbles) | 迁移说明 | 旧配置迁移到 `channels.imessage` |

---

## 插件通道

OpenClaw 最新架构里，很多通道通过插件提供。
有些聊天软件不是写死在 OpenClaw 核心里，而是像安装包一样接进来。

正常当前版本里，常见插件会随 OpenClaw 一起提供或由向导引导启用；只有做源码开发、使用第三方通道，或文档明确要求时，才需要手动安装插件。

常见插件通道包括：

- [飞书 / Lark](/tutorials/channels/feishu)
- [A2A Agent 通道](/tutorials/channels/a2a)
- [LINE](/tutorials/channels/line)
- [Matrix](/tutorials/channels/matrix)
- [Mattermost](/tutorials/channels/mattermost)
- [Microsoft Teams](/tutorials/channels/msteams)
- [Discord Activities](/tutorials/channels/discord-activities)
- [Nextcloud Talk](/tutorials/channels/nextcloud-talk)
- [Nostr](/tutorials/channels/nostr)
- [QQ Bot](/tutorials/channels/qqbot)
- [Raft](/tutorials/channels/raft)
- [Twitch](/tutorials/channels/twitch)
- [X / Twitter](/tutorials/channels/x)
- [Zalo](/tutorials/channels/zalo)
- [Zalo ClawBot](/tutorials/channels/zaloclawbot)
- [Zalo Personal](/tutorials/channels/zalouser)
- [Synology Chat](/tutorials/channels/synology-chat)
- [Tlon](/tutorials/channels/tlon)
- [WeChat](/tutorials/channels/wechat)
- [企业微信 WeCom](/tutorials/channels/wecom)
- [Yuanbao 元宝](/tutorials/channels/yuanbao)

如果某篇旧教程写着“必须额外安装插件”，先看你当前安装方式：npm 正式版、安装脚本、源码开发版的插件来源可能不同。最稳妥的检查方式是：

```bash
openclaw plugins list
openclaw channels status --probe
```

---

## 接入第一个通道：推荐 Telegram

如果你还没有让控制 UI 成功回复，请先回到 [Web 控制 UI](/tutorials/web/)。
控制 UI 能聊通以后，再接 Telegram，排查会轻松很多。

### 1. 创建 Telegram Bot

1. 打开 Telegram，搜索 `@BotFather`。
2. 发送 `/newbot`。
3. 按提示起名字。
4. BotFather 会给你一串 Token。
5. 把 Token 保存好，不要发给别人。

### 2. 在 OpenClaw 里配置 Token

```bash
openclaw config set channels.telegram.enabled true
openclaw config set channels.telegram.botToken "把你的Token粘贴到这里"
openclaw config set channels.telegram.dmPolicy pairing
```

Telegram 不走扫码登录，所以不要用 `channels login`。把 Token 写进配置后，重启 Gateway。

### 3. 检查通道状态

```bash
openclaw channels status --probe
```

看到 Telegram 正常后，就可以给你的 Bot 发消息了。

---

## 安全：谁能和你的 AI 说话？

OpenClaw 默认会保护你的 AI 助手。陌生私信通常不会直接进入 Agent，而是进入配对或 allowlist 流程。

allowlist 可以理解成“白名单”。
配对可以理解成“有人按门铃，你确认认识他，才让他进门”。

查看等待批准的人：

```bash
openclaw pairing list
```

批准某个请求：

```bash
openclaw pairing approve <channel> <code>
```

把它想成门禁：不是谁知道你的 Bot 名字，谁就能随便使用你的 AI。

---

## 配置参考

- [访问组 Access Groups](/tutorials/channels/access-groups)
- [通道路由配置](/tutorials/channels/channel-routing)
- [群组接入指南](/tutorials/channels/groups)
- [群组消息说明](/tutorials/channels/group-messages)
- [广播群组](/tutorials/channels/broadcast-groups)
- [位置消息](/tutorials/channels/location)
- [配对说明](/tutorials/channels/pairing)
- [Matrix 迁移](/tutorials/channels/matrix-migration)
- [Matrix 推送规则](/tutorials/channels/matrix-push-rules)
- [QA 测试通道](/tutorials/channels/qa-channel)
- [通道故障排查](/tutorials/channels/troubleshooting)

---

## 常见问题

::: details 可以同时连接多个聊天软件吗？

可以。一个 Gateway 可以同时服务多个通道。你可以让 Telegram、WhatsApp、Discord 等同时在线。

:::

::: details AI 没回复怎么办？

按顺序检查：

```bash
openclaw gateway status
openclaw channels status --probe
openclaw pairing list
openclaw logs --follow
```

先确认 Gateway 在，再确认通道在，最后看是否卡在配对或日志报错。

:::

::: details 插件通道是不是都要手动安装？

不一定。当前版本的很多插件通道会随 OpenClaw 提供或由向导引导启用。只有第三方插件、源码开发路径或某些可选通道，才需要你手动 `openclaw plugins install ...`。

:::
