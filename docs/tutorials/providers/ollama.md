---
title: "Ollama"
sidebarTitle: "Ollama"
---

# Ollama

Ollama 是一个本地 LLM 运行时，可以轻松在你的机器上运行开源模型。OpenClaw 集成了 Ollama 的原生 API（`/api/chat`），支持流式传输和工具调用，并且当你通过 `OLLAMA_API_KEY`（或认证配置文件）选择加入且未定义显式 `models.providers.ollama` 条目时，可以**自动发现支持工具调用的模型**。

---

## 快速开始

1. 安装 Ollama：[https://ollama.ai](https://ollama.ai)

2. 拉取模型：

```bash
ollama pull gpt-oss:20b
# 或
ollama pull llama3.3
# 或
ollama pull qwen2.5-coder:32b
# 或
ollama pull deepseek-r1:32b
```

3. 为 OpenClaw 启用 Ollama（任何值都可以；Ollama 不需要真实的密钥）：

```bash
# 设置环境变量
export OLLAMA_API_KEY="ollama-local"

# 或在配置文件中配置
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

4. 使用 Ollama 模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/gpt-oss:20b" },
    },
  },
}
```

---

## 模型发现（隐式提供商）

当你设置了 `OLLAMA_API_KEY`（或认证配置文件）且**未**定义 `models.providers.ollama` 时，OpenClaw 会从 `http://127.0.0.1:11434` 的本地 Ollama 实例发现模型：

- 查询 `/api/tags` 和 `/api/show`
- 仅保留报告 `tools` 能力的模型
- 当模型报告 `thinking` 时标记 `reasoning`
- 当可用时从 `model_info["<arch>.context_length"]` 读取 `contextWindow`
- 将 `maxTokens` 设置为上下文窗口的 10 倍
- 所有费用设置为 `0`

这避免了手动模型条目，同时保持目录与 Ollama 的功能对齐。

查看可用模型：

```bash
ollama list
openclaw models list
```

要添加新模型，只需使用 Ollama 拉取：

```bash
ollama pull mistral
```

新模型将被自动发现并可供使用。

如果你显式设置了 `models.providers.ollama`，自动发现将被跳过，你必须手动定义模型（见下文）。

---

## 配置

### 基本设置（隐式发现）

启用 Ollama 最简单的方式是通过环境变量：

```bash
export OLLAMA_API_KEY="ollama-local"
```

### 显式设置（手动模型）

在以下情况使用显式配置：

- Ollama 运行在其他主机/端口上。
- 你想强制指定上下文窗口或模型列表。
- 你想包含不报告工具支持的模型。

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
        apiKey: "ollama-local",
        api: "ollama",
        models: [
          {
            id: "gpt-oss:20b",
            name: "GPT-OSS 20B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

如果设置了 `OLLAMA_API_KEY`，你可以在提供商条目中省略 `apiKey`，OpenClaw 会自动填充以进行可用性检查。

### 自定义基础 URL（显式配置）

如果 Ollama 运行在不同的主机或端口上（显式配置会禁用自动发现，因此需要手动定义模型）：

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

### 模型选择

配置完成后，所有 Ollama 模型都可以使用：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

---

## 高级功能

### 推理模型

当 Ollama 在 `/api/show` 中报告 `thinking` 时，OpenClaw 会将模型标记为具有推理能力：

```bash
ollama pull deepseek-r1:32b
```

### 模型费用

Ollama 是免费的且在本地运行，因此所有模型费用都设置为 $0。

### 流式配置

OpenClaw 的 Ollama 集成默认使用**原生 Ollama API**（`/api/chat`），完全支持同时进行流式传输和工具调用。无需特殊配置。

#### 旧版 OpenAI 兼容模式

如果你需要使用 OpenAI 兼容端点（例如在仅支持 OpenAI 格式的代理后面），请显式设置 `api: "openai-completions"`：

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

注意：OpenAI 兼容端点可能不支持同时进行流式传输和工具调用。你可能需要在模型配置中使用 `params: { streaming: false }` 禁用流式传输。

### 上下文窗口

对于自动发现的模型，OpenClaw 使用 Ollama 报告的上下文窗口（如果可用），否则默认为 `8192`。你可以在显式提供商配置中覆盖 `contextWindow` 和 `maxTokens`。

---

## 故障排查

### Ollama 未被检测到

确保 Ollama 正在运行，且你设置了 `OLLAMA_API_KEY`（或认证配置文件），并且你**未**定义显式的 `models.providers.ollama` 条目：

```bash
ollama serve
```

并确保 API 可以访问：

```bash
curl http://localhost:11434/api/tags
```

### 没有可用模型

OpenClaw 只会自动发现报告工具支持的模型。如果你的模型未列出，可以：

- 拉取一个支持工具调用的模型，或
- 在 `models.providers.ollama` 中显式定义该模型。

添加模型：

```bash
ollama list  # 查看已安装的模型
ollama pull gpt-oss:20b  # 拉取支持工具调用的模型
ollama pull llama3.3     # 或其他模型
```

### 连接被拒绝

检查 Ollama 是否在正确的端口上运行：

```bash
# 检查 Ollama 是否在运行
ps aux | grep ollama

# 或重启 Ollama
ollama serve
```

---

## 另请参阅

- [模型提供商](/concepts/model-providers) - 所有提供商概览
- [模型选择](/concepts/models) - 如何选择模型
- [配置](/gateway/configuration) - 完整配置参考
