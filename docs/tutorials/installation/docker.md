---
title: "Docker"
sidebarTitle: "Docker"
description: "OpenClaw 安装部署：Docker（可选）。Docker 是可选的。仅当你需要容器化网关（Gateway）或验证 Docker 流程时才使用它。"
---

# Docker（可选）

Docker 是可选的。仅当你需要容器化网关（Gateway）或验证 Docker 流程时才使用它。

---

## 先说结论

如果你只是想在自己的电脑上把 OpenClaw 跑起来，请先回到[安装总览](/tutorials/installation/)用一键脚本。
Docker 不是新手必选项。

Docker 更像给 OpenClaw 准备一个独立盒子：
盒子里运行 OpenClaw，盒子外是你的电脑。这样更容易搬走、重建、隔离，但也多了一层 Docker 的学习成本。

---

## Docker 适合我吗？

| 情况 | 建议 |
|------|------|
| 我只想最快用起来 | 不用 Docker，走一键安装脚本 |
| 我想在 VPS 或服务器上长期跑 | 可以考虑 Docker |
| 我想随时删掉重建环境 | Docker 合适 |
| 我不懂 Docker 是什么 | 先别用 Docker |
| 我只是想开沙箱 | 不需要把整个 Gateway 放进 Docker |

沙箱说明：智能体沙箱也使用 Docker，但它不要求整个网关在 Docker 中运行。参见 [沙箱](/tutorials/gateway/sandboxing)。

本指南涵盖：

- 容器化网关（完整的 OpenClaw 运行在 Docker 中）
- 按会话（Session）的智能体沙箱（主机网关 + Docker 隔离的智能体工具）

沙箱详情：[沙箱](/tutorials/gateway/sandboxing)

---

## 系统要求

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 足够的磁盘空间用于镜像和日志

---

## 容器化网关（Docker Compose）

### 快速开始（推荐）

从仓库根目录：

```bash
./docker-setup.sh
```

此脚本：

- 构建网关镜像
- 运行引导向导
- 输出可选的提供商设置提示
- 通过 Docker Compose 启动网关
- 生成网关 Token 并写入 `.env`

跑完以后，不要急着改 compose 文件。
先打开控制面板，确认 Gateway 能正常访问。

可选环境变量：

- `OPENCLAW_DOCKER_APT_PACKAGES`：构建时安装额外的 apt 包
- `OPENCLAW_EXTRA_MOUNTS`：添加额外的主机绑定挂载
- `OPENCLAW_HOME_VOLUME`：使用命名卷持久化 `/home/node`
- `OPENCLAW_GATEWAY_PORT`：宿主机映射端口，默认 `18789`；两个容器内部仍使用 `18789`

修改 `.env` 或 Compose 环境变量后，运行 `docker compose up -d openclaw-gateway` 重新创建容器；`docker compose restart` 不会应用新的环境变量。

完成后：

- 在浏览器中打开 `http://127.0.0.1:18789/`。
- 将 Token 粘贴到控制面板（Settings > token）。
- 需要再次获取 URL？运行 `docker compose run --rm openclaw-cli dashboard --no-open`。

如果设置了自定义 `OPENCLAW_GATEWAY_PORT`，将打印 URL 中的 `18789` 换成宿主机端口，其他部分保持原样。容器内命令只知道内部端口。

Token 可以理解成“控制面板门钥匙”。看到 unauthorized 时，通常不是坏了，而是还没把钥匙填进去或设备还没批准。

配置和工作区（Workspace）写入主机：

- `~/.openclaw/`
- `~/.openclaw/workspace`

在 VPS 上运行？参见 [Hetzner（Docker VPS）](/tutorials/installation/hetzner)。

### 从 ClawDock 迁移

上游已移除 ClawDock，日常管理请直接使用 Docker Compose。已有下载副本不会自动卸载；从 `~/.zshrc` 或 `~/.bashrc` 中移除加载 `clawdock-helpers.sh` 的 `source` 行，再打开新终端。旧路径可能在 `~/.clawdock/`、`scripts/clawdock/` 或 `scripts/shell-helpers/`。

