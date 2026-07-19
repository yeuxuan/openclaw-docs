---
title: "Gateway 审计总览"
sidebarTitle: "Audit"
description: "理解 OpenClaw 的元数据级审计能力，区分审计、日志和对话记录。"
---

# Gateway 审计总览

OpenClaw 的审计能力，重点不是“保存聊天全文”，而是记录：

- 谁触发了什么
- 什么时候发生
- 成功还是失败
- 失败的大类是什么

如果你在做团队运维、留痕、合规排查或故障追踪，这一层很有价值。

---

## 先讲人话

审计可以理解成“操作账本”。

它和普通日志不同：

- 日志更像技术细节
- 审计更像业务活动轨迹

它也和 transcript 不同：

- transcript 重在聊天内容
- audit 重在元数据事件

所以不要拿审计去替代聊天归档，也不要拿聊天归档去替代操作留痕。

---

## 默认会记录什么

OpenClaw 默认重点覆盖 run 和 tool 级事件。

也就是：

- Agent 什么时候开始跑
- 最后是成功、失败、超时还是 blocked
- 某个工具调用什么时候发生
- 工具最终结果如何

消息级审计通常需要你显式配置。
如果你想连消息入站 / 出站元数据也记录，再去调整 Gateway 配置。

---

## 它适合解决哪些问题

### 谁动了系统

你需要知道是哪一个 agent、哪次 run、哪种工具动作造成了某个结果。

### 为什么“没回消息”

你可以先确认消息有没有入站记录、有没有对应 run、有没有 tool failure，而不是一上来就翻全量日志。

### 给运维或安全侧留一个低敏感度证据层

因为它默认偏元数据，不等于把所有消息全文都铺开保存。

---

## 最常见的配套命令

网关侧理解完以后，日常查询通常还是走 CLI：

```bash
openclaw audit
openclaw audit --kind tool_action --status failed
openclaw audit --kind message --channel telegram --json
```

对应命令说明见：

- [Audit CLI](/tutorials/cli/audit)

---

## 什么时候该开消息级审计

如果你只需要追任务、工具、失败链路，默认 run / tool 审计通常就够了。

以下情况才更值得考虑消息级审计：

- 需要确认消息是否真的入站 / 出站
- 需要做更细的通道链路排查
- 团队对消息元数据留痕有明确要求

但要注意：

即使不存正文，消息方向、时间、会话关系、通道信息本身也仍然属于敏感运营元数据。

---

## 审计、日志、transcript 怎么分工

推荐分工是：

- 审计：先定位是哪个 run / tool / message 生命周期出问题
- 日志：再看技术错误原因
- transcript：最后看具体对话内容和上下文

这样查问题效率最高，也不容易把三个层面的职责混在一起。

---

## 对团队管理员最重要的提醒

如果你开了审计，就要把审计导出也当成敏感数据来保护。

哪怕没有消息正文，下面这些信息组合起来仍然可能暴露很多事实：

- agent / run / session 标识
- 时间线
- 消息方向
- 通道类型
- 工具调用活动

所以权限、保留期和导出边界都要提前定好。

---

## 相关页面

- [Audit CLI](/tutorials/cli/audit)
- [Gateway 配置参考](/tutorials/gateway/configuration-reference)
- [调试与排障](/tutorials/help/debugging)

