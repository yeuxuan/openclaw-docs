---
title: "模型故障转移"
sidebarTitle: "模型故障转移"
description: "说明 OpenClaw 的模型故障转移：认证配置文件轮换、会话粘性、冷却、账单禁用和 fallback 模型。"
---

# 模型故障转移（Model Failover）

OpenClaw 遇到模型调用失败时，按两个层次处理：

1. 先在当前提供商内部轮换认证配置文件。
2. 如果当前提供商没有可用配置文件，再回退到 `agents.defaults.model.fallbacks` 里的下一个模型。

本文档解释运行时规则和支撑它们的数据。

---

## 认证存储（密钥 + OAuth）

OpenClaw 使用认证配置文件管理 API Key 和 OAuth Token。

- 密钥和运行时认证路由状态存储在
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。
- 配置 `auth.profiles` / `auth.order` 只保存元数据和路由，不保存密钥。
- `credentials/oauth.json`、`auth-profiles.json`、`auth-state.json` 和 Agent
  下的 `auth.json` 只由 `openclaw doctor --fix` 迁移；运行时不会直接读取。

更多详情：[/concepts/oauth](/tutorials/concepts/oauth)

凭证类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（+ 某些提供商的 `projectId`/`enterpriseUrl`）

---

## 配置文件 ID

OAuth 登录创建不同的配置文件，以便多个账户可以共存。

- 默认：当没有可用邮箱时为 `provider:default`。
- 带邮箱的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

profile 存储在每个 Agent 的 `openclaw-agent.sqlite` 认证档案库中。

---

## 轮换顺序

当提供商有多个配置文件时，OpenClaw 按以下方式选择顺序：

1. 显式配置：`auth.order[provider]`（如果设置了）。
2. 已配置的配置文件：按提供商过滤的 `auth.profiles`。
3. 已存储的配置文件：该 Agent SQLite 认证档案库中对应提供商的条目。

如果没有配置显式顺序，OpenClaw 使用轮询顺序：

- 主键：配置文件类型，OAuth 优先于 API Key。
- 次键：`usageStats.lastUsed`，每种类型内最旧优先。
- 冷却或禁用的配置文件移到末尾，按最早到期排序。

### 会话粘性（缓存友好）

OpenClaw 会把选定的认证配置文件固定到当前会话，尽量保持提供商缓存温热。它不会每次请求都轮换。固定配置会一直复用，直到：

- 会话被重置（`/new` / `/reset`）
- 压缩完成（压缩计数递增）
- 配置文件处于冷却/禁用状态

通过 `/model …@<profileId>` 手动选择时，会给该会话设置用户覆盖；新会话开始前不会自动轮换。

自动固定的配置文件由会话路由器选择，属于偏好项：OpenClaw 会先尝试它，但遇到速率限制或超时时可以换到另一个配置文件。用户手动固定的配置文件更严格；如果失败并配置了模型回退，OpenClaw 会换下一个模型，而不是偷偷切换配置文件。

### 为什么 OAuth 可能"看起来丢失了"

如果你对同一提供商同时有 OAuth 配置文件和 API 密钥配置文件，轮询可能在消息之间切换，除非被固定。要强制使用单个配置文件：

- 通过 `auth.order[provider] = ["provider:profileId"]` 固定，或
- 通过 `/model …` 使用每会话覆盖加配置文件覆盖（当你的 UI/聊天界面支持时）。

---

## 冷却

当配置文件由于认证/速率限制错误（或看起来像速率限制的超时）而失败时，OpenClaw 将其标记为冷却并移到下一个配置文件。格式/无效请求错误（例如 Cloud Code Assist 工具调用 ID 验证失败）被视为可故障转移的，使用相同的冷却。

冷却使用指数退避：

- 1 分钟
- 5 分钟
- 25 分钟
- 1 小时（上限）

状态存储在 SQLite 的 `auth_profile_state` 中。下面的 JSON 只是字段含义示意，
不要据此直接编辑数据库：

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

---

## 账单禁用

账单或额度失败（例如 "insufficient credits"、"credit balance too low"）可以触发故障转移，但通常不是临时问题。OpenClaw 不会只做短冷却，而是把该配置文件标记为禁用，并使用更长退避，再切换到下一个配置文件或提供商。

禁用状态同样存储在 SQLite 的 `auth_profile_state` 中。下面仅为字段示意：

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

默认值：

- 账单退避从 5 小时开始，每次账单失败翻倍，上限为 24 小时。
- 如果配置文件 24 小时内没有再次失败，退避计数器会重置。这个窗口可配置。

---

## 模型回退

如果提供商的所有配置文件都失败，OpenClaw 移到 `agents.defaults.model.fallbacks` 中的下一个模型。这适用于认证失败、速率限制和耗尽配置文件轮换的超时（其他错误不推进回退）。

当运行以模型覆盖（钩子或 CLI）启动时，回退在尝试任何配置的回退后仍然以 `agents.defaults.model.primary` 结束。

---

## 相关配置

参见[网关配置](/tutorials/gateway/configuration)了解：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

参见[模型](/tutorials/concepts/models)了解更广泛的模型选择和回退概览。
