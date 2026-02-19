---
title: "模型提供商快速入门"
sidebarTitle: "模型提供商快速入门"
---

# 模型提供商

OpenClaw 支持多种 LLM 提供商。选择一个提供商，完成认证，然后将默认模型设置为 `provider/model`。

---

## 推荐：Venice（Venice AI）

Venice 是我们推荐的 Venice AI 配置方案，提供隐私优先的推理服务，并可选择使用 Opus 处理最困难的任务。

- 默认模型：`venice/llama-3.3-70b`
- 最佳综合模型：`venice/claude-opus-45`（Opus 仍然是最强的）

详见 [Venice AI](/providers/venice)。

---

## 快速开始（两步完成）

1. 向提供商进行认证（通常通过 `openclaw onboard`）。
2. 设置默认模型：

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

---

## 支持的提供商（入门集合）

- [OpenAI（API + Codex）](/providers/openai)
- [Anthropic（API + Claude Code CLI）](/providers/anthropic)
- [OpenRouter](/providers/openrouter)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [Moonshot AI（Kimi + Kimi Coding）](/providers/moonshot)
- [Synthetic](/providers/synthetic)
- [OpenCode Zen](/providers/opencode)
- [Z.AI](/providers/zai)
- [GLM 模型](/providers/glm)
- [MiniMax](/providers/minimax)
- [Venice（Venice AI）](/providers/venice)
- [Amazon Bedrock](/providers/bedrock)
- [千帆](/providers/qianfan)

如需完整的提供商目录（xAI、Groq、Mistral 等）及高级配置，
请参阅[模型提供商](/concepts/model-providers)。
