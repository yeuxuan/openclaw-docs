---
title: "入门引导概述"
sidebarTitle: "入门引导概述"
description: "OpenClaw 快速入门：入门引导概述。OpenClaw 支持多种入门引导路径，具体取决于网关（Gateway）的运行位置以及你偏好的提供商配置方式。"
---

# 入门引导概述

OpenClaw 支持多种入门引导路径，具体取决于网关（Gateway）的运行位置以及你偏好的提供商配置方式。

所有路径都先验证真实推理，再配置其他功能。桌面端即使发现已配置模型，也要收到真实回复后才进入正常界面；“Gateway 能连上”或“模型名已保存”都不等于推理通过。

---

## 选择你的入门引导路径

- CLI 向导，适用于 macOS、Linux 和 Windows（通过 WSL2）。
- macOS 应用，适用于 Apple silicon 或 Intel Mac 上的引导式首次运行。
- Linux 桌面伴侣，支持本机 Gateway 或 URL / SSH 隧道连接的远程 Gateway。

---

## CLI 入门引导向导

在终端中运行向导：

```bash
openclaw onboard
```

首次运行优先选择 **Quick start**，它会验证现有 AI 访问并以前台 Gateway 打开
Dashboard；确认可用后按 `Ctrl+C`，再运行 `openclaw gateway install`。需要完全
控制网关、工作区、通道和技能时，使用 `openclaw onboard --classic`。文档：

- [入门引导向导 (CLI)](/tutorials/getting-started/wizard)
- [`openclaw onboard` 命令](/tutorials/getting-started/wizard-cli-reference)

---

## macOS 应用入门引导

当你需要在 macOS 上进行完全引导式设置时，请使用 OpenClaw 应用。文档：

- [入门引导 (macOS 应用)](/tutorials/getting-started/onboarding)

本地运行时可由 App 在私有目录安装，不要求全局 npm 安装。新模型通过验证后，记忆导入、通道等可选设置在 Dashboard 中完成；macOS 权限在 **Settings → Permissions** 按需设置。

## Linux 桌面端和恢复

Linux 本地模式在私有托管目录准备 CLI/Node 并启动 systemd 用户服务。模型验证通过后进入引导；已有模型验证通过则打开正常界面。

重启或重新打开 App 时，恢复依赖绑定 Gateway、Agent 和鉴权的临时记录。已知模型可直接重新验证；结果未知时需要明确点击 **Verify & use selected model**，不会静默重复激活。记录过期、浏览器存储不可用或连接归属改变，都可能阻止恢复。

---

## 自定义提供商

如果你需要一个未列出的端点，包括暴露标准 OpenAI 或 Anthropic API 的托管提供商，请在 CLI 向导中选择自定义提供商。你需要：

- 选择 OpenAI 兼容、Anthropic 兼容或未知（自动检测）。
- 输入基础 URL 和 API 密钥（如果提供商需要）。
- 提供模型 ID 和可选别名。
- 选择一个端点 ID，以便多个自定义端点可以共存。

详细步骤请参阅上方的 CLI 入门引导文档。
