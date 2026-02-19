---
title: "网关（Gateway）锁"
sidebarTitle: "网关"
---

# 网关（Gateway）锁

最后更新：2025-12-11

---

## 原因

- 确保每个主机上同一基础端口仅运行一个网关（Gateway）实例；额外的网关（Gateway）必须使用隔离的 profile 和唯一端口。
- 在崩溃/SIGKILL 后不留下过期的锁文件。
- 当控制端口已被占用时快速失败并给出清晰的错误。

---

## 机制

- 网关（Gateway）在启动时立即使用排他性 TCP 监听器绑定 WebSocket 监听器（默认 `ws://127.0.0.1:18789`）。
- 如果绑定因 `EADDRINUSE` 失败，启动抛出 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`。
- 操作系统在任何进程退出时自动释放监听器，包括崩溃和 SIGKILL — 不需要单独的锁文件或清理步骤。
- 关闭时网关（Gateway）关闭 WebSocket 服务器和底层 HTTP 服务器以及时释放端口。

---

## 错误表面

- 如果另一个进程占用了端口，启动抛出 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`。
- 其他绑定失败表现为 `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`。

---

## 运维说明

- 如果端口被_其他_进程占用，错误相同；释放端口或使用 `openclaw gateway --port <port>` 选择另一个端口。
- macOS 应用在生成网关（Gateway）之前仍然维护自己的轻量级 PID 守护；运行时锁由 WebSocket 绑定强制执行。