保留 OpenClaw 状态、凭据、工作区、项目 `.env` 和 volumes，不需要重装或清空数据。

| 操作 | 命令 |
|------|------|
| 启动 | `docker compose up -d openclaw-gateway` |
| 重启（不修改环境） | `docker compose restart openclaw-gateway` |
| 查看容器 | `docker compose ps` |
| 跟随日志 | `docker compose logs -f openclaw-gateway` |
| 获取面板 URL | `docker compose run --rm openclaw-cli dashboard --no-open` |
| 列出设备 | `docker compose run --rm openclaw-cli devices list` |
| 批准设备 | `docker compose run --rm openclaw-cli devices approve <requestId>` |

在 `docker-compose.yml` 所在目录运行，先启动 Gateway 再使用 CLI。每次命令必须使用相同顺序的 Compose 文件；默认自动发现 `docker-compose.override.yml`，但 extra/sandbox 文件需要显式 `-f`。用了 `-f` 时，把原来使用的 override 也一起列入，不要遗漏挂载和设置。

需要完整 Control UI token 时，私下读取项目 `.env` 中的 `OPENCLAW_GATEWAY_TOKEN`；`config get` 会脱敏，不能用来取回完整 token。旧命令对照见 [ClawDock 迁移页](/tutorials/installation/clawdock)。

### 手动流程（compose）

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm openclaw-cli onboard
docker compose up -d openclaw-gateway
```

注意：从仓库根目录运行 `docker compose ...`。如果你启用了
`OPENCLAW_EXTRA_MOUNTS` 或 `OPENCLAW_HOME_VOLUME`，设置脚本会写入
`docker-compose.extra.yml`；在其他地方运行 Compose 时需要包含它：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml <command>
```

### 控制面板 Token + 配对（Docker）

如果你看到 "unauthorized" 或 "disconnected (1008): pairing required"，获取新的面板链接并批准浏览器设备：

```bash
docker compose run --rm openclaw-cli dashboard --no-open
docker compose run --rm openclaw-cli devices list
docker compose run --rm openclaw-cli devices approve <requestId>
```

更多详情：[面板](/tutorials/web/)、[设备](/tutorials/nodes/)。

### 额外挂载（可选）

如果你想将额外的主机目录挂载到容器中，在运行 `docker-setup.sh` 之前设置
`OPENCLAW_EXTRA_MOUNTS`。它接受逗号分隔的 Docker 绑定挂载列表，并通过生成
`docker-compose.extra.yml` 应用到 `openclaw-gateway` 和 `openclaw-cli`。

挂载就是把你电脑上的某个文件夹“递给”容器。
只读挂载 `:ro` 更安全；读写挂载 `:rw` 更方便，但容器里的程序也能改这些文件。

示例：

```bash
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

注意事项：

- 路径必须在 macOS/Windows 上与 Docker Desktop 共享。
- 如果你编辑了 `OPENCLAW_EXTRA_MOUNTS`，重新运行 `docker-setup.sh` 以重新生成额外的 compose 文件。
- `docker-compose.extra.yml` 是自动生成的，不要手动编辑。

### 持久化整个容器 home 目录（可选）

如果你想让 `/home/node` 在容器重建后仍然持久化，通过 `OPENCLAW_HOME_VOLUME` 设置一个命名卷。
这会创建一个 Docker 卷并挂载到 `/home/node`，同时保留标准的配置/工作区绑定挂载。
这里请使用命名卷（非绑定路径）；绑定挂载请使用 `OPENCLAW_EXTRA_MOUNTS`。

示例：

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
./docker-setup.sh
```

你可以将其与额外挂载组合使用：

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

注意事项：

- 如果你更改了 `OPENCLAW_HOME_VOLUME`，重新运行 `docker-setup.sh` 以重新生成额外的 compose 文件。
- 命名卷在使用 `docker volume rm <name>` 删除之前会一直存在。

