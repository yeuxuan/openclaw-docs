---
title: "ClawDock 迁移到 Docker Compose"
sidebarTitle: "ClawDock 迁移"
description: "ClawDock 已从 OpenClaw 上游移除：保留状态与卷，将旧辅助命令迁移到 Docker Compose。"
---

# ClawDock 迁移到 Docker Compose

::: warning 历史入口
ClawDock 曾是 Docker 用户的 shell 辅助命令。2026-08-31 核对的上游已删除该工具和独立文档；本站保留此 URL 供旧用户迁移，不再推荐安装旧脚本。
:::

---

## 已安装用户要做什么

- 从 `~/.zshrc` / `~/.bashrc` 移除加载 `clawdock-helpers.sh` 的 `source` 行，再启动新终端。
- 路径可能是 `~/.clawdock/`、checkout 中的 `scripts/clawdock/`，或更早的 `scripts/shell-helpers/`。
- 不要删除 OpenClaw 状态、凭据、workspace、项目 `.env` 或 Docker volumes。

如果你还没用 Docker，先看 [Docker 部署](/tutorials/installation/docker)。

---

## Compose 文件要保持一致

在现有 `docker-compose.yml` 所在目录执行命令。若一直使用额外 Compose 文件，每次保留同一组 `-f` 参数和顺序；不要漏掉 override、extra 或 sandbox 文件。默认文件发现会自动加载 `docker-compose.override.yml`，显式传 `-f` 时则需要自行列入它。

---

## 常用命令

| 旧命令 | 替代命令 |
|------|------|
| `clawdock-start` | `docker compose up -d openclaw-gateway` |
| `clawdock-stop` | `docker compose down`（停止栈，不要加删除卷参数） |
| `clawdock-restart` | `docker compose restart openclaw-gateway` |
| `clawdock-logs` | `docker compose logs -f openclaw-gateway` |
| `clawdock-dashboard` | `docker compose run --rm openclaw-cli dashboard --no-open` |
| `clawdock-devices` | `docker compose run --rm openclaw-cli devices list` |
| `clawdock-approve <id>` | `docker compose run --rm openclaw-cli devices approve <requestId>` |

---

## 验证迁移

```bash
docker compose up -d openclaw-gateway
docker compose ps
docker compose run --rm openclaw-cli dashboard --no-open
```

如果控制台要求配对：

```bash
docker compose run --rm openclaw-cli devices list
docker compose run --rm openclaw-cli devices approve <requestId>
```
