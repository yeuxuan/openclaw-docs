---
title: "openclaw resume"
sidebarTitle: "继续会话"
description: "从终端 TUI 继续 Gateway 上已有的 OpenClaw 会话。"
---

# `openclaw resume`

`resume` 不复制会话，也不会新建会话；它选择 Gateway 上已有的会话并打开 TUI。

```bash
openclaw resume
openclaw resume <查询词>
openclaw resume agent:main:bugfix
```

不带查询词时，会列出最近 7 天最多 50 个会话。查询时优先匹配完整 key，其次要求显示名、标签或 key 的模糊结果唯一；命中多个候选时会退出并让你选更精确的值。

## 从控制 UI 继续

在会话标题菜单选择“Continue in terminal…”，复制：

```bash
openclaw resume --handoff <payload>
```

`payload` 只包含会话 key 与 Gateway WebSocket URL，不含 Token、密码或设备凭据。终端仍要独立完成该 Gateway 的认证和设备配对。不要手改或复用被截断的 payload，失效时回控制 UI 重新复制。

## 远程 Gateway

```bash
openclaw resume bugfix \
  --url wss://gateway.example.com \
  --token <token>
```

还支持 `--password` 与 `--tls-fingerprint`。`resume` 不会自动启动 Gateway；连接失败时先修复 Gateway 或网络路径，再重试。

上游来源：[`docs/cli/resume.md`](https://github.com/openclaw/openclaw/blob/main/docs/cli/resume.md)。