### 安装额外的 apt 包（可选）

如果你需要在镜像内安装系统包（例如构建工具或媒体库），在运行 `docker-setup.sh`
之前设置 `OPENCLAW_DOCKER_APT_PACKAGES`。这会在镜像构建期间安装这些包，
因此即使容器被删除也会保留。

示例：

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="ffmpeg build-essential"
./docker-setup.sh
```

注意事项：

- 接受以空格分隔的 apt 包名列表。
- 如果你更改了 `OPENCLAW_DOCKER_APT_PACKAGES`，重新运行 `docker-setup.sh` 以重建镜像。

### 高级用户 / 全功能容器（可选启用）

默认 Docker 镜像以安全为优先，以非 root 的 `node` 用户运行。这减小了攻击面，但意味着：

- 运行时无法安装系统包
- 默认不含 Homebrew
- 不包含 Chromium/Playwright 浏览器

如果你想要一个功能更完整的容器，使用以下可选开关：

1. 持久化 `/home/node` 以保留浏览器下载和工具缓存：

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
./docker-setup.sh
```

2. 将系统依赖烘焙到镜像中（可重复且持久）：

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"
./docker-setup.sh
```

3. 不使用 `npx` 安装 Playwright 浏览器（避免 npm 覆盖冲突）：

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

如果你需要 Playwright 安装系统依赖，请使用 `OPENCLAW_DOCKER_APT_PACKAGES` 重建镜像，而不是在运行时使用 `--with-deps`。

4. 持久化 Playwright 浏览器下载：

- 在 `docker-compose.yml` 中设置 `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright`。
- 通过 `OPENCLAW_HOME_VOLUME` 确保 `/home/node` 持久化，或通过 `OPENCLAW_EXTRA_MOUNTS` 挂载 `/home/node/.cache/ms-playwright`。

### 权限 + EACCES

镜像以 `node`（uid 1000）用户运行。如果你在 `/home/node/.openclaw` 上看到权限错误，确保你的主机绑定挂载的所有者是 uid 1000。

`EACCES` 基本可以先理解成“没有权限碰这个文件”。
遇到它时，先检查挂载目录的所有者和权限。

示例（Linux 主机）：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

如果你选择以 root 运行以求方便，你需要接受安全上的妥协。

### 加速重建（推荐）

为了加速重建，调整你的 Dockerfile 使依赖层被缓存。
这样除非锁文件发生变化，否则不会重新运行 `pnpm install`：

```dockerfile
FROM node:22-bookworm

# 安装 Bun（构建脚本需要）
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

# 除非包元数据变化，否则缓存依赖
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

### 通道设置（可选）

使用 CLI 容器配置通道（Channel），然后根据需要重启网关。

WhatsApp（二维码）：

```bash
docker compose run --rm openclaw-cli channels login
```

Telegram（bot token）：

```bash
docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"
```

Discord（bot token）：

```bash
docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
```

文档：[WhatsApp](/tutorials/channels/whatsapp)、[Telegram](/tutorials/channels/telegram)、[Discord](/tutorials/channels/discord)

### OpenAI Codex OAuth（无头 Docker）

如果你在向导中选择了 OpenAI Codex OAuth，它会打开一个浏览器 URL 并尝试在
`http://127.0.0.1:1455/auth/callback` 上捕获回调。在 Docker 或无头环境中，
该回调可能会显示浏览器错误。复制你到达的完整重定向 URL，并将其粘贴回向导以完成认证。

### 健康检查

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### E2E 冒烟测试（Docker）

```bash
scripts/e2e/onboard-docker.sh
```

### 二维码导入冒烟测试（Docker）

```bash
pnpm test:docker:qr
```

### 注意事项

