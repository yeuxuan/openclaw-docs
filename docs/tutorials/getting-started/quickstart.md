---
title: "快速开始"
sidebarTitle: "快速开始"
---

# 快速开始（3 分钟）

> 这是最精简的安装路径，只有 3 个步骤。如果需要详细说明，请看[完整入门指南](/tutorials/getting-started/getting-started)。

---

## 第一步：安装 OpenClaw

**macOS / Linux（在终端里运行）：**

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

**Windows（在 PowerShell 里运行）：**

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

::: info 前提条件
需要 Node.js 22 或更新版本。用 `node -v` 检查。没有的话先看[安装 Node.js](/tutorials/installation/node)。
:::

---

## 第二步：运行配置向导

```bash
openclaw onboard
```

跟着向导走，它会问你：
1. 选择 AI 服务商（推荐 **Anthropic / Claude**）
2. 填入 API 密钥
3. 选择聊天软件（推荐先选 **Telegram**）

整个过程 2~3 分钟，向导会帮你完成所有配置。

---

## 第三步：启动并开始对话

```bash
openclaw gateway
```

然后在浏览器打开 [http://127.0.0.1:18789](http://127.0.0.1:18789)，或运行：

```bash
openclaw dashboard
```

在控制面板的输入框里发消息，AI 就会回复了！

---

## 下一步

- **在 Telegram / WhatsApp 里聊天** → [通道接入教程](/tutorials/channels/)
- **了解详细设置** → [完整入门指南](/tutorials/getting-started/getting-started)
- **遇到问题？** → [故障排查](/tutorials/gateway/troubleshooting)
