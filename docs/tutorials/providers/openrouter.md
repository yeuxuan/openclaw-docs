---
title: "OpenRouter"
sidebarTitle: "OpenRouter"
---

# OpenRouter

OpenRouter 提供一个**统一 API**，通过单一端点和 API 密钥将请求路由到多种模型。它兼容 OpenAI，因此大多数 OpenAI SDK 只需切换基础 URL 即可使用。

---

## CLI 设置

```bash
openclaw onboard --auth-choice apiKey --token-provider openrouter --token "$OPENROUTER_API_KEY"
```

---

## 配置示例

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/anthropic/claude-sonnet-4-5" },
    },
  },
}
```

---

## 注意事项

- 模型引用格式为 `openrouter/<provider>/<model>`。
- 更多模型/提供商选项请参见 [/concepts/model-providers](/concepts/model-providers)。
- OpenRouter 底层使用 Bearer Token 与你的 API 密钥进行认证。
