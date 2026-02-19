---
title: "本地模型"
sidebarTitle: "本地模型"
---

# 本地模型

本地运行是可行的，但 OpenClaw 期望大上下文 + 强大的提示注入防御。小型显卡会截断上下文并泄露安全性。目标要高：**≥2 台满配 Mac Studio 或等效 GPU 设备（约 $30k+）**。单块 **24 GB** GPU 仅适用于较轻量的提示且延迟更高。使用你能运行的**最大/全尺寸模型变体**；激进量化或"小型"检查点会增加提示注入风险（参阅[安全](/gateway/security)）。

---

## 推荐：LM Studio + MiniMax M2.1（Responses API，全尺寸）

当前最佳本地技术栈。在 LM Studio 中加载 MiniMax M2.1，启用本地服务器（默认 `http://127.0.0.1:1234`），使用 Responses API 将推理与最终文本分离。

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.1-gs32" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/minimax-m2.1-gs32": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.1-gs32",
            name: "MiniMax M2.1 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**设置检查清单**

- 安装 LM Studio：[https://lmstudio.ai](https://lmstudio.ai)
- 在 LM Studio 中，下载**可用的最大 MiniMax M2.1 版本**（避免"小型"/重度量化变体），启动服务器，确认 `http://127.0.0.1:1234/v1/models` 列出了它。
- 保持模型加载；冷加载会增加启动延迟。
- 如果你的 LM Studio 版本不同，调整 `contextWindow`/`maxTokens`。
- 对于 WhatsApp，使用 Responses API 以确保仅发送最终文本。

即使运行本地模型也保持托管模型配置；使用 `models.mode: "merge"` 以使回退保持可用。

### 混合配置：托管主力，本地回退

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-5",
        fallbacks: ["lmstudio/minimax-m2.1-gs32", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
        "lmstudio/minimax-m2.1-gs32": { alias: "MiniMax Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.1-gs32",
            name: "MiniMax M2.1 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### 本地优先 + 托管安全网

交换主力和回退的顺序；保持相同的 providers 块和 `models.mode: "merge"`，以便在本地设备宕机时可以回退到 Sonnet 或 Opus。

### 区域托管/数据路由

- 托管的 MiniMax/Kimi/GLM 变体也存在于 OpenRouter 上，有区域固定端点（例如美国托管）。选择那里的区域变体以将流量保持在你选择的管辖区内，同时仍使用 `models.mode: "merge"` 进行 Anthropic/OpenAI 回退。
- 纯本地仍然是最强的隐私路径；托管的区域路由是你需要提供商（Provider）功能但又想控制数据流时的折中方案。

---

## 其他 OpenAI 兼容的本地代理

vLLM、LiteLLM、OAI-proxy 或自定义网关（Gateway），只要暴露 OpenAI 风格的 `/v1` 端点即可工作。用你的端点和模型 ID 替换上面的 provider 块：

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

保持 `models.mode: "merge"` 以使托管模型作为回退保持可用。

---

## 故障排查

- 网关（Gateway）能访问代理吗？`curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型卸载了？重新加载；冷启动是常见的"挂起"原因。
- 上下文错误？降低 `contextWindow` 或提高你的服务器限制。
- 安全：本地模型跳过提供商（Provider）端的过滤器；保持智能体（Agent）范围窄并启用压缩以限制提示注入的影响范围。
