---
title: "Fish Audio"
sidebarTitle: "Fish Audio"
description: "在 OpenClaw 中使用 Fish Audio 托管 TTS，或在 Apple silicon Mac 上使用本地 S2 Pro。"
---

# Fish Audio

OpenClaw 有两条 Fish Audio 路线：

- 托管 S2.1：Gateway 的 `fish-audio` 语音 Provider，可用于通道、语音消息、Talk 和电话。
- 本地 S2 Pro：原生 macOS App 通过 `mlx` Talk Provider 运行，不需要 Fish API Key。

## 托管 TTS

```bash
openclaw plugins install @openclaw/fish-audio-speech
export FISH_API_KEY="..."
```

配置示例：

```json5
{
  tts: {
    auto: "tagged",
    provider: "fish-audio",
    providers: {
      "fish-audio": {
        apiKey: "${FISH_API_KEY}",
        model: "s2.1-pro",
        speakerVoiceId: "<可选 voice id>",
        latency: "balanced",
      },
    },
  },
}
```

`speakerVoiceId` 可省略。可用 `/tts status` 检查当前 Provider，用 `/tts audio <text>` 做单次测试。创建或克隆 Voice 属于需要本人同意的独立操作，OpenClaw Provider 只使用已存在的 Voice ID。

## Apple silicon 本地 Talk

```json5
{
  talk: {
    provider: "mlx",
    providers: {
      mlx: { modelId: "mlx-community/fish-audio-s2-pro-8bit" },
    },
  },
}
```

首次使用会下载约 6.8 GB。该路线只适用于原生 macOS Talk；其他通道和客户端仍使用 Gateway 选择的托管语音 Provider。

::: warning 许可证
可下载的 S2 Pro 权重使用 Fish Audio Research License，商业使用需要单独许可；托管 API 则遵守 Fish Audio 服务条款。
:::

上游来源：[`docs/providers/fish-audio.md`](https://github.com/openclaw/openclaw/blob/main/docs/providers/fish-audio.md)。
