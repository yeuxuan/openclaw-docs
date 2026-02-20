---
title: "Hetzner"
sidebarTitle: "Hetzner"
---

# 在 Hetzner 上部署 OpenClaw（Docker，生产 VPS 指南）

## 目标

在 Hetzner VPS 上使用 Docker 运行持久化的 OpenClaw 网关（Gateway），具备持久化状态、内置二进制文件和安全的重启行为。

如果你想要"OpenClaw 24/7 运行，每月约 $5"，这是最简单可靠的部署方案。
Hetzner 价格会有变化；选择最小的 Debian/Ubuntu VPS，如果遇到 OOM 再扩容。

## 我们在做什么（简单解释）？

- 租用一台小型 Linux 服务器（Hetzner VPS）
- 安装 Docker（隔离的应用运行时）
- 在 Docker 中启动 OpenClaw 网关
- 在主机上持久化 `~/.openclaw` + `~/.openclaw/workspace`（重启/重建后仍然保留）
- 通过 SSH 隧道从你的笔记本电脑访问控制面板

网关可以通过以下方式访问：

- 从你的笔记本电脑进行 SSH 端口转发
- 如果你自己管理防火墙和 Token，也可以直接暴露端口

本指南假设在 Hetzner 上使用 Ubuntu 或 Debian。
如果你使用其他 Linux VPS，请相应地调整软件包。
通用 Docker 流程请参见 [Docker](/install/docker)。

---

## 快速路径（有经验的运维人员）

1. 配置 Hetzner VPS
2. 安装 Docker
3. 克隆 OpenClaw 仓库
4. 创建持久化主机目录
5. 配置 `.env` 和 `docker-compose.yml`
6. 将所需二进制文件烘焙到镜像中
7. `docker compose up -d`
8. 验证持久化和网关访问

---

## 你需要什么

- 具有 root 访问权限的 Hetzner VPS
- 从你的笔记本电脑的 SSH 访问
- 基本的 SSH + 复制/粘贴操作能力
- 约 20 分钟
- Docker 和 Docker Compose
- 模型认证凭据
- 可选的提供商凭据
  - WhatsApp 二维码
  - Telegram bot token
  - Gmail OAuth

---

## 1) 配置 VPS

在 Hetzner 创建 Ubuntu 或 Debian VPS。

以 root 身份连接：

```bash
ssh root@YOUR_VPS_IP
```

本指南假设 VPS 是有状态的。
不要将其视为一次性基础设施。

---

## 2) 安装 Docker（在 VPS 上）

```bash
apt-get update
apt-get install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sh
```

验证：

```bash
docker --version
docker compose version
```

---

## 3) 克隆 OpenClaw 仓库

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

本指南假设你会构建自定义镜像以确保二进制文件的持久性。

---

## 4) 创建持久化主机目录

Docker 容器是临时性的。
所有长期存活的状态必须存储在主机上。

```bash
mkdir -p /root/.openclaw/workspace

# 将所有权设置为容器用户（uid 1000）：
chown -R 1000:1000 /root/.openclaw
```

---

## 5) 配置环境变量

在仓库根目录创建 `.env`。

```bash
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=change-me-now
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789

OPENCLAW_CONFIG_DIR=/root/.openclaw
OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

GOG_KEYRING_PASSWORD=change-me-now
XDG_CONFIG_HOME=/home/node/.openclaw
```

生成强密钥：

```bash
openssl rand -hex 32
```

**不要提交此文件。**

---

## 6) Docker Compose 配置

创建或更新 `docker-compose.yml`。

```yaml
services:
  openclaw-gateway:
    image: ${OPENCLAW_IMAGE}
    build: .
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - HOME=/home/node
      - NODE_ENV=production
      - TERM=xterm-256color
      - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
      - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
      - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
      - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
      - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
      - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
    volumes:
      - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
      - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
    ports:
      # 推荐：在 VPS 上保持网关仅绑定回环地址；通过 SSH 隧道访问。
      # 要公开暴露，移除 `127.0.0.1:` 前缀并相应配置防火墙。
      - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
    command:
      [
        "node",
        "dist/index.js",
        "gateway",
        "--bind",
        "${OPENCLAW_GATEWAY_BIND}",
        "--port",
        "${OPENCLAW_GATEWAY_PORT}",
        "--allow-unconfigured",
      ]
```

