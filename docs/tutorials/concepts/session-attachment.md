---
title: "会话同步与附加"
sidebarTitle: "会话同步与附加"
description: "理解控制 UI、TUI、移动端与编码 Harness 如何继续同一个 Gateway 会话。"
---

# 会话同步与附加

会话的权威状态在 Gateway。控制 UI、移动客户端、`openclaw tui`、`openclaw resume` 和 `openclaw attach` 都是在查看或操作同一份 Gateway 会话，而不是各自保存一份聊天副本。

## 该用哪个命令

- 想在终端继续聊天：`openclaw resume` 或 `openclaw tui <target>`。
- 想让编码 Harness 加入现有会话：`openclaw attach <target>`。
- `openclaw tui --local`、`openclaw chat`、`openclaw terminal` 属于本地嵌入模式，不能接收 Gateway 会话目标。

```bash
openclaw resume agent:main:deploy-monitor
openclaw tui https://claw.example.com/dashboard/main/deploy-monitor-6db92d48
openclaw attach deploy-monitor-6db92d48
```

`attach` 会先让 Gateway 解析会话，再签发临时、仅限该会话的 MCP 授权；Token 通过子进程环境传递，不放在命令行参数中。

## 安全边界

会话 URL 不应携带凭据。第一次连接某个 Gateway Origin 时，用 `--token` 或 `--password` 完成认证，并在控制 UI 的 Devices 页面批准设备。设备 Token 只属于精确 Origin，不会自动跨域复用。

控制 UI 复制的 `--handoff` 参数同样不含凭据；终端必须已经配置或配对对应 Gateway。会话被删除、短 ID 冲突或 Gateway 太旧时，复制完整会话 key，或从控制 UI 重新生成命令。

上游来源：[`docs/concepts/session-attachment.md`](https://github.com/openclaw/openclaw/blob/main/docs/concepts/session-attachment.md)。
