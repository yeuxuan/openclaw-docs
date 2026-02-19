---
title: "OpenClaw 是怎么工作的（系统架构）"
sidebarTitle: "OpenClaw 是怎么工作的"
---

# OpenClaw 是怎么工作的？

这篇文章用生活化的语言解释 OpenClaw 的工作原理。不了解技术也没关系，看完你就知道每个部件是干什么的了。

---

## 用"餐厅"来理解 OpenClaw

把 OpenClaw 想象成一家特殊的餐厅：

- **网关（Gateway）** = 餐厅前台 + 点菜系统，负责接待所有客人（消息）
- **AI 助手（Agent）** = 后厨的厨师，负责处理每一个请求并给出回答
- **通道（Telegram/WhatsApp 等）** = 不同的点餐方式（电话点餐、外卖 App、到店点餐）
- **AI 模型（Anthropic/OpenAI）** = 餐厅使用的食材供应商，厨师根据供应商的食材做菜

```
你的消息
    ↓
Telegram / WhatsApp / Discord（通道）
    ↓
网关（Gateway）—— 接收、分发、管理
    ↓
AI 助手（Agent）—— 理解消息、制定回复
    ↓
AI 模型（Claude / ChatGPT）—— 生成回复内容
    ↓
网关（Gateway）—— 把回复发送回去
    ↓
你收到回复
```

---

## 各个部件详解

### 网关（Gateway）——系统的心脏

网关是整个系统最重要的部件，**它必须持续运行**，所有消息都经过它。

网关负责：
- 接收来自各个聊天软件的消息
- 把消息转发给 AI 助手处理
- 把 AI 助手的回复发送回去
- 管理所有的连接和安全认证

> 如果把网关比作餐厅，关掉网关就相当于餐厅前台下班了——没有人接待客人，生意就停了。

**网关默认运行在你电脑的 `127.0.0.1:18789` 地址。**（这是一个只有你自己电脑能访问的内部地址，外人无法直接访问。）

### AI 助手（Agent）——真正"思考"的部分

AI 助手是实际处理你问题的组件。它有自己的：

- **工作空间（Workspace）**：AI 助手保存文件和笔记的文件夹（默认在 `~/.openclaw/workspace`）
- **记忆（Memory）**：它记住你们之间对话的历史
- **工具（Tools）**：它能用来帮你做事情的能力（浏览网页、执行代码等）

### 通道（Channels）——消息的"入口"

通道就是你和 AI 助手对话的途径。你可以同时开启多个通道：

- Telegram Bot → 在 Telegram 里和 AI 聊
- WhatsApp 账号 → 在 WhatsApp 里和 AI 聊
- Discord Bot → 在 Discord 里和 AI 聊
- 网页控制台 → 在浏览器里直接和 AI 聊

所有通道的消息最终都汇聚到网关，再转给 AI 助手处理。

### AI 模型（Provider）——AI 的"大脑"

AI 模型是真正产生智能回复的地方。OpenClaw 支持接入多种 AI 服务：

- **Anthropic (Claude)**：Anthropic 公司的 Claude 模型
- **OpenAI (ChatGPT)**：OpenAI 公司的 GPT 模型
- **Ollama**：在你自己电脑上运行的开源模型

---

## 一条消息的完整旅程

当你在 Telegram 发送"帮我写一首诗"时，这是发生的事情：

```
1. 你在 Telegram 发送消息
2. Telegram Bot 把消息转发给 OpenClaw 网关
3. 网关检查你是否有权限（安全验证）
4. 网关把消息传给 AI 助手
5. AI 助手组织上下文（记忆 + 当前消息）
6. AI 助手把请求发给 AI 模型（比如 Claude）
7. Claude 生成一首诗
8. AI 助手把诗传回网关
9. 网关通过 Telegram Bot 把诗发给你
10. 你在 Telegram 收到这首诗 🎉
```

整个过程通常只需要几秒钟。

---

## 安全是怎么保证的？

OpenClaw 默认采用"配对（Pairing）"安全机制：

- **陌生人发消息**：OpenClaw 不会直接让 AI 回复，而是发出一个"配对码"
- **你审批**：你用 `openclaw pairing approve <码>` 批准或拒绝
- **批准后**：被批准的人就可以和 AI 自由聊天了

这样，你的 AI 助手不会被陌生人随意使用。

---

## 从外面访问——远程连接

默认情况下，网关只在你的本地电脑上运行，外网无法直接访问。

如果你想从手机或其他地方远程访问（比如出门在外也能管理 OpenClaw），推荐使用 **Tailscale**：

1. 在运行 OpenClaw 的电脑上安装 Tailscale
2. 在你的手机/其他设备上也安装 Tailscale
3. 两台设备就像在同一个内网里，可以安全地互相访问

详细配置：[认证与远程访问](/tutorials/gateway/authentication)
