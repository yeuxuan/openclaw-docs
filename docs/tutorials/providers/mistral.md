---
title: "Mistral"
sidebarTitle: "Mistral"
description: "OpenClaw 模型接入：Mistral。支持文本/图像模型路由、Voxtral 音频转录，以及作为记忆检索的嵌入提供商。"
---

# Mistral

OpenClaw 支持将 Mistral 用于：

- 文本 / 图像模型路由（`mistral/...`）
- Voxtral 音频转录
- 记忆嵌入与检索（`memory.search.provider = "mistral"`）

如果你希望同一套 API Key 同时覆盖聊天、媒体理解和记忆检索，Mistral 是一个比较直接的选择。

---

## CLI 设置

```bash
openclaw onboard --auth-choice mistral-api-key
# 或非交互式
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

---

## 配置示例

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

---

## 音频转录配置（Voxtral）

如果你想让 OpenClaw 使用 Mistral 的 Voxtral 做音频转录，可以这样配置：

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

---

## 记忆嵌入配置

Mistral 也可以作为记忆检索的嵌入提供商：

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  memory: {
    search: {
      provider: "mistral",
      model: "mistral-embed",
    },
  },
}
```

当 `memory.search.provider = "mistral"` 时，OpenClaw 会走 Mistral 的 embeddings 路径完成向量化。

---

## 注意事项

- 鉴权环境变量：`MISTRAL_API_KEY`
- 默认 Base URL：`https://api.mistral.ai/v1`
- 引导默认模型：`mistral/mistral-large-latest`
- Voxtral 默认音频模型：`voxtral-mini-latest`
- 音频转录路径：`/v1/audio/transcriptions`
- 记忆嵌入路径：`/v1/embeddings`
- 默认嵌入模型：`mistral-embed`
