---
title: "LongCat"
sidebarTitle: "LongCat"
description: "OpenClaw 模型接入：LongCat。适合长上下文、代码和 Agent 任务。"
---

# LongCat

LongCat 是一条偏“长上下文 + 推理 + 代码任务”的 provider 路线。
如果你关心超长输入窗口，又不想自己维护推理服务，它值得了解。

先记住：

- Provider id 是 `longcat`
- 环境变量是 `LONGCAT_API_KEY`
- 默认模型是 `longcat/LongCat-2.0`
- 走的是 OpenAI 兼容接口

---

## 什么时候适合它

比较适合：

- 代码仓库大、上下文长
- 需要 Agent 连续多轮工作
- 想用托管服务而不是自己搭推理栈

它的一个明显卖点是上下文窗口很大。
但窗口大不代表一定更便宜，所以正式切过去前最好结合你自己的账单看成本。

---

## 快速开始

如果没装 provider 插件，先装：

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

然后跑向导：

```bash
openclaw onboard --auth-choice longcat-api-key
```

无交互写法：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

检查模型是否可见：

```bash
openclaw models list --provider longcat
```

---

## 推荐配置

```json5
{
  env: {
    LONGCAT_API_KEY: "<your-key>",
  },
  agents: {
    defaults: {
      model: {
        primary: "longcat/LongCat-2.0",
      },
    },
  },
}
```

如果是守护进程、systemd、launchd 或 Docker 跑的 Gateway，记得把 `LONGCAT_API_KEY` 放进服务环境，而不是只放在你当前终端。

---

## Thinking 行为要注意什么

LongCat 的 thinking 控制比较接近“开 / 关”二元模式。

对普通使用者来说，最实用的结论是：

- `/think off` 能关掉推理
- 打开 thinking 时，LongCat 会按它自己的推理输出格式返回
- 如果你做多轮 Agent 任务，OpenClaw 会尽量保留这部分推理上下文形状

如果你只是第一次接入，不需要一开始就纠结 reasoning 参数细节。
先确认“能稳定调用、上下文够用、成本可接受”更重要。

---

## 成本和自托管边界

LongCat 文档里给了按百万 token 计费的参考价格，但真实账单还是以它当前控制台为准。

如果你要的是：

- 自己掌控机器
- 自己掌控模型文件
- 不走 LongCat 托管 API

那应该改走 [vLLM](/tutorials/providers/vllm) 或 [SGLang](/tutorials/providers/sglang)，而不是继续使用 `longcat/LongCat-2.0` 这个托管 provider。

---

## 常见问题

### 为什么 key 在终端里可用，但 OpenClaw 里报未授权

通常是因为 Gateway 并不是从你当前 shell 启动的。
把 `LONGCAT_API_KEY` 放进 `~/.openclaw/.env` 或服务环境，再重启 Gateway。

### 为什么报 `402` 或 `429`

- `402` 通常是额度不够
- `429` 通常是打到限流

先去 LongCat 控制台看额度和速率限制，不要先怀疑 OpenClaw 配置。

### 为什么列表里看不到 LongCat

先执行：

```bash
openclaw plugins list
openclaw models list --provider longcat
```

确认插件装上了，而且 Gateway 已经重启。

---

## 相关页面

- [模型提供商总览](/tutorials/providers/)
- [vLLM](/tutorials/providers/vllm)
- [SGLang](/tutorials/providers/sglang)
- [Secrets 管理](/tutorials/gateway/secrets)

