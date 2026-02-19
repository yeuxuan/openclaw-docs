---
title: "日志"
sidebarTitle: "日志"
---

# 日志

面向用户的概览（CLI + 控制界面 + 配置）请参阅 [/logging](/logging)。

OpenClaw 有两个日志"表面"：

- **控制台输出**（你在终端/调试 UI 中看到的）。
- **文件日志**（JSON 行）由网关（Gateway）日志器写入。

---

## 基于文件的日志器

- 默认滚动日志文件位于 `/tmp/openclaw/` 下（每天一个文件）：`openclaw-YYYY-MM-DD.log`
  - 日期使用网关（Gateway）主机的本地时区。
- 日志文件路径和级别可通过 `~/.openclaw/openclaw.json` 配置：
  - `logging.file`
  - `logging.level`

文件格式是每行一个 JSON 对象。

控制界面的日志标签页通过网关（Gateway）（`logs.tail`）跟踪此文件。
CLI 也可以做同样的事情：

```bash
openclaw logs --follow
```

**Verbose 与日志级别**

- **文件日志**完全由 `logging.level` 控制。
- `--verbose` 仅影响**控制台详细程度**（和 WS 日志样式）；它**不会**
  提高文件日志级别。
- 要在文件日志中捕获仅 verbose 的详情，将 `logging.level` 设为 `debug` 或
  `trace`。

---

## 控制台捕获

CLI 捕获 `console.log/info/warn/error/debug/trace` 并写入文件日志，
同时仍打印到 stdout/stderr。

你可以独立调整控制台详细程度：

- `logging.consoleLevel`（默认 `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

---

## 工具摘要脱敏

详细的工具摘要（例如 `🛠️ Exec: ...`）可以在进入
控制台流之前遮盖敏感 Token。这**仅限工具**，不会修改文件日志。

- `logging.redactSensitive`：`off` | `tools`（默认：`tools`）
- `logging.redactPatterns`：正则表达式字符串数组（覆盖默认值）
  - 使用原始正则表达式字符串（自动 `gi`），或 `/pattern/flags` 用于自定义标志。
  - 匹配项通过保留前 6 + 后 4 个字符进行遮盖（长度 >= 18），否则为 `***`。
  - 默认覆盖常见的键赋值、CLI 标志、JSON 字段、bearer 头、PEM 块和流行的 Token 前缀。

---

## 网关（Gateway）WebSocket 日志

网关（Gateway）以两种模式打印 WebSocket 协议日志：

- **正常模式（无 `--verbose`）**：仅打印"有趣的"RPC 结果：
  - 错误（`ok=false`）
  - 慢调用（默认阈值：`>= 50ms`）
  - 解析错误
- **Verbose 模式（`--verbose`）**：打印所有 WS 请求/响应流量。

### WS 日志样式

`openclaw gateway` 支持每网关（Gateway）的样式切换：

- `--ws-log auto`（默认）：正常模式优化；verbose 模式使用紧凑输出
- `--ws-log compact`：verbose 时使用紧凑输出（配对的请求/响应）
- `--ws-log full`：verbose 时使用完整的每帧输出
- `--compact`：`--ws-log compact` 的别名

示例：

```bash
# 优化（仅错误/慢调用）
openclaw gateway

# 显示所有 WS 流量（配对的）
openclaw gateway --verbose --ws-log compact

# 显示所有 WS 流量（完整元数据）
openclaw gateway --verbose --ws-log full
```

---

## 控制台格式化（子系统日志）

控制台格式化器是**TTY 感知的**，打印一致的、带前缀的行。
子系统日志器保持输出分组和可扫描。

行为：

- **子系统前缀**在每行上（例如 `[gateway]`、`[canvas]`、`[tailscale]`）
- **子系统颜色**（每子系统稳定）加上级别着色
- **当输出是 TTY 或环境看起来像富终端时着色**（`TERM`/`COLORTERM`/`TERM_PROGRAM`），尊重 `NO_COLOR`
- **缩短的子系统前缀**：去掉前导 `gateway/` + `channels/`，保留最后 2 个段（例如 `whatsapp/outbound`）
- **按子系统的子日志器**（自动前缀 + 结构化字段 `{ subsystem }`）
- **`logRaw()`** 用于 QR/UX 输出（无前缀，无格式化）
- **控制台样式**（例如 `pretty | compact | json`）
- **控制台日志级别**与文件日志级别分离（当 `logging.level` 设为 `debug`/`trace` 时文件保留完整详情）
- **WhatsApp 消息正文**在 `debug` 级别记录（使用 `--verbose` 查看）

这保持现有文件日志稳定，同时使交互输出可扫描。
