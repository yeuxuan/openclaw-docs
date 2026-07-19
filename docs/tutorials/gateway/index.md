---
title: "网关（Gateway）使用指南"
sidebarTitle: "网关"
---

# 网关（Gateway）::OpenClaw 的总服务台

如果只能记住一个概念，请记住 Gateway。

Gateway 是 OpenClaw 的常驻进程。它负责接收消息、管理通道、连接控制 UI、连接节点、调用 Agent，并把结果发回去。

---

## 用一句人话解释

把 OpenClaw 想成一家服务中心：

- Gateway 是前台。
- Control UI 是前台的电脑屏幕。
- Telegram、WhatsApp、Discord 是不同入口。
- Agent 是处理问题的人。
- Node 是可以被前台联系的外部设备。

前台关门了，所有入口都会受影响。

## 新手只要先记 3 件事

1. Gateway 要开着。
   它停了，OpenClaw 就像没人接电话。

2. 先用 `openclaw dashboard` 测试。
   浏览器能聊通，再去接 Telegram、WhatsApp。

3. 远程访问先别急。
   默认只让本机访问是为了安全。想让手机或外网访问时，先看 Tailscale、VPN 或认证配置。

---

## 快速检查 Gateway 是否在运行

```bash
openclaw gateway status
```

常见结果：

| 结果 | 意思 |
|------|------|
| `running` | Gateway 正在运行 |
| `stopped` | Gateway 没启动 |
| 连接失败 | 多半是 Gateway 没起来，或端口/认证配置不对 |

不确定问题在哪里时，先跑：

```bash
openclaw doctor
```

---

## 日常推荐启动方式

第一次设置时推荐运行：

```bash
openclaw onboard --install-daemon
```

它会把 Gateway 安装成后台服务。之后你通常不用手动启动。

日常常用命令：

```bash
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

如果你现在在做运维、托管或故障留痕，也可以继续看：

- [Gateway 审计总览](/tutorials/gateway/audit)
- [多租户托管](/tutorials/gateway/multi-tenant-hosting)
- [重启恢复](/tutorials/gateway/restart-recovery)

---

## 临时手动启动

排查问题时，可以让 Gateway 在当前终端前台运行：

```bash
openclaw gateway --port 18789 --verbose
```

这样日志会直接显示在终端里。关掉这个终端，Gateway 也会停止。

---

## Gateway 默认地址

默认本地地址是：

```text
http://127.0.0.1:18789/
```

这里有两层含义：

1. `127.0.0.1` 表示只给本机访问。
2. `18789` 是 Gateway 默认端口。

打开控制 UI 的推荐命令是：

```bash
openclaw dashboard
```

---

## Gateway 负责哪些事情

| 事情 | 人话解释 |
|------|----------|
| 长连接通信 | 让控制 UI、命令行、手机节点能一直和 Gateway 保持联系 |
| 网页服务 | 打开浏览器控制面板，也接收一些外部请求 |
| 通道管理 | 连接 Telegram、WhatsApp、Discord 等聊天软件 |
| Agent 调度 | 把消息交给 AI 助手，并把回复一段段拿回来 |
| 会话管理 | 记住每个聊天的上下文，避免把 A 的话回给 B |
| 节点管理 | 管理 iOS、Android、macOS、远程机器等外接设备 |
| 安全认证 | 检查 token、密码、Tailscale、可信代理和配对关系 |
| 状态通知 | 把在线状态、回复进度、健康信息推给客户端 |
| 外部集成 | 给脚本、CI、仪表盘、IDE 扩展暴露协议和 RPC 接口 |

这些事情看起来多，但你日常只需要知道：Gateway 是总服务台，所有入口都先找它。

---

## 远程访问要小心

不要直接把 `18789` 暴露到公网。

这句话很重要。
`18789` 后面连着你的控制 UI、会话和工具能力。把它不加保护地放到公网，就像把家门钥匙挂在门口。

推荐远程方式：

1. Tailscale 或 VPN。
2. SSH 隧道。
3. 可信反向代理，并明确配置认证和 allowed origins。

最简单的 SSH 隧道例子：

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

然后在本地打开：

```text
http://127.0.0.1:18789/
```

---

## 常见问题

::: details 端口 18789 被占用怎么办？

先确认是不是已有 Gateway 在运行：

```bash
openclaw gateway status
```

如果只是测试，可以换端口：

```bash
openclaw gateway --port 18790
```

:::

::: details Gateway 在运行，但控制 UI 打不开？

按顺序检查：

1. `openclaw gateway status`
2. `openclaw dashboard`
3. `openclaw logs --follow`
4. 是否改过 `gateway.controlUi.enabled`
5. 是否用了非本机访问但没有配置认证或 allowed origins

:::

::: details Gateway 在运行，但聊天软件没有回复？

先检查通道：

```bash
openclaw channels status --probe
```

再检查是否有配对请求：

```bash
openclaw pairing list
```

:::

---

## 常用命令速查

| 命令 | 作用 |
|------|------|
| `openclaw gateway status` | 查看 Gateway 状态 |
| `openclaw gateway restart` | 重启 Gateway |
| `openclaw gateway stop` | 停止 Gateway |
| `openclaw dashboard` | 打开浏览器控制 UI |
| `openclaw doctor` | 自动诊断问题 |
| `openclaw logs --follow` | 查看实时日志 |
| `openclaw channels status --probe` | 检查通道连接 |

---

## 继续阅读

- 想让脚本、CI 或仪表盘接 OpenClaw：看 [外部应用接入 Gateway](/tutorials/gateway/external-apps)

- [Web 控制 UI](/tutorials/web/)
- [节点入门](/tutorials/nodes/)
- [认证与远程访问](/tutorials/gateway/authentication)
- [Gateway 安全说明](/tutorials/gateway/security)
- [Agent 配置](/tutorials/gateway/config-agents)
- [Channel 配置](/tutorials/gateway/config-channels)
- [Tools 配置](/tutorials/gateway/config-tools)
- [密钥与 SecretRef](/tutorials/gateway/secrets)
- [Secrets Apply Plan](/tutorials/gateway/secrets-plan-contract)
- [Operator 权限范围](/tutorials/gateway/operator-scopes)
- [OpenShell](/tutorials/gateway/openshell)
- [Gateway 诊断包](/tutorials/gateway/diagnostics)
- [Prometheus 指标](/tutorials/gateway/prometheus)
- [OpenTelemetry 可观测性](/tutorials/gateway/opentelemetry)
- [Tailscale 远程访问](/tutorials/gateway/tailscale)
