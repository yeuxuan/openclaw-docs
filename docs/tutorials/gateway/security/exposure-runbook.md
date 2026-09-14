---
title: "Gateway 对外暴露检查清单"
sidebarTitle: "暴露前检查"
description: "把 OpenClaw Gateway 开放到 LAN、tailnet、反向代理或公网前的预检、验证与回滚清单。"
---

# Gateway 对外暴露检查清单

::: danger 先确认四件事
只有当你能明确回答“谁能访问、如何认证、能触发哪个 Agent、这个 Agent 能调用哪些工具”时，才继续开放 Gateway。拿不准就回到 loopback，并重新运行安全审计。
:::

## 选择最窄的暴露方式

| 方式 | 适合场景 | 必要控制 |
|------|----------|----------|
| loopback + SSH 隧道 | 个人管理、排障 | 保持 `gateway.bind: "loopback"`，只转发 `127.0.0.1:18789` |
| loopback + Tailscale Serve | tailnet 内访问控制 UI | Gateway 仍保持 loopback；不要把 Tailscale 身份头误当成所有 HTTP 接口的认证 |
| LAN / tailnet bind | 设备明确的私网 | Gateway 认证、主机防火墙白名单、禁止公网端口转发 |
| 可信反向代理 | 组织 SSO / OIDC | 严格 `trustedProxies`、代理覆写身份头、显式允许用户、阻断直连 Gateway 端口 |
| 公网 | 极少数确有需要的部署 | 身份代理、TLS、限流、严格 allowlist、非 main 会话沙箱 |

不要把 `18789` 直接端口转发到公网。必须公网访问时，让身份感知代理成为到 Gateway 的唯一网络路径。

## 改配置前先留清单

- Gateway 主机、OS 用户和 state 目录。
- 当前 `gateway.bind`、URL 和端口。
- 认证模式以及 token、密码或可信代理身份来源。
- 所有启用的通道，以及 DM、群组、Webhook 的开放范围。
- 外部发送者可以触发的 Agent。
- 每个 Agent 的工具 profile、沙箱模式和 elevated 策略。
- Agent 可访问的外部凭据。
- `openclaw.json`、凭据和状态数据的备份位置。

多人能给同一个 Agent 发消息，代表多人共享这组委托工具权限；它不是按用户隔离的主机安全边界。

## 暴露前基线检查

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

先解决 critical。只接受你明确理解、并在部署记录里说明过的 warning。

显式探测远程 URL 时，认证也要显式传入：

```bash
openclaw gateway probe \
  --url ws://127.0.0.1:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

不要假设本机配置里的凭据会自动应用到显式远程 URL。

## 最小安全起点

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "replace-with-a-long-random-token",
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    defaults: {
      sandbox: { mode: "non-main" },
    },
  },
  tools: {
    profile: "messaging",
    exec: { mode: "deny" },
    elevated: { enabled: false },
  },
}
```

一次只放宽一个控制。例如先给某个通道增加明确 allowlist，再考虑开放写工具；不要同时把发送者、网络入口和工具权限都放开。

`tools.exec.mode: "deny"` 会连诊断命令一起禁止。确实需要低风险命令时，再按风险选择
`allowlist`、`ask` 或 `auto`，并先明确发送者、Agent、命令范围和审批边界。

## DM、群组和反向代理

通道侧：

- 优先 `dmPolicy: "pairing"` 或严格 `allowFrom`，不要默认 `open`。
- 不要把 `"*"` allowlist 与宽工具权限组合。
- 群组默认要求提及，除非房间成员和用途都严格受控。
- 多人私信时使用 `session.dmScope: "per-channel-peer"`；多账户通道用 `per-account-channel-peer`。
- 共享通道应路由到最小工具、没有个人凭据的 Agent。

可信反向代理侧：

- 代理必须先认证，再转发。
- 防火墙必须阻断客户端直接访问 Gateway 端口。
- `gateway.trustedProxies` 只列代理来源 IP。
- 代理必须删除或覆写客户端提交的身份与转发头。
- 多受众代理要配置 `gateway.auth.trustedProxy.allowUsers`。
- 改完代理后再次运行 `openclaw security audit --deep`。

## 每次改动后的验证

1. 重新运行 `openclaw security audit --deep`。
2. 确认授权连接成功。
3. 确认未授权发送者或浏览器会话被拒绝。
4. 确认日志已脱敏。
5. 确认 DM / 群组只到预期 Agent。
6. 确认高影响工具会询问审批或直接拒绝。
7. 记录仍然接受的 warning。

## 怀疑过度暴露时立即回滚

先停止公网转发、Tailscale Funnel 或反向代理路由，再把 Gateway 收回 loopback：

```json5
{
  gateway: { bind: "loopback" },
  tools: {
    exec: { mode: "deny" },
    elevated: { enabled: false },
  },
}
```

随后按顺序处理：

1. 暂停开放通道的 DM，移除 `"*"` 和异常 allowlist 条目。
2. 轮换 Gateway token、密码和可能受影响的集成凭据。
3. 审查近期审计日志、运行记录、工具调用和配置变化。
4. 再次运行 `openclaw security audit --deep`。
5. 只恢复真正需要的最窄入口。

继续阅读：[Gateway 安全说明](/tutorials/gateway/security)、[可信代理认证](/tutorials/gateway/trusted-proxy-auth)、[Gateway 限流](/tutorials/gateway/security/rate-limiting)、[沙箱与工具策略](/tutorials/gateway/sandbox-vs-tool-policy-vs-elevated)。
