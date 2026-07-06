---
title: "选择 AI 大脑（模型提供商）"
sidebarTitle: "选择 AI 大脑"
---

# 选择 AI 大脑：模型提供商

OpenClaw 自己不是大模型。
它更像一个可靠的“总管”：收到消息，整理上下文，调用工具，然后把任务交给后面的 AI 大脑。

这个 AI 大脑可以来自 OpenAI、Anthropic、Google、OpenRouter，也可以是你自己用 Ollama、vLLM、SGLang 之类服务跑起来的本地模型。

---

## 先讲人话

你问 OpenClaw 一个问题时，OpenClaw 本身负责“接待、整理、转交、回复”。
真正写答案的，是后面的模型服务。

Provider 就是“这颗 AI 大脑由谁提供”。
比如：

- OpenAI 提供 ChatGPT 系列模型。
- Anthropic 提供 Claude 系列模型。
- Ollama 让模型在你自己电脑上跑。
- OpenRouter 像模型超市，一个账号能试很多家。

第一次只要选一个能稳定访问、能正常付费或能本地运行的 Provider。

---

## 新手怎么选

如果你只是想先跑起来，不要一上来纠结几十个模型。

| 场景 | 推荐选择 | 为什么 |
|------|----------|--------|
| 第一次使用，想少折腾 | OpenAI 或 Anthropic | 文档多、能力强、问题好排查 |
| 想一个账号试很多模型 | OpenRouter | 像模型超市，方便切换 |
| 更重视数据留在自己机器 | Ollama | 本地运行，不把内容发给外部模型服务 |
| 有服务器和显卡 | vLLM / SGLang / LiteLLM | 适合自托管和团队统一入口 |
| 国内网络访问海外服务不稳定 | Qwen、Moonshot、GLM、MiniMax 等 | 中文体验和访问稳定性通常更友好 |

::: tip 最简单的判断
能稳定访问哪家，就先用哪家。
OpenClaw 支持以后再换模型，不需要第一天就做“终身选择”。
:::

---

## 配置方式

最推荐从向导开始：

```bash
openclaw onboard --install-daemon
```

向导会带你完成几件事：

1. 选择模型提供商
2. 填入 API Key 或本地模型地址
3. 保存配置
4. 安装并启动 Gateway 后台服务
5. 打开 Web 控制 UI 检查状态

已经装好以后，也可以打开控制台：

```bash
openclaw dashboard
```

默认地址通常是：

```text
http://127.0.0.1:18789/
```

如果你不知道该在哪里填 API Key，先运行向导，不要手动翻配置文件。向导就是给第一次配置准备的。

---

## API Key 是什么

API Key 就像模型服务的“门钥匙”。
OpenClaw 拿着这把钥匙去请求模型，模型服务按你的账号计费。

常见入口：

