---
title: "命令行向导安装指南"
sidebarTitle: "命令行向导"
description: "用 openclaw onboard 完成 OpenClaw 首次配置，包括模型真实验证、前台 Gateway 和控制 UI。"
---

# 命令行向导安装指南

> 新手建议走这条路径：安装 OpenClaw 后运行 `openclaw onboard`。它支持 macOS、Linux 和 Windows；Windows 上完整体验更推荐 WSL2。

向导会逐步询问模型、Gateway、控制 UI 和通道设置。你按提示回答即可，通常 10 分钟左右能跑通第一条消息。

---

## 前提条件

开始之前，你需要准备：

- 一个 AI API Key，或一个可登录的模型账号。还没有的话，先看[准备事项](./getting-started#先准备这-3-样东西)。

Node.js 是必需运行环境。推荐 v26.1+，也支持 v24.16+；Node 22、23、25 不受支持。

---

## 安装 OpenClaw

### 方式 A：一键安装（推荐新手）

在终端里粘贴下面这条命令。安装脚本会检查 Node.js，并安装 OpenClaw：

macOS / Linux / WSL2：
```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
```

Windows（PowerShell）：
```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

::: tip 这条命令做了什么？
1. 检测你的操作系统
2. 如果没有安装合适的 Node.js，macOS 准备 Node 26，Linux 准备 Node 24 LTS
3. 用 npm 全局安装 OpenClaw
4. 启动设置向导（就是下面说的 9 步）

全程自动，不需要你手动处理 Node.js 版本问题。
:::

安装完成后，直接跳到[向导共 9 步](#向导共-9-步下面逐步说明)。

---

### 方式 B：手动安装（已有兼容的 Node.js）

如果你已经安装了 Node 24.16+ 或 26.1+，可以直接用 npm 安装：

验证 Node.js 版本（在终端里输入）：

```bash
node --version
```

如果显示 `v26.1.0` 或更高最省心；Node 24 至少需要 `v24.16.0`。Node 22、23、25 请先升级，或直接使用方式 A。

在终端里运行以下命令安装 OpenClaw：

```bash
npm install -g openclaw@latest --allow-scripts=openclaw
```

安装完成后，验证一下：

```bash
openclaw --version
```

看到版本号说明安装成功。

---

## 运行设置向导

安装好之后，运行这条命令启动设置向导：

```bash
openclaw onboard
```

> Quick start 会把 Gateway 留在当前终端并打开 Dashboard。验证第一条消息后按
> `Ctrl+C` 停止前台进程，再运行 `openclaw gateway install` 注册后台服务。

---

## 向导共 9 步，下面逐步说明

### 第 1 步：选择安装模式

向导显示：
```text
How would you like to set up OpenClaw?
> Quick start (recommended)
  Advanced
```
中文意思：你想用哪种安装模式，快速开始还是高级模式？

第一次使用直接按回车选 "Quick start"。它会处理大多数配置。

---

### 第 2 步：选择 AI 提供商（最重要）

向导显示：
```text
Which AI provider do you want to use?
> Anthropic (Claude) : recommended
  OpenAI (ChatGPT)
  Custom provider
```
中文意思：你想用哪家 AI？

如果你不知道选哪个，可以从 Anthropic（Claude）或 OpenAI 开始；如果你更重视本地运行，可以选择 Ollama 或自定义兼容端点。

选好后，向导会让你输入 API 密钥：
```text
Enter your Anthropic API key:
> （在这里粘贴你的密钥，回车确认）
```

::: tip 还没有 API 密钥？
1. 访问 [console.anthropic.com](https://console.anthropic.com)
2. 注册账号并登录
3. 点击 "API Keys" : "Create Key"，复制密钥（以 `sk-ant-` 开头）
4. 回到终端，粘贴进去

注意：密钥只显示一次，创建后立刻复制保存好！
:::

---

### 第 3 步：选择 AI 模型

向导显示：
```text
Select your default model:
> claude-opus-4-6     （最强，花费最高）
  claude-sonnet-4-6   （均衡，推荐）
  claude-haiku-4-5    （最快，花费最低）
```
中文意思：选一个默认使用的 AI 模型。

新手可以先选 `claude-sonnet-4-6`。它比较均衡，价格也不会一上来太高。

---

### 第 4 步：工作区路径

向导显示：
```text
Where should the agent workspace be?
> ~/.openclaw/workspace   （默认）
  Custom path             （自定义路径）
```
中文意思：AI 助手把文件和"记忆"保存在哪里？

直接按回车使用默认路径即可。

---

### 第 5 步：网关端口和认证

向导显示：
```text
Gateway port: 18789
Gateway authentication: Token (auto-generated)
```
中文意思：网关监听哪个端口 + 使用什么认证方式。

全部按回车使用默认值即可。

---

### 第 6 步：连接聊天软件（通道）

向导显示：
```text
Which channels would you like to set up?
[ ] WhatsApp
[ ] Telegram
[ ] Discord
[ ] Skip for now    （稍后设置）
```
中文意思：现在要连接哪个聊天软件？

如果你现在有 Telegram Bot Token，可以在这里配置。没有的话选 "Skip for now"，安装完成后也能随时添加。

---

### 第 7 步：安装为系统服务

向导显示：
```text
Install gateway as system service?
> Yes (recommended)
  No
```
中文意思：把网关安装成开机自启的后台服务吗？

建议选 Yes。这样 Gateway 会在后台运行，电脑重启后也不需要手动启动。

---

### 第 8 步：自动健康检查

向导会自动启动网关，然后验证它是否正常运行：

```text
✓ Gateway started successfully
✓ Health check: OK
```

看到两行绿色的 ✓，说明一切正常！

如果这里失败了，请看下方的[常见问题](#常见问题)。

---

### 第 9 步：安装推荐技能

向导显示：
```text
Install recommended skills?
> Yes (recommended)
  No
```
中文意思：安装一些推荐的"能力包"吗？

选 Yes。技能扩展了 AI 的能力，比如浏览网页、执行代码等。

---

## 向导完成！

结束时你会看到一个汇总：

```text
✓ AI Provider:  Anthropic (claude-sonnet-4-6)
✓ Workspace:    ~/.openclaw/workspace
✓ Gateway:      Running on port 18789
✓ Service:      Installed (auto-start enabled)
✓ Skills:       Browser, Code, Web Search installed
```

OpenClaw 已经配置好并在后台运行了！

---

## 下一步：连接你的聊天软件

现在网关已经在跑了，下一步是把 Telegram（或其他聊天软件）连接进来：

: [接入 Telegram（推荐，5 分钟搞定）](../channels/telegram)

---

## 以后怎么修改配置？

重新运行向导（不会清除数据）：

```bash
openclaw configure
```

单独添加新的聊天软件：

```bash
openclaw configure --section channels
```

如果是 Telegram，请记住它不是扫码登录通道：把 BotFather Token 写进配置即可；不要用 `channels login --channel telegram`。

修改 AI 模型：

```bash
openclaw configure --section model
```

---

## 常见问题

::: details 向导中途卡住了，怎么办？
按 `Ctrl + C` 退出，然后重新运行 `openclaw onboard`。之前的配置会保留，向导会从出错的地方继续。
:::

::: details 向导完成了，但 AI 不回复，怎么排查？

按顺序检查：

```bash
openclaw doctor           # 自动诊断所有问题
openclaw gateway status   # 检查网关是否在运行
openclaw channels status --probe  # 检查通道连接是否正常
```
:::

::: details 想重新来过，清空配置重装？

```bash
openclaw onboard --reset
```

加 `--reset` 会重置所有配置，但不会删除你的聊天记录。
:::

::: details `openclaw` 命令找不到？
可能是 npm 全局安装的路径没有加入系统 PATH。尝试：

```bash
npx openclaw --version
```

或者重新打开终端窗口再试。
:::