- 网关绑定默认为 `lan` 以供容器使用。
- Dockerfile CMD 使用 `--allow-unconfigured`；已挂载的配置中如果 `gateway.mode` 不是 `local` 仍会启动。覆盖 CMD 以强制执行检查。
- 网关容器是会话（Session）的权威来源（`~/.openclaw/agents/<agentId>/sessions/`）。

---

## 智能体沙箱（主机网关 + Docker 工具）

深入了解：[沙箱](/tutorials/gateway/sandboxing)

### 功能说明

当 `agents.defaults.sandbox` 启用时，非主会话在 Docker 容器内运行工具。
网关保留在主机上，但工具执行是隔离的：

- 作用域：默认为 `"agent"`（每个智能体一个容器 + 工作区）
- 作用域：`"session"` 表示按会话隔离
- 按作用域的工作区文件夹挂载到 `/workspace`
- 可选的智能体工作区访问（`agents.defaults.sandbox.workspaceAccess`）
- 允许/拒绝工具策略（拒绝优先）
- 入站媒体被复制到活动沙箱工作区（`media/inbound/*`），以便工具可以读取（使用 `workspaceAccess: "rw"` 时，这会落在智能体工作区中）

警告：`scope: "shared"` 会禁用跨会话隔离。所有会话共享一个容器和一个工作区。

### 按智能体的沙箱配置（多智能体）

如果你使用多智能体路由，每个智能体可以覆盖沙箱和工具设置：
`agents.entries.*.sandbox` 和 `agents.entries.*.tools`（加上 `agents.entries.*.tools.sandbox.tools`）。
这让你可以在一个网关中运行不同的访问级别：

- 完全访问（个人智能体）
- 只读工具 + 只读工作区（家庭/工作智能体）
- 无文件系统/shell 工具（公开智能体）

参见 [多智能体沙箱与工具](/tutorials/tools/multi-agent-sandbox-tools) 了解示例、优先级和故障排除。

### 默认行为

- 镜像：`openclaw-sandbox:bookworm-slim`
- 每个智能体一个容器
- 智能体工作区访问：`workspaceAccess: "none"`（默认）使用 `~/.openclaw/sandboxes`
  - `"ro"` 将沙箱工作区保持在 `/workspace`，并以只读方式挂载智能体工作区到 `/agent`（禁用 `write`/`edit`/`apply_patch`）
  - `"rw"` 以读写方式挂载智能体工作区到 `/workspace`
- 自动清理：空闲 > 24 小时 或 存在时间 > 7 天
- 网络：默认为 `none`（如需出站访问请显式开启）
- 默认允许：`exec`、`process`、`read`、`write`、`edit`、`sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status`
- 默认拒绝：`browser`、`canvas`、`nodes`、`cron`、`discord`、`gateway`

### 启用沙箱

如果你计划在 `setupCommand` 中安装包，请注意：

