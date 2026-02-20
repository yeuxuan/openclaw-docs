---
title: "Webhook 外部触发"
sidebarTitle: "Webhook"
---

# Webhook 外部触发（Webhook）

Webhook 让你可以通过标准的 HTTP 请求从外部服务触发 OpenClaw 的 Agent 执行。无论是 GitHub Actions、监控告警系统还是任意第三方平台，只要能发送 HTTP 请求，就能驱动你的 Agent 自动响应。

---

## 快速上手

**第一步：在配置文件中启用 Webhook**

```json5
{
  webhooks: {
    enabled: true,
    // 设置一个强密钥用于认证
    secret: "your-secret-token",
    agents: {
      "my-agent": {
        sessionKey: "webhook-session"
      }
    }
  }
}
```

**第二步：启动 OpenClaw Gateway**

```bash
openclaw gateway start
```

**第三步：发送第一个 Webhook 请求**

```bash
curl -X POST https://your-gateway/hooks/agent \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"agent": "my-agent", "message": "执行今日数据汇总任务"}'
```

**第四步：查看响应**

成功响应示例：
```json
{
  "status": "ok",
  "session": "webhook-session",
  "queued": true
}
```

::: tip 快速验证 Webhook 是否正常工作
先用 `/hooks/wake` 端点做连通性测试，它只唤醒 Agent 不发送消息，响应更快。
:::

---

## 技术说明

### 核心端点（Endpoints）

OpenClaw Gateway 暴露两个 Webhook 端点：

#### `POST /hooks/wake` - 唤醒 Agent

唤醒指定 Agent 进入活跃状态，但不发送具体消息。适合预热 Agent 或触发 Agent 自主检查。

```bash
curl -X POST https://your-gateway/hooks/wake \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"agent": "my-agent"}'
```

#### `POST /hooks/agent` - 运行 Agent

向指定 Agent 发送消息并触发执行。Agent 会处理消息并按配置的通道返回结果。

```bash
curl -X POST https://your-gateway/hooks/agent \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "my-agent",
    "message": "请检查服务器状态并生成报告",
    "sessionKey": "optional-custom-session"
  }'
```

---

### 认证机制（Authentication）

所有 Webhook 请求必须携带 Bearer Token（令牌）进行认证：

```http
Authorization: Bearer your-secret-token
```

| 响应码 | 含义 |
|--------|------|
| `200` | 请求成功，任务已入队 |
| `401` | 认证失败，Token 无效或缺失 |
| `404` | 指定的 Agent 不存在 |
| `500` | 服务器内部错误 |

---

### 会话密钥（Session Key）策略

会话密钥决定了 Webhook 触发的 Agent 运行在哪个会话中：

::: details 固定 Session Key（推荐用于持续任务）
使用固定的 `sessionKey`，每次 Webhook 触发都复用同一会话，Agent 能保持上下文记忆。

```json5
{
  webhooks: {
    agents: {
      "monitor-agent": {
        // 固定 Key：所有 Webhook 触发共享同一会话
        sessionKey: "monitor-persistent-session"
      }
    }
  }
}
```
:::

::: details 动态 Session Key（推荐用于独立任务）
在请求体中动态传入 `sessionKey`，每次任务使用独立会话，互不干扰。

```bash
curl -X POST https://your-gateway/hooks/agent \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "my-agent",
    "message": "处理订单 #12345",
    "sessionKey": "order-12345-session"
  }'
```
:::

---

### 完整配置示例

```json5
{
  webhooks: {
    // 启用 Webhook 功能
    enabled: true,
    // Bearer Token 密钥（请使用强随机字符串）
    secret: "your-secret-token",
    // 配置可被 Webhook 触发的 Agent
    agents: {
      // Agent 名称（与 agents 配置中的名称对应）
      "daily-report-agent": {
        sessionKey: "report-session"
      },
      "alert-handler": {
        sessionKey: "alert-session"
      }
    }
  }
}
```

---

### 使用场景示例

::: details GitHub Actions 集成
在 CI/CD 流程完成后，触发 Agent 发送部署通知：

```yaml
# .github/workflows/deploy.yml
- name: 通知 OpenClaw Agent
  run: |
    curl -X POST ${{ secrets.OPENCLAW_GATEWAY_URL }}/hooks/agent \
      -H "Authorization: Bearer ${{ secrets.OPENCLAW_SECRET }}" \
      -H "Content-Type: application/json" \
      -d '{
        "agent": "devops-agent",
        "message": "生产环境部署完成，版本 ${{ github.sha }}，请检查服务状态"
      }'
```
:::

::: details 监控告警集成
当监控系统检测到异常时，自动触发 Agent 分析和响应：

```bash
#!/bin/bash
# 告警处理脚本
ALERT_MSG="$1"

curl -X POST https://your-gateway/hooks/agent \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent\": \"alert-handler\",
    \"message\": \"收到告警：${ALERT_MSG}，请分析原因并给出处理建议\"
  }"
```
:::

---

### 安全注意事项

::: warning 生产环境安全清单

1. **使用强密钥**：Secret 至少 32 位随机字符，可用以下命令生成：
   ```bash
   openssl rand -hex 32
   ```

2. **限制 IP 白名单**：在 Gateway 或反向代理层限制只允许可信 IP 访问 Webhook 端点。

3. **不在消息中传递敏感数据**：Webhook 的 `message` 字段会进入 Agent 上下文，避免传递密码、API Key 等敏感信息。

4. **使用 HTTPS**：确保 Gateway 通过 HTTPS 暴露，防止 Token 在传输中泄露。

5. **定期轮换密钥**：定期更新 `secret` 配置并同步更新调用方。
:::

---

_下一步：[Cron 定时任务](./cron-jobs) | [Hooks 事件钩子](./hooks) | [自动化概览](./index)_
