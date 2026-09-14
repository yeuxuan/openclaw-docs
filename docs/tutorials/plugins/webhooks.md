---
title: "Webhooks"
sidebarTitle: "Webhooks"
description: "通过独立认证的 HTTP 路由管理 OpenClaw TaskFlow 记录，区分任务记录与真实 Agent 执行。"
---

# Webhooks：外部系统管理 TaskFlow 记录

Webhooks 插件让 CI、n8n、Zapier 或内部服务通过 HTTP 创建和推进 TaskFlow 跟踪记录。**它不会直接唤醒 Agent**：`create_flow` 创建流程记录，`run_task` 创建或关联子任务记录，外部控制器仍负责真正启动工作并推进状态。

如果目标是收到外部事件后提交一个 Agent 回合，使用独立的 [Gateway HTTP hooks](/tutorials/automation/webhook)（例如 `/hooks/agent`），不要用本插件替代。内部 Agent 事件则看 [Hooks](/tutorials/automation/hooks)。三者不共享路由和认证。

## 每条路由单独配置

插件运行在 Gateway 进程中，远程 Gateway 应在远端主机配置并重启。默认没有任何路由，不配置就不接收请求。

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            ci: {
              path: "/plugins/webhooks/ci",
              sessionKey: "agent:main:hook:ci",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
            },
          },
        },
      },
    },
  },
}
```

每条路由必须有 `sessionKey` 和 `secret`，默认路径为 `/plugins/webhooks/<routeId>`，各路径不能重复。路由可以读写绑定会话拥有的 TaskFlow，不能越过该会话；不同外部系统应使用独立强密钥和尽可能窄的会话。

`secret` 不是 `hooks.token`，也不是 Gateway 登录 Token。它支持明文或 `env` / `file` / `exec` / `store` SecretRef。某一路的引用无法解析时，Gateway 与其他路由仍可运行，但该路由保持不可用并返回通用 `401`；修好来源后 reload/restart，才会启用新的配置快照，公开请求期间不会临时解析密钥。

## 请求与结果

```bash
curl --include https://gateway.example.com/plugins/webhooks/ci \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <route-secret>' \
  -d '{"action":"create_flow","goal":"检查本次 CI 结果"}'
```

请求必须是 JSON `POST`，认证也可用 `x-openclaw-webhook-secret`；同时存在时 Bearer 优先，查询参数和请求体里的 token 不作为认证。非 loopback 使用 HTTPS。这里接收固定 action schema，不直接接收任意 Provider 的 Webhook、URL 验证挑战或专属 HMAC 签名；需要外部自动化先验证并转换事件。

成功创建会返回 `result.flow.flowId` 与初始 `revision: 0`，随后用 `get_flow` 查询。HTTP `200` 只确认读取或记录操作成功，不证明 Agent 已运行、工作完成或消息已送达；读取不存在或不属于该会话的记录时，还可能是 `flow: null`。实际运行状态见[任务 CLI](/tutorials/cli/tasks)。

## 自动化最容易踩的坑

- `create_flow` 没有通用幂等键。连接结果不确定时，先 `list_flows` 对账，再决定是否重试，避免重复创建。
- `run_task` 只创建或关联记录，**不启动任务**。关联既有运行时必须提供真实、当前仍由绑定会话拥有的 `childSessionKey` 和精确 `runId`；随意编造 ID 不会开始工作或得到权限。
- `set_waiting`、`resume_flow`、`finish_flow`、`fail_flow`、`request_cancel` 需要 `flowId` 和当前 `expectedRevision`。遇到 `409 revision_conflict`，重新读取并协调状态，不要盲目重复写。子任务成功也不会自动把流程标为完成。
- `request_cancel` 只登记取消意图；`cancel_flow` 返回 `202 cancel_pending` 表示子任务仍活跃，需要继续查询，不代表已经取消完毕。
- `401` 先查该路由密钥和 SecretRef；`405/415` 查方法及 JSON 类型；`408/413` 查 15 秒读取期限和 256 KiB 上限；`429` 降低频率/并发；`503 persist_failed` 先查存储和 Gateway 日志。

上游来源：[`docs/plugins/webhooks.md`](https://github.com/openclaw/openclaw/blob/2e3bf941b7848fa9dfcbcfc8c9a89d99e2feeb30/docs/plugins/webhooks.md)。
