---
title: Fly.io
sidebarTitle: "Fly.io"
description: 在 Fly.io 上部署 OpenClaw
---

# Fly.io 部署

**目标：** 在 [Fly.io](https://fly.io) 机器上运行 OpenClaw 网关（Gateway），具备持久化存储、自动 HTTPS 和 Discord/通道访问。

---

## 你需要什么

- 已安装 [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io 账户（免费套餐可用）
- 模型认证：Anthropic API 密钥（或其他提供商密钥）
- 通道凭据：Discord bot token、Telegram token 等

---

## 新手快速路径

1. 克隆仓库 → 自定义 `fly.toml`
2. 创建应用 + 卷 → 设置密钥
3. 使用 `fly deploy` 部署
4. 通过 SSH 进入创建配置或使用控制面板

---

## 1) 创建 Fly 应用

```bash
# 克隆仓库
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 创建新的 Fly 应用（选择你自己的名称）
fly apps create my-openclaw

# 创建持久化卷（1GB 通常足够）
fly volumes create openclaw_data --size 1 --region iad
```

**提示：** 选择离你近的区域。常见选项：`lhr`（伦敦）、`iad`（弗吉尼亚）、`sjc`（圣何塞）。

---

## 2) 配置 fly.toml

编辑 `fly.toml` 以匹配你的应用名称和需求。

**安全说明：** 默认配置会暴露公共 URL。要获得无公共 IP 的加固部署，请参见 [私有部署](#私有部署加固) 或使用 `fly.private.toml`。

```toml
app = "my-openclaw"  # 你的应用名称
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  OPENCLAW_PREFER_PNPM = "1"
  OPENCLAW_STATE_DIR = "/data"
  NODE_OPTIONS = "--max-old-space-size=1536"

[processes]
  app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[vm]]
  size = "shared-cpu-2x"
  memory = "2048mb"

[mounts]
  source = "openclaw_data"
  destination = "/data"
```

**关键设置：**

| 设置                           | 原因                                                                        |
| ------------------------------ | --------------------------------------------------------------------------- |
| `--bind lan`                   | 绑定到 `0.0.0.0` 以便 Fly 的代理可以访问网关                                  |
| `--allow-unconfigured`         | 无配置文件时也可启动（之后你会创建一个）                                        |
| `internal_port = 3000`         | 必须与 `--port 3000`（或 `OPENCLAW_GATEWAY_PORT`）匹配，用于 Fly 健康检查      |
| `memory = "2048mb"`            | 512MB 太小；推荐 2GB                                                         |
| `OPENCLAW_STATE_DIR = "/data"` | 在卷上持久化状态                                                              |

---

## 3) 设置密钥

```bash
# 必需：网关 Token（用于非回环绑定）
fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

# 模型提供商 API 密钥
fly secrets set ANTHROPIC_API_KEY=sk-ant-...

# 可选：其他提供商
fly secrets set OPENAI_API_KEY=sk-...
fly secrets set GOOGLE_API_KEY=...

# 通道 Token
fly secrets set DISCORD_BOT_TOKEN=MTQ...
```

**注意事项：**

- 非回环绑定（`--bind lan`）出于安全考虑需要 `OPENCLAW_GATEWAY_TOKEN`。
- 像对待密码一样对待这些 Token。
- **优先使用环境变量而非配置文件**存放所有 API 密钥和 Token。这可以防止密钥出现在 `openclaw.json` 中，避免意外暴露或被记录到日志。

---

## 4) 部署

```bash
fly deploy
```

首次部署会构建 Docker 镜像（约 2-3 分钟）。后续部署更快。

部署后验证：

```bash
fly status
fly logs
```

你应该看到：

```text
[gateway] listening on ws://0.0.0.0:3000 (PID xxx)
[discord] logged in to discord as xxx
```

---

## 5) 创建配置文件

通过 SSH 进入机器创建正式配置：

```bash
fly ssh console
```

创建配置目录和文件：

```bash
mkdir -p /data
cat > /data/openclaw.json << 'EOF'
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-opus-4-6",
        "fallbacks": ["anthropic/claude-sonnet-4-5", "openai/gpt-4o"]
      },
      "maxConcurrent": 4
    },
    "list": [
      {
        "id": "main",
        "default": true
      }
    ]
  },
  "auth": {
    "profiles": {
      "anthropic:default": { "mode": "token", "provider": "anthropic" },
      "openai:default": { "mode": "token", "provider": "openai" }
    }
  },
  "bindings": [
    {
      "agentId": "main",
      "match": { "channel": "discord" }
    }
  ],
  "channels": {
    "discord": {
      "enabled": true,
      "groupPolicy": "allowlist",
      "guilds": {
        "YOUR_GUILD_ID": {
          "channels": { "general": { "allow": true } },
          "requireMention": false
        }
      }
    }
  },
  "gateway": {
    "mode": "local",
    "bind": "auto"
  },
  "meta": {
    "lastTouchedVersion": "2026.1.29"
  }
}
EOF
```

**注意：** 使用 `OPENCLAW_STATE_DIR=/data` 时，配置路径为 `/data/openclaw.json`。

**注意：** Discord Token 可以来自以下任一方式：

- 环境变量：`DISCORD_BOT_TOKEN`（推荐用于保密信息）
- 配置文件：`channels.discord.token`

如果使用环境变量，无需在配置中添加 Token。网关会自动读取 `DISCORD_BOT_TOKEN`。

重启以应用：

```bash
exit
fly machine restart <machine-id>
```

---

## 6) 访问网关

### 控制面板

在浏览器中打开：

```bash
fly open
```

或访问 `https://my-openclaw.fly.dev/`

粘贴你的网关 Token（来自 `OPENCLAW_GATEWAY_TOKEN` 的那个）进行认证。

### 日志

```bash
fly logs              # 实时日志
fly logs --no-tail    # 近期日志
```

### SSH 控制台

```bash
fly ssh console
```

---

## 故障排除

### "App is not listening on expected address"

网关绑定到了 `127.0.0.1` 而不是 `0.0.0.0`。

**修复：** 在 `fly.toml` 的进程命令中添加 `--bind lan`。

### 健康检查失败 / 连接被拒绝

Fly 无法在配置的端口上访问网关。

**修复：** 确保 `internal_port` 与网关端口匹配（设置 `--port 3000` 或 `OPENCLAW_GATEWAY_PORT=3000`）。

### 内存不足（OOM）/ 内存问题

容器持续重启或被杀死。迹象：`SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration`，或无声重启。

**修复：** 在 `fly.toml` 中增加内存：

```toml
[[vm]]
  memory = "2048mb"
```

或更新现有机器：

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**注意：** 512MB 太小。1GB 可能可以工作，但在负载或详细日志记录时可能 OOM。**推荐 2GB。**

### 网关锁问题

网关拒绝启动并提示 "already running" 错误。

当容器重启但 PID 锁文件在卷上持久化时会发生这种情况。

**修复：** 删除锁文件：

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

锁文件位于 `/data/gateway.*.lock`（不在子目录中）。

### 配置未被读取

如果使用 `--allow-unconfigured`，网关会创建一个最小配置。重启后你在 `/data/openclaw.json` 的自定义配置应该会被读取。

验证配置是否存在：

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### 通过 SSH 写入配置

`fly ssh console -C` 命令不支持 shell 重定向。要写入配置文件：

```bash
# 使用 echo + tee（从本地传输到远程）
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# 或使用 sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**注意：** 如果文件已存在，`fly sftp` 可能会失败。先删除：

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 状态未持久化

如果重启后丢失凭据或会话，说明状态目录写入了容器文件系统。

**修复：** 确保在 `fly.toml` 中设置了 `OPENCLAW_STATE_DIR=/data` 并重新部署。

---

## 更新

```bash
# 拉取最新变更
git pull

# 重新部署
fly deploy

# 检查健康状态
fly status
fly logs
```

### 更新机器命令

如果你需要在不完全重新部署的情况下更改启动命令：

```bash
# 获取机器 ID
fly machines list

# 更新命令
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# 或同时增加内存
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**注意：** `fly deploy` 后，机器命令可能会重置为 `fly.toml` 中的内容。如果你做了手动更改，部署后需要重新应用。

---

## 私有部署（加固）

默认情况下，Fly 会分配公共 IP，使你的网关可以通过 `https://your-app.fly.dev` 访问。这很方便，但意味着你的部署可被互联网扫描器（Shodan、Censys 等）发现。

要获得**无公共暴露**的加固部署，使用私有模板。

### 何时使用私有部署

- 你只进行**出站**调用/消息（无入站 Webhook）
- 你使用 **ngrok 或 Tailscale** 隧道处理任何 Webhook 回调
- 你通过 **SSH、代理或 WireGuard** 访问网关，而非浏览器
- 你希望部署**对互联网扫描器不可见**

### 设置

使用 `fly.private.toml` 代替标准配置：

```bash
# 使用私有配置部署
fly deploy -c fly.private.toml
```

或转换现有部署：

```bash
# 列出当前 IP
fly ips list -a my-openclaw

# 释放公共 IP
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# 切换到私有配置，使未来的部署不会重新分配公共 IP
# （移除 [http_service] 或使用私有模板部署）
fly deploy -c fly.private.toml

# 分配仅限私有的 IPv6
fly ips allocate-v6 --private -a my-openclaw
```

之后，`fly ips list` 应该只显示 `private` 类型的 IP：

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### 访问私有部署

由于没有公共 URL，使用以下方法之一：

**方式 1：本地代理（最简单）**

```bash
# 将本地端口 3000 转发到应用
fly proxy 3000:3000 -a my-openclaw

# 然后在浏览器中打开 http://localhost:3000
```

**方式 2：WireGuard VPN**

```bash
# 创建 WireGuard 配置（一次性）
fly wireguard create

# 导入到 WireGuard 客户端，然后通过内部 IPv6 访问
# 示例：http://[fdaa:x:x:x:x::x]:3000
```

**方式 3：仅 SSH**

```bash
fly ssh console -a my-openclaw
```

### 私有部署中的 Webhook

如果你需要 Webhook 回调（Twilio、Telnyx 等）但不想公开暴露：

1. **ngrok 隧道** - 在容器内或作为 sidecar 运行 ngrok
2. **Tailscale Funnel** - 通过 Tailscale 暴露特定路径
3. **仅出站** - 部分提供商（Twilio）仅出站调用时无需 Webhook 也可正常工作

使用 ngrok 的语音通话配置示例：

```json
{
  "plugins": {
    "entries": {
      "voice-call": {
        "enabled": true,
        "config": {
          "provider": "twilio",
          "tunnel": { "provider": "ngrok" },
          "webhookSecurity": {
            "allowedHosts": ["example.ngrok.app"]
          }
        }
      }
    }
  }
}
```

ngrok 隧道在容器内运行，提供公共 Webhook URL 而不暴露 Fly 应用本身。设置 `webhookSecurity.allowedHosts` 为公共隧道主机名，以便接受转发的 host 头。

### 安全对比

| 方面              | 公共         | 私有        |
| ----------------- | ------------ | ----------- |
| 互联网扫描器       | 可发现       | 不可见      |
| 直接攻击          | 可能         | 已阻止      |
| 控制面板访问       | 浏览器       | 代理/VPN    |
| Webhook 投递      | 直接         | 通过隧道    |

---

## 注意事项

- Fly.io 使用 **x86 架构**（非 ARM）
- Dockerfile 兼容两种架构
- 对于 WhatsApp/Telegram 引导，使用 `fly ssh console`
- 持久化数据存储在 `/data` 卷上
- Signal 需要 Java + signal-cli；使用自定义镜像并保持内存在 2GB+。

---

## 费用

使用推荐配置（`shared-cpu-2x`，2GB RAM）：

- 根据使用情况约 $10-15/月
- 免费套餐包含一些额度

详情参见 [Fly.io 定价](https://fly.io/docs/about/pricing/)。
