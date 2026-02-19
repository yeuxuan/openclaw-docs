---
title: "Vercel AI Gateway"
sidebarTitle: "Vercel AI Gateway"
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway) 提供统一 API，通过单一端点访问数百个模型。

- 提供商：`vercel-ai-gateway`
- 认证：`AI_GATEWAY_API_KEY`
- API：Anthropic Messages 兼容

---

## 快速开始

1. 设置 API 密钥（推荐：为网关存储）：

```bash
openclaw onboard --auth-choice ai-gateway-api-key
```

2. 设置默认模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
    },
  },
}
```

---

## 非交互式示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

---

## 环境说明

如果 Gateway 作为守护进程运行（launchd/systemd），请确保 `AI_GATEWAY_API_KEY` 对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。
