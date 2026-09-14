---
title: "1Password 凭据集成"
sidebarTitle: "1Password"
description: "用 1Password CLI 与 SecretRef 让 OpenClaw 运行时读取凭据，而不是把密钥写进配置。"
---

# 1Password 凭据集成

OpenClaw 可以通过 1Password 插件在 Gateway 启动或重载时解析 SecretRef，让 API Key 不出现在 `openclaw.json` 中。Agent 另有 `1password` Skill；桌面交互场景也可使用官方 1Password MCP，它们是不同路径。

## Gateway 的无头运行方式

先在 Gateway 主机安装 `op` CLI，并准备权限最小化的 1Password Service Account：

```bash
openclaw plugins enable onepassword
mkdir -p ~/.openclaw/credentials/onepassword
chmod 700 ~/.openclaw/credentials/onepassword
printf '%s' "$OP_SERVICE_ACCOUNT_TOKEN" > \
  ~/.openclaw/credentials/onepassword/service-account-token
chmod 600 ~/.openclaw/credentials/onepassword/service-account-token
unset OP_SERVICE_ACCOUNT_TOKEN
```

生成、预览并应用 SecretRef 计划：

```bash
openclaw onepassword secretref setup \
  --openai-id op://Automation/OpenAI/credential \
  --plan-out ./openclaw-1password-secrets-plan.json

openclaw secrets apply \
  --from ./openclaw-1password-secrets-plan.json \
  --dry-run --allow-exec

openclaw secrets apply \
  --from ./openclaw-1password-secrets-plan.json \
  --allow-exec

openclaw secrets audit --check --allow-exec
openclaw secrets reload
```

插件只解析已注册的 OpenClaw 凭据目标，并检查 `op` 可执行文件的所有权与写权限。不要把 Service Account Token、解析后的密钥或 `op://` 之外的明文值放进配置、日志或聊天记录。

官方 1Password MCP 适合桌面 App 中需要逐次批准的 Environments 工作流，不等于无头 Service Account 访问。Gateway 自己需要在启动时取密钥时，请继续使用插件 + SecretRef。

上游来源：[`docs/gateway/1password.md`](https://github.com/openclaw/openclaw/blob/main/docs/gateway/1password.md)。
