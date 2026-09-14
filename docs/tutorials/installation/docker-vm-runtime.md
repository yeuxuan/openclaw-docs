---
title: "Docker VM Runtime"
sidebarTitle: "Docker VM Runtime"
description: "OpenClaw 安装部署：云 VM + Docker 长期运行 Gateway 时，如何处理镜像、二进制依赖、持久化和更新。"
---

# Docker VM Runtime

这页讲的是：你在云服务器上用 Docker 长期运行 OpenClaw 时，怎么少踩坑。

它适合 GCP、Hetzner、DigitalOcean、Oracle、Azure 等 VM。

---

## 最大原则

不要在正在运行的容器里临时安装工具。

容器重启后，这些临时安装的东西会消失。
正确做法是：

1. 改 Dockerfile。
2. 把需要的二进制工具装进镜像。
3. 重新 build。
4. 重启容器。

在仓库根 `Dockerfile` 上扩展，不要换成单阶段简化文件。构建依赖和生产依赖共享同一份 workspace manifests 与 lockfile，但分别执行 frozen-lockfile 安装；运行时使用新装的生产依赖，同时保留已编译 workspace 和原生 addon。不要对镜像层继承的依赖执行 `pnpm prune`，pnpm 12 在 OverlayFS 上可能报 `EXDEV`。

---

## 常见需要进镜像的工具

例如：

- Gmail CLI
- Google Places CLI
- WhatsApp CLI
- 公司内部脚本依赖
- 某些技能需要的系统命令

如果 Agent 报错说命令找不到，先想想这个命令是不是应该进 Docker 镜像。

---

## 构建和启动

```bash
docker compose build
docker compose up -d openclaw-gateway
docker compose logs -f openclaw-gateway
```

看到类似：

```text
[gateway] listening on ws://0.0.0.0:18789
```

说明 Gateway 已经起来。

---

## 持久化

务必持久化：

- `~/.openclaw/openclaw.json`
- `~/.openclaw/.env`
- `~/.openclaw/workspace`
- 会话、凭证、任务、cron 状态

如果这些不持久化，容器一重建，配置和记忆可能就没了。

---

## 内存不足

如果 build 时出现 `Killed` 或 `exit code 137`，通常是内存不够。
解决办法：

- 换大一点的 VM
- 加 swap
- 减少并发构建压力
