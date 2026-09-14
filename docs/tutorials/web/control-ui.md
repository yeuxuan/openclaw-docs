---
title: "Control UI"
sidebarTitle: "Control UI"
---

# Control UI：浏览器里的 OpenClaw 控制台

Control UI 是你管理 OpenClaw 的浏览器界面。它可以查看 Gateway、通道、节点、模型、任务和会话状态。

打开方式：

```bash
openclaw dashboard
```

默认地址通常是：

```text
http://127.0.0.1:18789/
```

如果你远程访问，请走 Tailscale、VPN、SSH 隧道或可信反向代理，并配置认证。

继续阅读：[Gateway 认证](/tutorials/gateway/authentication)、[Web 控制 UI](/tutorials/web/)

## 新手提醒

Control UI 很方便，但它也是管理入口。远程访问时一定要保护好：

- 使用 token 或密码。
- 不裸露到公网。
- 不把带 token 的 URL 发给别人。
- 服务器优先用 SSH tunnel 或 Tailscale。

## Chat 和 Talk

Control UI 的聊天仍然通过 Gateway WebSocket 调用：

- `chat.history`
- `chat.send`
- `chat.abort`
- `chat.inject`

Chat history 刷新现在会请求一个有上限的最近窗口，并给单条消息文本设置上限。
人话说：很大的会话不会再逼浏览器一次性渲染完整 transcript，聊天页应该先变得可用，再慢慢补状态。

被截断的可见助手消息现在会通过 `chat.message.get` 自动补全，加载期间保留预览。修改聊天设置后立即发送时，界面会显示 **Applying chat settings**，等待设置保存和这次会话刷新完成，不必重复点击发送。

如果 Gateway 明确报告“缺少模型凭证”或认证失败，Chat 与 New Session 会阻止发送：
缺凭证时进入 Model Setup，认证失败时检查对应凭证或重新登录。临时冷却、限流或
无法确认模型可用性不会被误判成认证失败，实际运行错误仍会留在 transcript 中；模型
选择器里已确认不可用的选项会保持禁用。

Talk 走新的 Talk session 合同。

浏览器实时语音分两类：

| 类型 | 谁持有 provider 会话 | 入口 |
| --- | --- | --- |
| OpenAI WebRTC / Google provider WebSocket | 浏览器客户端 | `talk.client.create` |
| Gateway relay / transcription / managed-room | Gateway | `talk.session.create` |

浏览器不会拿到普通 provider API Key。
OpenAI WebRTC 会拿临时 Realtime client secret。
Google Live 会拿一次性的受限 token。
后端 relay provider 的凭据保留在 Gateway，浏览器只把麦克风 PCM 通过 `talk.session.appendAudio` 发给 Gateway。

当 realtime provider 需要咨询更大的 OpenClaw Agent 时，客户端通过：

```text
talk.client.toolCall
```

转发 `openclaw_agent_consult`，由 Gateway 执行策略检查和会话处理。

::: warning 配置字段别写旧了
浏览器 Talk 的实时配置是 `talk.realtime.*`，不是旧的 `talk.provider` 顶层字段。
:::

示例：

```json5
{
  talk: {
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime",
          voice: "alloy"
        }
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult"
    }
  }
}
```

Control UI 里 Talk 按钮通常在聊天输入框旁边。状态从 `Connecting Talk...` 到 `Talk live`，如果 realtime 工具调用正在咨询 OpenClaw，会显示类似 `Asking OpenClaw...` 的状态。

## 慢状态刷新时不会白屏

Control UI 的通道探测、审计、状态刷新可能遇到很慢的 provider。
新版 UI 会尽量保持上一份快照可见，不会因为某个慢检查还没回来就把页面清空。

如果 probe 或 audit 超过 UI 预算，页面会标记 partial snapshot。
这表示“现在看到的是部分结果或旧结果”，不是 Gateway 一定坏了。

调试事件日志里也会记录：

- Control UI refresh/RPC timing。
- 慢 chat/config render timing。
- 浏览器 long animation frame 或 long task（浏览器支持时）。

这些信息可以帮助你判断：是 Gateway 慢、provider 慢，还是浏览器渲染大历史太慢。

## 断线、草稿和附件恢复

断线后看到 **Delivery unconfirmed**，先查看会话是否已收到消息，再使用 **Retry**；**Discard** 只移除本浏览器的待发副本，不撤销 Gateway 已受理的工作。未确认的早期消息会阻塞后续队列，解决或丢弃后才继续。

普通会话的附件队列使用浏览器 IndexedDB 保存二进制数据，单条消息上限 25 MiB、同 origin 合计 250 MiB，同时受浏览器配额限制。需要 HTTPS 或 localhost 的存储和 Web Locks 支持。全部附件保存成功才入队，发送前也必须全部可读；缺失附件不会被静默跳过后只发送剩余部分。Incognito 仍使用更小的标签页内存储，不把排队附件写入 IndexedDB。

草稿和队列保留创建时的 Agent 与目标会话，切换 Agent、分屏或刷新不会迁移目标。复制标签页带来的待发消息会标记投递未确认；先核对已投递情况再重试，避免重复执行。

旧存储无法可靠识别目标时，显示 **Saved messages need a destination**。打开期望的非 Incognito 会话，确保输入框和队列为空，再选择 **Restore here for review** 并核对会话键和 Agent。恢复的队列保持暂停，附件草稿只回到输入框，不会自动发送。

有待恢复内容时不要清除站点数据。清理会删除本地草稿、队列附件及登录状态；若配额在发送/丢弃队列后仍满，先保存需要的内容再清理。

## 浏览器推送的授权边界

待处理执行/插件审批可以触发 Web Push，但只发往当前仍具备设备、Token、profile 角色和审批可见权限的已绑定订阅。推送只包含通用提示和需认证的审批链接，不携带审批详情；旧未绑定订阅在浏览器重新连接前仅用于测试。

同一个已安装 PWA 在一个 Service Worker scope 中切换多个 Gateway 时，只能使用一套应用服务器 VAPID key。互相信任的 Gateway 可配置相同 key pair 和各自的 `gateway.publicOrigin`；这会形成共享推送签名信任域，不适合彼此隔离的实例。不同 HTTPS origin 或 base-path scope 的 PWA 不必共享密钥。
