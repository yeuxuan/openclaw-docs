---
title: "智能体（Agent）引导启动"
sidebarTitle: "引导启动"
---

# 智能体（Agent）引导启动

引导启动是**首次运行**时的初始化流程，用于准备智能体（Agent）工作区（Workspace）并收集身份信息。它在入门引导完成后、智能体（Agent）首次启动时执行。

---

## 引导启动的作用

在智能体（Agent）首次运行时，OpenClaw 会引导初始化工作区（Workspace）（默认路径为 `~/.openclaw/workspace`）：

- 生成 `AGENTS.md`、`BOOTSTRAP.md`、`IDENTITY.md`、`USER.md` 文件。
- 运行一个简短的问答流程（逐个提问）。
- 将身份和偏好信息写入 `IDENTITY.md`、`USER.md`、`SOUL.md`。
- 完成后删除 `BOOTSTRAP.md`，确保该流程只运行一次。

---

## 运行位置

引导启动始终在**网关（Gateway）主机**上运行。如果 macOS 应用连接到远程网关（Gateway），则工作区（Workspace）和引导文件位于该远程机器上。

::: info 说明
当网关（Gateway）运行在另一台机器上时，请在网关（Gateway）主机上编辑工作区文件（例如 `user@gateway-host:~/.openclaw/workspace`）。
:::

---

## 相关文档

- macOS 应用入门引导：[入门引导](/start/onboarding)
- 工作区（Workspace）布局：[智能体（Agent）工作区](/concepts/agent-workspace)
