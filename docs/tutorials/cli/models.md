---
title: "openclaw models"
sidebarTitle: "models"
---

# `openclaw models`

`models` 用来列出、检查和切换模型。模型问题常常不是 OpenClaw 坏了，而是 provider、API Key、base URL、模型名或额度其中一项不对。

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
```

## 什么时候用

- 想看当前可用模型。
- 想切换默认模型。
- 模型不回复或报 401/403/404。
- 想确认 provider 是否能连通。

## 新手排查顺序

### `Auth` 列不是实际调用成功证明

`models list` 的认证检查以只读状态为准，不会请求 Provider API，也不读取钥匙串凭据。OpenAI 按具体 API/base URL 匹配合格的认证路线；无法判断路线策略时保留 `unknown`，不借用整个 Provider 的登录状态。

原生 CLI 路线另有自己的登录：普通列表保持惰性，可能显示 `unknown`；完整列表或 `--provider <id>` 筛选可执行本机 CLI 的只读 auth-status 检查。另一个 Provider API Key 不能证明 Claude CLI 等原生路线已经登录。真正排障还需查看 `models status`、必要时执行 `models status --probe`（会发起真实请求）。

### 逐项检查

1. API Key 有没有填。
2. provider 名称是否正确。
3. 模型名是否真实存在。
4. base URL 是否写错。
5. 账号是否还有额度。

配置入口：

```bash
openclaw configure --section model
```

继续阅读：[模型提供商](/tutorials/providers/)。
