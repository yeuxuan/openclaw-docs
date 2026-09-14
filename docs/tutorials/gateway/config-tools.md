---
title: "Tools 配置"
sidebarTitle: "Tools 配置"
---

# Tools 配置：给 AI 工具箱上锁

`tools.*` 配置决定 Agent 能用哪些工具、哪些工具被禁止、不同模型能不能使用不同工具。

工具越强，越要管好。

---

## Tool profile

`tools.profile` 是一组基础工具集合。

| Profile | 适合场景 |
|---------|----------|
| `minimal` | 只保留很少状态工具 |
| `coding` | 代码任务常用，含文件、运行时、网页、会话、记忆等 |
| `messaging` | 主要做消息投递 |
| `full` | 不限制，等同放开 |

本地 onboarding 通常会偏向 `coding`。

---

## Tool groups

OpenClaw 用 group 简化配置：

| Group | 包含什么 |
|-------|----------|
| `group:runtime` | `exec`、`process`、`code_execution` |
| `group:fs` | 读写编辑文件、`apply_patch` |
| `group:web` | `web_search`、`web_fetch`、`x_search` |
| `group:ui` | `browser`、`canvas` |
| `group:automation` | `heartbeat_respond`、`cron`、`gateway` |
| `group:agents` | `agents_list`、`update_plan` |
| `group:media` | `image`、`image_generate`、`music_generate`、`video_generate`、`tts` |
| `group:messaging` | `message` |
| `group:nodes` | 节点能力 |

---

## allow 和 deny

示意：

```json5
{
  tools: {
    deny: ["browser", "canvas"]
  }
}
```

deny 优先级更高。
要禁止所有文件修改，不要只禁 `write`，还要考虑 `edit` 和 `apply_patch`。

```json5
{
  tools: {
    deny: ["write", "edit", "apply_patch"]
  }
}
```

---

## 按 provider 限制工具

某些模型不适合跑工具，或者你只信任某些模型做文件修改：

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] }
    }
  }
}
```

---

## 会话工具的可见范围

`tools.sessions.visibility` 当前默认是 `agent`：非沙箱会话可以访问同一 Agent 的其他会话，包括其他用户的对话和保留的 Cron 会话。按发送者拆分 `session.dmScope` 只隔离上下文，不会收紧会话工具的召回权限。

| 值 | 范围 |
|---|---|
| `self` | 仅当前会话，主会话也不例外 |
| `tree` | 当前及其派生会话；规范主会话仍能访问同 Agent 全部会话 |
| `agent` | 同 Agent 全部会话，当前默认 |
| `all` | 全部会话；跨 Agent 还须通过 `tools.agentToAgent` 策略 |

例如，需要严格限制跨会话读取时显式配置：

```json5
{
  tools: { sessions: { visibility: "self" } },
}
```

沙箱默认的 `sessionToolsVisibility: "spawned"` 仍会把范围收紧到派生子树；Incognito 会话不会因设置 `all` 而暴露。`tree` 允许访问自己拥有的跨 Agent 原生/ACP 子会话，`agent` 没有这一例外；依赖该工作流的配置应保留显式 `tree`。多人共用 Agent 时，先确认召回边界，必要时使用独立 Agent。

## Code Mode 默认值

`tools.codeMode.enabled` 默认为 `false`，即使同一对象已经设置其他 Code Mode 参数也不会自动启用。希望按模型目录的 `compat.codeMode: "preferred"` 激活时，须显式设置 `enabled: "auto"`。

## 新手建议

1. 先用默认 profile。
2. 只在明确需要时放开工具。
3. 命令执行看 [执行审批](/tutorials/tools/exec-approvals)。
4. 团队环境用 deny 做底线。
5. 对外通道不要默认开放危险工具。

---

## 继续阅读

- [工具系统](/tutorials/tools/)
- [执行审批](/tutorials/tools/exec-approvals)
- [高级执行审批](/tutorials/tools/exec-approvals-advanced)
