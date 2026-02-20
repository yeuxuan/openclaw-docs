---
title: "Cron 定时任务"
sidebarTitle: "Cron 定时任务"
---

# Cron 定时任务（Cron Jobs）

Cron 让你的 Agent 在指定时间自动执行，无需人工干预。使用标准的 cron 表达式（Cron Expression）精确控制执行时间，从"每天早 9 点发日报"到"每月第一天做汇总"，都能轻松实现。

---

## 快速上手（5 分钟搞定）

**第一步：在配置文件中添加 Cron 任务**

打开 OpenClaw 配置文件，添加以下内容：

```json5
{
  cron: {
    jobs: [
      {
        // 标准 5 段 cron 表达式：分 时 日 月 周
        schedule: "0 9 * * 1-5",  // 工作日（周一到周五）早上 9 点
        agent: "daily-summary",   // 要触发的 Agent 名称
        message: "生成今日工作总结，包括待办事项和昨日进展"
      }
    ]
  }
}
```

**第二步：确认 Agent 存在**

```bash
openclaw agents list
```

**第三步：验证 Cron 任务配置正确**

```bash
openclaw cron list
```

输出示例：
```text
NAME           SCHEDULE        NEXT RUN              AGENT
daily-summary  0 9 * * 1-5    2026-02-23 09:00:00   daily-summary
```

**第四步：手动触发测试（无需等到指定时间）**

```bash
openclaw cron run daily-summary
```

::: tip 验证 cron 表达式
不确定 cron 表达式是否正确？可以用在线工具验证：[crontab.guru](https://crontab.guru) 是一个常用的 cron 表达式解析器。
:::

---

## 技术说明

### Cron 表达式（Cron Expression）格式

标准 5 段格式：

```text
┌─────── 分钟（0-59）
│ ┌───── 小时（0-23）
│ │ ┌─── 日期（1-31）
│ │ │ ┌─ 月份（1-12）
│ │ │ │ └─ 星期（0-7，0 和 7 都代表周日）
│ │ │ │ │
* * * * *
```

常用示例：

| 表达式 | 含义 |
|--------|------|
| `0 9 * * 1-5` | 工作日早上 9 点 |
| `0 18 * * 5` | 每周五下午 6 点 |
| `0 */2 * * *` | 每 2 小时执行一次 |
| `30 8 1 * *` | 每月 1 日早上 8:30 |
| `0 0 * * *` | 每天午夜 |
| `*/15 * * * *` | 每 15 分钟 |

---

### 执行模式（Execution Mode）

Cron 任务支持两种执行模式：

#### 主会话模式（Main Session）

复用 Agent 已有的会话，保持上下文连续性。适合需要记忆前次状态的任务。

```json5
{
  cron: {
    jobs: [
      {
        schedule: "0 9 * * 1-5",
        agent: "monitor-agent",
        message: "检查昨日未处理的告警",
        // 默认为主会话模式，不需要额外配置
        isolated: false
      }
    ]
  }
}
```

#### 隔离执行模式（Isolated）

每次 Cron 触发时创建全新会话，完全独立，互不影响。适合独立的批量处理任务。

```json5
{
  cron: {
    jobs: [
      {
        schedule: "0 2 * * *",
        agent: "report-agent",
        message: "生成昨日完整数据报告",
        // 隔离模式：每次使用新会话
        isolated: true
      }
    ]
  }
}
```

::: tip 如何选择执行模式？
- 需要 Agent 记住上次状态 → 主会话模式
- 每次任务完全独立、互不影响 → 隔离执行模式
- 不确定时，推荐隔离执行模式，更安全可预期
:::

---

### 模型覆盖（Model Override）

可以为 Cron 任务指定不同的模型，覆盖 Agent 默认配置：

```json5
{
  cron: {
    jobs: [
      {
        schedule: "0 2 * * *",
        agent: "analysis-agent",
        message: "执行深度数据分析",
        // 为这个 Cron 任务单独指定更强的模型
        model: "claude-opus-4-6",
        // 启用扩展思考（Extended Thinking）
        thinking: {
          enabled: true,
          budget: 10000
        }
      }
    ]
  }
}
```

---

### 投递配置（Delivery）

Cron 任务执行结果可以发送到指定通道：

```json5
{
  cron: {
    jobs: [
      {
        schedule: "0 9 * * 1-5",
        agent: "daily-summary",
        message: "生成今日工作总结",
        // 执行结果投递到 Slack 通道
        delivery: {
          channel: "slack",
          target: "#daily-reports"
        }
      }
    ]
  }
}
```

---

### CLI 命令

```bash
# 查看所有 Cron 任务及下次执行时间
openclaw cron list

# 手动触发指定 Cron 任务（立即执行，不等待计划时间）
openclaw cron run <job-name>

# 查看 Cron 执行历史
openclaw cron history

# 暂停指定 Cron 任务
openclaw cron pause <job-name>

# 恢复已暂停的 Cron 任务
openclaw cron resume <job-name>
```

---

### 时区（Timezone）设置

::: warning 时区问题是 Cron 常见踩坑点
默认情况下，Cron 使用服务器系统时区。如果服务器在境外，实际触发时间可能与预期不符。
:::

在配置中显式指定时区：

```json5
{
  cron: {
    // 为所有 Cron 任务设置时区
    timezone: "Asia/Shanghai",
    jobs: [
      {
        schedule: "0 9 * * 1-5",
        agent: "daily-summary",
        message: "生成今日工作总结"
        // 也可以在单个任务中覆盖时区
        // timezone: "America/New_York"
      }
    ]
  }
}
```

常用时区标识：

| 时区 | 标识符 |
|------|--------|
| 北京时间（UTC+8）| `Asia/Shanghai` |
| 东京时间（UTC+9）| `Asia/Tokyo` |
| 美东时间 | `America/New_York` |
| 美西时间 | `America/Los_Angeles` |
| UTC | `UTC` |

---

### 存储和历史

Cron 执行历史保存在本地：

```text
~/.openclaw/cron/
├── history.json     # 执行历史记录
└── state.json       # 当前任务状态
```

查看最近的执行记录：

```bash
openclaw cron history --limit 20
```

---

### 故障排查

::: details Cron 任务没有在预期时间执行

1. 确认 Gateway 正在运行：`openclaw gateway status`
2. 检查时区配置是否正确：`openclaw cron list` 查看"NEXT RUN"时间
3. 验证 cron 表达式：用 `crontab.guru` 验证
4. 查看日志：`openclaw logs --filter cron`
:::

::: details 手动触发成功但定时不触发

可能原因：Gateway 未启动或意外退出。检查 Gateway 进程：

```bash
openclaw gateway status
openclaw gateway start  # 如果未运行则启动
```
:::

---

_下一步：[Cron vs Heartbeat 对比](./cron-vs-heartbeat) | [Webhook 外部触发](./webhook) | [故障排查](./troubleshooting)_
