---
title: "时区"
sidebarTitle: "时区"
---

# 时区（Timezones）

OpenClaw 标准化时间戳，以便模型看到 **单一的参考时间**。

---

## 消息信封（默认本地时间）

入站消息包装在如下信封中：

```
[Provider ... 2026-01-05 16:26 PST] message text
```

信封中的时间戳 **默认是宿主机本地时间**，精确到分钟。

你可以通过以下方式覆盖：

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` 使用 UTC。
- `envelopeTimezone: "user"` 使用 `agents.defaults.userTimezone`（回退到宿主时区）。
- 使用显式 IANA 时区（如 `"Europe/Vienna"`）设置固定偏移。
- `envelopeTimestamp: "off"` 从信封头中移除绝对时间戳。
- `envelopeElapsed: "off"` 移除经过时间后缀（`+2m` 风格）。

### 示例

**本地（默认）：**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**固定时区：**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**经过时间：**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

---

## 工具负载（原始提供商数据 + 规范化字段）

工具调用（`channels.discord.readMessages`、`channels.slack.readMessages` 等）返回 **原始提供商时间戳**。我们还附加规范化字段以保持一致性：

- `timestampMs`（UTC 纪元毫秒）
- `timestampUtc`（ISO 8601 UTC 字符串）

原始提供商字段被保留。

---

## 系统提示词的用户时区

设置 `agents.defaults.userTimezone` 告诉模型用户的本地时区。如果未设置，OpenClaw 在 **运行时解析宿主时区**（不写入配置）。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

系统提示词包括：

- `Current Date & Time` 部分，带本地时间和时区
- `Time format: 12-hour` 或 `24-hour`

你可以通过 `agents.defaults.timeFormat`（`auto` | `12` | `24`）控制提示格式。

参见[日期和时间](/date-time)了解完整行为和示例。
