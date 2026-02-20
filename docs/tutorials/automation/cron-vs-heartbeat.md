---
title: "Cron 与 Heartbeat 对比"
sidebarTitle: "Cron vs Heartbeat"
---

# Cron 与 Heartbeat 对比（Cron vs Heartbeat）

OpenClaw 提供两种让 Agent 持续运行的机制：心跳（Heartbeat）和定时任务（Cron）。它们看起来相似，但适用场景截然不同。读完这篇文档，你就能快速判断该用哪个。

---

## 核心区别一览

| 特性 | Heartbeat（心跳）| Cron（定时任务）|
|------|-----------------|----------------|
| 触发方式 | 固定间隔（如每 5 分钟）| 精确时间计划（cron 表达式）|
| 会话状态 | 保持连续上下文 | 可选隔离 / 共享会话 |
| 适合场景 | 持续监控、状态巡检 | 定时报告、批量处理 |
| 资源消耗 | 持续运行（Agent 常驻）| 按需唤醒（空闲时不消耗）|
| 时区支持 | 无（固定间隔）| 有（可配置 TZ）|
| 时间精度 | 相对时间（"每隔 X 分钟"）| 绝对时间（"每天 9:00"）|
| 上下文记忆 | 天然保持 | 主会话模式下保持 |

---

## Heartbeat 详解

Heartbeat 让 Agent 持续活跃，按固定间隔在主会话中发送消息。Agent 就像一个一直盯着屏幕的值班员——持续运行，每隔几分钟检查一次。

**配置示例：**

```json5
{
  agents: {
    "monitor-agent": {
      heartbeat: {
        // 启用心跳
        enabled: true,
        // 每 5 分钟发送一次心跳消息
        interval: "5m",
        // 心跳时发送给 Agent 的消息
        message: "检查系统状态，是否有异常需要处理？"
      }
    }
  }
}
```

**适合 Heartbeat 的场景：**

- 实时监控服务健康状态
- 持续检查消息队列或任务队列
- 需要 Agent 保持"随时待命"状态
- 任务之间有强依赖关系（需要记住上次检查结果）

::: info Heartbeat 的上下文优势
由于 Heartbeat 运行在主会话中，Agent 能记住之前所有的检查结果。比如："上次检查时服务 A 响应慢，这次检查看看是否恢复了。"
:::

---

## Cron 详解

Cron 在精确的时间点触发 Agent 执行，就像一个定闹钟的助手——在特定时刻准时启动，完成任务后退出（或在隔离模式下销毁会话）。

**配置示例：**

```json5
{
  cron: {
    timezone: "Asia/Shanghai",
    jobs: [
      {
        // 每个工作日早上 9 点
        schedule: "0 9 * * 1-5",
        agent: "report-agent",
        message: "生成昨日数据汇总报告并发送到邮件",
        isolated: true  // 每次独立会话
      }
    ]
  }
}
```

**适合 Cron 的场景：**

- 每天定时发送报告
- 每周批量处理数据
- 需要在特定时刻（而非固定间隔）执行的任务
- 任务完全独立，不需要记住上次状态

---

## 两者结合使用

很多场景下，Heartbeat 和 Cron 可以配合使用，互相补充：

**示例：监控 + 汇报**

```json5
{
  agents: {
    "ops-agent": {
      // Heartbeat：每 10 分钟巡检一次
      heartbeat: {
        enabled: true,
        interval: "10m",
        message: "快速检查：服务状态是否正常？有无新告警？"
      }
    }
  },
  cron: {
    timezone: "Asia/Shanghai",
    jobs: [
      {
        // Cron：每天下班前生成完整日报
        schedule: "0 18 * * 1-5",
        agent: "ops-agent",
        message: "生成今日完整运维日报，包括：告警统计、处理情况、明日注意事项"
      }
    ]
  }
}
```

在这个配置中：
- **Heartbeat** 负责持续的实时监控，Agent 保持上下文，知道今天发生了什么
- **Cron** 在固定时间触发，利用 Agent 积累的上下文生成完整日报

---

## 决策指南

```text
需要保持上下文记忆（记住上次的状态）？
  ├── 是 → Heartbeat（天然保持会话）
  └── 否 ↓

需要在特定时间点执行（如"每天9点"）？
  ├── 是 → Cron
  └── 否 ↓

任务间隔固定（如"每5分钟"），不关心具体时钟时间？
  ├── 是 → Heartbeat
  └── 否 → 两者结合，或重新评估需求
```

::: tip 简单记忆法
- **"一直盯着"** → Heartbeat
- **"定时闹钟"** → Cron
- **"既要盯着，也要定时汇报"** → 两者结合
:::

---

_下一步：[Cron 定时任务详细配置](./cron-jobs) | [故障排查](./troubleshooting) | [自动化概览](./index)_
