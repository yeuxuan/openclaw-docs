---
title: "文档中心"
sidebarTitle: "文档中心"
description: "OpenClaw 中文文档站的完整导览：从安装、Web 控制 UI、频道、模型、网关、节点到源码剖析。"
---

# 文档中心

如果你第一次打开 OpenClaw，不要急着把所有页面都看完。
先记住一句话：OpenClaw 是一个运行在你自己电脑或服务器上的 AI 助手总机。

它把 Telegram、WhatsApp、Slack、Discord、WebChat 等聊天入口接进来，再把消息交给后面的 AI 模型和工具去处理。你可以把它想成家里的“总开关”：灯、空调、门铃都接到这里，你只需要知道开关在哪。

::: tip 新手路线
第一次使用，建议按这个顺序走：

1. [快速入门](/tutorials/getting-started/getting-started)
2. [安装 OpenClaw](/tutorials/installation/)
3. [打开 Web 控制 UI](/tutorials/web/)
4. [连接一个聊天频道](/tutorials/channels/)
5. [选择一个 AI 大脑](/tutorials/providers/)
6. [遇到问题看帮助中心](/tutorials/help/)
:::

---

## 先把 OpenClaw 跑起来

这些页面解决“我电脑上怎么有一个能工作的 OpenClaw”。

- [快速入门](/tutorials/getting-started/getting-started)：最短路线，适合第一次安装
- [安装 OpenClaw](/tutorials/installation/)：脚本安装、npm 安装、检查环境
- [安装向导](/tutorials/getting-started/wizard)：用 `openclaw onboard` 跑通 Quick start，再按需安装后台服务
- [基础设置](/tutorials/getting-started/setup)：装好之后要检查什么
- [更新与回滚](/tutorials/installation/updating)：以后升级时看这里
- [Docker 部署](/tutorials/installation/docker)：想放到服务器或容器里运行
- [Nix 安装](/tutorials/installation/nix)：适合熟悉 Nix 的用户

---

## 认识核心架构

这些页面解决“它到底是怎么工作的”。

- [通俗架构说明](/tutorials/concepts/architecture)：用前台、总机、后厨的比喻理解 OpenClaw
- [系统架构设计](/tutorials/concepts/system-architecture)：更适合开发者的源码级结构
- [功能特性](/tutorials/concepts/features)：当前 OpenClaw 能做什么
- [智能体循环](/tutorials/concepts/agent-loop)：一条消息从进来到回复出去的过程
- [会话管理](/tutorials/concepts/session)：为什么 OpenClaw 能记住一段对话
- [多智能体路由](/tutorials/concepts/multi-agent)：多个 AI 助手如何分工
- [模型故障转移](/tutorials/concepts/model-failover)：主模型不可用时如何切到备用模型

---

## Web 控制 UI

新版 OpenClaw 把浏览器控制台作为日常管理入口。它不是装饰品，网关、频道、会话和配置都可以从这里查看。

- [Web 控制 UI 总览](/tutorials/web/)：从浏览器查看网关、频道、会话和配置
- 默认地址：`http://127.0.0.1:18789/`
- 常用命令：`openclaw dashboard`

如果你不知道 OpenClaw 现在有没有跑起来，先打开这里看一眼，通常比翻日志更省事。

---

## 网关与运维

网关是 OpenClaw 的“总机”。它负责收消息、分发任务、管理频道、连接节点、保存运行状态。

- [网关运维手册](/tutorials/gateway/)：状态检查、启动停止、重启和常用命令
- [配置文件](/tutorials/gateway/configuration)：OpenClaw 的配置放在哪里、怎么改
- [配置示例](/tutorials/gateway/configuration-examples)：照着改的样板
- [发现与传输](/tutorials/gateway/discovery)：本机和局域网里如何找到网关
- [配对](/tutorials/gateway/pairing)：设备和网关如何建立信任
- [远程访问](/tutorials/gateway/remote)：把 OpenClaw 放到服务器时要注意什么
- [安全](/tutorials/gateway/security)：不要把总机裸奔到公网
- [网关故障排查](/tutorials/gateway/troubleshooting)：启动失败、断连、端口占用

---

## 聊天频道

频道就是 OpenClaw 和外界说话的“门口”。你可以只开一个频道，也可以同时开很多个。

