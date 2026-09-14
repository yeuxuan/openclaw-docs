---
title: "文档目录"
sidebarTitle: "文档目录"
description: "OpenClaw 中文文档站精选索引：按新手、部署、频道、模型、工具、源码阅读路线分类。"
---

# 文档目录

这是一个精选目录，不追求把所有页面都塞进来。
如果你是第一次使用 OpenClaw，先走“新手必读”；如果你已经跑起来了，再按问题来找。

::: info 不知道从哪开始？
从 [零基础照着做](/tutorials/getting-started/grandma-guide) 开始。
如果你想看更完整的地图，再看 [文档中心](/tutorials/getting-started/hubs)。
:::

---

## 新手必读

- [零基础照着做](/tutorials/getting-started/grandma-guide)
- [快速入门](/tutorials/getting-started/getting-started)
- [安装 OpenClaw](/tutorials/installation/)
- [安装向导](/tutorials/getting-started/wizard)
- [基础设置](/tutorials/getting-started/setup)
- [团队共享 Gateway](/tutorials/getting-started/teams)
- [Web 控制 UI](/tutorials/web/)
- [帮助中心](/tutorials/help/)

---

## 先理解这几个词

- [OpenClaw 架构](/tutorials/concepts/architecture)
- [网关 Gateway](/tutorials/gateway/)
- [频道 Channel](/tutorials/channels/)
- [模型提供商](/tutorials/providers/)
- [插件专题](/tutorials/plugins/)
- [节点 Nodes](/tutorials/nodes/)

一句话版：

- Gateway：总机
- Channel：聊天入口
- Provider：AI 大脑
- Plugin：扩展能力
- Node：连接到网关的手机、桌面或远程设备
- Control UI：浏览器里的管理台

---

## 常用配置

- [网关配置](/tutorials/gateway/configuration)
- [配置示例](/tutorials/gateway/configuration-examples)
- [环境变量](/tutorials/help/environment)
- [模型选择](/tutorials/providers/models)
- [自定义模型提供商](/tutorials/providers/custom)
- [OAuth](/tutorials/concepts/oauth)

---

## 频道入口

- [频道总览](/tutorials/channels/)
- [Telegram](/tutorials/channels/telegram)
- [WhatsApp](/tutorials/channels/whatsapp)
- [Discord](/tutorials/channels/discord)
- [Slack](/tutorials/channels/slack)
- [Signal](/tutorials/channels/signal)
- [BlueBubbles / iMessage](/tutorials/channels/bluebubbles)
- [Matrix](/tutorials/channels/matrix)
- [Mattermost](/tutorials/channels/mattermost)
- [Microsoft Teams](/tutorials/channels/msteams)

---

## 工具与自动化

- [工具系统](/tutorials/tools/)
- [浏览器工具](/tutorials/tools/browser)
- [命令执行工具](/tutorials/tools/exec)
- [执行审批](/tutorials/tools/exec-approvals)
- [技能系统](/tutorials/tools/skills)
- [子智能体](/tutorials/tools/subagents)
- [斜杠命令](/tutorials/tools/slash-commands)
- [自动化总览](/tutorials/automation/)
- [Cron 定时任务](/tutorials/automation/cron-jobs)
- [Webhook](/tutorials/automation/webhook)
- [后台任务 Tasks](/tutorials/automation/tasks)
- [Task Flow 任务流](/tutorials/automation/taskflow)

---

## 运维与安全

- [网关运维](/tutorials/gateway/)
- [健康检查](/tutorials/gateway/health)
- [日志](/tutorials/gateway/logging)
- [Doctor 诊断](/tutorials/gateway/doctor)
- [沙箱](/tutorials/gateway/sandboxing)
- [远程访问](/tutorials/gateway/remote)
- [Tailscale](/tutorials/gateway/tailscale)
- [安全建议](/tutorials/gateway/security)
- [故障排查](/tutorials/help/troubleshooting)

---

## 源码阅读

- [完整工程主线](/beginner-openclaw-guide/)
- [AI 核心框架主线](/beginner-openclaw-framework-focus/)
- [通道适配器框架](/beginner-openclaw-guide/04-通道适配器框架与账号生命周期)
- [插件系统源码剖析](/beginner-openclaw-guide/08-插件系统)
- [通道适配器实现索引](/beginner-openclaw-guide/59-通道适配器实现索引)

---

## 排查三连

遇到“不知道坏在哪”的问题，先按这个顺序：

```bash
openclaw doctor
openclaw gateway status
openclaw dashboard
```

这三步分别回答：

- 我的电脑环境对不对？
- OpenClaw 网关有没有活着？
- 浏览器管理台里能不能看到频道、会话和错误？
