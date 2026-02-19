---
title: "Qwen"
sidebarTitle: "Qwen"
---

# Qwen

Qwen 提供免费层的 OAuth 流程，支持 Qwen Coder 和 Qwen Vision 模型（每天 2,000 次请求，受 Qwen 速率限制约束）。

---

## 启用插件

```bash
openclaw plugins enable qwen-portal-auth
```

启用后请重启网关（Gateway）。

---

## 认证

```bash
openclaw models auth login --provider qwen-portal --set-default
```

这将运行 Qwen 设备码 OAuth 流程，并将提供商条目写入你的 `models.json`（以及用于快速切换的 `qwen` 别名）。

---

## 模型 ID

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

切换模型：

```bash
openclaw models set qwen-portal/coder-model
```

---

## 复用 Qwen Code CLI 登录

如果你已经使用 Qwen Code CLI 登录，OpenClaw 在加载认证存储时会从 `~/.qwen/oauth_creds.json` 同步凭证。你仍然需要一个 `models.providers.qwen-portal` 条目（使用上面的登录命令创建）。

---

## 注意事项

- Token 自动刷新；如果刷新失败或访问被撤销，请重新运行登录命令。
- 默认基础 URL：`https://portal.qwen.ai/v1`（如果 Qwen 提供了不同的端点，使用 `models.providers.qwen-portal.baseUrl` 覆盖）。
- 提供商范围的规则请参见[模型提供商](/concepts/model-providers)。
