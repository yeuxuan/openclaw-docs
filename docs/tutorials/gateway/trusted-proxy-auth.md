---
title: "可信代理认证"
sidebarTitle: "可信代理认证"
description: "OpenClaw Gateway：可信代理认证。> ⚠️ 安全敏感功能。此模式将认证完全委托给你的反向代理。配置错误可能使你的网关（Gateway）暴露于未授权访问。在启用前请仔细阅读本页。"
---

# 可信代理认证

> ⚠️ 安全敏感功能。此模式将认证完全委托给你的反向代理。配置错误可能使你的网关（Gateway）暴露于未授权访问。在启用前请仔细阅读本页。

---

## 何时使用

在以下情况使用 `trusted-proxy` 认证模式：

- 你在身份感知代理后运行 OpenClaw（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）
- 你的代理处理所有认证并通过头传递用户身份
- 你在 Kubernetes 或容器环境中，代理是到达网关（Gateway）的唯一路径
- 你遇到 WebSocket `1008 unauthorized` 错误，因为浏览器无法在 WS 载荷中传递 Token

---

## 何时不要使用

- 如果你的代理不认证用户（只是 TLS 终结器或负载均衡器）
- 如果有任何路径可以绕过代理到达网关（Gateway）（防火墙漏洞、内部网络访问）
- 如果你不确定你的代理是否正确剥离/覆盖转发头
- 如果你只需要个人单用户访问（考虑 Tailscale Serve + loopback 以获得更简单的设置）

---

## 工作原理

1. 你的反向代理认证用户（OAuth、OIDC、SAML 等）
2. 代理添加一个包含已认证用户身份的头（例如 `x-forwarded-user: nick@example.com`）
3. OpenClaw 检查请求是否来自可信代理 IP（在 `gateway.trustedProxies` 中配置）
4. OpenClaw 从配置的头中提取用户身份
5. 如果一切检查通过，请求被授权

---

## 配置

```json5
{
  gateway: {
    // 必须绑定到网络接口（非 loopback）
    bind: "lan",

    // 关键：仅在此添加你的代理 IP
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // 包含已认证用户身份的头（必需）
        userHeader: "x-forwarded-user",

        // 可选：必须存在的头（代理验证）
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // 可选：限制为特定用户（空 = 允许所有）
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

### 配置参考

| 字段                                         | 必需 | 描述                                                          |
| ------------------------------------------- | ---- | ------------------------------------------------------------ |
| `gateway.trustedProxies`                    | 是   | 要信任的代理 IP 地址数组。来自其他 IP 的请求被拒绝。              |
| `gateway.auth.mode`                         | 是   | 必须是 `"trusted-proxy"`                                      |
| `gateway.auth.trustedProxy.userHeader`      | 是   | 包含已认证用户身份的头名称                                       |
| `gateway.auth.trustedProxy.requiredHeaders` | 否   | 请求被信任所需存在的额外头                                       |
| `gateway.auth.trustedProxy.allowUsers`      | 否   | 用户身份白名单。空表示允许所有已认证用户。                         |

---

## 代理设置示例

### Pomerium

Pomerium 在 `x-pomerium-claim-email`（或其他声明头）中传递身份，在 `x-pomerium-jwt-assertion` 中传递 JWT。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Pomerium 的 IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

Pomerium 配置片段：

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### Caddy + OAuth

Caddy 配合 `caddy-security` 插件可以认证用户并传递身份头。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["127.0.0.1"], // Caddy 的 IP（如果在同一主机上）
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Caddyfile 片段：

```text
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

oauth2-proxy 认证用户并在 `x-auth-request-email` 中传递身份。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

nginx 配置片段：

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Traefik + Forward Auth

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // Traefik 容器 IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

---

## 安全检查清单

### Loopback 代理与向导

