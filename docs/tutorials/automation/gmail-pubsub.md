---
title: "Gmail PubSub 实时集成"
sidebarTitle: "Gmail PubSub"
---

# Gmail PubSub 实时推送（Gmail PubSub）

通过 Google Cloud Pub/Sub 服务，OpenClaw 可以在新邮件到达时**实时收到通知**，而不需要定期轮询。这意味着更低的延迟、更少的 API 调用，以及更接近即时响应的邮件处理体验。

---

## 快速上手

**前置条件：**
- 已有 Google Cloud 项目
- Gmail API 已在项目中启用
- Google Cloud Pub/Sub API 已启用

**第一步：创建 Pub/Sub 主题（Topic）**

```bash
# 登录 Google Cloud
gcloud auth login

# 创建 Pub/Sub 主题
gcloud pubsub topics create openclaw-gmail

# 创建订阅（Subscription）
gcloud pubsub subscriptions create openclaw-gmail-sub \
  --topic=openclaw-gmail
```

**第二步：授权 Gmail 推送到主题**

```bash
# 授予 Gmail 服务账号发布权限
gcloud pubsub topics add-iam-policy-binding openclaw-gmail \
  --member="serviceAccount:gmail-api-push@system.gserviceaccount.com" \
  --role="roles/pubsub.publisher"
```

**第三步：在 OpenClaw 中配置 Gmail 通道**

```json5
{
  channels: {
    gmail: {
      // Gmail OAuth 凭证（通过 openclaw auth gmail 获取）
      credentialsFile: "~/.openclaw/gmail-credentials.json",
      // Pub/Sub 推送配置
      pubsub: {
        // Google Cloud 项目 ID
        project: "your-gcp-project-id",
        // 订阅名称
        subscription: "openclaw-gmail-sub"
      }
    }
  }
}
```

**第四步：完成 Gmail OAuth 授权**

```bash
openclaw auth gmail
```

**第五步：启动 Gmail Watch（告知 Gmail 推送到 Pub/Sub）**

```bash
openclaw channels gmail watch
```

**第六步：验证推送是否正常工作**

发送一封测试邮件，然后查看日志：

```bash
openclaw logs --filter gmail --follow
```

::: tip 一次性完整设置命令
如果你是第一次配置，可以使用向导命令完成所有步骤：
```bash
openclaw channels gmail setup
```
:::

---

## 技术说明

### 工作原理

```text
新邮件到达 Gmail
      ↓
Gmail 向 Pub/Sub 主题推送通知
      ↓
OpenClaw 从 Pub/Sub 订阅接收通知
      ↓
OpenClaw 获取邮件详情
      ↓
触发配置的 Agent 处理邮件
```

---

### 完整配置示例

```json5
{
  channels: {
    gmail: {
      credentialsFile: "~/.openclaw/gmail-credentials.json",
      // 邮件过滤：只处理收件箱中未读邮件
      filters: {
        labels: ["INBOX", "UNREAD"]
      },
      pubsub: {
        project: "your-gcp-project-id",
        subscription: "openclaw-gmail-sub",
        // 拉取超时（秒）
        timeout: 30,
        // 每次最多处理的消息数
        maxMessages: 10
      },
      // 处理邮件的 Agent
      agent: "email-handler-agent"
    }
  }
}
```

---

### Watch 刷新机制

::: warning Gmail Watch 每 7 天过期
Gmail 的推送订阅（Watch）有效期为 **7 天**，到期后必须重新调用 Watch 才能继续接收推送。

推荐使用 Cron 任务自动续期：

```json5
{
  cron: {
    jobs: [
      {
        // 每月 1 日早上 8 点自动刷新（Watch 有效期 7 天，按月刷新确保不过期）
        schedule: "0 8 1 * *",
        agent: "system-maintenance",
        message: "请执行 Gmail Watch 续期操作：openclaw channels gmail watch"
      }
    ]
  }
}
```

或者直接用系统 cron 运行命令：

```bash
# 在系统 crontab 中添加（每月 1 日早上 8 点刷新）
0 8 1 * * /usr/local/bin/openclaw channels gmail watch
```
:::

---

### CLI 命令

```bash
# 完整设置向导（首次使用）
openclaw channels gmail setup

# 启动/刷新 Gmail Watch
openclaw channels gmail watch

# 查看 Watch 状态
openclaw channels gmail status

# 手动从 Pub/Sub 拉取一次（测试用）
openclaw channels gmail pull

# 停止 Watch（取消推送）
openclaw channels gmail unwatch

# 清理 Pub/Sub 订阅
openclaw channels gmail cleanup
```

---

### 故障排查

::: details 推送不工作：没有收到新邮件通知

1. 确认 Watch 是否活跃：`openclaw channels gmail status`
2. 检查 IAM 权限是否正确配置（Step 2 的授权步骤）
3. 验证 Pub/Sub 订阅是否有未确认消息：
   ```bash
   gcloud pubsub subscriptions describe openclaw-gmail-sub
   ```
4. 手动触发一次拉取：`openclaw channels gmail pull`
:::

::: details Watch 已过期：超过 7 天未刷新

```bash
# 重新启动 Watch
openclaw channels gmail watch
```

Watch 过期期间收到的邮件不会补发通知。如需处理漏掉的邮件，可手动轮询：

```bash
openclaw channels poll --channel gmail
```
:::

::: details 权限错误（403 Forbidden）

检查 OAuth 授权范围是否包含以下权限：
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/pubsub`

重新授权：
```bash
openclaw auth gmail --force-reauth
```
:::

---

_下一步：[OAuth 认证监控](./auth-monitoring) | [轮询通道](./poll) | [自动化概览](./index)_
