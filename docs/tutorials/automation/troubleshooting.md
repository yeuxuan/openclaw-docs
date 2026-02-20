---
title: "自动化故障排查"
sidebarTitle: "故障排查"
---

# 自动化故障排查（Troubleshooting）

Cron 不执行、Heartbeat 停了、Webhook 报 401……遇到自动化问题别慌，这里汇总了最常见的问题和对应的解决方法。按照"手动触发 → 检查日志 → 验证配置"的步骤逐一排查，大多数问题 5 分钟内可以定位。

---

## 通用调试步骤

**第一步：手动触发，排除调度问题**

```bash
# 手动触发 Cron 任务
openclaw cron run <job-name>

# 手动触发 Hook
openclaw hooks run <hook-name>

# 手动触发通道轮询
openclaw channels poll --channel <channel-name>
```

如果手动触发成功，说明配置本身没问题，是调度层的问题（时区、Gateway 未运行等）。

**第二步：查看日志**

```bash
# 查看最近的自动化相关日志
openclaw logs --filter cron
openclaw logs --filter heartbeat
openclaw logs --filter webhook
openclaw logs --filter hook

# 实时跟踪日志（类似 tail -f）
openclaw logs --follow

# 查看特定 Agent 的日志
openclaw logs --agent <agent-name> --limit 50
```

**第三步：验证配置语法**

```bash
# 检查配置文件是否有语法错误
openclaw config validate

# 查看当前生效的配置（合并后）
openclaw config show
```

---

## 常见问题速查表

| 问题 | 可能原因 | 解决方法 |
|------|---------|---------|
| Cron 任务不执行 | Gateway 未运行 | `openclaw gateway start` |
| Cron 任务不执行 | cron 表达式错误 | 用 crontab.guru 验证表达式 |
| Cron 任务不执行 | 时区错误导致时间不对 | 配置 `timezone: "Asia/Shanghai"` |
| Cron 任务不执行 | Agent 名称拼写错误 | `openclaw agents list` 确认名称 |
| Cron 重复执行 | 多个 Gateway 实例 | 确保只运行一个 Gateway |
| Heartbeat 停止 | Agent 崩溃或会话断开 | 重启 Agent：`openclaw agents restart` |
| Webhook 返回 401 | Token 错误或缺失 | 检查 `Authorization: Bearer` header |
| Webhook 返回 404 | Agent 名称不存在 | `openclaw agents list` 确认 Agent |
| Hook 不执行 | 文件无执行权限 | `chmod +x ~/.openclaw/hooks/<name>` |
| Hook 不执行 | 目录配置错误 | `openclaw hooks list` 确认 Hook 被发现 |
| Gmail 不推送 | Watch 已过期 | `openclaw channels gmail watch` |
| OAuth Token 失效 | Token 过期未刷新 | `openclaw auth refresh --all` |

---

## Cron 问题详解

### Cron 任务不在预期时间执行

::: details 排查步骤

**检查 1：Gateway 是否在运行**

```bash
openclaw gateway status
```

如果未运行：
```bash
openclaw gateway start
```

**检查 2：查看 Cron 任务列表和下次执行时间**

```bash
openclaw cron list
```

输出中的 `NEXT RUN` 列显示下次执行时间。如果时间不对，检查时区配置。

**检查 3：验证 cron 表达式**

```bash
# 本地验证（需要安装 node-cron 或类似工具）
# 推荐直接用在线工具：https://crontab.guru
```

**检查 4：检查 Agent 是否存在**

```bash
openclaw agents list
```

确认配置中的 `agent` 字段名称与列表完全一致（区分大小写）。
:::

---

### Cron 任务重复执行

::: details 原因和解决方法

**原因：** 系统中运行了多个 OpenClaw Gateway 实例，每个实例都在独立调度 Cron，导致同一任务被执行多次。

**诊断：**

```bash
# 查看所有运行中的 Gateway 进程
ps aux | grep "openclaw gateway"
# 或
openclaw gateway list-instances
```

