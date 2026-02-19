---
title: "快速开始"
sidebarTitle: "快速开始"
---

# 快速开始

**OpenClaw 是什么？**

OpenClaw 是一个运行在你自己电脑上的 AI 助手平台。安装完成后，你可以在 Telegram、WhatsApp、Discord 等聊天软件里直接和 AI 对话——发消息、让它帮你写东西、查资料、执行任务，就像有一个随时待命的私人助手。

---

## 第一步：准备 API 密钥

OpenClaw 本身是免费的，但它需要借助 AI 服务（比如 Anthropic 的 Claude）来产生智能回复。**你需要提前准备好一个 API 密钥。**

::: tip 推荐使用 Anthropic（Claude）
Claude 中文理解能力强，也是 OpenClaw 官方首选。
:::

**如何获取 Anthropic API 密钥：**

1. 打开浏览器，访问 [console.anthropic.com](https://console.anthropic.com)
2. 注册账号并登录
3. 点击左侧菜单 **"API Keys"**，再点击 **"Create Key"**
4. 给密钥起个名字（随便写），点击确认
5. **立刻复制这串密钥**（以 `sk-ant-` 开头）——它只显示一次！

> 也可以使用 OpenAI（ChatGPT）的密钥，在 [platform.openai.com](https://platform.openai.com) 注册获取。

---

## 第二步：选择安装方式

OpenClaw 提供两种安装方式，选一种适合你的就行：

### 方式一：macOS 桌面应用（图形界面）

**适合：** 不熟悉命令行的用户，或者只用 Mac 的用户

- ✅ 有可视化界面，点一点就能完成配置
- ✅ 自动管理后台服务，不用手动启动
- ❌ 仅支持 **macOS**

**下载 macOS App：**
前往 [GitHub Releases](https://github.com/openclaw/openclaw/releases) 页面，下载最新版本的 `.dmg` 文件，双击安装。

**→ [去 macOS App 首次启动指南](./onboarding)**

---

### 方式二：命令行安装（跨平台）

**适合：** 开发者，或者在 Linux / Windows 上使用的用户

- ✅ 支持 macOS、Linux、Windows
- ✅ 灵活配置，适合高级用法
- ⚠️ 需要使用终端（命令行），共 9 步，大约 10 分钟

**→ [去命令行向导安装指南](./wizard)**

---

## 安装完成后做什么？

装好之后，下一步是把你的聊天软件连接上来，这样 AI 才能接收你的消息。推荐先接 Telegram，最简单：

**→ [接入 Telegram（推荐新手，5 分钟搞定）](../channels/telegram)**

如果安装过程中遇到了问题，或者想了解更多配置：

**→ [安装后配置与常见问题](./setup)**