`--allow-unconfigured` 仅用于初始引导的便利性，它不能替代正确的网关配置。仍然需要设置认证（`gateway.auth.token` 或密码）并为你的部署使用安全的绑定设置。

---

## 7) 将所需二进制文件烘焙到镜像中（关键）

在运行中的容器内安装二进制文件是一个陷阱。
运行时安装的任何内容都会在重启后丢失。

所有技能所需的外部二进制文件必须在镜像构建时安装。

以下示例仅展示三个常用二进制文件：

- `gog` 用于 Gmail 访问
- `goplaces` 用于 Google Places
- `wacli` 用于 WhatsApp

这些只是示例，并非完整列表。
你可以使用相同的模式安装所需数量的二进制文件。

如果你之后添加的新技能依赖额外的二进制文件，你必须：

1. 更新 Dockerfile
2. 重建镜像
3. 重启容器

**示例 Dockerfile**

```dockerfile
FROM node:22-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# 示例二进制文件 1：Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# 示例二进制文件 2：Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# 示例二进制文件 3：WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# 使用相同模式在下方添加更多二进制文件

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

---

## 8) 构建并启动

```bash
docker compose build
docker compose up -d openclaw-gateway
```

验证二进制文件：

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

预期输出：

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

---

## 9) 验证网关

```bash
docker compose logs -f openclaw-gateway
```

成功标志：

```text
[gateway] listening on ws://0.0.0.0:18789
```

从你的笔记本电脑：

```bash
ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
```

打开：

`http://127.0.0.1:18789/`

粘贴你的网关 Token。

---

## 持久化存储位置（权威来源）

OpenClaw 运行在 Docker 中，但 Docker 不是权威来源。
所有长期存活的状态必须能在重启、重建和重启后保留。

| 组件                | 位置                              | 持久化机制            | 说明                             |
| ------------------- | --------------------------------- | ---------------------- | -------------------------------- |
| 网关配置            | `/home/node/.openclaw/`           | 主机卷挂载             | 包含 `openclaw.json`、Token 等   |
| 模型认证配置        | `/home/node/.openclaw/`           | 主机卷挂载             | OAuth Token、API 密钥            |
| 技能配置            | `/home/node/.openclaw/skills/`    | 主机卷挂载             | 技能级别状态                     |
| 智能体工作区        | `/home/node/.openclaw/workspace/` | 主机卷挂载             | 代码和智能体产物                 |
| WhatsApp 会话       | `/home/node/.openclaw/`           | 主机卷挂载             | 保留二维码登录状态               |
| Gmail 密钥环        | `/home/node/.openclaw/`           | 主机卷 + 密码          | 需要 `GOG_KEYRING_PASSWORD`      |
| 外部二进制文件      | `/usr/local/bin/`                 | Docker 镜像            | 必须在构建时烘焙                 |
| Node 运行时         | 容器文件系统                       | Docker 镜像            | 每次构建镜像时重建               |
| 操作系统包          | 容器文件系统                       | Docker 镜像            | 不要在运行时安装                 |
| Docker 容器         | 临时性                             | 可重启                 | 可安全销毁                       |

---

## 基础设施即代码（Terraform）

对于偏好基础设施即代码工作流的团队，社区维护的 Terraform 部署方案提供：

- 带远程状态管理的模块化 Terraform 配置
- 通过 cloud-init 自动配置
- 部署脚本（引导、部署、备份/恢复）
- 安全加固（防火墙、UFW、仅 SSH 访问）
- 用于网关访问的 SSH 隧道配置

**仓库：**

- 基础设施：[openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker 配置：[openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

此方法通过可重现的部署、版本控制的基础设施和自动化灾难恢复来补充上述 Docker 部署。

> **注意：** 由社区维护。如有问题或贡献，请查看上述仓库链接。