- 默认 `docker.network` 为 `"none"`（无出站访问）。
- `readOnlyRoot: true` 会阻止包安装。
- `user` 必须是 root 才能执行 `apt-get`（省略 `user` 或设置 `user: "0:0"`）。
  当 `setupCommand`（或 docker 配置）发生变化时，OpenClaw 会自动重建容器，
  除非容器最近被使用过（约 5 分钟内）。活跃容器会记录一条警告，并附带确切的 `openclaw sandbox recreate ...` 命令。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared (agent is default)
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
        },
        prune: {
          idleHours: 24, // 0 禁用空闲清理
          maxAgeDays: 7, // 0 禁用最大存活时间清理
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

安全加固选项位于 `agents.defaults.sandbox.docker` 下：
`network`、`user`、`pidsLimit`、`memory`、`memorySwap`、`cpus`、`ulimits`、
`seccompProfile`、`apparmorProfile`、`dns`、`extraHosts`。

多智能体：通过 `agents.entries.*.sandbox.{docker,browser,prune}.*` 按智能体覆盖 `agents.defaults.sandbox.{docker,browser,prune}.*`
（当 `agents.defaults.sandbox.scope` / `agents.entries.*.sandbox.scope` 为 `"shared"` 时忽略）。

### 构建默认沙箱镜像

```bash
scripts/sandbox-setup.sh
```

这会使用 `Dockerfile.sandbox` 构建 `openclaw-sandbox:bookworm-slim`。

### 沙箱通用镜像（可选）

如果你想要一个包含常用构建工具（Node、Go、Rust 等）的沙箱镜像，构建通用镜像：

```bash
scripts/sandbox-common-setup.sh
```

这会构建 `openclaw-sandbox-common:bookworm-slim`。使用方法：

```json5
{
  agents: {
    defaults: {
      sandbox: { docker: { image: "openclaw-sandbox-common:bookworm-slim" } },
    },
  },
}
```

### 沙箱浏览器镜像

要在沙箱内运行浏览器工具，构建浏览器镜像：

```bash
scripts/sandbox-browser-setup.sh
```

这会使用 `Dockerfile.sandbox-browser` 构建 `openclaw-sandbox-browser:bookworm-slim`。
容器运行启用了 CDP 的 Chromium 和一个可选的 noVNC 观察器（通过 Xvfb 实现有头模式）。

注意事项：

- 有头模式（Xvfb）比无头模式更能减少机器人检测。
- 无头模式仍可通过设置 `agents.defaults.sandbox.browser.headless=true` 使用。
- 不需要完整的桌面环境（GNOME）；Xvfb 提供显示。

使用配置：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        browser: { enabled: true },
      },
    },
  },
}
```

自定义浏览器镜像：

```json5
{
  agents: {
    defaults: {
      sandbox: { browser: { image: "my-openclaw-browser" } },
    },
  },
}
```

启用后，智能体将获得：

- 一个沙箱浏览器控制 URL（用于 `browser` 工具）
- 一个 noVNC URL（如果已启用且 headless=false）

请记住：如果你使用工具白名单，需要添加 `browser`（并从拒绝列表中移除），否则该工具仍会被阻止。
清理规则（`agents.defaults.sandbox.prune`）也适用于浏览器容器。

### 自定义沙箱镜像

构建你自己的镜像并在配置中指向它：

```bash
docker build -t my-openclaw-sbx -f Dockerfile.sandbox .
```

```json5
{
  agents: {
    defaults: {
      sandbox: { docker: { image: "my-openclaw-sbx" } },
    },
  },
}
```

### 工具策略（允许/拒绝）

- `deny` 优先于 `allow`。
- 如果 `allow` 为空：所有工具（除了 deny 中的）可用。
- 如果 `allow` 非空：仅 `allow` 中的工具可用（减去 deny 中的）。

### 清理策略

两个控制项：

- `prune.idleHours`：移除 X 小时内未使用的容器（0 = 禁用）
- `prune.maxAgeDays`：移除超过 X 天的容器（0 = 禁用）

示例：

- 保留活跃会话但限制生命周期：
  `idleHours: 24`，`maxAgeDays: 7`
- 永不清理：
  `idleHours: 0`，`maxAgeDays: 0`

### 安全说明

- 硬隔离仅适用于工具（exec/read/write/edit/apply_patch）。
- 仅主机工具如 browser/camera/canvas 默认被阻止。
- 在沙箱中允许 `browser` 会破坏隔离（浏览器运行在主机上）。

---

## 故障排除

- 镜像缺失：使用 [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) 构建或设置 `agents.defaults.sandbox.docker.image`。
- 容器未运行：它会按需自动为每个会话创建。
- 沙箱中的权限错误：将 `docker.user` 设置为与挂载工作区所有权匹配的 UID:GID（或 chown 工作区文件夹）。
- 找不到自定义工具：OpenClaw 使用 `sh -lc`（登录 shell）运行命令，这会 source `/etc/profile` 并可能重置 PATH。设置 `docker.env.PATH` 以前置你的自定义工具路径（例如 `/custom/bin:/usr/local/share/npm-global/bin`），或在你的 Dockerfile 中在 `/etc/profile.d/` 下添加脚本。
