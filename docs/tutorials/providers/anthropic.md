---
title: "Anthropic (Claude)"
sidebarTitle: "Anthropic"
description: "通过 Anthropic API Key 或同机 Claude CLI 登录在 OpenClaw 中使用 Claude。"
---

# Anthropic (Claude)

OpenClaw 当前支持两条 Anthropic 路线：

- API Key：直接调用 Anthropic API，按量计费，适合共享自动化和生产。
- Claude CLI：复用 Gateway 同一主机、同一系统用户已经登录的 Claude Code，
  通过 Anthropic 官方 Agent SDK 运行。

## 方式 A：API Key

```bash
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
openclaw models list --provider anthropic
```

模型名称会变化，应以 `models list` 为准。新配置示例：

```json5
{
  env: {
    vars: {
      ANTHROPIC_API_KEY: "example-anthropic-key-not-real",
    },
  },
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-5" },
    },
  },
}
```

API Key 路线支持 Anthropic Prompt Cache。`cacheRetention` 常用值为 `none`、
`short`（5 分钟）和 `long`（1 小时）；订阅/Claude CLI 路线不使用这套 API
缓存参数。

## 方式 B：复用 Claude CLI 登录

在 Gateway 主机上、以运行 Gateway 的同一用户确认 Claude Code 已安装并登录：

```bash
claude --version
claude auth status --text
claude auth login
```

然后运行 `openclaw onboard` 并选择 Claude CLI。OpenClaw 通过官方 Agent SDK
调用本机 Claude Code；它不会读取、保存、刷新、选择或转发 Claude CLI 的原生
登录 Token，登录生命周期仍由 Claude Code 自己管理。

建议保持规范 Anthropic 模型名，把执行后端写到模型运行时策略：

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-5" },
      models: {
        "anthropic/claude-opus-5": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

旧 `claude-cli/<model>` 引用仍可兼容，但新配置应把 Provider/Model 与 Runtime
分开。连续 Agent turn 在认证会话和执行策略一致时会复用 warm Agent SDK query；
Gateway 重启或进程结束后，下轮从已持久化 Claude Code 会话继续。

::: warning 宿主必须一致
Claude CLI 复用依赖 Gateway 用户自己的本机登录。普通容器不会自动挂载宿主的
`~/.claude`；Docker 需要在持久化容器 home 中单独登录，其他容器路径更适合用
Anthropic API Key。
:::

## Claude CLI 的长上下文

Anthropic API 支持某个长窗口，不代表本机 Claude CLI 自动取得同样预算。较早模型（例如 Sonnet 4.6）要结合 CLI 自身元数据和配置上限；合格的 `[1m]` 模型引用或 `params.context1m: true` 才明确选择 1M 预算。最终可用性仍取决于已安装 CLI 和账号权限，不能仅凭 OpenClaw 配置证明已获得扩展上下文。

## Setup Token 仍可使用

如果需要手动导入长期 Token：

```bash
claude setup-token
openclaw models auth login --provider anthropic --method setup-token
```

Token 会进入 OpenClaw 的 Agent SQLite 认证档案。不要把 Token 发进聊天，也不要
复制旧 `auth-profiles.json`。

## 订阅额度与生产选择

Anthropic 当前把 Agent SDK、`claude -p` 和第三方应用用量计入已登录 Claude
订阅的额度；API Key 则走独立按量账单。政策可能不经 OpenClaw 发版就变化，
对可预测成本或共享生产环境，API Key 仍是更稳妥的选择。

## 排障

```bash
openclaw models status --check
openclaw models status --probe --probe-provider anthropic
openclaw doctor
```

- Claude CLI 登录过期：运行 `claude auth status --text`，必要时重新
  `claude auth login`，然后重启 Gateway。
- `No credentials found`：确认在目标 Agent 上配置，或确认共享认证已经通过
  `openclaw doctor --fix` 迁移到共享 SQLite。
- 所有 profile 都在 cooldown：等待恢复或在 `auth.order.anthropic` 中加入备用
  API Key profile。

继续阅读：[OAuth](/tutorials/concepts/oauth)、[CLI Backends](/tutorials/gateway/cli-backends)、
[模型故障转移](/tutorials/concepts/model-failover)。
