---
title: "选择 AI 大脑（模型提供商）"
sidebarTitle: "选择 AI 大脑"
---

# 选择 AI 大脑——模型提供商

## 什么是"模型提供商"？

OpenClaw 本身只是一个"管家"，它把消息传递给真正的 AI 模型，AI 模型处理后再把回复传回来。

**"模型提供商"就是你租用 AI 大脑的地方。** 就像手机需要 SIM 卡才能打电话，OpenClaw 需要你提供一个 AI 服务的"密钥"才能让 AI 帮你干活。

常见的选择：
- **Anthropic（Claude）**——Anthropic 公司的 Claude 模型，能力强，中文好
- **OpenAI（ChatGPT）**——OpenAI 公司的 GPT 模型，最知名
- **Ollama（本地运行）**——完全免费，在你自己的电脑上运行，不需要联网，但对电脑性能要求高

---

## 我该选哪个？

| 提供商 | 特点 | 是否收费 | 推荐程度 |
|--------|------|---------|---------|
| **Anthropic (Claude)** | 能力强，中文优秀 | 按使用量收费 | ⭐⭐⭐ 推荐 |
| **OpenAI (ChatGPT)** | 最知名，功能全面 | 按使用量收费 | ⭐⭐⭐ 推荐 |
| **Ollama（本地）** | 完全免费，隐私好 | 完全免费 | ⭐⭐ 适合有高配电脑的用户 |
| **OpenRouter** | 汇聚多家模型，按需选 | 按使用量收费 | ⭐⭐ 适合想灵活选模型的用户 |
| **Moonshot (Kimi)** | 中国团队，中文好 | 按使用量收费 | ⭐⭐ 国内用户可考虑 |
| **Qwen（通义千问）** | 阿里巴巴，中文好 | 按使用量收费 | ⭐⭐ 国内用户可考虑 |

> **不知道选哪个？** 从 **Anthropic (Claude)** 开始，它是 OpenClaw 官方推荐的首选。

---

## 如何配置？

### 第一步：获取 API 密钥

根据你选择的提供商，去对应的官网注册并创建 API 密钥：

- **Anthropic**：[console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key
- **OpenAI**：[platform.openai.com](https://platform.openai.com) → API Keys → Create New

::: tip API 密钥长什么样？
- Anthropic 密钥：以 `sk-ant-` 开头
- OpenAI 密钥：以 `sk-` 开头

**请妥善保管，不要分享给别人！** 别人用了你的密钥，费用会算在你头上。
:::

### 第二步：填入 OpenClaw

运行配置命令：

```bash
openclaw configure
```

向导会问你选择哪个提供商，然后让你输入 API 密钥，按提示操作就好。

---

## 各提供商详细配置

### 主流推荐

- [Anthropic (Claude)](/tutorials/providers/anthropic) — 推荐新手从这里开始
- [OpenAI (ChatGPT)](/tutorials/providers/openai) — OpenAI API 配置
- [Ollama（本地模型，完全免费）](/tutorials/providers/ollama) — 在自己电脑上运行 AI
- [OpenRouter](/tutorials/providers/openrouter) — 一个账号访问多家 AI

### 国内模型

- [Moonshot (Kimi)](/tutorials/providers/moonshot) — 国内用户友好
- [通义千问 (Qwen)](/tutorials/providers/qwen) — 阿里巴巴的 AI 模型
- [GLM（智谱 AI）](/tutorials/providers/glm) — 智谱 AI
- [MiniMax（海螺 AI）](/tutorials/providers/minimax) — 国内模型
- [百度千帆 (Qianfan)](/tutorials/providers/qianfan) — 百度 AI 开放平台
- [小米 AI](/tutorials/providers/xiaomi) — 小米大模型
- [ZAI](/tutorials/providers/zai) — ZAI 模型服务

### 云平台与企业方案

- [AWS Bedrock](/tutorials/providers/bedrock) — 亚马逊云 AI 服务
- [Cloudflare AI Gateway](/tutorials/providers/cloudflare-ai-gateway) — Cloudflare AI 网关代理
- [Vercel AI Gateway](/tutorials/providers/vercel-ai-gateway) — Vercel AI 网关代理
- [NVIDIA](/tutorials/providers/nvidia) — NVIDIA NIM 推理服务
- [GitHub Copilot](/tutorials/providers/github-copilot) — GitHub Copilot API
- [HuggingFace](/tutorials/providers/huggingface) — HuggingFace 推理端点

### 本地与自托管

- [vLLM](/tutorials/providers/vllm) — 高性能本地大模型推理
- [LiteLLM](/tutorials/providers/litellm) — 统一接口代理多家模型
- [Together AI](/tutorials/providers/together) — Together 推理服务
- [Venice AI](/tutorials/providers/venice) — Venice 隐私优先推理
- [OpenCode](/tutorials/providers/opencode) — OpenCode 兼容端点

### 自定义接入

- [自定义模型提供商](/tutorials/providers/custom) — 接入任意 OpenAI / Anthropic 兼容 API，或自建推理服务

### 其他与特殊用途

- [Claude Max API 代理](/tutorials/providers/claude-max-api-proxy) — 通过代理访问 Claude Max
- [Deepgram](/tutorials/providers/deepgram) — 语音转文字（ASR）
- [Synthetic（测试用）](/tutorials/providers/synthetic) — 本地测试 / 模拟回复
- [模型选择参考](/tutorials/providers/models) — 各模型能力与适用场景对比

---

## 常见问题

::: details API 密钥需要花多少钱？

大多数 AI 服务都是"按量计费"——你用多少，付多少。每次对话消耗的钱非常少（通常是几分到几毛钱人民币）。

如果你只是个人日常使用，每月花费通常在 1-10 美元之间。

很多服务还有免费额度，Anthropic 和 OpenAI 新用户都有一定的免费试用额度。

:::

::: details 能同时配置多个提供商吗？

可以！OpenClaw 支持配置多个提供商，如果主要提供商不可用，可以自动切换到备用提供商（"模型回退"功能）。

:::

::: details 想完全免费用，怎么办？

使用 Ollama 可以在本地运行开源 AI 模型，完全免费，数据也不会上传到外部服务器。

缺点：需要较好的电脑（建议显卡内存 8GB 以上），并且开源模型的能力可能不如 Claude 或 GPT-4 强。

[查看 Ollama 配置教程](/tutorials/providers/ollama)

:::
