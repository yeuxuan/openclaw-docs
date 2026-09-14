---
title: "自定义模型提供商"
sidebarTitle: "自定义提供商"
description: "OpenClaw 模型接入：自定义模型提供商。通过 models.providers 或 CLI 引导接入任意第三方 API，包括 OpenAI 兼容、Anthropic 兼容、Azure OpenAI、自建网关和本地推理服务。"
---

# 自定义模型提供商

OpenClaw 内置了对主流 AI 服务商的支持，但很多第三方 API 并不在内置列表里。
这时你可以通过 `models.providers` 或 CLI 引导，把任意兼容 OpenAI / Anthropic 协议的端点接入 OpenClaw。

适用对象包括：

- 本地推理服务：vLLM、LM Studio、LocalAI、Ollama 兼容网关
- 统一代理网关：LiteLLM、One API、企业自建模型网关
- 私有化部署模型：公司内网推理服务、闭源模型代理
- 第三方聚合 API：只提供兼容接口，但不在 OpenClaw 内置目录中
- Azure OpenAI / Azure AI Foundry：需要特殊路径和请求头的兼容端点

---

## 新手快速接入（推荐）

如果你已经装好 OpenClaw，最简单的方式是直接走引导：

```bash
openclaw onboard
```

然后在模型 / 认证选择里选择：

```text
Custom Provider
```

引导会依次要求你填写：

1. Base URL：第三方 API 的基础地址
2. API Key：如果不需要认证，可留空或按服务要求填写占位值
3. Model ID：你要调用的模型 ID
4. Endpoint compatibility：选择 `OpenAI-compatible`、`Anthropic-compatible`，或 `Unknown (detect automatically)`
5. Endpoint ID：OpenClaw 内部使用的 provider id，默认会根据域名自动生成
6. Model alias（可选）：给模型取一个更短的别名

引导会自动做两件事：

- 探测这个端点更像 OpenAI 兼容还是 Anthropic 兼容
- 用你填写的模型和密钥做一次在线验证

验证成功后，OpenClaw 会自动把配置写入 `openclaw.json`，并把默认模型切到这个第三方 API。

---

## 非交互式 CLI 接入

如果你想脚本化接入，可以直接使用非交互式参数：

```bash
openclaw onboard \
  --auth-choice custom-api-key \
  --custom-base-url https://llm.example.com/v1 \
  --custom-api-key sk-... \
  --custom-model-id my-model \
  --custom-provider-id my-provider \
  --custom-compatibility openai
```

参数说明：

- `--custom-base-url`：第三方 API 的基础地址
- `--custom-api-key`：API Key，可选
- `--custom-model-id`：模型 ID，必填
- `--custom-provider-id`：提供商 ID，可选；不填时自动从域名生成
- `--custom-compatibility`：`openai` 或 `anthropic`

::: tip 什么时候用 CLI 参数？
适合批量部署、自动化安装、远程服务器初始化，或者你已经明确知道端点兼容协议，不想再走交互式探测。
:::

---

## 先判断你的第三方 API 属于哪一类

### OpenAI 兼容 API

大多数第三方 API 都属于这一类。常见特征：

- 文档里出现 `/v1/chat/completions`
- 或提供新版 `/v1/responses`
- 请求头一般是 `Authorization: Bearer <API_KEY>`
- Base URL 常见写法是 `https://example.com/v1`

常见服务：

- vLLM
- LM Studio
- LocalAI
- LiteLLM
- One API
- 各类“OpenAI 兼容网关”

### Anthropic 兼容 API

这类服务一般模仿 Claude 的 `/messages` 协议。常见特征：

- 文档里出现 `/v1/messages`
- 请求头通常包含 `anthropic-version`
- Base URL 往往不是标准 OpenAI 风格

常见服务：

- 某些 Claude 代理
- 部分企业网关
- 一些“Anthropic-compatible” 聚合服务

::: tip Anthropic 兼容端点的 Base URL
当 `api` 使用 `anthropic-messages` 时，`baseUrl` 通常应写服务根地址，不要手动再拼 `/v1`，因为客户端会自行追加。
:::

### Azure OpenAI / Azure AI Foundry

如果你的地址长这样，也可以走“自定义提供商”流程：

- `https://<resource>.openai.azure.com`
- `https://<resource>.services.ai.azure.com`

注意：

- `modelId` 一般应填写 deployment name，而不是裸模型名
- Azure 使用的是 `api-key` 请求头，不是标准 `Authorization: Bearer`
- OpenClaw 的引导流程会自动把 Azure URL 转换到正确的 deployment 路径

---

## 手动配置方式

如果你更喜欢直接改配置文件，可以编辑：

```text
~/.openclaw/openclaw.json
```

基本结构如下：

```json5
{
  models: {
    mode: "merge",
    providers: {
      "my-provider": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "${MY_API_KEY}",
        api: "openai-completions",
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
  agents: {
    defaults: {
      model: { primary: "my-provider/my-model-id" },
    },
  },
}
```

模型引用格式始终是：

```text
提供商ID/模型ID
```

例如：

```text
my-provider/my-model-id
```

---

## 最常见的 4 种第三方 API 接入方式

### 场景一：任意 OpenAI 兼容 API

适用于 vLLM、LM Studio、LocalAI，以及大多数暴露 `/v1/chat/completions` 的服务：

