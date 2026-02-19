# LiteLLM

[LiteLLM](https://litellm.ai) 是一个开源的 LLM 网关（Gateway），提供统一的 API 来访问 100 多个模型提供商。通过 LiteLLM 路由 OpenClaw 请求，可以获得集中式的费用追踪、日志记录，以及在不更改 OpenClaw 配置的情况下切换后端的灵活性。

---

## 为什么将 LiteLLM 与 OpenClaw 配合使用？

- **费用追踪** — 精确查看 OpenClaw 在所有模型上的开支
- **模型路由** — 在 Claude、GPT-4、Gemini、Bedrock 之间切换，无需更改配置
- **虚拟密钥** — 为 OpenClaw 创建带支出限制的密钥
- **日志记录** — 完整的请求/响应日志，便于调试
- **故障转移（Failover）** — 主提供商宕机时自动切换

---

## 快速开始

### 通过引导流程

```bash
openclaw onboard --auth-choice litellm-api-key
```

### 手动设置

1. 启动 LiteLLM Proxy：

```bash
pip install 'litellm[proxy]'
litellm --model claude-opus-4-6
```

2. 将 OpenClaw 指向 LiteLLM：

```bash
export LITELLM_API_KEY="your-litellm-key"

openclaw
```

就是这样。OpenClaw 现在通过 LiteLLM 路由请求。

---

## 配置

### 环境变量

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### 配置文件

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

---

## 虚拟密钥

为 OpenClaw 创建一个带支出限制的专用密钥：

```bash
curl -X POST "http://localhost:4000/key/generate" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "openclaw",
    "max_budget": 50.00,
    "budget_duration": "monthly"
  }'
```

将生成的密钥用作 `LITELLM_API_KEY`。

---

## 模型路由

LiteLLM 可以将模型请求路由到不同的后端。在你的 LiteLLM `config.yaml` 中配置：

```yaml
model_list:
  - model_name: claude-opus-4-6
    litellm_params:
      model: claude-opus-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

OpenClaw 继续请求 `claude-opus-4-6` — LiteLLM 处理路由。

---

## 查看用量

检查 LiteLLM 的仪表板或 API：

```bash
# 密钥信息
curl "http://localhost:4000/key/info" \
  -H "Authorization: Bearer sk-litellm-key"

# 支出日志
curl "http://localhost:4000/spend/logs" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

---

## 注意事项

- LiteLLM 默认运行在 `http://localhost:4000`
- OpenClaw 通过 OpenAI 兼容的 `/v1/chat/completions` 端点连接
- 所有 OpenClaw 功能都可以通过 LiteLLM 正常工作 — 没有限制

---

## 另请参阅

- [LiteLLM 文档](https://docs.litellm.ai)
- [模型提供商](/concepts/model-providers)
