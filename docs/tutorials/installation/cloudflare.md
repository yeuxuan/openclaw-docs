---
title: "Cloudflare Containers 部署"
sidebarTitle: "Cloudflare Containers"
description: "实验性地用 Cloudflare Worker、Container、Durable Object 与 R2 运行 OpenClaw。"
---

# Cloudflare Containers 部署

官方模板用一个 Worker 把 HTTP/WebSocket 请求转给固定 Durable Object，再由它管理单实例 Container；Litestream 增量复制 SQLite 写入到 R2。

::: danger 这是实验性部署
Litestream 只保护 SQLite，不会还原 `openclaw.json`、凭据文件、插件文件和工作区。不要在没有完整归档、可重放初始化脚本和恢复演练的情况下放入生产凭据。
:::

## 适合什么场景

- 纯 Webhook 通道可以休眠、按请求唤醒。
- Discord、Slack Socket Mode、WhatsApp 等长连接会让 Container 常驻，月成本可能高于小型 VPS。
- 需要固定出口 IP、完整持久磁盘或多实例写入时，不适合这个模板。

## 前置条件

- Cloudflare Workers Paid、Containers 与 R2 可用
- Docker Buildx 支持 `linux/amd64`
- 公共 Docker Hub 仓库（模板当前不从 GHCR 拉取）
- Node.js、npm，以及模型/通道凭据

模板位置：[`scripts/cloudflare`](https://github.com/openclaw/openclaw/tree/main/scripts/cloudflare)。

## 部署主链路

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw/scripts/cloudflare
npm install
npx wrangler login
npx wrangler whoami
npx wrangler r2 bucket create openclaw-backups
```

在 Cloudflare 控制台创建只允许访问该 bucket 的 R2 S3 凭据，并在 `wrangler.jsonc` 填入账号 ID、bucket 名称和不可变镜像引用。

镜像必须构建为 `linux/amd64` 并推到公共 Docker Hub：

```bash
docker buildx build \
  --platform linux/amd64 \
  --tag docker.io/<user>/openclaw-cloudflare:<version> \
  --push .

npm run check
npm run deploy
```

运行时密钥通过 Wrangler secret 注入，不要写进仓库：

```bash
npx wrangler secret put LITESTREAM_ACCESS_KEY_ID
npx wrangler secret put LITESTREAM_SECRET_ACCESS_KEY
npx wrangler secret put OPENCLAW_GATEWAY_TOKEN
```

其他 Provider/Channel 环境变量必须同时加入模板 `src/container.ts` 的显式 allowlist。

## 首次初始化

首次启动需要临时开启 Container SSH，进入实例后使用 SecretRef 完成非交互式 onboarding。初始化完成后移除 SSH 配置并重新部署。

不要依赖容器磁盘保存初始化结果：把操作写成私有、可重复执行的 runbook，并定期做[完整归档](./backups)。

## 验收清单

```bash
curl -sS https://<worker>.workers.dev/healthz
curl -sS -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
  https://<worker>.workers.dev/readyz

aws s3 ls s3://openclaw-backups/replicas/ --recursive \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com
```

R2 前缀在有会话写入几分钟后仍为空，就表示复制没有成功。继续接入生产通道前必须做一次真实恢复演练：发消息、等待复制、删除实例、重新访问并确认会话仍在。

`OPENCLAW_WEBHOOK_ONLY=true` 只适用于全部通道都走 HTTP Webhook 的安装；长连接通道保持默认 `false`。

上游来源：[`docs/install/cloudflare.md`](https://github.com/openclaw/openclaw/blob/main/docs/install/cloudflare.md)。
