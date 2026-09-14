---
title: "OpenAI"
sidebarTitle: "OpenAI"
description: "在 OpenClaw 中使用 OpenAI API Key 或 ChatGPT/Codex 订阅，配置 GPT-6 Astra、GPT-5.6 与媒体模型。"
---

# OpenAI：模型、认证和运行时要分开看

当前 OpenClaw 对 OpenAI 只使用一个 Provider ID：`openai`。API Key 和
ChatGPT/Codex OAuth 都使用 `openai:*` 认证档案，模型也统一写成
`openai/<model>`。

`openai-codex/*`、`codex/*` 和 `codex-cli/*` 都是旧模型引用。运行：

```bash
openclaw doctor --fix
openclaw config validate
```

Doctor 会把旧模型引用迁移到 `openai/*`，必要时补模型级
`agentRuntime.id: "codex"`，并把旧的认证 profile ID 和 `auth.order` 迁移到
`openai` 命名空间。

## 新安装先选哪一个模型

| 目标 | 模型 |
|------|------|
| 最新旗舰、需要长上下文或在生成中追加指令 | `openai/gpt-6-astra` |
| 旗舰 Agent | `openai/gpt-5.6-sol` |
| 平衡能力与成本 | `openai/gpt-5.6-terra` |
| 更快、更低成本 | `openai/gpt-5.6-luna` |
| 账号尚无 GPT-5.6 权限 | `openai/gpt-5.5` |

新安装会优先使用精确的 `openai/gpt-6-astra`。它可通过有权限的 OpenAI API Key
或 ChatGPT/Codex 订阅使用；订阅目录发现失败时，模型选择器会暂时不显示 Astra，
不会把“目录没加载出来”误判成已授权。Astra 支持文本和图片，官方 API Key +
OpenClaw runtime 的 WebSocket 路线还支持工具异步执行与生成中的文字/图片纠偏；
自定义端点、SSE、Codex runtime 不应假定具备同样能力。

Sol、Terra、Luna 当前都支持 `xhigh` 和 `max` reasoning。账号权限可能不同，
先查询：

```bash
openclaw models list --provider openai
```

如果 GPT-5.6 不可用，OpenClaw 会显示上游权限错误，不会偷偷降级；需要你显式
选择 GPT-5.5：

```bash
openclaw models set openai/gpt-5.5
```

## 方式 A：ChatGPT/Codex 订阅

```bash
openclaw onboard --auth-choice openai
```

只登录认证：

```bash
openclaw models auth login --provider openai
```

无头服务器可使用设备码：

```bash
openclaw models auth login --provider openai --device-code
```

多个账号使用 `openai:<name>` profile：

```bash
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth login --provider openai --profile-id openai:personal
```

OAuth 凭据写入当前 Agent 的 SQLite 认证档案，不再写
`auth-profiles.json`。新登录如果检测到已有 primary，不会擅自替换；只有
`--set-default` 或 `openclaw models set` 才会明确改默认模型。

## 方式 B：OpenAI Platform API Key

```bash
openclaw onboard --auth-choice openai-api-key
```

非交互式：

```bash
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

API Key 适合 Platform 按量计费、Realtime、Embedding 等非订阅能力。不要把
`OPENAI_API_KEY` 当作 ChatGPT 订阅凭据；两者账单和额度相互独立。

## 订阅优先、API Key 备用

两种认证都放在 `auth.order.openai`：

```json5
{
  auth: {
    order: {
      openai: ["openai:work", "openai:api-key-backup"],
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-6-astra" },
    },
  },
}
```

订阅达到限额时，OpenClaw 可切换到有资格的备用 profile，并保留模型与原生
Codex harness。额度恢复后，自动选择可以回到订阅 profile。

## `openai/*` 不等于一定使用 Codex Runtime

Provider、模型、认证与 Agent runtime 是四层独立概念。只有精确的 OpenAI
官方 HTTPS Responses/ChatGPT Responses 路线、没有自定义请求覆盖，且运行时
策略未设置或为 `auto` 时，OpenClaw 才可能隐式选择 bundled Codex app-server。

- 自定义 Endpoint 或 `openai-completions` adapter：使用 OpenClaw runtime。
- `agentRuntime.id: "openclaw"`：强制使用 OpenClaw runtime。
- `agentRuntime.id: "codex"`：要求 Codex harness；不支持的路线会失败关闭。
- 官方 Endpoint 写成明文 HTTP：直接拒绝，不发送凭据。

不要只凭模型前缀判断实际 harness；依赖原生能力时应检查完成结果的 runtime。

## Realtime 与图片账单

语音要按使用入口区分认证，不能统称为“都走 Platform”或“订阅都能用”：

| 入口 | 认证要求 |
|------|----------|
| GA Realtime 浏览器 Talk | 优先 Platform 凭据；未配置时也可用有权限的 ChatGPT OAuth |
| GPT-Live 浏览器 / Gateway-relay Talk | 优先 ChatGPT OAuth；无 OAuth 时可用已获 API 权限的 Platform Key |
| OpenAI TTS、Voice Call、GA Gateway relay、Discord realtime、实时转写 | 仍需 Platform API Key |

启用的 OpenAI 插件会自动启动浏览器 session broker，Gateway 启动后再登录也可以；只有开始 Talk 才创建语音会话，登录本身不会打开麦克风。返回浏览器后会刷新语音入口的就绪状态。

GPT-Live 的 OAuth 路线通过 Codex 后端建会话，Platform 路线通过 `/v1/live`；API 访问仍受账号资格限制。GPT-Live 优先 OAuth，即使已配置 Platform Key；没有 OAuth 且配置的 Key/SecretRef 无法解析时，先修好或移除该配置。

GPT-Live 音色使用 Codex V3 集合：`arbor`、`breeze`、`cove`、`ember`、`juniper`、`maple`、`sol`、`spruce`、`vale`，默认 `cove`。GA Realtime 的 `marin`、`cedar` 不属于这个集合。iOS GPT-Live 传输已实现但设备实时验证仍待完成，Android 仍有设备验证限制，不要把实现存在等同于全部端到端验收。

共享 Discord 语音还要看[唤醒词策略限制](/tutorials/channels/discord#线程会话与语音限制)；电话侧 GPT-Live 不能调用原生挂断或自定义 realtime 工具，见 [Voice Call](/tutorials/plugins/voice-call#实时通话的模型限制)。

图片生成新增 GPT Image 2.5 Flare / Sunburst：

```text
openai/gpt-image-2.5-flare
openai/gpt-image-2.5-sunburst
```

它们需要显式的 OpenAI API Key 路线；仅有 ChatGPT/Codex 订阅不代表具备图片 API
权限。支持自定义尺寸、`xhigh` 质量、透明 PNG/WebP，OpenAI 编辑最多 5 张参考图。
旧的 `openai/gpt-image-2` 与 `openai/gpt-image-1.5` 仍可按账号能力使用。

继续阅读：[OAuth](/tutorials/concepts/oauth)、[Agent Runtime](/tutorials/concepts/agent-runtimes)、
[模型故障转移](/tutorials/concepts/model-failover)。
