---
title: "Image Generation"
sidebarTitle: "图像生成"
---

# Image Generation：让 Agent 生成或编辑图片

`image_generate` 工具可以让 Agent 根据文字生成图片，也可以参考已有图片做编辑。

它不是“看图理解”。看图理解属于视觉模型或媒体理解。
这一页讲的是“产出图片”。

---

## 快速开始

你需要至少配置一个图像生成提供商，例如：

- OpenAI。
- Google Gemini。
- MiniMax。
- fal。
- DeepInfra。
- OpenRouter。
- LiteLLM。
- ComfyUI。
- xAI。

常见环境变量：

```bash
export OPENAI_API_KEY="..."
export GEMINI_API_KEY="..."
export MINIMAX_API_KEY="..."
```

也可以在配置中指定默认模型：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2.5-flare",
        timeoutMs: 180000
      }
    }
  }
}
```

---

## 怎么使用？

你直接对 Agent 说：

```text
帮我生成一张适合 OpenClaw 教程首页的友好机器人插图。
```

如果工具可用，Agent 会自动调用 `image_generate`，生成结果会作为媒体附件发回。

---

## 生成和编辑的区别

| 模式 | 需要什么 |
|------|----------|
| 生成 | 文字 prompt |
| 编辑 | 文字 prompt + 一张或多张参考图 |

不同提供商支持的参考图数量、透明背景、尺寸和质量参数不同。Agent 会尽量按提供商能力转发，提供商不支持的参数可能会被忽略。

GPT Image 2.5 可显式选择：

| 路线 | 模型 |
|------|------|
| OpenAI | `openai/gpt-image-2.5-flare` / `openai/gpt-image-2.5-sunburst` |
| fal | `fal/openai/gpt-image-2.5/flare/text-to-image` / `fal/openai/gpt-image-2.5/sunburst/text-to-image` |

OpenAI 路线需要显式 API Key，最多使用 5 张参考图；fal 路线需要 `FAL_KEY`，编辑
最多 16 张参考图。两条路线都可返回最多 4 张图片，并支持透明背景与 WebP。

---

## 安全提醒

如果你配置的是局域网或内网 OpenAI-compatible 图片服务，需要显式允许私有网络访问。默认拦截内网地址是为了防 SSRF。

不要为了省事把内网图片端点暴露给不可信用户。

---

## 继续阅读

- [旧版图像生成页](/tutorials/tools/image-generate)
- [媒体能力总览](/tutorials/tools/media-overview)
- [视频生成](/tutorials/tools/video-generation)
