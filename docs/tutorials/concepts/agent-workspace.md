---
title: "智能体工作区"
sidebarTitle: "智能体工作区"
---

# 智能体工作区（Agent Workspace）

工作区（Workspace）是智能体（Agent）的主目录。它是文件工具和工作区上下文使用的唯一工作目录。请将其视为私有空间并当作记忆来对待。

这与存储配置、凭证和会话（Session）的 `~/.openclaw/` 是分开的。

**重要：** 工作区是 **默认 cwd**，而非硬隔离的沙箱（Sandbox）。工具会将相对路径解析到工作区，但绝对路径仍然可以访问宿主机上的其他位置，除非启用了沙箱。如果需要隔离，请使用 [`agents.defaults.sandbox`](/gateway/sandboxing)（和/或每个智能体的沙箱配置）。当启用沙箱且 `workspaceAccess` 不是 `"rw"` 时，工具在 `~/.openclaw/sandboxes` 下的沙箱工作区中操作，而非宿主工作区。

---

## 默认位置

- 默认：`~/.openclaw/workspace`
- 如果设置了 `OPENCLAW_PROFILE` 且不是 `"default"`，默认变为 `~/.openclaw/workspace-<profile>`。
- 在 `~/.openclaw/openclaw.json` 中覆盖：

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 会创建工作区并在缺失时填充引导文件。

如果你已经自行管理工作区文件，可以禁用引导文件创建：

```json5
{ agent: { skipBootstrap: true } }
```

---

## 额外的工作区文件夹

旧版安装可能创建了 `~/openclaw`。保留多个工作区目录可能导致认证或状态混乱，因为同一时间只有一个工作区处于活动状态。

**建议：** 保留单一活动工作区。如果不再使用额外的文件夹，请归档或移至回收站（例如 `trash ~/openclaw`）。如果有意保留多个工作区，请确保 `agents.defaults.workspace` 指向活动的那个。

`openclaw doctor` 会在检测到额外工作区目录时发出警告。

---

## 工作区文件一览（每个文件的含义）

以下是 OpenClaw 在工作区中期望的标准文件：

- `AGENTS.md`
  - 智能体的操作指令以及如何使用记忆。
  - 在每次会话开始时加载。
  - 适合放置规则、优先级和"行为方式"等细节。

- `SOUL.md`
  - 人设、语调和边界。
  - 每次会话加载。

- `USER.md`
  - 用户是谁以及如何称呼他们。
  - 每次会话加载。

- `IDENTITY.md`
  - 智能体的名称、风格和表情符号。
  - 在引导仪式期间创建/更新。

- `TOOLS.md`
  - 关于本地工具和约定的备注。
  - 不控制工具的可用性；仅作为指导。

- `HEARTBEAT.md`
  - 可选的心跳（Heartbeat）运行小清单。
  - 保持简短以避免 Token 消耗。

- `BOOT.md`
  - 当内部钩子启用时，在网关重启时执行的可选启动清单。
  - 保持简短；使用消息工具进行出站发送。

- `BOOTSTRAP.md`
  - 一次性的首次运行仪式。
  - 仅为全新工作区创建。
  - 仪式完成后删除。

- `memory/YYYY-MM-DD.md`
  - 每日记忆日志（每天一个文件）。
  - 建议在会话开始时读取今天 + 昨天的文件。

- `MEMORY.md`（可选）
  - 精选的长期记忆。
  - 仅在主要的私人会话中加载（不在共享/群组上下文中使用）。

参见[记忆](/concepts/memory)了解工作流和自动记忆刷新。

- `skills/`（可选）
  - 工作区特定的技能。
  - 当名称冲突时覆盖托管/捆绑的技能。

- `canvas/`（可选）
  - 用于节点显示的 Canvas UI 文件（例如 `canvas/index.html`）。

如果任何引导文件缺失，OpenClaw 会在会话中注入一个"缺失文件"标记并继续。大型引导文件在注入时会被截断；通过 `agents.defaults.bootstrapMaxChars`（默认：20000）调整限制。`openclaw setup` 可以在不覆盖现有文件的情况下重新创建缺失的默认文件。

---

## 不在工作区中的内容

以下内容位于 `~/.openclaw/` 下，**不应**提交到工作区仓库：

- `~/.openclaw/openclaw.json`（配置）
- `~/.openclaw/credentials/`（OAuth Token、API 密钥）
- `~/.openclaw/agents/<agentId>/sessions/`（会话记录 + 元数据）
- `~/.openclaw/skills/`（托管技能）

如果需要迁移会话或配置，请单独复制它们并将其排除在版本控制之外。

---

## Git 备份（推荐，私有）

将工作区视为私有记忆。放入一个 **私有** git 仓库以便备份和恢复。

在网关运行的机器上执行以下步骤（工作区就在那里）。

### 1）初始化仓库

如果安装了 git，全新工作区会自动初始化。如果此工作区还不是仓库，请运行：

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2）添加私有远程仓库（适合初学者的选项）

选项 A：GitHub 网页界面

1. 在 GitHub 上创建一个新的 **私有** 仓库。
2. 不要使用 README 初始化（避免合并冲突）。
3. 复制 HTTPS 远程 URL。
4. 添加远程并推送：

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

选项 B：GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

选项 C：GitLab 网页界面

1. 在 GitLab 上创建一个新的 **私有** 仓库。
2. 不要使用 README 初始化（避免合并冲突）。
3. 复制 HTTPS 远程 URL。
4. 添加远程并推送：

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3）后续更新

```bash
git status
git add .
git commit -m "Update memory"
git push
```

---

## 不要提交密钥

即使在私有仓库中，也要避免在工作区中存储密钥：

- API 密钥、OAuth Token、密码或私有凭证。
- `~/.openclaw/` 下的任何内容。
- 聊天原始转储或敏感附件。

如果必须存储敏感引用，请使用占位符，并将真实密钥保存在其他地方（密码管理器、环境变量或 `~/.openclaw/`）。

建议的 `.gitignore` 起始配置：

```text
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

---

## 将工作区迁移到新机器

1. 将仓库克隆到目标路径（默认 `~/.openclaw/workspace`）。
2. 在 `~/.openclaw/openclaw.json` 中将 `agents.defaults.workspace` 设置为该路径。
3. 运行 `openclaw setup --workspace <path>` 以填充任何缺失的文件。
4. 如果需要会话，从旧机器单独复制 `~/.openclaw/agents/<agentId>/sessions/`。

---

## 高级说明

- 多智能体路由可以为每个智能体使用不同的工作区。参见[通道路由](/channels/channel-routing)了解路由配置。
- 如果启用了 `agents.defaults.sandbox`，非主会话可以在 `agents.defaults.sandbox.workspaceRoot` 下使用每会话的沙箱工作区。
