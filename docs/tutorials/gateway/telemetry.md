---
title: "使用统计与更新检查"
sidebarTitle: "Telemetry"
description: "说明 OpenClaw 默认发送什么、匿名功能统计如何选择加入，以及如何关闭所有自动更新请求。"
---

# 使用统计与更新检查

OpenClaw 默认自动发送的只有每日更新检查：版本、操作系统和 CPU 架构。匿名功能
统计默认关闭，只有你显式开启后，才会随同一次更新检查发送。

查看当前状态和实际载荷：

```bash
openclaw telemetry show
openclaw telemetry show --json
```

CLI 与实际发送端使用同一个 payload builder，因此这里显示的就是当时会发送的
数据，而不是另一份近似说明。

## 匿名功能统计包含什么

启用后可包含已配置的官方通道、Provider 和目录中公开插件的名称，以及启用数量、
最近 24 小时会话数量等汇总。私有插件只计数，不发送名称。

不会收集：

- 消息、Prompt 或模型名称
- API Key、凭据与 SecretRef
- 文件路径、主机名、账号或用户标识
- 安装 ID、机器 ID 或随机 UUID

报告没有持久标识，因此 OpenClaw 不会把今天和明天的请求关联为同一台机器。

## 开启或关闭匿名统计

```bash
openclaw telemetry on
openclaw telemetry off
```

等价配置：

```json5
{
  telemetry: {
    enabled: false,
  },
}
```

`DO_NOT_TRACK=1` 会强制关闭匿名功能统计，但仍保留只读的每日更新检查。

## 完全关闭自动请求

```json5
{
  update: {
    checkOnStart: false,
  },
}
```

这会停止自动更新检查、匿名功能统计和更新提示，即使
`update.auto.enabled` 为 `true`。`OPENCLAW_NO_AUTO_UPDATE=1` 也会阻止自动
检查与自动应用；手动执行更新命令不受影响。

CI 环境默认不发送更新检查或功能统计。Telemetry 与你主动配置的
[OpenTelemetry 导出](/tutorials/gateway/opentelemetry)是两套不同功能。
