---
title: "自定义模型提供商"
sidebarTitle: "自定义提供商"
---

# 自定义模型提供商

OpenClaw 内置了对主流 AI 服务商的支持，同时也允许你通过 `models.providers` 配置接入任意兼容 OpenAI / Anthropic / Google 协议的 API 端点——包括本地推理服务、反向代理、自建模型网关等。

---

## 适用场景

| 场景 | 说明 |
|------|------|
| 本地推理服务 | vLLM、LocalAI、LM Studio 等暴露兼容 API 的服务 |
| 统一代理网关 | LiteLLM、One API 等聚合多家提供商的中间层 |
| 私有化部署模型 | 企业内网部署的闭源或开源模型 |
| 自定义基础 URL | 已有 Provider 使用镜像站/代理时覆盖默认端点 |
| 特殊认证方式 | 需要自定义请求头、Token 格式的专有 API |

---

## 配置结构

```json5
// ~/.openclaw/openclaw.json
{
  models: {
    mode: "merge",           // merge（默认）| replace
    providers: {
      "my-provider": {       // 提供商 ID，可自由命名
        baseUrl: "http://localhost:4000/v1",
        apiKey: "${MY_API_KEY}",
        api: "openai-completions",   // 协议类型，见下文
        models: [
          {
            id: "my-model-id",
            name: "My Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

引用模型时使用 `提供商ID/模型ID` 格式：

```json5
{
  agents: {
    defaults: {
      model: { primary: "my-provider/my-model-id" },
    },
  },
}
```

---

## 提供商字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `baseUrl` | string | API 基础地址（**必填**） |
| `apiKey` | string | API 密钥，支持 `${ENV_VAR}` 语法 |
| `api` | string | 协议类型，见下文 |
| `models` | array | 模型列表，见下文 |
| `authHeader` | boolean | 为 `true` 时将密钥放入自定义请求头而非 `Authorization: Bearer` |
| `headers` | object | 附加自定义 HTTP 请求头 |

### 协议类型（`api` 字段）

| 值 | 对应协议 | 适用服务 |
|----|---------|---------|
| `openai-completions` | OpenAI Chat Completions | vLLM、LiteLLM、LocalAI、大多数兼容服务 |
| `openai-responses` | OpenAI Responses API | 使用新版 Responses 端点的服务 |
| `anthropic-messages` | Anthropic Messages API | Anthropic 兼容端点（如 Synthetic、MiniMax）|
| `google-generative-ai` | Google Generative AI | Google 兼容端点 |

---

## 模型字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 模型 ID（发送给 API 的实际值，**必填**） |
| `name` | string | 显示名称（展示用） |
| `reasoning` | boolean | 是否支持推理/思考（thinking）模式 |
| `input` | array | 支持的输入类型：`"text"` / `"image"` / `"audio"` / `"video"` |
| `cost` | object | 费用（每百万 Token，单位：美元），填 `0` 表示免费 |
| `contextWindow` | number | 上下文窗口大小（Token 数） |
| `maxTokens` | number | 最大输出 Token 数 |

---

## `mode` 字段

| 值 | 行为 |
|----|------|
| `merge`（默认） | 自定义提供商**追加**到内置目录，内置提供商仍可用 |
| `replace` | 自定义提供商**完全替换**内置目录，内置提供商不再可用 |

建议保持默认 `merge`，除非你想完全接管模型目录。

---

## 常用场景示例

### 场景一：接入任意 OpenAI 兼容 API

适用于 vLLM、LM Studio、LocalAI 等任何暴露 `/v1/chat/completions` 端点的服务：

```json5
{
  models: {
    mode: "merge",
    providers: {
      "local-llm": {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local",   // 不需要认证时随便填
        api: "openai-completions",
        models: [
          {
            id: "Qwen2.5-Coder-32B-Instruct",
            name: "Qwen 2.5 Coder 32B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "local-llm/Qwen2.5-Coder-32B-Instruct" },
    },
  },
}
```

### 场景二：接入 Anthropic 兼容 API

适用于 Synthetic、MiniMax 等 Anthropic 协议兼容服务：

::: tip 注意
`anthropic-messages` 协议下，`baseUrl` 应省略 `/v1`，Anthropic 客户端会自动追加。
:::

```json5
{
  env: { MY_ANTHROPIC_PROXY_KEY: "sk-..." },
  models: {
    mode: "merge",
    providers: {
      "my-proxy": {
        baseUrl: "https://my-proxy.example.com",   // 不要加 /v1
        apiKey: "${MY_ANTHROPIC_PROXY_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6 (via proxy)",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
            contextWindow: 200000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "my-proxy/claude-opus-4-6" },
    },
  },
}
```

### 场景三：自定义请求头认证

某些企业 API 使用非标准认证头：

```json5
{
  models: {
    mode: "merge",
    providers: {
      "enterprise-api": {
        baseUrl: "https://ai.internal.company.com/v1",
        apiKey: "${ENTERPRISE_API_KEY}",
        authHeader: true,        // 使用自定义请求头而不是 Authorization: Bearer
        headers: {
          "X-API-Key": "${ENTERPRISE_API_KEY}",
          "X-Tenant-ID": "my-team",
        },
        api: "openai-completions",
        models: [
          {
            id: "internal-model-v2",
            name: "Enterprise Model v2",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

### 场景四：LiteLLM 代理（多模型统一入口）

通过 LiteLLM 一次配置多个模型：

```json5
{
  env: { LITELLM_API_KEY: "sk-litellm-..." },
  models: {
    mode: "merge",
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude (via LiteLLM)",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o (via LiteLLM)",
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
      model: {
        primary: "litellm/claude-opus-4-6",
        fallbacks: ["litellm/gpt-4o"],
      },
    },
  },
}
```

---

## 按智能体使用不同提供商

如果需要为特定智能体单独配置模型目录，可在智能体配置目录下创建 `models.json`：

```
~/.openclaw/agents/<agentId>/agent/models.json
```

格式与 `models.providers` 相同。可通过环境变量 `OPENCLAW_AGENT_DIR` 或 `PI_CODING_AGENT_DIR` 覆盖配置根目录。

---

## 验证配置

配置完成后运行：

```bash
openclaw doctor           # 检测配置是否合法
openclaw models list      # 列出所有可用模型（包含自定义提供商）
```

配置有误时，网关会拒绝启动并显示具体错误原因。

---

## 常见问题

::: details 模型调用成功但工具调用不工作？

部分 OpenAI 兼容 API 不完整支持 Function Calling / Tool Use。可尝试：
- 确认服务端支持 `tools` 参数
- 换用支持工具调用的模型（如 Qwen2.5-Coder、Llama 3.3 等）
- 对于 OpenAI 兼容层，某些服务需要设置 `params: { streaming: false }` 禁用流式

:::

::: details API 密钥如何安全存储？

推荐使用环境变量 + 配置中的 `${ENV_VAR}` 语法，避免密钥明文写入配置文件：

```bash
# ~/.openclaw/.env 或 .env（网关启动目录）
MY_API_KEY=sk-...
```

```json5
// openclaw.json
{ models: { providers: { "my-provider": { apiKey: "${MY_API_KEY}" } } } }
```

:::

::: details `merge` 和 `replace` 模式什么时候用 `replace`？

当你希望**只使用自定义提供商**（完全禁用 Anthropic、OpenAI 等内置提供商）时使用 `replace`。大多数情况下保持默认 `merge` 即可。

:::

---

_相关：[配置参考 · 自定义提供商](/tutorials/gateway/configuration-reference#自定义提供商和基础-url) · [LiteLLM](/tutorials/providers/litellm) · [vLLM](/tutorials/providers/vllm) · [Ollama](/tutorials/providers/ollama)_
