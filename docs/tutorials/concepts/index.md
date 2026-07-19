---
title: "核心概念"
sidebarTitle: "核心概念"
---

# 核心概念：理解 OpenClaw 的工作方式

如果你刚接触 OpenClaw，先不要被 Agent、Provider、Gateway、Plugin 这些词吓住。
它们其实都能用生活里的东西类比。

OpenClaw 的核心结构可以先这样记：

- Gateway：总机，所有消息和连接都先到这里
- Control UI：浏览器里的管理台，用来看状态和配置
- Channel：聊天入口，比如 Telegram、WhatsApp、Slack
- Provider：AI 大脑，比如 OpenAI、Anthropic、本地模型
- Agent：真正处理任务的 AI 助手
- Tool：AI 能使用的工具，比如浏览器、命令行、网页搜索
- Plugin：扩展包，用来增加频道、工具和能力
- Node：连接到网关的手机、桌面或远程设备

---

## 不用背术语，先会翻译

很多官方文档会直接写英文名词。本站会尽量先翻译成人话：

| 官方词 | 先这样理解 |
|--------|------------|
| Gateway | 总服务台 |
| Control UI | 浏览器控制面板 |
| Channel | 聊天入口 |
| Provider | AI 大脑来源 |
| Agent | 真正办事的 AI 助手 |
| Tool | AI 能用的手和工具 |
| Plugin | 扩展安装包 |
| Node | 外接设备 |
| Session | 一段对话的独立房间 |
| Memory | AI 的长期笔记 |

第一次读文档，不需要知道这些东西在代码里怎么实现。
先知道它们各自负责什么，后面看安装、配置和排查就不会迷路。

---

## 先读这三篇

- [通俗架构说明](/tutorials/concepts/architecture)：给零基础读者看的总览
- [功能特性](/tutorials/concepts/features)：OpenClaw 当前能做什么
- [系统架构设计](/tutorials/concepts/system-architecture)：更偏开发者和源码阅读

读完这三篇，你再看其他页面会轻松很多。

如果你只是想先把 OpenClaw 用起来，可以先只读第一篇。
后两篇等你想看源码、改配置、做插件时再读。

---

## 网关、控制台、节点

- [网关运维](/tutorials/gateway/)：Gateway 如何启动、检查和管理
- [Web 控制 UI](/tutorials/web/)：浏览器管理台怎么用
- [节点 Nodes](/tutorials/nodes/)：手机、桌面、远程设备如何接入
- [发现与传输](/tutorials/gateway/discovery)：网关和设备怎么互相找到
- [配对](/tutorials/gateway/pairing)：设备如何建立信任关系

这部分是新版架构里很需要留意的底座。
以后你看到频道、插件、工具，大多都绕不开 Gateway。

---

## 智能体 Agent

- [Agent 是什么](/tutorials/concepts/agent)
- [Agent 运行时](/tutorials/concepts/agent-runtimes)：同一个 Gateway 如何接不同工作方式
- [智能体循环](/tutorials/concepts/agent-loop)：一条消息从进入到回复的完整过程
- [智能体工作区](/tutorials/concepts/agent-workspace)：Agent 读写文件和执行任务的地方
- [托管 Worktree](/tutorials/concepts/managed-worktrees)：给 Agent 任务单独开分支和 checkout
- [多智能体路由](/tutorials/concepts/multi-agent)：多个 Agent 如何分工

如果把 Gateway 看成总机，Agent 就是接到任务后真正去办事的人。

---

## 上下文与记忆

- [上下文 Context](/tutorials/concepts/context)：模型为什么需要“前因后果”
- [上下文引擎 Context Engine](/tutorials/concepts/context-engine)：每次模型运行前如何组装材料
- [记忆 Memory](/tutorials/concepts/memory)：OpenClaw 如何保存长期信息
- [内置记忆引擎](/tutorials/concepts/memory-builtin)：默认本地记忆怎么存和怎么搜
- [QMD 记忆后端](/tutorials/concepts/memory-qmd)：本地资料柜式的增强记忆
- [记忆搜索](/tutorials/concepts/memory-search)：如何把过去相关内容翻出来
- [主动记忆 Active Memory](/tutorials/concepts/active-memory)：回复前主动检索相关记忆
- [上下文压缩 Compaction](/tutorials/concepts/compaction)：对话太长时怎么变短
- [系统提示词](/tutorials/concepts/system-prompt)：如何规定 Agent 的行为边界

