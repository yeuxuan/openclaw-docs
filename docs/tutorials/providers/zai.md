---
title: "Z.AI"
sidebarTitle: "Z.AI"
---

# Z.AI

Z.AI 是 **GLM** 模型的 API 平台。它提供 GLM 的 REST API，并使用 API 密钥进行认证。在 Z.AI 控制台创建你的 API 密钥。OpenClaw 使用 `zai` 提供商和 Z.AI API 密钥。

---

## CLI 设置

```bash
openclaw onboard --auth-choice zai-api-key
# 或非交互式
openclaw onboard --zai-api-key "$ZAI_API_KEY"
```

---

## 配置示例

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

---

## 注意事项

- GLM 模型以 `zai/<model>` 格式引用（示例：`zai/glm-5`）。
- 模型系列概览请参见 [/providers/glm](/providers/glm)。
- Z.AI 使用 Bearer 认证和你的 API 密钥。
