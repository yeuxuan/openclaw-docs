---
title: "Ollama"
sidebarTitle: "Ollama"
description: "OpenClaw 模型接入：Ollama。Ollama 是一个本地 LLM 运行时，可以轻松在你的机器上运行开源模型。OpenClaw 集成了 Ollama 的原生 API（），支持流式传输和工具调…"
---

# Ollama

Ollama 是本地模型运行时。OpenClaw 默认使用其原生 `/api/chat`，支持流式传输和工具调用。模型目录发现、首次向导自动推荐、实际请求上下文是三套不同判断，不要把“磁盘上已安装”当成“向导一定自动选中”。

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

3. 为本机无鉴权 Ollama 启用发现（占位值即可；远程受保护服务仍要使用有效凭据）：

```bash
# 设置环境变量
export OLLAMA_API_KEY="ollama-local"
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

Ollama 要先在 Agent 的模型范围内。使用 `OLLAMA_API_KEY`（或认证档案）、且没有显式端点时，默认发现本机 `http://127.0.0.1:11434`：

- 查询 `/api/tags` 和 `/api/show`
- `/api/show` 尽力读取原生窗口、Modelfile `num_ctx`、视觉/工具/思考能力
- 报告 `vision` 时标记图片输入；优先根据 `thinking` 判断推理能力，缺少元数据时可能使用名称规则
- `maxTokens` 使用 OpenClaw 的 Ollama 输出上限，不是上下文窗口的 10 倍
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

只有**非空** `models.providers.ollama.models` 才选择手动目录并跳过发现。自托管端点配置 `models: []` 仍可发现；只填 `models.providers.ollama.apiKey` 并不会自动把该 Provider 选入 Gateway 浏览范围。托管 `https://ollama.com` 不走本地发现。

没有显式 Ollama 端点时，非 loopback 的自定义 `api: "ollama"` Provider 会阻止顺带探测 localhost；此类自定义 Provider 应手动列模型。loopback 自定义地址仍允许本地发现。

### 首次向导为什么没有自动选择已安装模型

首次向导只把 `/api/ps` 显示**已加载到内存**、且 `/api/show` 确认支持工具和至少 16K 上下文的模型作为自动候选；不会为了发现去拉取或加载空闲模型。保存路线前还必须通过真实 completion。

桌面 Model Setup 想用已安装但空闲的模型，可在 Ollama 卡选择 **Choose connection → Local only**，由明确的配置流程准备模型并做在线检查。没有合适工具模型时，向导可先征求拉取授权，不会把自动发现等同于自动下载。

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
            maxTokens: 8192
          }
        ]
      }
    }
  }
}
```

如果设置了 `OLLAMA_API_KEY`，你可以在提供商条目中省略 `apiKey`，OpenClaw 会自动填充以进行可用性检查。

### 自定义基础 URL（显式配置）

如果 Ollama 运行在不同主机或端口，希望继续自动发现，可配置空模型列表：

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434",
        api: "ollama",
        models: [],
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

OpenClaw 的 Ollama 集成默认使用原生 Ollama API（`/api/chat`），完全支持同时进行流式传输和工具调用。无需特殊配置。

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

`contextWindow` 描述模型原生能力；`contextTokens` 限制实际输入预算；`maxTokens` 限制输出。原生 `/api/chat` 的 `options.num_ctx` 依次取有效的正数 `params.num_ctx`、模型生效的 `contextTokens`。本地发现通常把后者限制为 32,768 或更小原生窗口，因此即使没写 `params.num_ctx`，也可能覆盖更小的 Modelfile 默认值。

只有前两项都不存在时，才由 Ollama 的 Modelfile、环境或显存默认值决定；原生适配器不会直接退回 `contextWindow`。零、负数、非有限值的 `params.num_ctx` 会被忽略。OpenAI 兼容适配器则依次看 `params.num_ctx`、`contextTokens`、`contextWindow`；上游拒绝 `options` 时可设 `injectNumCtxForOpenAICompat: false`。

长上下文导致首字慢或内存不足时，同时降低 `contextTokens` 和 `params.num_ctx`；只降低 `maxTokens` 只会限制生成长度。旧配置先执行 `openclaw doctor --fix` 再核对模型条目。

---

## 故障排查

### Ollama 未被检测到

确保 Ollama 正在运行并在 Agent 的模型范围内；默认本地发现需要 `OLLAMA_API_KEY` 或认证档案。检查是否被非空手动模型列表关闭了发现，自托管端点的 `models: []` 不会关闭发现：

```bash
ollama serve
```

并确保 API 可以访问：

```bash
curl http://localhost:11434/api/tags
```

### 没有可用模型

首次向导自动推荐需要已加载、支持工具且至少 16K 上下文。如果你的模型没有被推荐，可以：

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

- [模型提供商](/tutorials/concepts/model-providers) - 所有提供商概览
- [模型选择](/tutorials/concepts/models) - 如何选择模型
- [配置](/tutorials/gateway/configuration) - 完整配置参考
