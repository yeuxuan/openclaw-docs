---
title: "Voice Call"
sidebarTitle: "Voice Call"
---

# Voice Call 插件

Voice Call 插件用于实时语音通话、流式 STT/TTS 和电话类场景。

它比普通 TTS 更复杂，因为它涉及：

- 实时音频流。
- 低延迟转写。
- 中途打断。
- 语音回复。
- 通话状态。

先理解 [TTS](/tutorials/tools/tts) 和 [节点音频](/tutorials/nodes/audio)，再做 Voice Call。

## 新手排查

语音通话链路很长，至少包含：电话入口、STT、Agent、TTS、音频返回。
一段失败，用户听起来就是“没反应”。

先看：

```bash
openclaw voicecall status --json
openclaw logs --follow
```

## 实时通话的模型限制

`realtime.provider` 可省略：按 Provider 优先级选择首个已配置的实时语音 Provider，不是随便取第一个注册的插件。`realtime.providers` 点名的 Provider 仍会被发现，但插件禁用和 allow/deny 规则继续生效。

::: warning GPT-Live 不支持原生通话工具
GPT-Live 当前通过 Agent 委托工作，Voice Call bridge 无法调用 `openclaw_end_call` 或自定义 `realtime.tools`。需要模型主动挂断或调用这些工具时，使用 OpenAI GA Realtime 或 Google Gemini Live；选了 GPT-Live 并不会让委托自动获得这些控制能力。
:::

Realtime Provider 会话先关闭时（包括正常关闭），OpenClaw 也会结束电话连接，避免留下静音但未挂断的线路。排查时要区分 Provider 会话结束与运营商断流，不能只看 Agent 是否生成了最后一句话。
