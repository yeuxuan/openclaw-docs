---
title: "模型故障转移"
sidebarTitle: "模型故障转移"
---

# 模型故障转移（Model Failover）

OpenClaw 分两个阶段处理故障：

1. 当前提供商内的 **认证配置文件轮换**。
2. **模型回退** 到 `agents.defaults.model.fallbacks` 中的下一个模型。

本文档解释运行时规则和支撑它们的数据。

---

## 认证存储（密钥 + OAuth）

OpenClaw 使用 **认证配置文件** 来管理 API 密钥和 OAuth Token。

- 密钥存储在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（旧版：`~/.openclaw/agent/auth-profiles.json`）。
- 配置 `auth.profiles` / `auth.order` 是 **元数据 + 路由**（不含密钥）。
- 旧版仅导入 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json`）。

更多详情：[/concepts/oauth](/concepts/oauth)

凭证类型：

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（+ 某些提供商的 `projectId`/`enterpriseUrl`）

---

## 配置文件 ID

OAuth 登录创建不同的配置文件，以便多个账户可以共存。

- 默认：当没有可用邮箱时为 `provider:default`。
- 带邮箱的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

配置文件存储在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 的 `profiles` 下。

---

## 轮换顺序

当提供商有多个配置文件时，OpenClaw 按以下方式选择顺序：

1. **显式配置**：`auth.order[provider]`（如果设置了）。
2. **已配置的配置文件**：按提供商过滤的 `auth.profiles`。
3. **已存储的配置文件**：`auth-profiles.json` 中该提供商的条目。

如果没有配置显式顺序，OpenClaw 使用轮询顺序：

- **主键：** 配置文件类型（**OAuth 优先于 API 密钥**）。
- **次键：** `usageStats.lastUsed`（最旧优先，在每种类型内）。
- **冷却/禁用的配置文件** 移到末尾，按最早到期排序。

### 会话粘性（缓存友好）

OpenClaw **将选定的认证配置文件固定到每个会话** 以保持提供商缓存温暖。它 **不会** 在每次请求时轮换。固定的配置文件会被重用，直到：

- 会话被重置（`/new` / `/reset`）
- 压缩完成（压缩计数递增）
- 配置文件处于冷却/禁用状态

通过 `/model …@<profileId>` 手动选择会为该会话设置 **用户覆盖**，在新会话开始之前不会自动轮换。

自动固定的配置文件（由会话路由器选择）被视为 **偏好**：它们首先被尝试，但 OpenClaw 可能在速率限制/超时时轮换到另一个配置文件。用户固定的配置文件锁定到该配置文件；如果失败且配置了模型回退，OpenClaw 移到下一个模型而不是切换配置文件。

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

状态存储在 `auth-profiles.json` 的 `usageStats` 下：

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

账单/额度失败（例如"insufficient credits"/"credit balance too low"）被视为可故障转移的，但它们通常不是暂时的。OpenClaw 不使用短冷却，而是将配置文件标记为 **禁用**（使用更长的退避）并轮换到下一个配置文件/提供商。

状态存储在 `auth-profiles.json` 中：

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

- 账单退避从 **5 小时** 开始，每次账单失败翻倍，上限为 **24 小时**。
- 退避计数器在配置文件 **24 小时** 未失败时重置（可配置）。

---

## 模型回退

如果提供商的所有配置文件都失败，OpenClaw 移到 `agents.defaults.model.fallbacks` 中的下一个模型。这适用于认证失败、速率限制和耗尽配置文件轮换的超时（其他错误不推进回退）。

当运行以模型覆盖（钩子或 CLI）启动时，回退在尝试任何配置的回退后仍然以 `agents.defaults.model.primary` 结束。

---

## 相关配置

参见[网关配置](/gateway/configuration)了解：

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

参见[模型](/concepts/models)了解更广泛的模型选择和回退概览。
