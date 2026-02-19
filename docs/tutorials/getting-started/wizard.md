---
title: "命令行向导安装指南"
sidebarTitle: "命令行向导"
---

# 命令行向导安装指南

> 这是 **方式二：命令行安装** 的安装指南，支持 macOS、Linux、Windows。
> 如果你想用图形界面安装，请看 [macOS App 首次启动指南](./onboarding)。

通过运行一条命令，向导会一步步问你问题，你只需要回答，最后自动帮你配置好一切。全程大约 10 分钟。

---

## 前提条件

开始之前，请确认你的电脑上已经安装了：

- **Node.js 22 或更高版本** — [点此下载 Node.js](https://nodejs.org)（选 LTS 版本即可）
- **一个 AI API 密钥**（推荐 Anthropic/Claude）— [还没有？先去获取](./getting-started#第一步准备-api-密钥)

验证 Node.js 是否已安装（在终端里输入）：

```bash
node --version
```

如果显示 `v22.x.x` 或更高版本，说明已经准备好了。

---

## 安装 OpenClaw

在终端里运行以下命令安装 OpenClaw：

```bash
npm install -g openclaw
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
openclaw onboard --install-daemon
```

> **`--install-daemon` 是什么意思？**
> 加上这个参数，网关会自动注册为系统后台服务，电脑重启后也会自动启动，不需要每次手动开。**强烈推荐加上。**

---

## 向导共 9 步，下面逐步说明

### 第 1 步：选择安装模式

向导显示：
```
How would you like to set up OpenClaw?
> Quick start (recommended)
  Advanced
```
中文意思：你想用哪种安装模式？**快速开始（推荐）** 还是 **高级**？

**直接按回车选择 "Quick start"**，快速开始会自动处理大多数配置，最省心。

---

### 第 2 步：选择 AI 提供商（最重要）

向导显示：
```
Which AI provider do you want to use?
> Anthropic (Claude) — recommended
  OpenAI (ChatGPT)
  Custom provider
```
中文意思：你想用哪家 AI？

**推荐选择 Anthropic（Claude）**，Claude 中文能力强，也是 OpenClaw 官方首选。

选好后，向导会让你输入 API 密钥：
```
Enter your Anthropic API key:
> （在这里粘贴你的密钥，回车确认）
```

::: tip 还没有 API 密钥？
1. 访问 [console.anthropic.com](https://console.anthropic.com)
2. 注册账号并登录
3. 点击 "API Keys" → "Create Key"，复制密钥（以 `sk-ant-` 开头）
4. 回到终端，粘贴进去

**注意：密钥只显示一次，创建后立刻复制保存好！**
:::

---

### 第 3 步：选择 AI 模型

向导显示：
```
Select your default model:
> claude-opus-4-6     （最强，花费最高）
  claude-sonnet-4-6   （均衡，推荐）
  claude-haiku-4-5    （最快，花费最低）
```
中文意思：选一个默认使用的 AI 模型。

**新手推荐选 `claude-sonnet-4-6`**——能力强，价格也不会太贵。

---

### 第 4 步：工作区路径

向导显示：
```
Where should the agent workspace be?
> ~/.openclaw/workspace   （默认）
  Custom path             （自定义路径）
```
中文意思：AI 助手把文件和"记忆"保存在哪里？

**直接按回车使用默认路径即可。**

---

### 第 5 步：网关端口和认证

向导显示：
```
Gateway port: 18789
Gateway authentication: Token (auto-generated)
```
中文意思：网关监听哪个端口 + 使用什么认证方式。

**全部按回车使用默认值即可。**

---

### 第 6 步：连接聊天软件（通道）

向导显示：
```
Which channels would you like to set up?
[ ] WhatsApp
[ ] Telegram
[ ] Discord
[ ] Skip for now    （稍后设置）
```
中文意思：现在要连接哪个聊天软件？

如果你现在手头有 Telegram Bot Token，可以在这里配置。**没有的话直接选 "Skip for now"**，安装完成后随时可以加。

---

### 第 7 步：安装为系统服务

向导显示：
```
Install gateway as system service?
> Yes (recommended)
  No
```
中文意思：把网关安装成开机自启的后台服务吗？

**强烈推荐选 Yes。** 这样网关会自动在后台运行，电脑重启后也不需要手动启动。

---

### 第 8 步：自动健康检查

向导会自动启动网关，然后验证它是否正常运行：

```
✓ Gateway started successfully
✓ Health check: OK
```

看到两行绿色的 ✓，说明一切正常！

如果这里失败了，请看下方的[常见问题](#常见问题)。

---

### 第 9 步：安装推荐技能

向导显示：
```
Install recommended skills?
> Yes (recommended)
  No
```
中文意思：安装一些推荐的"能力包"吗？

**选 Yes**。技能扩展了 AI 的能力，比如浏览网页、执行代码等。

---

## 向导完成！

结束时你会看到一个汇总：

```
✓ AI Provider:  Anthropic (claude-sonnet-4-6)
✓ Workspace:    ~/.openclaw/workspace
✓ Gateway:      Running on port 18789
✓ Service:      Installed (auto-start enabled)
✓ Skills:       Browser, Code, Web Search installed
```

**OpenClaw 已经配置好并在后台运行了！**

---

## 下一步：连接你的聊天软件

现在网关已经在跑了，下一步是把 Telegram（或其他聊天软件）连接进来：

**→ [接入 Telegram（推荐，5 分钟搞定）](../channels/telegram)**

---

## 以后怎么修改配置？

**重新运行向导（不会清除数据）：**

```bash
openclaw configure
```

**单独添加新的聊天软件：**

```bash
openclaw channels login --channel telegram
```

**修改 AI 模型：**

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
openclaw channels status  # 检查通道连接是否正常
```
:::

::: details 想重新来过，清空配置重装？

```bash
openclaw onboard --reset
```

加 `--reset` 会重置所有配置，但**不会删除你的聊天记录**。
:::

::: details `openclaw` 命令找不到？
可能是 npm 全局安装的路径没有加入系统 PATH。尝试：

```bash
npx openclaw --version
```

或者重新打开终端窗口再试。
:::
