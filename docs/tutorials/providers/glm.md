---
title: "GLM 模型"
sidebarTitle: "GLM 模型"
---

# GLM 模型

GLM 是一个**模型系列**（不是一家公司），通过 Z.AI 平台提供。在 OpenClaw 中，GLM 模型通过 `zai` 提供商访问，模型 ID 格式如 `zai/glm-5`。

---

## CLI 设置

```bash
openclaw onboard --auth-choice zai-api-key
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

- GLM 版本和可用性可能会变化；请查看 Z.AI 的文档获取最新信息。
- 示例模型 ID 包括 `glm-5`、`glm-4.7` 和 `glm-4.6`。
- 提供商详情请参见 [/providers/zai](/providers/zai)。
