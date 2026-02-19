---
title: "vLLM"
sidebarTitle: "vLLM"
---

# vLLM

vLLM 可以通过 **OpenAI 兼容的** HTTP API 提供开源（及部分自定义）模型的服务。OpenClaw 可以使用 `openai-completions` API 连接到 vLLM。

当你通过 `VLLM_API_KEY`（如果你的服务器不强制认证，任何值都可以）选择加入且未定义显式的 `models.providers.vllm` 条目时，OpenClaw 还可以**自动发现** vLLM 上的可用模型。

---

## 快速开始

1. 使用 OpenAI 兼容服务器启动 vLLM。

你的基础 URL 应暴露 `/v1` 端点（例如 `/v1/models`、`/v1/chat/completions`）。vLLM 通常运行在：

- `http://127.0.0.1:8000/v1`

2. 选择加入（如果未配置认证，任何值都可以）：

```bash
export VLLM_API_KEY="vllm-local"
```

3. 选择模型（替换为你的 vLLM 模型 ID）：

```json5
{
  agents: {
    defaults: {
      model: { primary: "vllm/your-model-id" },
    },
  },
}
```

---

## 模型发现（隐式提供商）

当设置了 `VLLM_API_KEY`（或存在认证配置文件）且你**未**定义 `models.providers.vllm` 时，OpenClaw 会查询：

- `GET http://127.0.0.1:8000/v1/models`

...并将返回的 ID 转换为模型条目。

如果你显式设置了 `models.providers.vllm`，自动发现将被跳过，你必须手动定义模型。

---

## 显式配置（手动模型）

在以下情况使用显式配置：

- vLLM 运行在不同的主机/端口上。
- 你想固定 `contextWindow`/`maxTokens` 的值。
- 你的服务器需要真实的 API 密钥（或你想控制头部信息）。

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

---

## 故障排查

- 检查服务器是否可达：

```bash
curl http://127.0.0.1:8000/v1/models
```

- 如果请求因认证错误失败，请设置与你的服务器配置匹配的真实 `VLLM_API_KEY`，或在 `models.providers.vllm` 下显式配置提供商。
