---
title: "连接聊天软件（通道）"
sidebarTitle: "连接聊天软件"
---

# 连接聊天软件——让 AI 助手住进你的聊天 App

## 什么是"通道"？

"通道"就是聊天软件。OpenClaw 可以连接到你日常使用的聊天软件，这样你就能直接在 Telegram、WhatsApp 或其他 App 里和你的 AI 助手聊天，不需要打开任何专门的界面。

> 想象一下：你的 AI 助手有了一个"入口"，你在微信、Telegram 里发消息，它就能收到并回复你。

---

## 我该选哪个聊天软件？

**新手强烈推荐 Telegram**，原因：

- 设置最简单（只需一个 Bot Token，5 分钟搞定）
- 功能完整，支持文字、图片、文件
- 稳定可靠

| 聊天软件 | 难度 | 特点 |
|---------|------|------|
| **Telegram** ⭐ 推荐 | 简单 | 设置最快，一个 Token 搞定 |
| **Discord** | 简单 | 支持服务器和私信 |
| **WhatsApp** | 中等 | 需要扫二维码，国内最常用 |
| **Slack** | 中等 | 适合工作场景 |
| **飞书** | 中等 | 国内办公场景 |
| **Google Chat** | 中等 | 谷歌工作空间用户 |
| **Signal** | 中等 | 注重隐私 |
| **iMessage** | 较复杂 | 仅 macOS，需要额外软件 |
| **微软 Teams** | 较复杂 | 企业场景 |

---

## 各聊天软件的接入教程

### 常用（内置支持，直接配置）

- [Telegram](/tutorials/channels/telegram) — 推荐新手从这里开始
- [Discord](/tutorials/channels/discord) — Discord 服务器和私信
- [WhatsApp](/tutorials/channels/whatsapp) — 扫码登录
- [Slack](/tutorials/channels/slack) — 工作空间机器人
- [Google Chat](/tutorials/channels/googlechat) — Google 工作空间
- [Signal](/tutorials/channels/signal) — 隐私优先的消息应用
- [iMessage（通过 BlueBubbles）](/tutorials/channels/bluebubbles) — 苹果 Mac 用户推荐此方案

### 需要额外安装插件

- [飞书](/tutorials/channels/feishu) — 字节跳动飞书/Lark
- [LINE](/tutorials/channels/line) — LINE 聊天
- [微软 Teams](/tutorials/channels/msteams) — 企业版微软团队
- [Matrix](/tutorials/channels/matrix) — 开源去中心化聊天
- [Mattermost](/tutorials/channels/mattermost) — 开源企业即时通讯
- [Nextcloud Talk](/tutorials/channels/nextcloud-talk) — Nextcloud 内建聊天
- [IRC](/tutorials/channels/irc) — IRC 经典协议
- [GrammY](/tutorials/channels/grammy) — Telegram GrammY 框架接入
- [Nostr](/tutorials/channels/nostr) — 去中心化社交协议
- [Tlon](/tutorials/channels/tlon) — Tlon/Urbit 通讯
- [Twitch](/tutorials/channels/twitch) — Twitch 直播聊天室
- [Zalo](/tutorials/channels/zalo) — 越南 Zalo（企业账号）
- [Zalo 用户版](/tutorials/channels/zalouser) — Zalo（个人账号）
- [iMessage](/tutorials/channels/imessage) — iMessage（macOS 原生方案）

### 配置参考

- [通道路由配置](/tutorials/channels/channel-routing) — 多通道路由规则
- [群组接入指南](/tutorials/channels/groups) — 群组管理与权限
- [群组消息说明](/tutorials/channels/group-messages) — 群消息处理机制
- [广播群组](/tutorials/channels/broadcast-groups) — 一对多广播场景
- [位置消息](/tutorials/channels/location) — 地理位置消息处理
- [配对（Pairing）](/tutorials/channels/pairing) — 用户授权与配对流程
- [通道故障排查](/tutorials/channels/troubleshooting) — 常见连接问题排查

---

## 如何接入第一个聊天软件？

### 推荐路径：Telegram

如果你选择 Telegram，按以下步骤操作：

**第一步：创建一个 Telegram Bot**

1. 打开 Telegram，搜索 `@BotFather`
2. 发送命令 `/newbot`
3. 给你的 Bot 起个名字（比如 `MyAI Assistant`）
4. 再给它起个用户名（必须以 `bot` 结尾，比如 `myai_helper_bot`）
5. BotFather 会给你发一串 **Token**（看起来像 `123456789:ABCDEFGhijklmNOPQrstu`），**复制保存好**

**第二步：把 Token 填入 OpenClaw**

运行设置命令：

```bash
openclaw channels login --channel telegram
```

按提示输入你的 Bot Token，然后回车。

**第三步：验证是否成功**

```bash
openclaw channels status
```

看到 Telegram 旁边显示 `connected` 就成功了！

**第四步：发送第一条消息**

在 Telegram 里搜索你的 Bot 用户名，点开，发送一条消息。如果 AI 助手回复了，就完成了！

---

## 安全说明：谁能和你的 AI 说话？

默认情况下，OpenClaw 采用**配对（Pairing）模式**保护你的 AI 助手——陌生人给你的 Bot 发消息时，AI 不会直接回复，而是会发出一个"配对码"，需要你手动审批。

这样可以防止陌生人随便使用你的 AI 助手。

查看并批准等待中的用户：

```bash
openclaw pairing list           # 查看等待批准的用户
openclaw pairing approve <码>   # 批准某人
```

---

## 常见问题

::: details 能同时连接多个聊天软件吗？

可以！你可以同时连接 Telegram、WhatsApp、Discord 等多个通道。OpenClaw 会根据消息来源自动路由，AI 助手在哪个软件里收到消息，就在哪个软件里回复。

:::

::: details WhatsApp 需要一直保持手机开着吗？

WhatsApp 的连接方式（Baileys）是通过扫码关联你的 WhatsApp 账号，类似于 WhatsApp Web。手机不需要一直开着，但如果手机上的 WhatsApp 被注销，需要重新扫码。

:::

::: details 连接之后 AI 不回复，怎么办？

按顺序检查：

1. 确认网关在运行：`openclaw gateway status`
2. 确认通道已连接：`openclaw channels status`
3. 检查是否有待审批的配对请求：`openclaw pairing list`
4. 如果还有问题，查看日志：`openclaw logs --follow`

:::
