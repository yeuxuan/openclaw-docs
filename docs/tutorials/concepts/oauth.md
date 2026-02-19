---
title: "OAuth"
sidebarTitle: "OAuth"
---

# OAuth

OpenClaw 通过 OAuth 支持"订阅认证"，适用于提供此功能的提供商（特别是 **OpenAI Codex (ChatGPT OAuth)**）。对于 Anthropic 订阅，使用 **setup-token** 流程。本页解释：

- OAuth **Token 交换** 如何工作（PKCE）
- Token 存储在 **哪里**（以及为什么）
- 如何处理 **多个账户**（配置文件 + 每会话覆盖）

OpenClaw 还支持 **提供商插件**，它们附带自己的 OAuth 或 API 密钥流程。通过以下方式运行：

```bash
openclaw models auth login --provider <id>
```

---

## Token 汇聚（存在的原因）

OAuth 提供商通常在登录/刷新流程中生成 **新的刷新 Token**。一些提供商（或 OAuth 客户端）在为同一用户/应用发出新 Token 时可能会使旧的刷新 Token 失效。

实际症状：

- 你通过 OpenClaw _和_ Claude Code / Codex CLI 登录 → 其中一个后来随机"登出"

为了减少这种情况，OpenClaw 将 `auth-profiles.json` 视为 **Token 汇聚点**：

- 运行时从 **一个地方** 读取凭证
- 我们可以保留多个配置文件并确定性地路由它们

---

## 存储（Token 存储位置）

密钥存储是 **每智能体的**：

- 认证配置文件（OAuth + API 密钥）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 运行时缓存（自动管理；不要编辑）：`~/.openclaw/agents/<agentId>/agent/auth.json`

旧版仅导入文件（仍然支持，但不是主存储）：

- `~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json`）

以上所有路径也遵循 `$OPENCLAW_STATE_DIR`（状态目录覆盖）。完整参考：[/gateway/configuration](/gateway/configuration#auth-storage-oauth--api-keys)

---

## Anthropic setup-token（订阅认证）

在任何机器上运行 `claude setup-token`，然后粘贴到 OpenClaw：

```bash
openclaw models auth setup-token --provider anthropic
```

如果你在其他地方生成了 Token，手动粘贴：

```bash
openclaw models auth paste-token --provider anthropic
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

向导路径是 `openclaw onboard` → 认证选择 `setup-token`（Anthropic）。

### OpenAI Codex (ChatGPT OAuth)

流程形式（PKCE）：

1. 生成 PKCE verifier/challenge + 随机 `state`
2. 打开 `https://auth.openai.com/oauth/authorize?...`
3. 尝试在 `http://127.0.0.1:1455/auth/callback` 捕获回调
4. 如果回调无法绑定（或你在远程/无头环境），粘贴重定向 URL/code
5. 在 `https://auth.openai.com/oauth/token` 交换
6. 从访问 Token 提取 `accountId` 并存储 `{ access, refresh, expires, accountId }`

向导路径是 `openclaw onboard` → 认证选择 `openai-codex`。

---

## 刷新 + 到期

配置文件存储 `expires` 时间戳。

运行时：

- 如果 `expires` 在未来 → 使用存储的访问 Token
- 如果过期 → 刷新（在文件锁下）并覆盖存储的凭证

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

`auth-profiles.json` 支持同一提供商的多个配置文件 ID。

选择使用哪个配置文件：

- 全局通过配置排序（`auth.order`）
- 每会话通过 `/model ...@<profileId>`

示例（会话覆盖）：

- `/model Opus@anthropic:work`

如何查看存在哪些配置文件 ID：

- `openclaw channels list --json`（显示 `auth[]`）

相关文档：

- [/concepts/model-failover](/concepts/model-failover)（轮换 + 冷却规则）
- [/tools/slash-commands](/tools/slash-commands)（命令界面）
