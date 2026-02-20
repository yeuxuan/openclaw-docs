---
title: "Signal"
sidebarTitle: "Signal"
---

# Signal（signal-cli）

状态：外部 CLI 集成。网关通过 HTTP JSON-RPC + SSE 与 `signal-cli` 通信。

---

## 前置要求

- 服务器上已安装 OpenClaw（以下 Linux 流程在 Ubuntu 24 上测试）。
- 网关运行的主机上有 `signal-cli`。
- 一个可以接收验证短信的电话号码（用于短信注册路径）。
- 注册时需要浏览器访问 Signal 验证码（`signalcaptchas.org`）。

---

## 快速设置（新手）

1. 为机器人使用一个 **独立的 Signal 号码**（推荐）。
2. 安装 `signal-cli`（使用 JVM 构建时需要 Java）。
3. 选择一种设置路径：
   - **路径 A（QR 链接）：** `signal-cli link -n "OpenClaw"` 然后用 Signal 扫描。
   - **路径 B（短信注册）：** 使用验证码 + 短信验证注册一个专用号码。
4. 配置 OpenClaw 并重启网关。
5. 发送第一条私信并批准配对（`openclaw pairing approve signal <CODE>`）。

最小配置：

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

字段参考：

| 字段        | 描述                                              |
| ----------- | ------------------------------------------------- |
| `account`   | 机器人电话号码，E.164 格式（`+15551234567`）      |
| `cliPath`   | `signal-cli` 路径（如在 `PATH` 中则为 `signal-cli`） |
| `dmPolicy`  | 私信访问策略（推荐 `pairing`）                    |
| `allowFrom` | 允许私信的电话号码或 `uuid:<id>` 值               |

---

## 它是什么

- 通过 `signal-cli` 的 Signal 通道（非嵌入式 libsignal）。
- 确定性路由：回复始终返回 Signal。
- 私信共享智能体的主会话；群组隔离（`agent:<agentId>:signal:group:<groupId>`）。

---

## 配置写入

默认情况下，Signal 允许由 `/config set|unset` 触发的配置更新写入（需要 `commands.config: true`）。

禁用：

```json5
{
  channels: { signal: { configWrites: false } },
}
```

---

## 号码模型（重要）

- 网关连接到一个 **Signal 设备**（`signal-cli` 账户）。
- 如果你在 **个人 Signal 账户** 上运行机器人，它会忽略你自己的消息（循环保护）。
- 要实现"我给机器人发消息，它回复我"，使用一个 **独立的机器人号码**。

---

## 设置路径 A：链接现有 Signal 账户（QR）

1. 安装 `signal-cli`（JVM 或原生构建）。
2. 链接机器人账户：
   - `signal-cli link -n "OpenClaw"` 然后在 Signal 中扫描 QR 码。
3. 配置 Signal 并启动网关。

示例：

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

多账户支持：使用 `channels.signal.accounts` 进行按账户配置和可选的 `name`。参见 [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts) 了解共享模式。

---

## 设置路径 B：注册专用机器人号码（短信，Linux）

当你想要一个专用机器人号码而不是链接现有 Signal 应用账户时使用此方式。

1. 获取一个可以接收短信的号码（或固定电话使用语音验证）。
   - 使用专用机器人号码以避免账户/会话冲突。
2. 在网关主机上安装 `signal-cli`：

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

如果使用 JVM 构建（`signal-cli-${VERSION}.tar.gz`），先安装 JRE 25+。
保持 `signal-cli` 更新；上游说明旧版本可能因 Signal 服务器 API 变更而损坏。

3. 注册并验证号码：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

如果需要验证码：

1. 打开 `https://signalcaptchas.org/registration/generate.html`。
2. 完成验证码，从"Open Signal"复制 `signalcaptcha://...` 链接目标。
3. 尽可能从与浏览器会话相同的外部 IP 运行。
4. 立即再次运行注册（验证码 Token 很快过期）：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. 配置 OpenClaw，重启网关，验证通道：

```bash
# 如果你以用户 systemd 服务运行网关：
systemctl --user restart openclaw-gateway

# 然后验证：
openclaw doctor
openclaw channels status --probe
```

5. 配对你的私信发送者：
   - 向机器人号码发送任何消息。
   - 在服务器上批准配对码：`openclaw pairing approve signal <PAIRING_CODE>`。
   - 将机器人号码保存为手机上的联系人以避免"未知联系人"。

重要：使用 `signal-cli` 注册电话号码账户可能会取消该号码的主 Signal 应用会话的认证。建议使用专用机器人号码，或如果需要保留现有手机应用设置，使用 QR 链接模式。

上游参考：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- 验证码流程：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 链接流程：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

---

## 外部守护进程模式（httpUrl）

如果你想自行管理 `signal-cli`（JVM 冷启动慢、容器初始化或共享 CPU），单独运行守护进程并将 OpenClaw 指向它：

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

这跳过了 OpenClaw 内部的自动启动和启动等待。对于自动启动时的慢启动，设置 `channels.signal.startupTimeoutMs`。

---

## 访问控制（私信 + 群组）

私信：

- 默认：`channels.signal.dmPolicy = "pairing"`。
- 未知发送者收到配对码；消息在批准前被忽略（配对码 1 小时后过期）。
- 批准方式：
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- 配对是 Signal 私信的默认令牌交换方式。详情：[配对](/channels/pairing)
- 仅有 UUID 的发送者（来自 `sourceUuid`）以 `uuid:<id>` 形式存储在 `channels.signal.allowFrom` 中。

