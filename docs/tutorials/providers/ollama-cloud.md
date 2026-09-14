---
title: "Ollama Cloud"
sidebarTitle: "Ollama Cloud"
description: "OpenClaw 模型接入：直接使用 Ollama Cloud 托管模型，不依赖本地 Ollama 服务。"
---

# Ollama Cloud

Ollama Cloud 是 Ollama 的托管模型 API。它让 OpenClaw 可以直接调用云端 Ollama 模型，不需要在本机安装或运行 `ollama serve`。

这个 Provider 使用 `ollama-cloud`，模型引用形如 `ollama-cloud/kimi-k3`。它走 Ollama 原生 `/api/chat` 风格，不是 OpenAI 兼容 `/v1` 路线。

如果你要使用本地 Ollama、混合本地加云端、embedding 或自定义 host，请看 [Ollama](/tutorials/providers/ollama)。

---

## 快速设置

在 [ollama.com/settings/keys](https://ollama.com/settings/keys) 创建 API Key 后运行：

```bash
openclaw onboard --auth-choice ollama-cloud
```

也可以用环境变量：

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>"
```

---

## 默认信息

| 项 | 值 |
|----|----|
| Provider | `ollama-cloud` |
| Base URL | `https://ollama.com` |
| 环境变量 | `OLLAMA_API_KEY` |
| API 风格 | Ollama 原生 `/api/chat` |
| 示例模型 | `ollama-cloud/kimi-k3` |

---

## 什么时候选 Ollama Cloud

- 你想使用托管 Ollama 模型，但不想维护本地 Ollama 服务。
- 你想保持 Ollama 原生 chat API 语义。
- 你需要一个简单的云端模型入口。
- 你不需要本地模型拉取、本地 GPU 控制或纯内网推理。

如果本地模型名称在 Ollama Cloud 目录里不存在，就继续使用 `ollama` Provider 指向你的本地 host。

---

## 模型列表

OpenClaw 会从云端目录发现模型。常见 hosted id 包括：

- `ollama-cloud/gpt-oss:20b`
- `ollama-cloud/kimi-k3`
- `ollama-cloud/deepseek-v4-flash`
- `ollama-cloud/minimax-m3`
- `ollama-cloud/glm-5.2`

使用前先查当前账号可用模型：

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k3
```

实时发现为空时，OpenClaw 会回退到内置的 `minimax-m2.7`、`minimax-m3`、`kimi-k3`、`glm-5.1` 和 `glm-5.2`。旧的 `kimi-k2.5` 只为已有精确引用保留 deprecated 标记，不应再作为当前托管模型推荐。

---

## 故障排查

- 提示需要 `OLLAMA_API_KEY`：这里必须是真实 Ollama Cloud API Key，`ollama-local` 只适合本地 Provider。
- Unknown model：运行 `openclaw models list --provider ollama-cloud`，复制云目录里的完整模型 ID。
- 工具调用或 JSON 异常：确认没有误用 OpenAI 兼容 `/v1` URL。Ollama 路线应使用原生 base URL，不带 `/v1`。
