---
title: "openclaw channels"
sidebarTitle: "channels"
---

# `openclaw channels`

`channels` 管理聊天软件入口。Telegram、WhatsApp、Discord、Slack、微信、飞书这些都属于通道。

通道的任务很简单：把外面的消息送进 Gateway，再把 OpenClaw 的回复送回去。

常用：

```bash
openclaw channels status
openclaw channels status --probe
openclaw channels login --channel whatsapp
openclaw channels logout --channel zalouser
```

注意：Telegram 不使用 `channels login`，它是 Bot Token 配置型通道。

## 什么时候用

- 机器人在聊天软件里不回消息。
- 你刚加了一个通道，想确认配置是否生效。
- 某个通道需要扫码或 OAuth 登录。
- 升级后想检查所有通道是否仍可用。

## `status` 和 `status --probe` 的区别

`openclaw channels status` 像看登记表：配置里有没有这个通道、是否启用。

`openclaw channels status --probe` 像打电话试一下：真的去检查连接、token、账号状态。排障时优先用 `--probe`。

## 常见排障顺序

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

如果是私聊不回复，还要看配对：

```bash
openclaw pairing list <channel>
```

继续阅读：[连接聊天软件](/tutorials/channels/)。

## 保留凭据重连单个账号

不要为了重连先 `logout`：它会清除凭据并要求重新登录。具有 `operator.admin` 权限时，可以只停止/启动一个账号，保留已有配对：

```bash
openclaw gateway call channels.stop --params '{"channel":"whatsapp","accountId":"<accountId>"}'
openclaw gateway call channels.start --params '{"channel":"whatsapp","accountId":"<accountId>"}'
openclaw channels status --channel whatsapp --probe
openclaw channels logs --channel whatsapp
```

两次调用必须使用同一 `accountId`；两次都省略时选择默认账号。`started` / `stopped` 只反映操作后的运行快照，`started: true` 不代表 Provider 已健康连接，`started: false` 也不能单独证明已停止；仍要看 probe 和日志。`gateway restart` 则重启整个 Gateway。

`channels logs --channel discord` 只匹配 `discord` 或 `gateway/channels/discord` 及其斜杠子模块，不会误匹配 `discord-archive`。

## 入站死信

通道将不可继续自动投递的事件保留为死信时，先读取原因：

```bash
openclaw channels dead-letters list --channel line --account default
```

修复根因、确认事件没有产生已提交副作用后，才单独重提：

```bash
openclaw channels dead-letters resubmit <event-id> --channel line --account default
```

重提不会检查失败原因。尤其不要重提 `delivery-side-effects-committed`，否则会重复已启动的工作或回复。LINE 的重试次数、队列与超时判断见 [LINE 排障](/tutorials/channels/line#line-delivery-recovery)。
