---
title: "后台执行与进程工具"
sidebarTitle: "后台执行与进程工具"
---

# 后台执行 + 进程工具

OpenClaw 通过 `exec` 工具运行 shell 命令，并将长时间运行的任务保留在内存中。`process` 工具用于管理这些后台会话（Session）。

---

## exec 工具

关键参数：

- `command`（必需）
- `yieldMs`（默认 10000）：超过此延迟后自动转为后台运行
- `background`（bool）：立即后台运行
- `timeout`（秒，默认 1800）：超时后终止进程
- `elevated`（bool）：在启用/允许 elevated 模式时在主机上运行
- 需要真正的 TTY？设置 `pty: true`。
- `workdir`、`env`

行为：

- 前台运行直接返回输出。
- 转为后台运行时（显式或超时），工具返回 `status: "running"` + `sessionId` 和一个简短的尾部输出。
- 输出保留在内存中，直到会话（Session）被轮询或清除。
- 如果 `process` 工具被禁用，`exec` 会同步运行并忽略 `yieldMs`/`background`。

---

## 子进程桥接

在 exec/process 工具之外生成长时间运行的子进程时（例如 CLI 重启或网关（Gateway）辅助进程），请挂载子进程桥接辅助器，以便终止信号被转发且监听器在退出/错误时被分离。这可以避免 systemd 上的孤儿进程，并在各平台上保持一致的关闭行为。

环境变量覆盖：

- `PI_BASH_YIELD_MS`：默认 yield（毫秒）
- `PI_BASH_MAX_OUTPUT_CHARS`：内存中输出上限（字符数）
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`：每个流的待处理 stdout/stderr 上限（字符数）
- `PI_BASH_JOB_TTL_MS`：已完成会话（Session）的 TTL（毫秒，限制在 1 分钟至 3 小时）

配置（推荐）：

- `tools.exec.backgroundMs`（默认 10000）
- `tools.exec.timeoutSec`（默认 1800）
- `tools.exec.cleanupMs`（默认 1800000）
- `tools.exec.notifyOnExit`（默认 true）：后台 exec 退出时，入队一个系统事件并请求心跳。
- `tools.exec.notifyOnExitEmptySuccess`（默认 false）：设为 true 时，也为没有输出的成功后台运行入队完成事件。

---

## process 工具

操作：

- `list`：列出运行中 + 已完成的会话（Session）
- `poll`：获取会话（Session）的新输出（同时报告退出状态）
- `log`：读取聚合输出（支持 `offset` + `limit`）
- `write`：发送 stdin（`data`，可选 `eof`）
- `kill`：终止后台会话（Session）
- `clear`：从内存中移除已完成的会话（Session）
- `remove`：如果运行中则终止，如果已完成则清除

注意事项：

- 仅后台化的会话（Session）会被列出/保留在内存中。
- 进程重启时会话（Session）会丢失（无磁盘持久化）。
- 会话（Session）日志仅在运行 `process poll/log` 且工具结果被记录时才保存到聊天历史。
- `process` 作用域限定在每个智能体（Agent）；它只能看到该智能体（Agent）启动的会话（Session）。
- `process list` 包含一个派生的 `name`（命令动词 + 目标）用于快速浏览。
- `process log` 使用基于行的 `offset`/`limit`。
- 当 `offset` 和 `limit` 都省略时，返回最后 200 行并包含分页提示。
- 当提供 `offset` 但省略 `limit` 时，返回从 `offset` 到末尾的内容（不限制为 200 行）。

---

## 示例

运行一个长时间任务并稍后轮询：

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

立即在后台启动：

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

发送 stdin：

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```
