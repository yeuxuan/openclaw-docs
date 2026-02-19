---
title: "NVIDIA"
sidebarTitle: "NVIDIA"
---

# NVIDIA

NVIDIA 在 `https://integrate.api.nvidia.com/v1` 提供 OpenAI 兼容的 API，支持 Nemotron 和 NeMo 模型。使用来自 [NVIDIA NGC](https://catalog.ngc.nvidia.com/) 的 API 密钥进行认证。

---

## CLI 设置

导出密钥后运行引导流程并设置 NVIDIA 模型：

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/llama-3.1-nemotron-70b-instruct
```

如果你仍然使用 `--token` 参数，请注意它会出现在 shell 历史记录和 `ps` 输出中；尽可能使用环境变量。

---

## 配置示例

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/llama-3.1-nemotron-70b-instruct" },
    },
  },
}
```

---

## 模型 ID

- `nvidia/llama-3.1-nemotron-70b-instruct`（默认）
- `meta/llama-3.3-70b-instruct`
- `nvidia/mistral-nemo-minitron-8b-8k-instruct`

---

## 注意事项

- OpenAI 兼容的 `/v1` 端点；使用来自 NVIDIA NGC 的 API 密钥。
- 当设置了 `NVIDIA_API_KEY` 时提供商自动启用；使用静态默认值（131,072 Token 上下文窗口，4,096 最大 Token）。
