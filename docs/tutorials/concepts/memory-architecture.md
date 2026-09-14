---
title: "记忆架构"
sidebarTitle: "记忆架构"
description: "OpenClaw 记忆分层、来源标记、写入门控与召回的整体设计。"
---

# 记忆架构

OpenClaw 的记忆不是一个神秘的黑盒：主要由工作区里的文本文件和 SQLite 索引组成。不同层级有不同信任程度、写入规则和注入方式。

| 层级 | 典型内容 | 何时进入上下文 |
|------|----------|----------------|
| 指令 | `AGENTS.md`、工作区说明 | 会话启动时始终加载 |
| 核心记忆 | `MEMORY.md`、`USER.md` | 会话启动时按预算加载 |
| 情节记忆 | `memory/YYYY-MM-DD.md`、会话转录 | 需要时搜索召回 |
| 前瞻记忆 | Standing intents、Cron | 条件触发时出现 |
| 复核材料 | `DREAMS.md`、整理报告 | 给人审阅，不自动注入 |

## 为什么要分层

长期记忆质量更取决于“写进去的是什么”，而不只是搜索算法。OpenClaw 把大量原始记录留在情节层，只有通过确定性门控和受限整理后，才提升到始终加载的核心记忆。

记忆条目还会记录来源：Owner、Agent、外部不可信内容或系统脚手架。Cron、Heartbeat、子智能体输出和已被召回的旧记忆不会自动反复晋升，避免心跳噪声、网页污染和召回回声循环。

## 失败时的行为

记忆搜索、整理或索引失败不应吞掉正常回复。OpenClaw 为回复链路设置超时和降级路径：记忆不可用时，召回质量会下降，但对话仍应继续。

如果只是想配置记忆，先读[记忆 Memory](/tutorials/concepts/memory)和[记忆搜索](/tutorials/concepts/memory-search)；本页用于理解为什么同一条信息不会自动进入长期核心记忆。

上游来源：[`docs/concepts/memory-architecture.md`](https://github.com/openclaw/openclaw/blob/main/docs/concepts/memory-architecture.md)。
