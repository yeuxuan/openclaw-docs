---
title: "核心概念"
sidebarTitle: "核心概念"
---

# 核心概念——理解 OpenClaw 的工作方式

这里汇总了 OpenClaw 所有核心概念的说明文档。如果你在使用过程中遇到不熟悉的术语或机制，可以在这里找到对应的解释。

---

## 系统架构

- [OpenClaw 是怎么工作的](/tutorials/concepts/architecture) — 用生活化比喻解释整体架构，适合零基础读者
- [功能特性](/tutorials/concepts/features) — OpenClaw 支持的完整功能列表

---

## 智能体（Agent）

- [智能体循环（Agent Loop）](/tutorials/concepts/agent-loop) — 一条消息从接收到回复的完整执行链路
- [智能体工作区（Agent Workspace）](/tutorials/concepts/agent-workspace) — AI 助手的文件存储与工作目录
- [多智能体路由](/tutorials/concepts/multi-agent) — 如何配置多个独立 AI 助手并按规则分发消息

---

## 上下文与记忆

- [上下文（Context）](/tutorials/concepts/context) — 什么是上下文，如何影响模型回复质量
- [记忆（Memory）](/tutorials/concepts/memory) — AI 如何记住历史对话
- [上下文窗口与压缩（Compaction）](/tutorials/concepts/compaction) — 对话过长时的自动压缩机制
- [系统提示词（System Prompt）](/tutorials/concepts/system-prompt) — 如何定制 AI 助手的行为与人格

---

## 会话管理

- [会话管理（Session Management）](/tutorials/concepts/session) — 会话作用域、隔离策略与身份绑定
- [会话（Sessions）](/tutorials/concepts/sessions) — 会话的基本概念与生命周期
- [会话工具（Session Tools）](/tutorials/concepts/session-tool) — 会话内可用的工具集合
- [会话修剪（Session Pruning）](/tutorials/concepts/session-pruning) — 过期会话的清理策略

---

## 消息与通信

- [消息（Messages）](/tutorials/concepts/messages) — 消息结构、类型与分发机制
- [流式输出（Streaming）](/tutorials/concepts/streaming) — AI 回复的流式输出与分块发送
- [输入指示器（Typing Indicators）](/tutorials/concepts/typing-indicators) — 在聊天软件中显示"正在输入"状态
- [在线状态（Presence）](/tutorials/concepts/presence) — 节点在线状态检测与广播
- [Markdown 格式化](/tutorials/concepts/markdown-formatting) — 各通道的 Markdown 渲染与格式转换

---

## 模型

- [模型 CLI](/tutorials/concepts/models) — 在聊天中切换模型的命令
- [模型提供商（Model Providers）](/tutorials/concepts/model-providers) — 各 AI 服务商的接入说明
- [模型故障转移（Model Failover）](/tutorials/concepts/model-failover) — 主模型不可用时的自动回退机制

---

## 执行与可靠性

- [命令队列（Command Queue）](/tutorials/concepts/queue) — 消息串行执行与并发控制
- [重试策略（Retry Policy）](/tutorials/concepts/retry) — 请求失败后的自动重试规则

---

## 认证、配置与其他

- [OAuth](/tutorials/concepts/oauth) — Anthropic / OpenAI 订阅授权接入
- [时区（Timezones）](/tutorials/concepts/timezone) — 时区配置与时间相关行为
- [用量跟踪（Usage Tracking）](/tutorials/concepts/usage-tracking) — Token 用量统计与费用估算
- [TypeBox 协议](/tutorials/concepts/typebox) — OpenClaw 内部协议的类型约束体系

---

> **不知道从哪里开始？** 推荐先读[系统架构说明](/tutorials/concepts/architecture)，用 5 分钟建立对 OpenClaw 的整体认知。