- OpenAI：[platform.openai.com](https://platform.openai.com)
- Anthropic：[console.anthropic.com](https://console.anthropic.com)
- OpenRouter：[openrouter.ai](https://openrouter.ai)

::: warning 把钥匙收好
API Key 不要发到群里，不要写进公开仓库，也不要贴到截图里。
别人拿到你的 Key，就可能花你的钱。
:::

---

## 主流提供商

下面是“云端模型”。你的消息会发到对应服务商，由它们返回答案。

- [OpenAI](/tutorials/providers/openai)：OpenAI API、兼容端点和常见配置
- [Anthropic](/tutorials/providers/anthropic)：Claude 系列模型
- [Google Gemini](/tutorials/providers/google)：文本、多模态与媒体能力
- [OpenRouter](/tutorials/providers/openrouter)：一个入口访问多家模型
- [ClawRouter](/tutorials/providers/clawrouter)：团队统一模型入口，带策略和预算边界
- [Cohere](/tutorials/providers/cohere)：兼容 OpenAI 的 Command A 路线
- [Mistral](/tutorials/providers/mistral)：Mistral 系列模型
- [Groq](/tutorials/providers/groq)：高速推理
- [Cerebras](/tutorials/providers/cerebras)：高速推理服务
- [GMI Cloud](/tutorials/providers/gmi)：一个账号访问多家托管模型路线
- [NovitaAI](/tutorials/providers/novita)：托管开源和第三方模型路线

---

## 国内模型

- [Moonshot / Kimi](/tutorials/providers/moonshot)
- [通义千问 Qwen](/tutorials/providers/qwen)
- [Qwen OAuth / Portal](/tutorials/providers/qwen-oauth)：旧版 Portal/OAuth 凭证迁移入口
- [GLM 智谱](/tutorials/providers/glm)
- [DeepSeek](/tutorials/providers/deepseek)
- [MiniMax](/tutorials/providers/minimax)
- [百度千帆 Qianfan](/tutorials/providers/qianfan)
- [StepFun 阶跃星辰](/tutorials/providers/stepfun)
- [Tencent](/tutorials/providers/tencent)
- [Volcengine 火山引擎](/tutorials/providers/volcengine)
- [Alibaba Model Studio](/tutorials/providers/alibaba)
- [小米 AI](/tutorials/providers/xiaomi)
- [ZAI](/tutorials/providers/zai)

这些提供商更适合国内网络环境，也常常有不错的中文能力。

---

## 本地与自托管

下面是“自己管模型”的路线。
它更可控，但也更像自己在家照顾一台机器：要关心模型文件、内存、显卡和服务是否在线。

- [Ollama](/tutorials/providers/ollama)：最容易上手的本地模型方式
- [Ollama Cloud](/tutorials/providers/ollama-cloud)：不运行本地 Ollama 服务，直接调用 Ollama 托管模型
- [vLLM](/tutorials/providers/vllm)：适合服务器和高性能推理
- [SGLang](/tutorials/providers/sglang)：自托管推理服务路线
- [LM Studio](/tutorials/providers/lmstudio)：桌面本地模型入口
- [LiteLLM](/tutorials/providers/litellm)：把多家模型包装成统一接口
- [Together AI](/tutorials/providers/together)
- [HuggingFace](/tutorials/providers/huggingface)
- [NVIDIA NIM](/tutorials/providers/nvidia)
- [DeepInfra](/tutorials/providers/deepinfra)
- [Fireworks](/tutorials/providers/fireworks)
- [Chutes](/tutorials/providers/chutes)
- [Inferrs](/tutorials/providers/inferrs)

自托管的好处是可控，代价是你要自己照顾机器、显卡、模型文件和服务稳定性。

---

## 网关与代理

如果你们是团队，常见做法不是每个人都直接填自己的模型 Key，而是先接一个统一网关。

把它想成公司统一买了一张门禁卡，大家通过公司入口访问模型。这样更方便统计费用，也更容易统一管理权限。

- [Cloudflare AI Gateway](/tutorials/providers/cloudflare-ai-gateway)
- [Vercel AI Gateway](/tutorials/providers/vercel-ai-gateway)
- [Kilo Gateway](/tutorials/providers/kilocode)
- [ClawRouter](/tutorials/providers/clawrouter)
- [自定义模型提供商](/tutorials/providers/custom)

---

## 语音与媒体 Provider

- [Azure Speech](/tutorials/providers/azure-speech)
- [ElevenLabs](/tutorials/providers/elevenlabs)
- [Gradium](/tutorials/providers/gradium)
- [SenseAudio](/tutorials/providers/senseaudio)
- [ComfyUI](/tutorials/providers/comfy)
- [fal](/tutorials/providers/fal)
- [Runway](/tutorials/providers/runway)
- [Vydra](/tutorials/providers/vydra)
- [xAI](/tutorials/providers/xai)
- [Inworld](/tutorials/providers/inworld)

这样做的好处是：统一计费、统一限流、统一审计，也更方便替换后端模型。

---

## 常见问题

::: details 可以同时配置多个模型吗？
可以。OpenClaw 支持多提供商和模型回退。主模型失败时，可以切到备用模型。
:::

::: details 本地模型是不是一定更便宜？
不一定。个人电脑上用 Ollama 可能很省钱；但如果你买云服务器和显卡，机器费用也要算进去。
:::

::: details 哪个模型最强？
这个问题会随时间变化。更稳妥的做法是：选一个当前稳定可用的主模型，再配一个备用模型。本站会尽量讲配置方法，不把某个模型写成永久答案。
:::

::: details OpenClaw 支持 OpenAI 兼容接口吗？
支持。很多服务都提供 OpenAI 兼容接口，你可以参考 [自定义模型提供商](/tutorials/providers/custom) 接入。
:::
