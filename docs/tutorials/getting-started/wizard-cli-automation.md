---
title: "CLI 自动化"
sidebarTitle: "CLI 自动化"
---

# CLI 自动化

使用 `--non-interactive` 来自动化 `openclaw onboard`。

::: info 说明
`--json` 不代表非交互模式。对于脚本，请使用 `--non-interactive`（和 `--workspace`）。
:::

---

## 基础非交互示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

添加 `--json` 可获取机器可读的摘要。

---

## 特定提供商示例


::: details Gemini 示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```
  

:::

::: details Z.AI 示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice zai-api-key \
  --zai-api-key "$ZAI_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```
  

:::

::: details Vercel AI Gateway 示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```
  

:::

::: details Cloudflare AI Gateway 示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```
  

:::

::: details Moonshot 示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice moonshot-api-key \
  --moonshot-api-key "$MOONSHOT_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```
  

:::

::: details Synthetic 示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice synthetic-api-key \
  --synthetic-api-key "$SYNTHETIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```
  

:::

::: details OpenCode Zen 示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice opencode-zen \
  --opencode-zen-api-key "$OPENCODE_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```
  

:::

::: details 自定义提供商示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --custom-provider-id "my-custom" \
  --custom-compatibility anthropic \
  --gateway-port 18789 \
  --gateway-bind loopback
```

    `--custom-api-key` 是可选的。如果省略，入门引导会检查 `CUSTOM_API_KEY`。

  

:::

---

## 添加另一个智能体（Agent）

使用 `openclaw agents add <name>` 创建一个独立的智能体（Agent），拥有自己的工作区（Workspace）、会话（Session）和认证档案。不带 `--workspace` 运行时会启动向导。

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.2 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

它设置的内容：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

说明：

- 默认工作区遵循 `~/.openclaw/workspace-<agentId>` 命名规则。
- 添加 `bindings` 来路由入站消息（向导可以完成此操作）。
- 非交互参数：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

---

## 相关文档

- 入门引导中心：[入门引导向导 (CLI)](/start/wizard)
- 完整参考：[CLI 入门引导参考](/start/wizard-cli-reference)
- 命令参考：[`openclaw onboard`](/cli/onboard)
