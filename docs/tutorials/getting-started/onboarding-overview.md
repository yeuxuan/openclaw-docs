---
title: "入门引导概述"
sidebarTitle: "入门引导概述"
---

# 入门引导概述

OpenClaw 支持多种入门引导路径，具体取决于网关（Gateway）的运行位置以及你偏好的提供商配置方式。

---

## 选择你的入门引导路径

- **CLI 向导**，适用于 macOS、Linux 和 Windows（通过 WSL2）。
- **macOS 应用**，适用于 Apple silicon 或 Intel Mac 上的引导式首次运行。

---

## CLI 入门引导向导

在终端中运行向导：

```bash
openclaw onboard
```

当你需要完全控制网关（Gateway）、工作区（Workspace）、通道（Channel）和技能时，请使用 CLI 向导。文档：

- [入门引导向导 (CLI)](/start/wizard)
- [`openclaw onboard` 命令](/cli/onboard)

---

## macOS 应用入门引导

当你需要在 macOS 上进行完全引导式设置时，请使用 OpenClaw 应用。文档：

- [入门引导 (macOS 应用)](/start/onboarding)

---

## 自定义提供商

如果你需要一个未列出的端点，包括暴露标准 OpenAI 或 Anthropic API 的托管提供商，请在 CLI 向导中选择**自定义提供商**。你需要：

- 选择 OpenAI 兼容、Anthropic 兼容或**未知**（自动检测）。
- 输入基础 URL 和 API 密钥（如果提供商需要）。
- 提供模型 ID 和可选别名。
- 选择一个端点 ID，以便多个自定义端点可以共存。

详细步骤请参阅上方的 CLI 入门引导文档。
