---
title: "Venice AI"
sidebarTitle: "Venice AI"
description: "在 OpenClaw 中接入 Venice AI：隐私模式、模型选择、API Key、配置方式、模型发现和常见排障。"
---

# Venice AI

Venice AI 提供偏隐私的 AI 推理服务。你可以直接使用它托管的开源模型，也可以通过 Venice 的匿名代理访问部分专有模型。

OpenClaw 使用 Venice 的 OpenAI 兼容 `/v1` 端点接入。

---

## 为什么在 OpenClaw 中使用 Venice

- 隐私推理：开源模型请求不记录日志。
- 无审查模型：需要时可以选择 Venice Uncensored 一类模型。
- 匿名访问：通过 Venice 代理访问 Opus、GPT、Gemini 等专有模型。
- OpenAI 兼容的 `/v1` 端点。

---

## 隐私模式

Venice 有两种隐私级别。选模型前先区分这两类：

| 模式           | 说明                                                                                                                 | 模型                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 私密 | 提示和响应不存储、不记录。 | Llama、Qwen、DeepSeek、Venice Uncensored 等 |
| 匿名化 | 通过 Venice 代理访问，元数据会被剥离；底层提供商看到的是匿名化请求。 | Claude、GPT、Gemini、Grok、Kimi、MiniMax |

---

## 功能特性

- 可以在私密模型和匿名化代理模型之间选择。
- 支持部分无内容限制模型。
- 可通过匿名代理使用 Claude、GPT-5.2、Gemini、Grok。
- 使用标准 `/v1` OpenAI 兼容 API。
- 所有模型支持流式传输。
- 部分模型支持函数调用，具体以模型能力为准。
- 带视觉能力的模型可以处理图像。
- 没有固定硬性速率限制，但极端用量可能触发公平使用限流。

---

## 设置

### 1. 获取 API 密钥

