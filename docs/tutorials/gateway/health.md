---
title: "健康检查"
sidebarTitle: "健康检查"
description: "OpenClaw Gateway：健康检查（CLI）。用于验证通道（Channel）连接性的简要指南。"
---

# 健康检查（CLI）

用于验证通道（Channel）连接性的简要指南。

---

## 快速检查

- `openclaw status` : 本地摘要：网关（Gateway）可达性/模式、更新提示、关联的通道（Channel）认证时效、会话（Session）+ 近期活动。
- `openclaw status --all` : 完整本地诊断（只读、彩色、可安全粘贴用于调试）。
- `openclaw status --deep` : 同时探测运行中的网关（Gateway）（支持的通道（Channel）进行逐通道探测）。
- `openclaw health --json` : 向运行中的网关（Gateway）请求完整的健康快照（仅 WS；无直接 Baileys 套接字）。
- 在 WhatsApp/WebChat 中发送 `/status` 作为独立消息，可获取状态回复而不调用智能体（Agent）。
- 日志：查看 `/tmp/openclaw/openclaw-*.log` 并过滤 `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound`。

---

## 深度诊断

- 磁盘上的凭证：`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（修改时间应较近）。
- 会话（Session）存储：当前会话位于
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`；用
  `openclaw status` 或 `openclaw sessions --json` 查看计数和最近活动，不要直接查询或编辑数据库。
- 重新关联流程：当日志中出现状态码 409-515 或 `loggedOut` 时，执行 `openclaw channels logout && openclaw channels login --verbose`。（注意：QR 登录流程在配对后遇到状态 515 时会自动重启一次。）

---

## 故障处理

- `logged out` 或状态 409-515 → 使用 `openclaw channels logout` 然后 `openclaw channels login` 重新关联。
- 网关（Gateway）不可达 → 先看状态：`openclaw gateway status`；如果还没有安装后台服务，运行 `openclaw onboard --install-daemon`。
- 无入站消息 → 确认关联的手机在线且发送者被允许（`channels.whatsapp.allowFrom`）；对于群聊，确保白名单 + 提及规则匹配（`channels.whatsapp.groups`、`agents.entries.*.groupChat.mentionPatterns`）。

---

## 专用 "health" 命令

多 Agent 共用 SQLite 存储时，逐 Agent 的会话计数只包含该 Agent；status 汇总对每个物理存储只计一次。顶层 health 会话摘要对应默认 Agent，没有默认时取首个配置 Agent，不是全体 Agent 的总数。

`openclaw health --json` 向运行中的网关（Gateway）请求其健康快照（CLI 不直接连接通道（Channel）套接字）。它报告可用时的关联凭证/认证时效、逐通道探测摘要、会话（Session）存储摘要和探测耗时。如果网关（Gateway）不可达或探测失败/超时则以非零退出码退出。使用 `--timeout <ms>` 覆盖默认的 10 秒超时。