**解决：** 停止多余的 Gateway 实例，确保只有一个在运行：

```bash
# 停止所有 Gateway
openclaw gateway stop --all

# 重新启动单个 Gateway
openclaw gateway start
```
:::

---

### 时区问题导致 Cron 不按时执行

::: details 诊断和配置

```bash
# 查看服务器当前时区
date
timedatectl  # Linux 系统

# 查看 OpenClaw 识别的时区
openclaw config show | grep timezone
```

在配置文件中显式设置时区（推荐）：

```json5
{
  cron: {
    // 所有 Cron 任务使用北京时间
    timezone: "Asia/Shanghai",
    jobs: [
      {
        schedule: "0 9 * * 1-5",
        // 也可以单独为某个任务设置时区
        // timezone: "America/New_York",
        agent: "daily-report",
        message: "生成日报"
      }
    ]
  }
}
```
:::

---

## Heartbeat 问题详解

### Heartbeat 停止发送

::: details 排查步骤

**检查 1：Agent 是否仍在运行**

```bash
openclaw agents status <agent-name>
```

**检查 2：查看 Heartbeat 日志**

```bash
openclaw logs --filter heartbeat --agent <agent-name>
```

**检查 3：重启 Agent**

```bash
openclaw agents restart <agent-name>
```

**检查 4：验证 Heartbeat 配置**

```bash
openclaw config show | grep -A 5 heartbeat
```
:::

---

## Webhook 问题详解

### Webhook 返回 401 Unauthorized

```bash
# 确认请求头格式正确
curl -v -X POST https://your-gateway/hooks/agent \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"agent": "my-agent", "message": "test"}'
```

常见错误：
- Token 前面忘写 `Bearer ` 空格
- Token 包含多余的空格或换行符
- 配置文件中的 `secret` 与请求中的 Token 不一致

---

### Webhook 返回 404 Agent Not Found

```bash
# 确认 Agent 名称
openclaw agents list

# 确认 Webhook 配置中的 agent 名称
openclaw config show | grep -A 10 webhooks
```

::: warning Agent 名称区分大小写
`my-agent` 和 `My-Agent` 是不同的 Agent 名称，请确保配置中的名称完全一致。
:::

---

## Hook 问题详解

### Hook 脚本不被执行

```bash
# 第一步：确认 Hook 被发现
openclaw hooks list

# 第二步：确认文件有执行权限
ls -la ~/.openclaw/hooks/
# 应该看到类似：-rwxr-xr-x ... session-started

# 如果没有执行权限，添加：
chmod +x ~/.openclaw/hooks/<hook-name>

# 第三步：手动测试脚本是否能直接运行
~/.openclaw/hooks/session-started
```

### Hook 脚本执行出错

启用调试模式查看详细错误：

```bash
HOOK_DEBUG=1 openclaw hooks run <hook-name>
```

---

## 日志查看命令速查

```bash
# 查看最近 100 条日志
openclaw logs --limit 100

# 按模块过滤
openclaw logs --filter cron
openclaw logs --filter hook
openclaw logs --filter webhook
openclaw logs --filter heartbeat
openclaw logs --filter auth

# 按时间范围
openclaw logs --since "2026-02-20 00:00:00"

# 按 Agent 过滤
openclaw logs --agent <agent-name>

# 实时跟踪
openclaw logs --follow

# 输出为 JSON 格式（便于分析）
openclaw logs --json | jq '.[] | select(.level == "error")'
```

---

::: info 问题仍未解决？
如果以上步骤都无法解决你的问题，可以：
1. 查看 [GitHub Issues](https://github.com/openclaw/openclaw/issues) 确认是否是已知问题
2. 收集完整日志（`openclaw logs --json > debug.log`）提交问题报告
:::

---

_下一步：[Cron 定时任务](./cron-jobs) | [Hooks 事件钩子](./hooks) | [自动化概览](./index)_
