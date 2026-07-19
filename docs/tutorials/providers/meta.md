---
title: "Meta"
sidebarTitle: "Meta"
description: "OpenClaw 模型接入：Meta API。当前重点是 muse-spark-1.1 的接入方式。"
---

# Meta

Meta 这条 provider 线路目前最值得记住的是 `muse-spark-1.1`。
它不是“随便一个 OpenAI 兼容端点”，而是走 Responses API 语义的一条新接法。

先记住：

- Provider id 是 `meta`
- 鉴权变量是 `MODEL_API_KEY`
- 默认模型是 `meta/muse-spark-1.1`
- 默认地址是 `https://api.meta.ai/v1`

---

## 它和常见 OpenAI 兼容 provider 有什么不同

很多 provider 只是把聊天接口伪装成 OpenAI 风格。
Meta 这里更接近“按 Responses API 规则工作”的路线。

对普通使用者来说，最直接的影响是：

- 思考强度和推理参数有自己的约束
- 一些兼容 provider 的旧经验，不一定能原封不动套过来
- 如果你看到 `reasoning.effort` 之类字段，不要随便照搬别家的写法

---

## 快速开始

最省事的方式是直接走向导：

```bash
openclaw onboard --auth-choice meta-api-key
```

无交互写法：

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

然后检查：

```bash
openclaw models list --provider meta
```

如果模型状态有问题，可以再看：

```bash
openclaw models status --json
```

---

## 配置示例

```json5
{
  env: {
    MODEL_API_KEY: "<your-key>",
  },
  agents: {
    defaults: {
      model: {
        primary: "meta/muse-spark-1.1",
      },
      models: {
        "meta/muse-spark-1.1": {
          alias: "Muse Spark 1.1",
        },
      },
    },
  },
}
```

如果 Gateway 作为后台服务运行，`MODEL_API_KEY` 也必须进入那个服务的真实环境。
只在当前 shell 临时导出，通常不会让守护进程自动继承。

---

## thinking 要特别注意

`muse-spark-1.1` 支持 reasoning，但有一个容易踩坑的点：

```text
它不接受 reasoning.effort: "none"
```

这意味着你在别的 provider 上习惯的“彻底关闭思考”，在这里不一定能原样工作。
OpenClaw 会尽量帮你做映射，但如果你在低层配置里硬写参数，最好按 Meta 当前接口要求来。

如果你只是第一次接入，先不要手改底层 reasoning 字段，先用默认配置跑通。

---

## 适合什么人

适合：

- 想尝试 Meta 这条官方模型路线
- 希望在 OpenClaw 里统一接入 Responses API 风格模型
- 需要文本和图片输入、工具调用、流式输出

不太适合：

- 你只想找一个最传统、最像旧版 Chat Completions 的接口

---

## 常见问题

### `openclaw models list --provider meta` 能看到模型，但调用失败

先检查三件事：

1. `MODEL_API_KEY` 是否真的被 Gateway 读到了
2. 当前配置有没有手动覆盖不兼容的 reasoning 参数
3. 你的 Gateway 是否已经重启，加载到了新的 provider 环境

### 为什么我把 thinking 关掉后行为还是和别家不一样

因为 Meta 这条线路对 reasoning 的约束本来就不同。
这里不要把其他 provider 的习惯当成通用真理。

### 怎么做最小验证

至少先做到两步：

```bash
openclaw models list --provider meta
openclaw status --usage
```

前者确认 provider 暴露正常，后者至少能让你看到这条线路是否真的在被调用。

---

## 相关页面

- [模型提供商总览](/tutorials/providers/)
- [模型提供商概念](/tutorials/concepts/model-providers)
- [Thinking 模式](/tutorials/tools/thinking)
- [Agent 默认模型配置](/tutorials/gateway/config-agents)

