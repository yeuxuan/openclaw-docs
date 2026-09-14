---
title: "OAuth"
sidebarTitle: "OAuth"
description: "OpenClaw 核心概念：OAuth。OpenClaw 通过 OAuth 支持\"订阅认证\"，适用于提供此功能的提供商（特别是 OpenAI Codex (ChatGPT OAuth)）。对于 An…"
---

# OAuth

OpenClaw 通过 OAuth 支持订阅认证，特别是 OpenAI ChatGPT/Codex OAuth。
Anthropic 可以复用同机 Claude CLI 登录，也可以显式导入 setup-token。本页解释：

- OAuth Token 交换 如何工作（PKCE）
- Token 存储在 哪里（以及为什么）
- 如何处理 多个账户（配置文件 + 每会话覆盖）

OpenClaw 还支持 提供商插件，它们附带自己的 OAuth 或 API 密钥流程。通过以下方式运行：

```bash
openclaw models auth login --provider <id>
```

---

## Token 汇聚（存在的原因）

OAuth 提供商通常在登录/刷新流程中生成 新的刷新 Token。一些提供商（或 OAuth 客户端）在为同一用户/应用发出新 Token 时可能会使旧的刷新 Token 失效。

实际症状：

- 你通过 OpenClaw _和_ Claude Code / Codex CLI 登录 : 其中一个后来随机"登出"

为了减少这种情况，OpenClaw 将每个 Agent 的 SQLite 认证档案库视为 Token 汇聚点：

- 运行时从 一个地方 读取凭证
- 我们可以保留多个配置文件并确定性地路由它们

---

## 存储（Token 存储位置）

密钥与认证路由状态存储在每个 Agent 的规范 SQLite 数据库中：

- 数据库：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- 凭据表：`auth_profile_store`
- 顺序、last-good、冷却与用量状态：`auth_profile_state`

新登录不会再写认证 JSON。旧安装可能仍有 `auth-profiles.json`、
`auth-state.json`、Agent 下的 `auth.json` 或共享的
`~/.openclaw/credentials/oauth.json`；运行 `openclaw doctor --fix` 导入并归档。
运行时不会回退读取这些退役文件；如果 SQLite 仍为空，会以
`AUTH_PROFILE_MIGRATION_REQUIRED` 失败关闭，而不是静默使用旧 Token。

以上所有路径也遵循 `$OPENCLAW_STATE_DIR`（状态目录覆盖）。完整参考：[/gateway/configuration](/tutorials/gateway/configuration)

---

## Anthropic Claude CLI 与 setup-token

优先在 Gateway 主机上确认 Claude CLI 登录：

```bash
claude auth status --text
```

OpenClaw 通过 Anthropic 官方 Agent SDK 使用该登录，不会把 Claude CLI Token
导入自己的 SQLite。需要 OpenClaw 自己保存 setup-token 时运行：

在任何机器上运行 `claude setup-token`，然后粘贴到 OpenClaw：

```bash
openclaw models auth login --provider anthropic --method setup-token
```

验证：

```bash
openclaw models status
```

---

## OAuth 交换（登录如何工作）

OpenClaw 的交互式登录流程在 `@mariozechner/pi-ai` 中实现，并连接到向导/命令中。

### Anthropic (Claude Pro/Max) setup-token

流程形式：

1. 运行 `claude setup-token`
2. 将 Token 粘贴到 OpenClaw
3. 存储为 Token 认证配置文件（无刷新）

向导路径是 `openclaw onboard`：选择 Claude CLI 或 Anthropic setup-token。

### OpenAI Codex (ChatGPT OAuth)

流程形式（PKCE）：

1. 生成 PKCE verifier/challenge + 随机 `state`
2. 打开 `https://auth.openai.com/oauth/authorize?...`
3. 尝试在 `http://127.0.0.1:1455/auth/callback` 捕获回调
4. 如果回调无法绑定（或你在远程/无头环境），粘贴重定向 URL/code
5. 在 `https://auth.openai.com/oauth/token` 交换
6. 从访问 Token 提取 `accountId` 并存储 `{ access, refresh, expires, accountId }`

向导路径是 `openclaw onboard --auth-choice openai`。当前认证 profile ID 使用
`openai:*`；旧 `openai-codex:*` 由 `openclaw doctor --fix` 迁移。

---

## 刷新 + 到期

配置文件存储 `expires` 时间戳。

运行时：

- 如果 `expires` 在未来 : 使用存储的访问 Token
- 如果过期 : 刷新（在文件锁下）并覆盖存储的凭证

刷新流程是自动的；你通常不需要手动管理 Token。

---

## 多账户（配置文件）+ 路由

两种模式：

### 1）推荐：独立智能体

如果你想让"个人"和"工作"永远不交互，使用隔离的智能体（独立的会话 + 凭证 + 工作区）：

```bash
openclaw agents add work
openclaw agents add personal
```

然后为每个智能体配置认证（向导）并将聊天路由到正确的智能体。

### 2）高级：单个智能体中的多个配置文件

SQLite 认证档案库支持同一提供商的多个 profile ID。

选择使用哪个配置文件：

- 全局通过配置排序（`auth.order`）
- 每会话通过 `/model ...@<profileId>`

示例（会话覆盖）：

- `/model Opus@anthropic:work`

如何查看存在哪些配置文件 ID：

- `openclaw channels list --json`（显示 `auth[]`）

相关文档：

- [/concepts/model-failover](/tutorials/concepts/model-failover)（轮换 + 冷却规则）
- [/tools/slash-commands](/tutorials/tools/slash-commands)（命令界面）
