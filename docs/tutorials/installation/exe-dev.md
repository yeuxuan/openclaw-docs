---
title: "exe.dev"
sidebarTitle: "exe.dev"
---

# exe.dev

目标：在 exe.dev 虚拟机上运行 OpenClaw 网关（Gateway），从你的笔记本电脑通过以下地址访问：`https://<vm-name>.exe.xyz`

本页面假设使用 exe.dev 默认的 **exeuntu** 镜像。如果你选择了其他发行版，请相应地调整软件包。

---

## 新手快速路径

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. 根据需要填入你的认证密钥/Token
3. 点击虚拟机旁边的 "Agent"，然后等待...
4. ???
5. 完成

---

## 你需要什么

- exe.dev 账户
- 对 [exe.dev](https://exe.dev) 虚拟机的 `ssh exe.dev` 访问权限（可选）

---

## 使用 Shelley 自动安装

Shelley 是 [exe.dev](https://exe.dev) 的智能体（Agent），可以使用我们的提示词即时安装 OpenClaw。使用的提示词如下：

```text
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw device approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

---

## 手动安装

---

## 1) 创建虚拟机

在你的设备上：

```bash
ssh exe.dev new
```

然后连接：

```bash
ssh <vm-name>.exe.xyz
```

提示：保持此虚拟机为**有状态的**。OpenClaw 将状态存储在 `~/.openclaw/` 和 `~/.openclaw/workspace/` 下。

---

## 2) 安装前置依赖（在虚拟机上）

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

---

## 3) 安装 OpenClaw

运行 OpenClaw 安装脚本：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

---

## 4) 设置 nginx 将 OpenClaw 代理到端口 8000

编辑 `/etc/nginx/sites-enabled/default`，内容如下：

```text
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

---

## 5) 访问 OpenClaw 并授予权限

访问 `https://<vm-name>.exe.xyz/`（查看引导过程中控制面板的输出）。如果提示认证，请粘贴
虚拟机上 `gateway.auth.token` 中的 Token（通过 `openclaw config get gateway.auth.token` 获取，
或使用 `openclaw doctor --generate-gateway-token` 生成）。使用 `openclaw devices list` 和
`openclaw devices approve <requestId>` 批准设备。如有疑问，可以从浏览器使用 Shelley！

---

## 远程访问

远程访问由 [exe.dev](https://exe.dev) 的认证机制处理。
默认情况下，端口 8000 的 HTTP 流量通过邮箱认证转发到 `https://<vm-name>.exe.xyz`。

---

## 更新

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

指南：[更新](/install/updating)