```json5
{
  models: {
    mode: "merge",
    providers: {
      "local-llm": {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local",
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

### 场景二：Anthropic 兼容 API

适用于 Claude 兼容代理或 Anthropic 协议网关：

```json5
{
  env: { MY_ANTHROPIC_PROXY_KEY: "sk-..." },
  models: {
    mode: "merge",
    providers: {
      "my-proxy": {
        baseUrl: "https://my-proxy.example.com",
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

### 场景三：企业私有网关 / 自定义请求头

某些第三方 API 不用标准 Bearer Token，而是要求自定义请求头：

```json5
{
  models: {
    mode: "merge",
    providers: {
      "enterprise-api": {
        baseUrl: "https://ai.internal.company.com/v1",
        apiKey: "${ENTERPRISE_API_KEY}",
        authHeader: true,
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

### 场景四：LiteLLM / One API 这类统一网关

适用于一个网关下挂多种模型：

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

## 配置字段说明

### Provider 级字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `baseUrl` | string | API 基础地址 |
| `apiKey` | string | API 密钥，建议使用 `${ENV_VAR}` |
| `api` | string | 请求协议适配器 |
| `models` | array | 模型目录 |
| `authHeader` | boolean | 强制通过请求头传递密钥 |
| `headers` | object | 追加自定义 HTTP 头 |

### `api` 可选值

| 值 | 说明 |
|----|------|
| `openai-completions` | OpenAI Chat Completions 兼容端点 |
| `openai-responses` | OpenAI Responses API 兼容端点 |
| `anthropic-messages` | Anthropic Messages API 兼容端点 |
| `google-generative-ai` | Google Generative AI 兼容端点 |

### 模型字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 实际发送给 API 的模型 ID |
| `name` | string | 显示名称 |
| `reasoning` | boolean | 是否支持思考 / 推理模式 |
| `input` | array | 支持的输入类型，如 `text`、`image` |
| `cost` | object | 费用信息，可填 `0` |
| `contextWindow` | number | 上下文窗口 |
| `maxTokens` | number | 最大输出 Token |

---

## `mode` 应该怎么选

| 值 | 行为 |
|----|------|
| `merge` | 保留内置提供商，并追加你的第三方 API |
| `replace` | 完全替换内置模型目录 |

大多数情况下保持 `merge` 即可。
只有在你想完全接管模型目录时，才需要 `replace`。

---

## 按智能体使用不同第三方 API

如果你只想让某个特定智能体使用第三方 API，可以在该智能体目录下创建：

```text
~/.openclaw/agents/<agentId>/agent/models.json
```

格式和 `models.providers` 一样。
这样你可以做到：

- 默认智能体走内置提供商
- 某个专用智能体走企业网关
- 某个本地智能体单独走本地推理服务

---

## 接入完成后怎么验证

配置完成后，建议至少执行以下命令：

```bash
openclaw doctor
openclaw models list
```

你还可以进一步检查：

```bash
openclaw models set my-provider/my-model-id
```

验证重点：

- `doctor` 不报配置错误
- `models list` 能看到你的自定义 provider
- 默认模型或目标模型能被正确选中

---

## 常见问题

::: details 自动探测失败，提示不是 OpenAI / Anthropic 兼容怎么办？

先检查 3 件事：

- Base URL 是否写对了
- 模型 ID 是否真实存在
- API Key 是否有效

如果你本来就知道它是哪种协议，直接在引导中手动选择 `OpenAI-compatible` 或 `Anthropic-compatible`，不要依赖自动探测。

:::

::: details 为什么 OpenAI 兼容 API 能聊天，但工具调用 / Function Calling 不工作？

部分第三方 API 只兼容基础聊天接口，不完整支持工具调用。优先检查：

- 服务端是否支持 `tools`
- 目标模型是否支持工具调用
- 该网关是否对流式、函数调用、结构化输出做了裁剪

兼容“OpenAI API”不等于兼容所有高级能力。

:::

::: details 为什么 Anthropic 兼容端点总是 404？

最常见原因是 `baseUrl` 写错了。
对 `anthropic-messages` 来说，通常不要手动在 `baseUrl` 后再追加 `/v1`。

:::

::: details 为什么 Azure OpenAI 看起来配置对了，但仍然报 404 / 401？

重点检查：

- `baseUrl` 是否是 Azure 资源地址
- `modelId` 是否填写成了 deployment name
- API Key 是否有效

Azure 的路由方式和普通 OpenAI 兼容端点不同，deployment 名称写错时最容易报错。

:::

::: details API Key 怎么存更安全？

推荐使用环境变量：

```bash
MY_API_KEY=sk-...
```

然后在配置里引用：

```json5
{
  models: {
    providers: {
      "my-provider": {
        apiKey: "${MY_API_KEY}",
      },
    },
  },
}
```

这样可以避免把密钥明文写进配置文件。

:::

::: details 为什么我的 provider id 变成了 `custom-2`、`custom-3`？

这是正常行为。
当你填写的 provider id 已经被另一个不同 `baseUrl` 占用时，OpenClaw 会自动改名，避免覆盖旧配置。

:::

---

_相关：[模型提供商概念](/tutorials/concepts/model-providers) · [配置参考 · 自定义提供商和基础 URL](/tutorials/gateway/configuration-reference) · [LiteLLM](/tutorials/providers/litellm) · [vLLM](/tutorials/providers/vllm) · [Ollama](/tutorials/providers/ollama)_
