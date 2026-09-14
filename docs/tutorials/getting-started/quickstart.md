---
title: "快速开始"
sidebarTitle: "快速开始"
description: "OpenClaw 快速入门：快速开始（3 分钟）。用安装脚本、onboard 向导和 Web 控制 UI 跑通第一个 OpenClaw。"
---

# 快速开始（3 分钟）

> 这是最精简的安装路径，只有 3 个步骤。如果需要详细说明，请看[完整入门指南](/tutorials/getting-started/getting-started)。

---

## 第一步：安装 OpenClaw

macOS / Linux（在终端里运行）：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Windows（在 PowerShell 里运行）：

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

::: info 前提条件
推荐使用 Node.js 26.1+；也支持 Node 24.16+。Node 22、23、25 不受支持。
安装脚本通常会帮你处理 Node.js。想手动检查，可以运行 `node -v`，详见[安装 Node.js](/tutorials/installation/node)。
:::

---

## 第二步：运行配置向导

```bash
openclaw onboard
```

选择 **Quick start**。它会发现已有的 Claude Code、Codex 登录或 Provider Key，
只把真实请求验证通过的路线写入配置，然后以前台 Gateway 打开 Dashboard。没有
可复用路线时，再按提示手动选择服务商。要逐项配置通道、远程 Gateway 等高级
选项，运行 `openclaw onboard --classic`。

---

## 第三步：打开控制 UI，开始对话

Quick start 会直接打开浏览器控制台，并让 Gateway 留在当前终端。第一条消息验证
成功后按 `Ctrl+C` 停止前台进程，再安装后台服务：

```bash
openclaw gateway install
```

以后可用下面的命令重新打开控制台：

```bash
openclaw dashboard
```

也可以直接访问 [http://127.0.0.1:18789](http://127.0.0.1:18789)。

在控制 UI 的输入框里发消息，AI 能回复，就说明第一步跑通了。

---

## 下一步

- 在 Telegram / WhatsApp 里聊天 → [频道接入教程](/tutorials/channels/)
- 了解详细设置 → [完整入门指南](/tutorials/getting-started/getting-started)
- 遇到问题？ → [故障排查](/tutorials/gateway/troubleshooting)