- [频道总览](/tutorials/channels/)：不知道选哪个入口时先看这里
- [Telegram](/tutorials/channels/telegram)：新手最推荐，配置清楚，反馈快
- [WhatsApp](/tutorials/channels/whatsapp)：适合手机即时通讯场景
- [Discord](/tutorials/channels/discord)：适合社区、群组和开发者服务器
- [Slack](/tutorials/channels/slack)：适合团队协作
- [Signal](/tutorials/channels/signal)：适合更重视隐私的用户
- [BlueBubbles / iMessage](/tutorials/channels/bluebubbles)：适合 Apple 生态
- [Mattermost](/tutorials/channels/mattermost)、[Matrix](/tutorials/channels/matrix)、[Teams](/tutorials/channels/msteams)：适合团队和自托管协作场景

频道在新版 OpenClaw 中多由插件承载。普通用户只需要知道：能在向导里启用的，就按向导来；向导找不到的，再看对应插件说明。

---

## AI 模型和提供商

模型提供商就是 OpenClaw 后面的“AI 大脑”。OpenClaw 负责调度，真正写代码、总结、分析的是模型。

- [选择 AI 大脑](/tutorials/providers/)：新手从这里开始
- [OpenAI](/tutorials/providers/openai)：OpenAI API 和兼容端点
- [Anthropic](/tutorials/providers/anthropic)：Claude 系列模型
- [OpenRouter](/tutorials/providers/openrouter)：一个入口访问多家模型
- [Ollama](/tutorials/providers/ollama)：在自己电脑上跑本地模型
- [vLLM](/tutorials/providers/vllm)：自托管高性能推理
- [LiteLLM](/tutorials/providers/litellm)：统一代理多家模型
- [自定义模型提供商](/tutorials/providers/custom)：接入 OpenAI 兼容或 Anthropic 兼容服务

---

## 工具、插件与节点

工具让 AI 不只会聊天，还能做事。插件让 OpenClaw 能扩展新能力。节点让手机、桌面应用或远程设备也能参与进来。

- [工具系统](/tutorials/tools/)：浏览器、命令、网页、画布、技能等能力概览
- [插件专题](/tutorials/plugins/)：理解 `openclaw.plugin.json`、能力注册和插件加载
- [浏览器工具](/tutorials/tools/browser)：让 Agent 操作网页
- [Exec 命令工具](/tutorials/tools/exec)：让 Agent 在允许范围内运行命令
- [技能系统](/tutorials/tools/skills)：给 Agent 加一份“做事说明书”
- [子智能体](/tutorials/tools/subagents)：把复杂任务拆给多个 Agent
- [节点总览](/tutorials/nodes/)：手机、桌面或远程设备如何连接网关
- [Canvas 工具](/tutorials/tools/canvas)：在节点上显示交互式画布

---

## 自动化

自动化适合“到点做”“有事件就做”“外部系统通知后做”的任务。

- [自动化总览](/tutorials/automation/)：先理解 Hooks、Cron、Webhook、Heartbeat
- [Hooks 事件钩子](/tutorials/automation/hooks)：系统发生事情时自动触发
- [Cron 定时任务](/tutorials/automation/cron-jobs)：每天、每周、每小时运行
- [Cron vs Heartbeat](/tutorials/automation/cron-vs-heartbeat)：什么时候用哪一种
- [后台任务 Tasks](/tutorials/automation/tasks)：查看后台任务是否成功
- [Task Flow 任务流](/tutorials/automation/taskflow)：跟踪多步骤流程
- [Standing Orders 长期指令](/tutorials/automation/standing-orders)：给 Agent 长期授权和边界
- [Webhook](/tutorials/automation/webhook)：让 GitHub、监控系统或其他服务触发 OpenClaw
- [自动化故障排查](/tutorials/automation/troubleshooting)：任务不执行时从哪里查

---

## 源码剖析

如果你不只是想用，还想读懂 OpenClaw 源码，可以走这两条线。

- [完整工程主线](/beginner-openclaw-guide/)：从入口、配置、通道、插件、队列一路读到实现细节
- [AI 核心框架主线](/beginner-openclaw-framework-focus/)：更聚焦 Agent、模型、上下文、工具调用

这两部分不是官方文档翻译，而是本站按“慢慢讲清楚”的方式整理的源码导读。

---

## 遇到问题

- [帮助中心](/tutorials/help/)：先从这里判断问题类型
- [常见问题 FAQ](/tutorials/help/faq)：新手最常问的问题
- [调试指南](/tutorials/help/debugging)：看日志、开调试、定位异常
- [故障排查](/tutorials/help/troubleshooting)：Agent 不回复、频道断连、网关起不来
- [环境变量](/tutorials/help/environment)：密钥和配置不生效时看这里

记住一个最朴素的排查顺序：

```bash
openclaw doctor
openclaw gateway status
openclaw dashboard
```

先确认环境，再确认网关，最后进浏览器看状态。这样最省力。
