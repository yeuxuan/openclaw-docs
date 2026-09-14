---
title: "零基础照着做"
sidebarTitle: "零基础照着做"
description: "OpenClaw 零基础配置教程：像陪家人操作电脑一样，一步一步安装 OpenClaw、打开控制 UI、配置模型、完成第一次对话，并知道出错时先看哪里。"
---

# 零基础照着做：把 OpenClaw 跑起来

这篇写给完全没接触过 OpenClaw 的人。

你不需要先懂 Gateway、Provider、Node、Plugin。
先把它当成一台“家里的 AI 总机”：

```text
OpenClaw 在电脑或服务器上一直运行。
你打开浏览器或聊天软件跟它说话。
它再去找 AI 模型回答你。
```

本页只做一件事：让你照着做，先成功发出第一条消息。

---

## 先准备 3 样东西

### 1. 一台电脑或服务器

新手推荐：

- macOS：最容易上手。
- Linux 服务器：适合 24 小时在线。
- Windows：推荐用 WSL2。

如果你只是第一次体验，用自己的电脑就可以。

### 2. 一个 AI 模型账号或 API Key

OpenClaw 自己不是模型，它要连接一个“AI 大脑”。

你可以选其中一种：

- OpenAI / ChatGPT 相关账号或 API Key。
- Anthropic Claude API Key。
- DeepSeek API Key。
- Ollama 本地模型。
- 其他 OpenClaw 支持的 Provider。

如果你还没决定，先看 [模型提供商](/tutorials/providers/)。

### 3. 一个终端窗口

终端就是输入命令的地方。

- macOS：打开“终端”。
- Linux：打开 SSH 或终端。
- Windows：打开 PowerShell 或 WSL2 终端。

看见黑色或白色的命令窗口，就对了。

---

## 第一步：安装 OpenClaw

### macOS / Linux / WSL2

复制这一整行，粘贴到终端里，按回车：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Windows PowerShell

复制这一整行，粘贴到 PowerShell 里，按回车：

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

安装脚本会尽量帮你准备运行环境。最新版推荐 Node.js 26.1+；也支持 Node 24.16+。Node 22、23、25 不再受支持。

---

## 第二步：运行新手向导

安装完成后，继续复制这一行：

```bash
openclaw onboard
```

这一步像手机第一次开机设置。它会问你一些问题。

你可以这样理解：

- 问模型：就是问“用哪个 AI 大脑”。
- 问 API Key：就是问“打开 AI 服务的钥匙”。
- 问 Gateway：就是问“总机怎么运行”。
- 问 daemon：就是问“要不要让它在后台一直开着”。

新手建议：能选默认就先选默认，不确定就先不要接复杂通道。

---

## 第三步：打开浏览器控制台

向导完成后，运行：

```bash
openclaw dashboard
```

它会打开浏览器里的 Control UI。
Control UI 就是 OpenClaw 的管理台。

如果浏览器打开了，并且你能看到 OpenClaw 页面，说明 Gateway 大概率已经跑起来了。

---

## 第四步：先用 WebChat 说一句话

先不要急着接 Telegram、WhatsApp 或 Discord。

先在浏览器 Control UI 里找聊天入口，发一句最简单的话：

```text
你好，请用一句话介绍你自己。
```

如果它回复了，说明主链路通了：

```text
浏览器 → Gateway → AI 模型 → Gateway → 浏览器
```

这一步成功，比接任何聊天软件都重要。

---

## 第五步：确认状态

回到终端，运行：

```bash
openclaw status
openclaw doctor
```

你可以把它们理解成：

- `status`：看 OpenClaw 现在活着没有。
- `doctor`：帮 OpenClaw 做体检。

如果输出里没有明显红色错误，先继续往下走。

---

## 第六步：再接聊天软件

WebChat 能回复以后，再接 Telegram 这类聊天软件。

新手推荐先看：

- [Telegram 教程](/tutorials/channels/telegram)
- [通道总览](/tutorials/channels/)

为什么不一开始就接聊天软件？

因为聊天软件多一层配置。
如果一开始就失败，你分不清是模型坏了、Gateway 坏了，还是聊天软件配置错了。

先让 WebChat 成功，再接通道，排查会简单很多。

---

## 如果失败了，先不要慌

按这个顺序查：

```bash
openclaw status --all
openclaw doctor
openclaw logs --follow
```

你只需要记住：

- `status` 看整体状态。
- `doctor` 给修复建议。
- `logs` 看刚刚发生了什么。

如果要去社区求助，把这三条命令的关键输出发出来，别人会更容易帮你。

::: warning 分享前先检查
不要把 API Key、token、手机号、邮箱、服务器密码发到公开群里。
:::

---

## 最小成功标准

做到下面 4 件事，就算安装成功：

1. `openclaw dashboard` 能打开浏览器页面。
2. WebChat 能收到 AI 回复。
3. `openclaw status` 能看到 Gateway 在线。
4. `openclaw doctor` 没有关键错误。

这时你已经可以继续学习：

- [安装后配置](/tutorials/getting-started/setup)
- [连接聊天软件](/tutorials/channels/)
- [选择模型 Provider](/tutorials/providers/)
- [常用 CLI 命令](/tutorials/cli/common-commands)

---

## 一句话词典

| 词 | 人话解释 |
|---|---|
| Gateway | OpenClaw 的总机，负责把各路消息接起来 |
| Control UI | 浏览器里的管理台 |
| Provider | AI 大脑的服务商，比如 OpenAI、Claude、DeepSeek |
| API Key | 调用 AI 服务的钥匙 |
| Channel | 聊天入口，比如 Telegram、Slack、WhatsApp |
| Plugin | 给 OpenClaw 加新能力的小组件 |
| Node | 连接到 Gateway 的手机、电脑或远程机器 |
| Doctor | 自动体检命令 |

记不住没关系。先跑起来，遇到哪个词再回来查。
