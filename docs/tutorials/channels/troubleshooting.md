---
title: "通道故障排查"
sidebarTitle: "通道故障排查"
---

# 通道故障排查

当通道已连接但行为异常时，请使用本页面进行排查。

---

## 命令排查步骤

请按顺序运行以下命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

健康基准：

- `Runtime: running`
- `RPC probe: ok`
- 通道探测显示已连接/就绪

---

## WhatsApp

### WhatsApp 故障特征

| 症状                         | 最快检查方式                                       | 修复方法                                                     |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| 已连接但没有私信回复     | `openclaw pairing list whatsapp`                    | 批准发送者或切换 DM 策略/白名单。           |
| 群组消息被忽略          | 检查配置中的 `requireMention` + 提及模式 | 提及机器人或放宽该群组的提及策略。 |
| 随机断开/重新登录循环 | `openclaw channels status --probe` + 日志           | 重新登录并验证凭据目录是否正常。   |

完整故障排查：[/channels/whatsapp#troubleshooting-quick](/channels/whatsapp#troubleshooting-quick)

---

## Telegram

### Telegram 故障特征

| 症状                           | 最快检查方式                                   | 修复方法                                                                         |
| --------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| `/start` 后没有可用的回复流程 | `openclaw pairing list telegram`                | 批准配对或更改 DM 策略。                                        |
| 机器人在线但群组保持静默 | 验证提及要求和机器人隐私模式 | 禁用隐私模式以获取群组可见性或提及机器人。                   |
| 发送失败并出现网络错误 | 检查日志中的 Telegram API 调用失败     | 修复到 `api.telegram.org` 的 DNS/IPv6/代理路由。                           |
| 升级后白名单阻止你 | `openclaw security audit` 和配置白名单 | 运行 `openclaw doctor --fix` 或将 `@username` 替换为数字发送者 ID。 |

完整故障排查：[/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

---

## Discord

### Discord 故障特征

| 症状                         | 最快检查方式                       | 修复方法                                                       |
| ------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| 机器人在线但没有公会回复 | `openclaw channels status --probe`  | 允许公会/频道并验证消息内容 Intent。    |
| 群组消息被忽略          | 检查日志中的提及门控丢弃 | 提及机器人或设置公会/频道 `requireMention: false`。 |
| 私信回复缺失              | `openclaw pairing list discord`     | 批准私信配对或调整 DM 策略。                   |

完整故障排查：[/channels/discord#troubleshooting](/channels/discord#troubleshooting)

---

## Slack

### Slack 故障特征

| 症状                                | 最快检查方式                             | 修复方法                                               |
| -------------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| Socket 模式已连接但没有响应 | `openclaw channels status --probe`        | 验证 app token + bot token 以及所需的 scope。 |
| 私信被阻止                            | `openclaw pairing list slack`             | 批准配对或放宽 DM 策略。               |
| 频道消息被忽略                | 检查 `groupPolicy` 和频道白名单 | 允许该频道或将策略切换为 `open`。     |

完整故障排查：[/channels/slack#troubleshooting](/channels/slack#troubleshooting)

---

## iMessage 和 BlueBubbles

### iMessage 和 BlueBubbles 故障特征

| 症状                          | 最快检查方式                                                           | 修复方法                                                   |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| 没有入站事件                | 验证 Webhook/服务器可达性和应用权限                  | 修复 Webhook URL 或 BlueBubbles 服务器状态。          |
| macOS 上可以发送但无法接收 | 检查 macOS 对 Messages 自动化的隐私权限                 | 重新授予 TCC 权限并重启通道进程。 |
| 私信发送者被阻止                | `openclaw pairing list imessage` 或 `openclaw pairing list bluebubbles` | 批准配对或更新白名单。                  |

完整故障排查：

- [/channels/imessage#troubleshooting-macos-privacy-and-security-tcc](/channels/imessage#troubleshooting-macos-privacy-and-security-tcc)
- [/channels/bluebubbles#troubleshooting](/channels/bluebubbles#troubleshooting)

---

## Signal

### Signal 故障特征

| 症状                         | 最快检查方式                              | 修复方法                                                      |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| 守护进程可达但机器人无响应 | `openclaw channels status --probe`         | 验证 `signal-cli` 守护进程 URL/账户和接收模式。 |
| 私信被阻止                      | `openclaw pairing list signal`             | 批准发送者或调整 DM 策略。                      |
| 群组回复未触发    | 检查群组白名单和提及模式 | 添加发送者/群组或放宽门控。                       |

完整故障排查：[/channels/signal#troubleshooting](/channels/signal#troubleshooting)

---

## Matrix

### Matrix 故障特征

| 症状                             | 最快检查方式                                | 修复方法                                             |
| ----------------------------------- | -------------------------------------------- | ----------------------------------------------- |
| 已登录但忽略房间消息 | `openclaw channels status --probe`           | 检查 `groupPolicy` 和房间白名单。         |
| 私信不处理                  | `openclaw pairing list matrix`               | 批准发送者或调整 DM 策略。             |
| 加密房间失败                | 验证加密模块和加密设置 | 启用加密支持并重新加入/同步房间。 |

完整故障排查：[/channels/matrix#troubleshooting](/channels/matrix#troubleshooting)
