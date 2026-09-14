---
title: "Daytona 云沙箱部署"
sidebarTitle: "Daytona"
description: "在 Daytona 持久云沙箱中运行 OpenClaw，并通过签名预览地址访问控制 UI。"
---

# Daytona 云沙箱部署

Daytona 提供带 SSH 和签名预览地址的 Linux 沙箱，适合不想自己维护 VPS 的测试或个人环境。Gateway 保持回环监听，通过 Daytona Preview Proxy 访问，不要直接公开 18789 端口。

## 创建沙箱

```bash
daytona login --api-key=YOUR_API_KEY
daytona sandbox create --name openclaw \
  --snapshot daytona-medium \
  --auto-stop 0
daytona ssh openclaw
```

沙箱内没有常规服务管理器，因此 onboarding 跳过 daemon，随后手动后台启动 Gateway：

```bash
openclaw onboard --non-interactive --accept-risk \
  --anthropic-api-key YOUR_ANTHROPIC_KEY \
  --skip-daemon --skip-channels --skip-skills --skip-hooks --skip-health
```

在本地终端生成预览地址：

```bash
daytona preview-url openclaw --port 18789
```

回到沙箱，把输出的 Origin 原样写入允许列表，不要添加尾部 `/`：

```bash
openclaw config set gateway.controlUi.allowedOrigins '["PASTE_YOUR_PREVIEW_URL"]'
openclaw config set gateway.trustedProxies '["127.0.0.1"]'
nohup openclaw gateway run > /tmp/gateway.log 2>&1 &
openclaw gateway health
```

第一次用浏览器连接时，还要在沙箱里运行 `openclaw devices list`，核对并批准请求。预览 URL、Gateway Token 和设备批准是三层独立保护，都要保留。

Daytona Snapshot 的全局 npm 目录通常属于 root，升级时使用：

```bash
sudo env "PATH=$PATH" npm install --global openclaw@latest --allow-scripts=openclaw
openclaw doctor
```

上游来源：[`docs/install/daytona.md`](https://github.com/openclaw/openclaw/blob/main/docs/install/daytona.md)。