上下文越清楚，模型越不容易胡猜。
这部分适合想让 Agent 更稳定、更懂你的用户阅读。

---

## 会话与消息

- [会话管理](/tutorials/concepts/session)：会话作用域、隔离和身份绑定
- [会话搜索](/tutorials/concepts/session-search)：从旧聊天里找回上下文
- [会话状态](/tutorials/concepts/session-state)：理解会话为什么能继续、为什么会挂起
- [Sessions](/tutorials/concepts/sessions)：会话生命周期
- [Channel Docking](/tutorials/concepts/channel-docking)：同一会话换到另一个聊天软件回复
- [会话工具](/tutorials/concepts/session-tool)：会话里可以用哪些工具
- [会话修剪](/tutorials/concepts/session-pruning)：过期会话如何清理
- [消息 Messages](/tutorials/concepts/messages)：消息结构和分发机制
- [流式输出](/tutorials/concepts/streaming)：回复为什么能一段段发出来
- [Progress Drafts](/tutorials/concepts/progress-drafts)：长任务中先给用户可读进度
- [Markdown 格式化](/tutorials/concepts/markdown-formatting)：不同聊天平台的格式差异

---

## 模型与提供商

- [选择模型提供商](/tutorials/providers/)
- [模型 CLI](/tutorials/concepts/models)
- [模型提供商概念](/tutorials/concepts/model-providers)
- [模型故障转移](/tutorials/concepts/model-failover)
- [OAuth](/tutorials/concepts/oauth)

这里解决“AI 大脑从哪里来”“坏了怎么切备用”“订阅授权怎么接”这些问题。

---

## 插件、工具与执行

- [工具系统](/tutorials/tools/)
- [插件专题](/tutorials/plugins/)
- [OpenClaw App SDK](/tutorials/concepts/openclaw-sdk)
- [Delegate 架构](/tutorials/concepts/delegate-architecture)
- [并行专家通道](/tutorials/concepts/parallel-specialist-lanes)
- [命令队列](/tutorials/concepts/queue)
- [队列引导](/tutorials/concepts/queue-steering)
- [重试策略](/tutorials/concepts/retry)
- [TypeBox 协议](/tutorials/concepts/typebox)

插件负责扩展能力，工具负责实际执行。
这部分更偏进阶用户和开发者。

如果你只是在日常使用 OpenClaw，看到这里可以先停。
等你要让 AI 操作浏览器、运行命令、接公司内部系统时，再回来读工具和插件。

---

## 其他基础概念

- [输入指示器](/tutorials/concepts/typing-indicators)：聊天软件里的“正在输入”
- [在线状态 Presence](/tutorials/concepts/presence)：节点和连接是否在线
- [时区处理](/tutorials/concepts/timezone)：定时任务和消息时间如何处理
- [用量跟踪](/tutorials/concepts/usage-tracking)：Token 用量和费用估算
- [SOUL.md](/tutorials/concepts/soul)：写给 Agent 的性格说明书
- [Commitments](/tutorials/concepts/commitments)：自然跟进，不是精确定时提醒
- [Dreaming](/tutorials/concepts/dreaming)：后台整理记忆
- [Honcho 记忆](/tutorials/concepts/memory-honcho)：外部记忆服务路线
- [实验功能](/tutorials/concepts/experimental-features)：可以试，但别当成地基
- [QA 自动化](/tutorials/concepts/qa-e2e-automation)：维护者端到端测试体系
- [Matrix QA](/tutorials/concepts/qa-matrix)：真实 Matrix 通道测试
- [Mantis QA](/tutorials/concepts/mantis)：真实通道 bug 前后验证

---

## 不知道从哪里开始？

先读 [通俗架构说明](/tutorials/concepts/architecture)。
它会用最少术语告诉你：一条消息进来以后，OpenClaw 到底做了哪些事。
