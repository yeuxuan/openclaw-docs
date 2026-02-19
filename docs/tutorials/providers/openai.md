---
title: "OpenAI"
sidebarTitle: "OpenAI"
---

# OpenAI

OpenAI 提供 GPT 模型的开发者 API。Codex 支持 **ChatGPT 登录**（订阅访问）或 **API 密钥**登录（按量计费）。Codex 云端需要 ChatGPT 登录。

---

## 方式 A：OpenAI API 密钥（OpenAI 平台）

**适用场景：** 直接 API 访问和按量计费。
从 OpenAI 仪表板获取你的 API 密钥。

### CLI 设置

```bash
openclaw onboard --auth-choice openai-api-key
# 或非交互式
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### 配置示例

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.1-codex" } } },
}
```

---

## 方式 B：OpenAI Code (Codex) 订阅

**适用场景：** 使用 ChatGPT/Codex 订阅访问代替 API 密钥。
Codex 云端需要 ChatGPT 登录，而 Codex CLI 支持 ChatGPT 或 API 密钥登录。

### CLI 设置（Codex OAuth）

```bash
# 在向导中运行 Codex OAuth
openclaw onboard --auth-choice openai-codex

# 或直接运行 OAuth
openclaw models auth login --provider openai-codex
```

### 配置示例（Codex 订阅）

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.3-codex" } } },
}
```

---

## 注意事项

- 模型引用始终使用 `provider/model` 格式（参见 [/concepts/models](/concepts/models)）。
- 认证详情和复用规则见 [/concepts/oauth](/concepts/oauth)。