群组：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- 当设置为 `allowlist` 时，`channels.signal.groupAllowFrom` 控制谁可以在群组中触发。

---

## 工作原理（行为）

- `signal-cli` 作为守护进程运行；网关通过 SSE 读取事件。
- 入站消息被标准化为共享的通道信封。
- 回复始终路由回相同的号码或群组。

---

## 媒体 + 限制

- 出站文本分块至 `channels.signal.textChunkLimit`（默认 4000）。
- 可选换行分块：设置 `channels.signal.chunkMode="newline"` 在按长度分块前先在空行处（段落边界）分割。
- 支持附件（从 `signal-cli` 获取 base64）。
- 默认媒体上限：`channels.signal.mediaMaxMb`（默认 8）。
- 使用 `channels.signal.ignoreAttachments` 跳过媒体下载。
- 群组历史上下文使用 `channels.signal.historyLimit`（或 `channels.signal.accounts.*.historyLimit`），回退到 `messages.groupChat.historyLimit`。设置 `0` 禁用（默认 50）。

---

## 输入状态 + 已读回执

- **输入指示器**：OpenClaw 通过 `signal-cli sendTyping` 发送输入信号，并在回复运行时刷新它们。
- **已读回执**：当 `channels.signal.sendReadReceipts` 为 true 时，OpenClaw 为允许的私信转发已读回执。
- Signal-cli 不支持群组的已读回执。

---

## 表情回应（消息工具）

- 使用 `message action=react` 配合 `channel=signal`。
- 目标：发送者 E.164 或 UUID（使用配对输出中的 `uuid:<id>`；裸 UUID 也可以）。
- `messageId` 是你要回应的消息的 Signal 时间戳。
- 群组回应需要 `targetAuthor` 或 `targetAuthorUuid`。

示例：

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

配置：

- `channels.signal.actions.reactions`：启用/禁用表情回应操作（默认 true）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`。
  - `off`/`ack` 禁用智能体回应（消息工具 `react` 会报错）。
  - `minimal`/`extensive` 启用智能体回应并设置指导级别。
- 按账户覆盖：`channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

---

## 投递目标（CLI/定时任务）

- 私信：`signal:+15551234567`（或纯 E.164）。
- UUID 私信：`uuid:<id>`（或裸 UUID）。
- 群组：`signal:group:<groupId>`。
- 用户名：`username:<name>`（如果你的 Signal 账户支持）。

---

## 故障排查

首先运行此诊断梯度：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

然后如需确认私信配对状态：

```bash
openclaw pairing list signal
```

常见故障：

- 守护进程可达但无回复：验证账户/守护进程设置（`httpUrl`、`account`）和接收模式。
- 私信被忽略：发送者正在等待配对批准。
- 群组消息被忽略：群组发送者/提及门控阻止了投递。
- 编辑后配置验证错误：运行 `openclaw doctor --fix`。
- 诊断中缺少 Signal：确认 `channels.signal.enabled: true`。

额外检查：

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

分流流程：[/channels/troubleshooting](/channels/troubleshooting)。

---

## 安全说明

- `signal-cli` 在本地存储账户密钥（通常在 `~/.local/share/signal-cli/data/`）。
- 在服务器迁移或重建前备份 Signal 账户状态。
- 除非你明确需要更广泛的私信访问，否则保持 `channels.signal.dmPolicy: "pairing"`。
- 短信验证仅在注册或恢复流程时需要，但失去号码/账户的控制可能使重新注册复杂化。

---

## 配置参考（Signal）

完整配置：[配置](/gateway/configuration)

提供商选项：

- `channels.signal.enabled`：启用/禁用通道启动。
- `channels.signal.account`：机器人账户的 E.164 号码。
- `channels.signal.cliPath`：`signal-cli` 路径。
- `channels.signal.httpUrl`：完整的守护进程 URL（覆盖 host/port）。
- `channels.signal.httpHost`、`channels.signal.httpPort`：守护进程绑定（默认 127.0.0.1:8080）。
- `channels.signal.autoStart`：自动启动守护进程（`httpUrl` 未设置时默认 true）。
- `channels.signal.startupTimeoutMs`：启动等待超时（毫秒，上限 120000）。
- `channels.signal.receiveMode`：`on-start | manual`。
- `channels.signal.ignoreAttachments`：跳过附件下载。
- `channels.signal.ignoreStories`：忽略来自守护进程的故事。
- `channels.signal.sendReadReceipts`：转发已读回执。
- `channels.signal.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.signal.allowFrom`：私信白名单（E.164 或 `uuid:<id>`）。`open` 需要 `"*"`。Signal 没有用户名；使用电话/UUID ID。
- `channels.signal.groupPolicy`：`open | allowlist | disabled`（默认：allowlist）。
- `channels.signal.groupAllowFrom`：群组发送者白名单。
- `channels.signal.historyLimit`：作为上下文包含的最大群组消息数（0 禁用）。
- `channels.signal.dmHistoryLimit`：私信历史限制（用户轮次）。按用户覆盖：`channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`：出站分块大小（字符）。
- `channels.signal.chunkMode`：`length`（默认）或 `newline`，在按长度分块前先在空行处（段落边界）分割。
- `channels.signal.mediaMaxMb`：入站/出站媒体上限（MB）。

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（Signal 不支持原生提及）。
- `messages.groupChat.mentionPatterns`（全局回退）。
- `messages.responsePrefix`。
