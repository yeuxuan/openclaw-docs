---
title: "快速开始"
sidebarTitle: "快速开始"
description: "OpenClaw 快速入门：用最少步骤安装 OpenClaw、完成 onboarding、打开控制 UI，并发出第一条消息。"
---

# 快速开始

这篇先不讲复杂原理。你只要记住一句话：

OpenClaw 是一个运行在你自己电脑上的 AI 助手。它有一个常驻的 Gateway 网关，负责接收消息、调用 AI、再把回复送回去。

第一次使用，按下面 5 步走就够了。

::: tip 如果你完全没有技术背景
先把这篇当成“照着做清单”。
看不懂某个词时不要停，先继续复制命令。只要最后能打开浏览器控制 UI，并让 AI 回复一句话，就算成功。
:::

---

## 先准备这 3 样东西

1. 一台电脑
   macOS、Linux、Windows 都可以。Windows 可以直接用，但完整体验更推荐 WSL2。

2. Node.js
   推荐 Node 26.1+；也支持 Node 24.16+。Node 22、23、25 不受支持。
   官网脚本在 Linux 缺少 Node 时会安装 Node 24 LTS，这是当前预期行为。

3. 一个 AI 模型账号或 API key
   新手可以先用你已经有账号的提供商。OpenClaw 支持 OpenAI、Anthropic、Google、Ollama、本地或兼容 OpenAI API 的服务。

API key 可以先理解成“AI 服务的门钥匙”。OpenClaw 需要拿着这把钥匙，才能替你去问模型。

检查 Node 版本：

```bash
node --version
```

如果显示 `v26.1.0` 或更高，很好；使用 Node 24 时至少需要 `v24.16.0`。
如果提示找不到 `node`，先看[安装 Node.js](/tutorials/installation/node)。

---

## 第一步：安装 OpenClaw

### macOS / Linux / WSL2

打开终端，复制这一行：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Windows PowerShell

打开 PowerShell，复制这一行：

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

如果你更喜欢 npm，也可以这样装：

```bash
npm install -g openclaw@latest --allow-scripts=openclaw
```

`--allow-scripts=openclaw` 适用于 npm 12 和 npm 11.16+。如果仍在使用 npm 11.15
或更早版本，该参数尚不可用，请去掉参数执行安装；更推荐先升级 npm。

---

## 第二步：运行新手向导

安装完后，运行：

```bash
openclaw onboard
```

这一步会帮你做 4 件事：

1. 选择 AI 模型提供商。
2. 保存 API key 或登录信息。
3. 配置 Gateway 网关。
4. 启动前台 Gateway 并打开已认证 Dashboard。

你可以把它理解成“第一次开机设置”。跟着提示填就行，不需要提前懂所有选项。

如果本机已有可用的 Claude Code、Codex 登录或 Provider Key，选 **Quick start** 即可。
它只保存真实请求验证通过的路线。前台跑通后按 `Ctrl+C` 停止，再执行
`openclaw gateway install` 安装后台服务；配置不会丢失。

---

## 第三步：确认 Gateway 正在运行

Gateway 是 OpenClaw 的“总服务台”。
它不运行，就像服务台没人值班，聊天软件、网页控制台、手机节点都会找不到 AI。

运行：

```bash
openclaw gateway status
```

如果看到正在监听 `18789` 端口，说明 Gateway 已经起来了。

如果不确定哪里出问题，先跑：

```bash
openclaw doctor
```

`doctor` 就像体检，会检查配置、服务、权限和常见风险。

如果希望把只读诊断整理成可交给编码 Agent 的脱敏排障提示，运行：

```bash
openclaw triage
```

它不会自动修复或上传原始日志；详见 [`openclaw triage`](/tutorials/cli/triage)。

---

## 第四步：打开控制 UI

控制 UI 是浏览器里的管理界面。新手建议先在这里试第一句，不要一上来就接 Telegram 或 WhatsApp。

运行：

```bash
openclaw dashboard
```

正常情况下，浏览器会打开：

```text
http://127.0.0.1:18789/
```

看到聊天界面后，输入一句：

```text
你好，帮我用一句话介绍 OpenClaw。
```

如果 AI 回复了，恭喜，你已经跑通最小闭环了。

这个闭环的意思是：

```text
你在浏览器发消息 → OpenClaw 找 AI → AI 回复 → 浏览器看到答案
```

后面所有 Telegram、WhatsApp、手机节点，都是在这个基础上继续加东西。

---

## 第五步：再连接聊天软件

控制 UI 能聊通之后，再接聊天软件会简单很多。

推荐顺序：

1. [Telegram](/tutorials/channels/telegram)
   最适合新手，只需要 Bot Token。

2. [Discord](/tutorials/channels/discord)
   适合服务器和社区场景。

3. [WhatsApp](/tutorials/channels/whatsapp)
   适合日常手机聊天，但配置比 Telegram 多一步扫码。

更多选择看[通道总览](/tutorials/channels/)。

---

## 最容易混淆的 4 个词

| 名词 | 人话解释 |
|------|----------|
| Gateway 网关 | OpenClaw 的总服务台，负责接消息、管连接、发回复 |
| Control UI | 浏览器里的控制面板，用来聊天、看配置、看会话 |
| Channel 通道 | Telegram、WhatsApp、Discord 这些聊天入口 |
| Node 节点 | 手机、Mac、远程机器等“可被 Gateway 指挥的设备” |

::: tip 不用一次学完
第一次使用只需要记住 Gateway 和 Control UI。
Channel、Provider、Node 这些词，等你真的接聊天软件、换模型、连手机时再看。
:::

---

## 下一步读什么

- 想先稳稳装好：看[安装 OpenClaw](/tutorials/installation/)。
- 想知道系统怎么工作：看[OpenClaw 是怎么工作的](/tutorials/concepts/architecture)。
- 想从浏览器管理：看[Web 控制 UI](/tutorials/web/)。
- 想连接手机或远程机器：看[节点入门](/tutorials/nodes/)。
