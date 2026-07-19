---
title: "Featherless AI"
sidebarTitle: "Featherless AI"
description: "OpenClaw 模型接入：Featherless AI。适合想通过 OpenAI 兼容接口接入开源模型的人。"
---

# Featherless AI

Featherless AI 可以理解成“托管开源模型的 OpenAI 兼容入口”。

如果你不想自己搭 vLLM / SGLang，但又想用 Qwen、Kimi 一类开源或开放模型，Featherless 是一条比较省事的路线。

先记住 4 个事实：

- Provider id 是 `featherless`
- API Key 环境变量是 `FEATHERLESS_API_KEY`
- 默认地址是 `https://api.featherless.ai/v1`
- OpenClaw 默认模型是 `featherless/Qwen/Qwen3-32B`

---

## 适合什么场景

适合：

- 想少折腾，直接用托管开源模型
- 需要 OpenAI 兼容接口，方便和已有工具链接轨
- 想先体验 Qwen 3 这一类自带工具调用能力的模型

不太适合：

- 你已经自己有本地推理服务
- 你强依赖官方内置模型目录里“完整列出所有模型”

Featherless 的模型很多，但 OpenClaw 不会把它整份公开目录都无脑塞进选择器里。
对未知模型，OpenClaw 会按更保守的默认能力处理。

---

## 快速开始

如果当前环境还没装对应 provider 插件，先安装：

```bash
openclaw plugins install @openclaw/featherless-provider
openclaw gateway restart
```

然后走向导：

```bash
openclaw onboard --auth-choice featherless-api-key
```

无交互写法：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice featherless-api-key \
  --featherless-api-key "$FEATHERLESS_API_KEY"
```

检查是否接通：

```bash
openclaw models list --provider featherless
```

---

## 常用配置

```json5
{
  env: {
    FEATHERLESS_API_KEY: "<your-key>",
  },
  agents: {
    defaults: {
      model: {
        primary: "featherless/Qwen/Qwen3-32B",
      },
    },
  },
}
```

如果 Gateway 是后台服务、Docker 容器或守护进程，只在当前 shell 里 `export FEATHERLESS_API_KEY=...` 往往不够。
要把变量放进 Gateway 真正启动时能读到的环境里。

---

## 自定义其他模型

如果你想切到别的 Featherless 模型，通常直接写完整模型引用即可：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "featherless/moonshotai/Kimi-K2-Instruct",
      },
    },
  },
}
```

如果某个模型其实支持图像输入、更大的上下文或不同输出上限，而 OpenClaw 默认没识别到，就手动补模型元数据：

```json5
{
  models: {
    mode: "merge",
    providers: {
      featherless: {
        baseUrl: "https://api.featherless.ai/v1",
        apiKey: "${FEATHERLESS_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-3-27b-it",
            name: "Gemma 3 27B",
            input: ["text", "image"],
            reasoning: false,
            contextWindow: 32768,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

---

## 常见问题

### 为什么模型列表是空的

先查这三件事：

1. 插件有没有装上并启用
2. `FEATHERLESS_API_KEY` Gateway 进程是否真的能读到
3. 你写的 provider 是否确实是 `featherless`

### 为什么模型调用退化成普通文本回复

优先确认你选的模型是否真的支持原生工具调用。
如果只是“兼容聊天接口”但没有可靠 tool calling，OpenClaw 侧也救不回来。

### 为什么我填了模型名却报 unknown model

很多时候不是模型不存在，而是模型 id 大小写或路径不对。
Featherless 这里最好直接用它官方目录里的完整 id，再加上 `featherless/` 前缀。

---

## 相关页面

- [模型提供商总览](/tutorials/providers/)
- [模型提供商概念](/tutorials/concepts/model-providers)
- [Thinking 模式](/tutorials/tools/thinking)

