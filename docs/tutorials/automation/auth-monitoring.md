---
title: "OAuth 认证监控"
sidebarTitle: "OAuth 认证监控"
---

# OAuth 认证监控（OAuth Token Monitoring）

OAuth 令牌（Token）会过期。当 Token 在凌晨 3 点悄悄失效，你的 Agent 就会停止工作——而你可能要等到早上才发现。这篇文档告诉你如何主动监控 Token 状态，在它过期前自动刷新，保持服务持续运行。

---

## 快速上手

**第一步：检查当前所有 Token 状态**

```bash
openclaw auth status
```

输出示例：
```json5
CHANNEL    STATUS     EXPIRES_IN    SCOPES
gmail      valid      6d 14h        gmail.readonly, pubsub
slack      valid      89d           chat:write, channels:read
discord    expired    -             (需要重新授权)
```

**第二步：刷新即将过期的 Token**

```bash
# 刷新指定通道的 Token
openclaw auth refresh --channel gmail

# 刷新所有通道的 Token
openclaw auth refresh --all
```

**第三步：设置自动监控（推荐）**

```json5
{
  cron: {
    timezone: "Asia/Shanghai",
    jobs: [
      {
        // 每天早上 8 点检查 Token 状态
        schedule: "0 8 * * *",
        agent: "system-agent",
        message: "检查所有 OAuth Token 状态，如有即将过期（7天内）的请提前刷新"
      }
    ]
  }
}
```

::: tip 将认证监控纳入日常运维
建议把 Token 状态检查加入到你的日常巡检清单，或者配置 Cron 自动检查，避免服务因认证失效而中断。
:::

---

## 技术说明

### CLI 命令

```bash
# 查看所有通道的认证状态
openclaw auth status

# 输出 JSON 格式（便于脚本处理）
openclaw auth status --json

# 查看指定通道的详细认证信息
openclaw auth status --channel gmail

# 刷新指定通道的 Token
openclaw auth refresh --channel gmail

# 强制重新完整授权（当刷新失败时使用）
openclaw auth login --channel gmail --force
```

---

### 自动化监控脚本

以下是一个简单的 Bash 监控脚本，可以检查 Token 剩余有效期并在即将过期时刷新：

```bash
#!/bin/bash
# check-auth.sh：检查 OAuth Token 有效期
# 建议通过系统 cron 每天运行一次

set -euo pipefail

OPENCLAW_BIN="/usr/local/bin/openclaw"
ALERT_DAYS=7  # 距离过期还有 7 天时触发刷新

# 获取所有通道的 Token 状态（JSON 格式）
STATUS=$($OPENCLAW_BIN auth status --json)

# 检查每个通道的过期时间（需要安装 jq）
echo "$STATUS" | jq -r '.channels[] | "\(.name) \(.expires_in_seconds)"' | \
while read -r channel expires_in; do
  THRESHOLD=$((ALERT_DAYS * 86400))  # 转换为秒

  if [ "$expires_in" -lt "$THRESHOLD" ]; then
    echo "[警告] 通道 $channel 的 Token 将在 $((expires_in / 3600)) 小时内过期，正在刷新..."
    $OPENCLAW_BIN auth refresh --channel "$channel"
    echo "[完成] 通道 $channel Token 已刷新"
  else
    echo "[正常] 通道 $channel Token 有效，剩余 $((expires_in / 86400)) 天"
  fi
done
```

使用方式：

```bash
# 添加执行权限
chmod +x check-auth.sh

# 手动运行测试
./check-auth.sh

# 添加到系统 cron（每天早上 7 点运行）
echo "0 7 * * * /path/to/check-auth.sh >> /var/log/openclaw-auth.log 2>&1" | crontab -
```

---

### 使用 OpenClaw Cron 自动刷新

不想维护独立脚本？可以直接使用 OpenClaw 的 Cron + Agent 来处理：

```json5
{
  cron: {
    timezone: "Asia/Shanghai",
    jobs: [
      {
        // 每天早上 7 点执行认证检查
        schedule: "0 7 * * *",
        agent: "ops-agent",
        message: "执行命令 'openclaw auth status --json' 检查所有通道 Token 状态。如果任何通道的 expires_in_seconds 小于 604800（7天），执行 'openclaw auth refresh --channel <name>' 刷新对应 Token，并报告刷新结果。",
        isolated: true
      }
    ]
  }
}
```

---

### 各通道 Token 特性

| 通道 | Token 类型 | 典型有效期 | 是否支持自动刷新 |
|------|-----------|-----------|----------------|
| Gmail | OAuth 2.0 | Access: 1小时，Refresh: 长期 | 是（通过 Refresh Token）|
| Slack | OAuth 2.0 | 较长（bot token 不过期）| 视配置而定 |
| Discord | Bot Token | 不过期 | 不需要 |
| MS Teams | Azure AD Token | 1小时 | 是（通过 MSAL）|
| WhatsApp | Business API | 60天 | 需要手动刷新 |

::: warning WhatsApp Business API Token 需要手动刷新
WhatsApp Business API 的 Token 有效期为 60 天，且不支持自动刷新。建议：
1. 在日历中设置 50 天提醒
2. 或使用监控脚本检测到期前告警
3. 每次刷新后更新 OpenClaw 配置
:::

---

### 最佳实践

::: tip 认证运维三步法

1. **主动监控**：配置 Cron 每天检查 Token 状态，不要等到失效了才发现
2. **提前刷新**：在 Token 过期前 7 天刷新，留出足够的缓冲时间
3. **告警通知**：配置刷新失败时的告警通道（如发送 Slack 消息），确保人工及时介入

```json5
{
  cron: {
    jobs: [
      {
        schedule: "0 7 * * *",
        agent: "ops-agent",
        message: "检查并刷新即将过期的 OAuth Token，如果刷新失败请通过 Slack 发送告警到 #ops-alerts 频道",
        delivery: {
          channel: "slack",
          target: "#ops-alerts",
          // 只在失败时发送
          onFailure: true
        }
      }
    ]
  }
}
```
:::

---

_下一步：[故障排查](./troubleshooting) | [Gmail PubSub 集成](./gmail-pubsub) | [自动化概览](./index)_
