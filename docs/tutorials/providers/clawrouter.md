---
title: "ClawRouter"
sidebarTitle: "ClawRouter"
description: "OpenClaw 模型接入：ClawRouter。用一个受策略约束的统一凭证接多家上游模型，并把目录与预算状态同步到 OpenClaw。"
---

# ClawRouter

ClawRouter 可以把很多上游模型提供商收敛到一把统一的钥匙上。

你可以先把它理解成：

- 公司或团队给你发一把受限的总钥匙
- 这把钥匙后面能访问多家模型
- 但你能看到哪些模型、能花多少钱，都由策略决定
- OpenClaw 只接 ClawRouter，不直接保存每一家上游 provider 的独立密钥

如果 OpenRouter 更像“模型超市”，那 ClawRouter 更像“公司内部统一门禁 + 配额面板”。

---

## 它解决什么问题

很多团队会遇到这些麻烦：

- OpenAI、Anthropic、Google、Gemini 等各家 key 分散
- 每个成员都要单独保管上游凭证
- 想统一预算、统一模型白名单、统一审计

ClawRouter 的思路是：

- 上游 provider 凭证留在 ClawRouter 那边
- OpenClaw 只拿一个 `CLAWROUTER_API_KEY`
- 当前这把 key 被允许用哪些模型，运行时动态发现
- 月度预算和已用额度，也能回显到 OpenClaw 的状态面板

---

## 什么时候值得考虑它

适合：

- 团队统一发放模型访问权限
- 想把多家 provider 收口成一个入口
- 希望普通使用者不直接接触上游 provider 密钥
- 需要更明确的预算和配额边界

不一定适合：

- 个人单机轻量使用
- 只接一家模型服务
- 没有 ClawRouter 管理端或团队策略需求

---

## 快速开始

最常见的接法：

```bash
export CLAWROUTER_API_KEY="..."
openclaw onboard --auth-choice clawrouter-api-key
openclaw plugins enable clawrouter
```

然后看它给你开放了哪些模型：

```bash
openclaw models list --all --provider clawrouter
```

如果你已经在配置里用了 `plugins.allow`，别忘了把 `clawrouter` 也放进去。

---

## 关键事实先记住

| 项目 | 值 |
|------|------|
| Provider id | `clawrouter` |
| 鉴权环境变量 | `CLAWROUTER_API_KEY` |
| 默认地址 | `https://clawrouter.openclaw.ai` |
| 模型目录来源 | `/v1/catalog` |
| 配额/预算来源 | `/v1/usage` |
| 插件形态 | bundled，默认启用 |

最关键的一点不是默认 URL，而是：

```text
模型目录是按这把凭证的授权范围动态返回的
```

也就是说，别人能看到的模型，不代表你这把 key 一定也能看到。

---

## 模型引用长什么样

ClawRouter 模型通常不是简短的单段名字，而是三段式：

```text
clawrouter/<provider>/<model>
```

例如：

- `clawrouter/openai/gpt-5.5`
- `clawrouter/anthropic/claude-sonnet-4-6`
- `clawrouter/google/gemini-3.5-flash`

选择默认模型：

```bash
openclaw models set clawrouter/<provider>/<model>
```

如果你的配置把 `agents.defaults.models` 当 allowlist 用，记得把这些完整模型引用也加入进去。

---

## 和 OpenRouter / 自定义 Provider 的区别

### 和 OpenRouter 的区别

- OpenRouter 更像公开聚合入口
- ClawRouter 更强调受策略约束的团队/组织用法
- ClawRouter 会把月预算和总体使用情况同步回 OpenClaw

### 和自定义 Provider 的区别

- 自定义 Provider 通常是你自己知道 base URL、自己填模型、自己管兼容协议
- ClawRouter 是运行时从目录里发现“当前这把 key 被允许用什么”

所以它不是“再一种 OpenAI 兼容端点”这么简单，而是带权限边界和目录发现的一条路线。

---

## 为什么团队会喜欢它

因为它把三件事收口了：

1. **凭证收口**：终端用户不直接拿上游各家 key
2. **模型收口**：只暴露当前策略允许的模型
3. **预算收口**：OpenClaw 里能直接看到这把策略 key 的预算和使用量

对团队管理员来说，这比“每个人自己配 OpenAI + Anthropic + Google”更容易控。

---

## OpenClaw 会怎么发现模型

ClawRouter 不是把一份固定模型表内置在 OpenClaw 里。

它会根据 `/v1/catalog` 的返回结果，决定哪些模型可以在 OpenClaw 中显示和选择。

简单理解，能被展示出来通常至少要满足：

- 当前凭证策略允许这个 provider
- 这个模型声明了 OpenClaw 支持的能力
- 对应的请求协议是 OpenClaw 这边能接住的

所以如果某个上游模型没显示出来，不一定是坏了，也可能是：

- 你的策略没放开
- 目录里还没给这个模型可用路由
- 它的协议当前不在 OpenClaw 支持范围内

---

## 配额和预算怎么看

可以直接看：

```bash
openclaw status --usage
openclaw models status
```

这类状态面板会反映：

- 请求量
- Token 量
- 花费
- 如果该策略有月预算，还会显示预算窗口和剩余额度比例

要注意一点：

如果同一把 ClawRouter 策略 key 被其他客户端也在用，剩余额度会一起变化，不是只算你这一台机器。

---

## 常见问题

### 为什么看不到任何 ClawRouter 模型

先检查三件事：

1. 插件是否启用
2. `plugins.allow` 是否放行了 `clawrouter`
3. 当前凭证是否真的授权了至少一个可用 provider

### 为什么我明明填了模型名，却提示 unknown model

很多时候不是模型不存在，而是你的 allowlist 没放行那个完整引用。

优先确认是不是少了类似：

```text
clawrouter/openai/gpt-5.5
```

这种完整条目。

### 为什么有使用统计，但没有预算百分比

通常说明这把策略 key 是 unmetered，或没有配置月预算窗口。

### 为什么发现到了模型，但调用还是失败

优先把问题分成两层：

- OpenClaw 是否成功发现了模型目录
- ClawRouter 到上游 provider 的真实连通性是否正常

发现成功不等于上游一定健康。

---

## 中文用户的实用建议

1. 先把它当“团队统一模型入口”，不要当普通单模型 provider。
2. 先跑 `openclaw models list --all --provider clawrouter`，再决定默认模型。
3. 如果列表里有模型但选不中，先查 allowlist，不要先怀疑 OpenClaw 本身。
4. 如果预算数字和你预期不一致，先确认是不是多人共用同一策略 key。

---

## 相关页面

- [模型提供商总览](/tutorials/providers/)
- [模型提供商概念](/tutorials/concepts/model-providers)
- [OpenRouter](/tutorials/providers/openrouter)
- [用量跟踪](/tutorials/concepts/usage-tracking)