`openclaw configure --section gateway` 的 Trusted Proxy 设置会识别包含 loopback 的整个 CIDR，不仅检查网段起始地址。命中后会询问 `allowLoopback`，新配置默认拒绝；选择 No 会撤销原有允许值。不要用一个宽网段绕开本机身份伪造的风险。

### 单一操作者的独立信任边界

若一个 Gateway 只允许某个人使用，身份代理必须在转发任何 HTTP 请求或 WebSocket 升级之前拒绝其他人，包括插件和节点路由；Gateway 本身也应只对代理可达。`allowUsers` 仅对去空格后的身份头做精确比较，不验证 JWT，也不把邮箱变成不可变身份；`requiredHeaders` 只检查非空。

不要只改 `allowUsers` 就认为已撤销所有访问：已有连接、配对设备和 bootstrap 凭据另有认证路径，须显式撤销或断开。代理专用实例应省略 Gateway token/password 及其环境变量；独立网络代理保持 `allowLoopback: false`。Fleet 托管实例当前使用 token，不要覆盖其托管认证配置。

不同 workspace、模型筛选或同 OS 用户下的另一个 Gateway 进程不构成凭据/文件隔离。需要独立信任边界时，另行部署受隔离的实例；宿主机管理员始终受信任。

在启用可信代理认证之前，请验证：

- [ ] 代理是唯一路径：网关（Gateway）端口已通过防火墙屏蔽除你的代理以外的所有流量
- [ ] trustedProxies 最小化：仅包含你实际的代理 IP，不是整个子网
- [ ] 代理剥离头：你的代理覆盖（而非追加）来自客户端的 `x-forwarded-*` 头
- [ ] TLS 终结：你的代理处理 TLS；用户通过 HTTPS 连接
- [ ] 设置了 allowUsers（推荐）：限制为已知用户而非允许任何已认证用户

---

## 安全审计

`openclaw security audit` 会以严重级别标记可信代理认证。这是有意的，它提醒你正在将安全委托给代理设置。

审计检查：

- 缺少 `trustedProxies` 配置
- 缺少 `userHeader` 配置
- 空的 `allowUsers`（允许任何已认证用户）

---

## 故障排除

### "trusted_proxy_untrusted_source"

请求不是来自 `gateway.trustedProxies` 中的 IP。检查：

- 代理 IP 是否正确？（Docker 容器 IP 可能会变化）
- 代理前面是否有负载均衡器？
- 使用 `docker inspect` 或 `kubectl get pods -o wide` 查找实际 IP

### "trusted_proxy_user_missing"

用户头为空或缺失。检查：

- 你的代理是否配置为传递身份头？
- 头名称是否正确？（不区分大小写，但拼写很重要）
- 用户是否在代理处实际已认证？

### "trusted*proxy_missing_header*\*"

必需的头不存在。检查：

- 你的代理配置中是否包含那些特定的头
- 头是否在链路中某处被剥离

### "trusted_proxy_user_not_allowed"

用户已认证但不在 `allowUsers` 中。要么添加他们，要么移除白名单。

### WebSocket 仍然失败

确保你的代理：

- 支持 WebSocket 升级（`Upgrade: websocket`、`Connection: upgrade`）
- 在 WebSocket 升级请求上传递身份头（不仅仅是 HTTP）
- 没有为 WebSocket 连接设置单独的认证路径

---

## 从 Token 认证迁移

如果你正从 Token 认证迁移到可信代理：

1. 配置你的代理来认证用户并传递头
2. 独立测试代理设置（带头的 curl）
3. 更新 OpenClaw 配置为可信代理认证
4. 重启网关（Gateway）
5. 从 Control UI 测试 WebSocket 连接
6. 运行 `openclaw security audit` 并审查发现

---

## 相关

- [安全](/tutorials/gateway/security)：完整安全指南
- [配置](/tutorials/gateway/configuration)：配置参考
- [远程访问](/tutorials/gateway/remote)：其他远程访问模式
- [Tailscale](/tutorials/gateway/tailscale)：仅 tailnet 访问的更简单替代方案