1. 在 [venice.ai](https://venice.ai) 注册
2. 前往 Settings → API Keys → Create new key
3. 复制你的 API 密钥（格式：`vapi_xxxxxxxxxxxx`）

### 2. 配置 OpenClaw

方式 A：环境变量

```bash
export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
```

方式 B：交互式设置（推荐）

```bash
openclaw onboard --auth-choice venice-api-key
```

向导会完成这些事：

1. 提示输入你的 API 密钥（或使用现有的 `VENICE_API_KEY`）
2. 显示所有可用的 Venice 模型
3. 让你选择默认模型
4. 自动配置提供商

方式 C：非交互式

```bash
openclaw onboard --non-interactive \
  --auth-choice venice-api-key \
  --venice-api-key "vapi_xxxxxxxxxxxx"
```

### 3. 验证设置

```bash
openclaw chat --model venice/llama-3.3-70b "Hello, are you working?"
```

---

## 模型选择

设置完成后，OpenClaw 会显示所有可用的 Venice 模型。根据你的需求选择：

- 默认建议：`venice/llama-3.3-70b`，私密，性能也比较均衡。
- 难任务：`venice/claude-opus-45`，通过匿名代理使用 Opus。
- 强隐私：选择私密模型。
- 追求能力：选择匿名化模型，通过 Venice 代理访问 Claude、GPT、Gemini。

随时更改默认模型：

```bash
openclaw models set venice/claude-opus-45
openclaw models set venice/llama-3.3-70b
```

列出所有可用模型：

```bash
openclaw models list | grep venice
```

---

## 通过 `openclaw configure` 配置

1. 运行 `openclaw configure`
2. 选择 Model/auth
3. 选择 Venice AI

---

## 我应该使用哪个模型？

| 使用场景                     | 推荐模型                         | 原因                                      |
| ---------------------------- | -------------------------------- | ----------------------------------------- |
| 通用聊天 | `llama-3.3-70b` | 综合表现好，完全私密 |
| 最高综合质量 | `claude-opus-45` | 通过匿名代理使用 Opus |
| 隐私 + Claude 质量 | `claude-opus-45` | 元数据由 Venice 代理剥离 |
| 编程 | `qwen3-coder-480b-a35b-instruct` | 针对代码任务优化，262k 上下文 |
| 视觉任务 | `qwen3-vl-235b-a22b` | 私密视觉模型 |
| 无审查 | `venice-uncensored` | 内容限制更少 |
| 快速 + 便宜 | `qwen3-4b` | 轻量模型，适合低成本任务 |
| 复杂推理 | `deepseek-v3.2` | 私密推理模型 |

---

## 可用模型（共 25 个）

### 私密模型（15 个）

| 模型 ID                          | 名称                    | 上下文（Token）  | 特性                    |
| -------------------------------- | ----------------------- | ---------------- | ----------------------- |
| `llama-3.3-70b`                  | Llama 3.3 70B           | 131k             | 通用                    |
| `llama-3.2-3b`                   | Llama 3.2 3B            | 131k             | 快速、轻量              |
| `hermes-3-llama-3.1-405b`        | Hermes 3 Llama 3.1 405B | 131k             | 复杂任务                |
| `qwen3-235b-a22b-thinking-2507`  | Qwen3 235B Thinking     | 131k             | 推理                    |
| `qwen3-235b-a22b-instruct-2507`  | Qwen3 235B Instruct     | 131k             | 通用                    |
| `qwen3-coder-480b-a35b-instruct` | Qwen3 Coder 480B        | 262k             | 编程                    |
| `qwen3-next-80b`                 | Qwen3 Next 80B          | 262k             | 通用                    |
| `qwen3-vl-235b-a22b`             | Qwen3 VL 235B           | 262k             | 视觉                    |
| `qwen3-4b`                       | Venice Small (Qwen3 4B) | 32k              | 快速、推理              |
| `deepseek-v3.2`                  | DeepSeek V3.2           | 163k             | 推理                    |
| `venice-uncensored`              | Venice Uncensored       | 32k              | 无审查                  |
| `mistral-31-24b`                 | Venice Medium (Mistral) | 131k             | 视觉                    |
| `google-gemma-3-27b-it`          | Gemma 3 27B Instruct    | 202k             | 视觉                    |
| `openai-gpt-oss-120b`            | OpenAI GPT OSS 120B     | 131k             | 通用                    |
| `zai-org-glm-4.7`                | GLM 4.7                 | 202k             | 推理、多语言            |

### 匿名化模型（10 个）

| 模型 ID                  | 原始模型          | 上下文（Token）  | 特性              |
| ------------------------ | ----------------- | ---------------- | ----------------- |
| `claude-opus-45`         | Claude Opus 4.5   | 202k             | 推理、视觉        |
| `claude-sonnet-45`       | Claude Sonnet 4.5 | 202k             | 推理、视觉        |
| `openai-gpt-52`          | GPT-5.2           | 262k             | 推理              |
| `openai-gpt-52-codex`    | GPT-5.2 Codex     | 262k             | 推理、视觉        |
| `gemini-3-pro-preview`   | Gemini 3 Pro      | 202k             | 推理、视觉        |
| `gemini-3-flash-preview` | Gemini 3 Flash    | 262k             | 推理、视觉        |
| `grok-41-fast`           | Grok 4.1 Fast     | 262k             | 推理、视觉        |
| `grok-code-fast-1`       | Grok Code Fast 1  | 262k             | 推理、编程        |
| `kimi-k2-thinking`       | Kimi K2 Thinking  | 262k             | 推理              |
| `minimax-m21`            | MiniMax M2.1      | 202k             | 推理              |

---

## 模型发现

当设置了 `VENICE_API_KEY` 时，OpenClaw 会自动从 Venice API 发现模型。如果 API 不可达，则回退到静态目录。

`/models` 端点是公开的（列出模型不需要认证），但推理需要有效的 API 密钥。

---

## 流式传输和工具支持

| 功能               | 支持情况                                                |
| -------------------- | ------------------------------------------------------- |
| 流式传输 | 所有模型均支持 |
| 函数调用 | 大多数模型支持，具体看 API 中的 `supportsFunctionCalling` |
| 视觉/图像 | 标记了 "Vision" 特性的模型支持 |
| JSON 模式 | 通过 `response_format` 支持 |

---

## 定价

Venice 使用积分制。查看 [venice.ai/pricing](https://venice.ai/pricing) 了解当前费率：

- 私密模型通常成本更低。
- 匿名化模型接近直接 API 定价，另加少量 Venice 费用。

---

## 对比：Venice 与直接 API

| 方面       | Venice（匿名化）              | 直接 API            |
| ------------ | ----------------------------- | ------------------- |
| 隐私 | 元数据剥离，匿名化 | 关联你的账户 |
| 延迟 | 代理通常增加 10-50ms | 直连 |
| 功能 | 大多数功能支持 | 完整功能 |
| 计费 | Venice 积分 | 提供商计费 |

---

## 费用估算不是“免费”承诺

OpenClaw 对 bundled 模型优先采用 Venice 插件 manifest 的价格，即使模型来自在线发现。目录中新发现、但 manifest 未覆盖的模型可能显示零估算；这不表示 Provider 免费。

`grok-4-5` 和 `qwen-3-7-plus` 的扩展上下文价格分别在总输入**超过** 200,000 / 256,000 tokens 后适用于整个请求。总输入包括未缓存输入、缓存读取和缓存写入，不以输出量决定；恰好等于阈值仍用基础价格。

显式 `models.providers.venice.models[].cost` 优先，包括手写的零价格；onboarding 不会替你覆盖它们。旧配置若留下过时的零值，先备份再仅更新受影响的费用字段，保留有意设置的定制价格。实际价格以 [Venice 官方定价](https://venice.ai/pricing) 为准。

## 使用示例

```bash
# 使用默认私密模型
openclaw chat --model venice/llama-3.3-70b

# 通过 Venice 使用 Claude（匿名化）
openclaw chat --model venice/claude-opus-45

# 使用无审查模型
openclaw chat --model venice/venice-uncensored

# 使用视觉模型处理图像
openclaw chat --model venice/qwen3-vl-235b-a22b

# 使用编程模型
openclaw chat --model venice/qwen3-coder-480b-a35b-instruct
```

---

## 故障排查

### API 密钥未识别

```bash
openclaw models list --provider venice
```

确认密钥已配置且格式以 `vapi_` 开头；不要打印或分享完整密钥。

### 模型不可用

Venice 模型目录会动态更新。运行 `openclaw models list` 查看当前可用的模型。某些模型可能暂时离线。

### 连接问题

Venice API 地址为 `https://api.venice.ai/api/v1`。确保你的网络允许 HTTPS 连接。

---

## 配置文件示例

```json5
{
  env: { VENICE_API_KEY: "vapi_..." },
  agents: { defaults: { model: { primary: "venice/llama-3.3-70b" } } },
  models: {
    mode: "merge",
    providers: {
      venice: {
        baseUrl: "https://api.venice.ai/api/v1",
        apiKey: "${VENICE_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "llama-3.3-70b",
            name: "Llama 3.3 70B",
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
}
```

---

## 链接

- [Venice AI](https://venice.ai)
- [API 文档](https://docs.venice.ai)
- [定价](https://venice.ai/pricing)
- [状态](https://status.venice.ai)
