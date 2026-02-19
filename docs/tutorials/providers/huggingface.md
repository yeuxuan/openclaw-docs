---
title: "Hugging Face（推理）"
sidebarTitle: "Hugging Face"
---

# Hugging Face（推理）

[Hugging Face 推理提供商](https://huggingface.co/docs/inference-providers)通过单一路由 API 提供 OpenAI 兼容的聊天补全。你只需一个 Token 即可访问多种模型（DeepSeek、Llama 等）。OpenClaw 使用 **OpenAI 兼容端点**（仅聊天补全）；如需文本转图像、嵌入或语音功能，请直接使用 [HF 推理客户端](https://huggingface.co/docs/api-inference/quicktour)。

- 提供商：`huggingface`
- 认证：`HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`（细粒度 Token，需具备 **Make calls to Inference Providers** 权限）
- API：OpenAI 兼容（`https://router.huggingface.co/v1`）
- 计费：单一 HF Token；[定价](https://huggingface.co/docs/inference-providers/pricing)遵循提供商费率，包含免费层。

---

## 快速开始

1. 在 [Hugging Face → Settings → Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) 创建一个具备 **Make calls to Inference Providers** 权限的细粒度 Token。
2. 运行引导流程，在提供商下拉菜单中选择 **Hugging Face**，然后在提示时输入你的 API 密钥：

```bash
openclaw onboard --auth-choice huggingface-api-key
```

3. 在**默认 Hugging Face 模型**下拉菜单中，选择你想要的模型（当你有有效 Token 时，列表从推理 API 加载；否则显示内置列表）。你的选择将保存为默认模型。
4. 你也可以稍后在配置中设置或更改默认模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
    },
  },
}
```

---

## 非交互式示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

这将设置 `huggingface/deepseek-ai/DeepSeek-R1` 为默认模型。

---

## 环境说明

如果 Gateway 作为守护进程运行（launchd/systemd），请确保 `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN` 对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。

---

## 模型发现和引导下拉菜单

OpenClaw 通过直接调用**推理端点**来发现模型：

```bash
GET https://router.huggingface.co/v1/models
```

（可选：发送 `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` 或 `$HF_TOKEN` 获取完整列表；某些端点在无认证时返回子集。）响应为 OpenAI 风格的 `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`。

当你配置了 Hugging Face API 密钥（通过引导流程、`HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`）时，OpenClaw 使用此 GET 请求发现可用的聊天补全模型。在**交互式引导**过程中，输入 Token 后你会看到一个从该列表填充的**默认 Hugging Face 模型**下拉菜单（如果请求失败则使用内置目录）。在运行时（如 Gateway 启动时），当密钥存在时，OpenClaw 会再次调用 **GET** `https://router.huggingface.co/v1/models` 来刷新目录。该列表与内置目录合并（用于上下文窗口和费用等元数据）。如果请求失败或未设置密钥，则仅使用内置目录。

---

## 模型名称和可编辑选项

- **来自 API 的名称：** 当 API 返回 `name`、`title` 或 `display_name` 时，模型显示名称从 **GET /v1/models** 获取；否则从模型 ID 派生（例如 `deepseek-ai/DeepSeek-R1` → "DeepSeek R1"）。
- **覆盖显示名称：** 你可以在配置中为每个模型设置自定义标签，使其在 CLI 和 UI 中按你想要的方式显示：

```json5
{
  agents: {
    defaults: {
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
        "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
      },
    },
  },
}
```

- **提供商/策略选择：** 在**模型 ID** 后追加后缀来选择路由器如何选取后端：
  - **`:fastest`** — 最高吞吐量（路由器选择；提供商选择被**锁定** — 无交互式后端选择器）。
  - **`:cheapest`** — 每输出 Token 最低成本（路由器选择；提供商选择被**锁定**）。
  - **`:provider`** — 强制指定后端（例如 `:sambanova`、`:together`）。

  当你选择 **:cheapest** 或 **:fastest**（例如在引导模型下拉菜单中），提供商被锁定：路由器按成本或速度决定，不会显示可选的"偏好特定后端"步骤。你可以将这些作为单独条目添加到 `models.providers.huggingface.models` 中，或使用带后缀的 `model.primary`。你也可以在[推理提供商设置](https://hf.co/settings/inference-providers)中设置默认顺序（无后缀 = 使用该顺序）。

- **配置合并：** `models.providers.huggingface.models` 中的现有条目（例如 `models.json` 中的）在配置合并时会保留。因此你在那里设置的任何自定义 `name`、`alias` 或模型选项都会保留。

---

## 模型 ID 和配置示例

模型引用使用 `huggingface/<org>/<model>` 格式（Hub 风格的 ID）。以下列表来自 **GET** `https://router.huggingface.co/v1/models`；你的目录可能包含更多。

**示例 ID（来自推理端点）：**

| 模型                   | 引用（加上 `huggingface/` 前缀）    |
| ---------------------- | ----------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`           |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`         |
| Qwen3 8B               | `Qwen/Qwen3-8B`                     |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`          |
| Qwen3 32B              | `Qwen/Qwen3-32B`                    |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`  |
| GPT-OSS 120B           | `openai/gpt-oss-120b`               |
| GLM 4.7                | `zai-org/GLM-4.7`                   |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`              |

你可以在模型 ID 后追加 `:fastest`、`:cheapest` 或 `:provider`（例如 `:together`、`:sambanova`）。在[推理提供商设置](https://hf.co/settings/inference-providers)中设置默认顺序；参见[推理提供商](https://huggingface.co/docs/inference-providers)和 **GET** `https://router.huggingface.co/v1/models` 获取完整列表。

### 完整配置示例

**以 DeepSeek R1 为主，Qwen 为后备（Fallback）：**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-R1",
        fallbacks: ["huggingface/Qwen/Qwen3-8B"],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
      },
    },
  },
}
```

**Qwen 为默认，带 :cheapest 和 :fastest 变体：**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen3-8B" },
      models: {
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
        "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (cheapest)" },
        "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (fastest)" },
      },
    },
  },
}
```

**DeepSeek + Llama + GPT-OSS 带别名：**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
        fallbacks: [
          "huggingface/meta-llama/Llama-3.3-70B-Instruct",
          "huggingface/openai/gpt-oss-120b",
        ],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
        "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
        "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
      },
    },
  },
}
```

**强制指定后端（:provider）：**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1:together" },
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1:together": { alias: "DeepSeek R1 (Together)" },
      },
    },
  },
}
```

**多个 Qwen 和 DeepSeek 模型带策略后缀：**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
      models: {
        "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
        "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (cheap)" },
        "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fast)" },
        "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
      },
    },
  },
}
```
