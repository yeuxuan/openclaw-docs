---
title: "Workboard 插件"
sidebarTitle: "Workboard"
description: "OpenClaw 插件：在控制 UI 中启用 Kanban 风格 Workboard，跟踪 Agent 工作卡片、任务和会话交接。"
---

# Workboard 插件

Workboard 插件会给 [控制 UI](/tutorials/web/control-ui) 增加一个可选的 Kanban 风格工作板。你可以用它收集适合 Agent 处理的工作卡片，指派给 Agent，并从一张卡片里跟踪关联的后台 task、run 和 dashboard session。

Workboard 是本地 Gateway 的轻量工作面板，不是 GitHub Issues、Linear、Jira 这类团队项目管理系统的替代品。

---

## 启用

Workboard 是 bundled plugin，但默认关闭：

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

打开 Dashboard：

```bash
openclaw dashboard
```

启用后，Dashboard 导航里会出现 Workboard 标签。如果标签可见但插件被禁用，或被 `plugins.allow` / `plugins.deny` 挡住，页面会显示插件不可用状态。

---

## 卡片包含什么

每张卡片包含：

- 标题和备注
- 状态：`triage`、`backlog`、`todo`、`scheduled`、`ready`、`running`、`review`、`blocked`、`done`
- 优先级：`low`、`normal`、`high`、`urgent`
- 标签
- 可选 agent id
- 可选 task、run、session 或 source URL 链接
- Codex 或 Claude 执行元数据
- attempts、comments、links、proof、artifacts、attachments、worker logs、diagnostics、notifications 等紧凑元数据

卡片存储在插件自己的 Gateway 状态里，会随着这个 Gateway 的 OpenClaw 状态一起迁移。

---

## 从卡片启动工作

未链接的卡片可以直接启动工作：

- Run Codex / Run Claude：启动 task-backed agent run，发送卡片 prompt，并把卡片标为 `running`。
- Open Codex / Open Claude：创建一个关联的 Dashboard session，但不发送卡片 prompt，也不移动卡片，适合人工接手。

Dashboard 会从 Gateway task ledger 刷新任务状态，并用 task id、run id 或 session key 反查卡片。任务完成、失败、超时或取消后，卡片生命周期会自动进入 review 或 blocked 等状态。

---

## Dispatch

Workboard Dispatch 是 Gateway 本地调度，不会直接启动任意操作系统进程。它使用正常 OpenClaw 子 Agent 会话执行工作。

Dispatch 会：

1. 把依赖已完成的子卡片提升到 `ready`。
2. 阻塞过期 claim 或超时 run。
3. 给 ready 卡片记录 dispatch 元数据。
4. Claim 少量 ready 卡片。
5. 通过 Gateway subagent runtime 启动 worker run。

默认一次最多启动 3 个 worker，并避免同一个 owner/agent 在同一轮里拿到过多工作。

如果你希望每张卡片都在独立 Git checkout 里执行，不要只盯着 dispatch 本身，还要配合看[托管 Worktree](/tutorials/concepts/managed-worktrees)。

入口包括：

- Dashboard dispatch action
- `openclaw workboard dispatch`
- 支持命令的通道里的 `/workboard dispatch`

CLI 细节见 [Workboard CLI](/tutorials/cli/workboard)。

---

## Agent 工具

Workboard 也提供 board-aware 工具，例如：

- `workboard_list`
- `workboard_read`
- `workboard_create`
- `workboard_claim`
- `workboard_heartbeat`
- `workboard_release`
- `workboard_complete`
- `workboard_block`
- `workboard_dispatch`

被 claim 的卡片会拒绝其他 Agent 的工具写入，除非调用方持有 claim token。Dashboard 操作者仍可通过 Gateway RPC 恢复或重新指派卡片。

---

## 数据和迁移

Workboard 使用插件拥有的 SQLite 数据库保存 board、card、label、生命周期事件、run attempt、comment、依赖链接、proof、artifact、attachment、diagnostic、notification、worker log 等数据。

如果你曾在 `.28` 版本使用 Workboard，可以运行：

```bash
openclaw doctor --fix
```

它会把旧的 plugin-state namespace，例如 `workboard.cards`、`workboard.boards`、`workboard.notify` 和可选 `workboard.attachments`，迁移到关系型数据库。

---

## 排查

- Dashboard 没有 Workboard 标签：确认 `openclaw plugins enable workboard` 后重启 Gateway。
- 标签有但不可用：检查 `plugins.allow` / `plugins.deny`。
- Dispatch 没启动 worker：确认有未 claim 的 `ready` 卡片，并检查 `openclaw gateway status --deep`。
- CLI 看不到 Dashboard 卡片：确认 CLI 和 Gateway 使用同一个 profile / state root。
