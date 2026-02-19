---
title: "Doctor"
sidebarTitle: "Doctor"
---

# Doctor

`openclaw doctor` 是 OpenClaw 的修复 + 迁移工具。它修复过期的
配置/状态，检查健康状况，并提供可操作的修复步骤。

---

## 快速入门

```bash
openclaw doctor
```

### 无头/自动化

```bash
openclaw doctor --yes
```

无需提示接受默认值（包括适用时的重启/服务/沙箱（Sandbox）修复步骤）。

```bash
openclaw doctor --repair
```

无需提示应用推荐的修复（修复 + 在安全时重启）。

```bash
openclaw doctor --repair --force
```

也应用激进的修复（覆盖自定义监管配置）。

```bash
openclaw doctor --non-interactive
```

无提示运行，仅应用安全的迁移（配置规范化 + 磁盘状态移动）。跳过需要人工确认的重启/服务/沙箱（Sandbox）操作。
检测到旧版状态迁移时自动运行。

```bash
openclaw doctor --deep
```

扫描系统服务以查找额外的网关（Gateway）安装（launchd/systemd/schtasks）。

如果你想在写入前查看变更，先打开配置文件：

```bash
cat ~/.openclaw/openclaw.json
```

---

## 功能概述

- 可选的 git 安装预检更新（仅交互模式）。
- UI 协议新鲜度检查（当协议架构更新时重建控制界面）。
- 健康检查 + 重启提示。
- 技能状态摘要（可用/缺失/被阻止）。
- 旧版值的配置规范化。
- OpenCode Zen 提供商（Provider）覆盖警告（`models.providers.opencode`）。
- 旧版磁盘状态迁移（会话（Session）/智能体（Agent）目录/WhatsApp 认证）。
- 状态完整性和权限检查（会话（Session）、转录、状态目录）。
- 配置文件权限检查（本地运行时 chmod 600）。
- 模型认证健康：检查 OAuth 过期，可刷新即将过期的 Token，报告认证 profile 的冷却/禁用状态。
- 额外工作区（Workspace）目录检测（`~/openclaw`）。
- 启用沙箱（Sandbox）时的沙箱（Sandbox）镜像修复。
- 旧版服务迁移和额外网关（Gateway）检测。
- 网关（Gateway）运行时检查（服务已安装但未运行；缓存的 launchd 标签）。
- 通道（Channel）状态警告（从运行中的网关（Gateway）探测）。
- 监管配置审计（launchd/systemd/schtasks），可选修复。
- 网关（Gateway）运行时最佳实践检查（Node vs Bun、版本管理器路径）。
- 网关（Gateway）端口冲突诊断（默认 `18789`）。
- 开放私信策略的安全警告。
- 未设置 `gateway.auth.token` 时的网关（Gateway）认证警告（本地模式；提供 Token 生成）。
- Linux 上的 systemd linger 检查。
- 源码安装检查（pnpm 工作区不匹配、缺失 UI 资源、缺失 tsx 二进制）。
- 写入更新后的配置 + 向导元数据。

---

## 详细行为和原理

### 0) 可选更新（git 安装）

如果这是一个 git checkout 且 doctor 以交互方式运行，它会在运行 doctor 之前提供
更新（fetch/rebase/build）的选项。

### 1) 配置规范化

如果配置包含旧版值形式（例如 `messages.ackReaction`
没有通道（Channel）特定的覆盖），doctor 会将其规范化为当前
架构。

### 2) 旧版配置键迁移

当配置包含已弃用的键时，其他命令会拒绝运行并要求
你运行 `openclaw doctor`。

Doctor 会：

- 说明找到了哪些旧版键。
- 显示应用的迁移。
- 使用更新后的架构重写 `~/.openclaw/openclaw.json`。

网关（Gateway）在启动时检测到旧版配置格式时也会自动运行 doctor 迁移，
因此过期配置无需手动干预即可修复。

当前迁移：

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → 顶层 `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`

### 2b) OpenCode Zen 提供商（Provider）覆盖

如果你手动添加了 `models.providers.opencode`（或 `opencode-zen`），它
会覆盖 `@mariozechner/pi-ai` 的内置 OpenCode Zen 目录。这可能
强制所有模型使用单一 API 或将成本归零。Doctor 会发出警告以便你可以
移除覆盖并恢复每模型 API 路由 + 成本。

### 3) 旧版状态迁移（磁盘布局）

Doctor 可以将旧的磁盘布局迁移到当前结构：

- 会话（Session）存储 + 转录：
  - 从 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
- 智能体（Agent）目录：
  - 从 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp 认证状态（Baileys）：
  - 从旧版 `~/.openclaw/credentials/*.json`（除 `oauth.json`）
  - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账户 id：`default`）

这些迁移是尽力而为且幂等的；doctor 会在将旧版文件夹作为备份保留时
发出警告。网关（Gateway）/CLI 在启动时也会自动迁移
旧版会话（Session）+ 智能体（Agent）目录，使历史/认证/模型无需手动运行 doctor 即可
到达每智能体（Agent）路径。WhatsApp 认证有意仅通过
`openclaw doctor` 迁移。

### 4) 状态完整性检查（会话（Session）持久化、路由和安全）

状态目录是运维核心。如果它消失，你会丢失
会话（Session）、凭证、日志和配置（除非你在其他地方有备份）。

Doctor 检查：

- **状态目录缺失**：警告灾难性的状态丢失，提示重新创建
  目录，并提醒它无法恢复丢失的数据。
- **状态目录权限**：验证可写性；提供修复权限的选项
  （当检测到所有者/组不匹配时发出 `chown` 提示）。
- **会话（Session）目录缺失**：`sessions/` 和会话（Session）存储目录
  是持久化历史和避免 `ENOENT` 崩溃所必需的。
- **转录不匹配**：当最近的会话（Session）条目缺少
  转录文件时发出警告。
- **主会话（Session）"1 行 JSONL"**：当主转录只有一
  行时标记（历史没有累积）。
- **多个状态目录**：当多个 `~/.openclaw` 文件夹存在于
  不同的 home 目录或当 `OPENCLAW_STATE_DIR` 指向其他位置时发出警告（历史可能
  在安装之间分裂）。
- **远程模式提醒**：如果 `gateway.mode=remote`，doctor 提醒你在
  远程主机上运行它（状态在那里）。
- **配置文件权限**：当 `~/.openclaw/openclaw.json`
  对组/其他用户可读时发出警告，并提供收紧到 `600` 的选项。

### 5) 模型认证健康（OAuth 过期）

Doctor 检查认证存储中的 OAuth profile，当 Token
即将过期/已过期时发出警告，并在安全时刷新。如果 Anthropic Claude Code
profile 过期，它建议运行 `claude setup-token`（或粘贴 setup-token）。
刷新提示仅在交互运行时（TTY）出现；`--non-interactive`
跳过刷新尝试。

Doctor 还报告由于以下原因暂时不可用的认证 profile：

- 短期冷却（速率限制/超时/认证失败）
- 较长期禁用（计费/额度问题）

### 6) Webhook 模型验证

如果设置了 `hooks.gmail.model`，doctor 会根据
模型目录和白名单验证模型引用，当它无法解析或被禁止时发出警告。

### 7) 沙箱（Sandbox）镜像修复

启用沙箱（Sandbox）时，doctor 检查 Docker 镜像并提供在
当前镜像缺失时构建或切换到旧版名称的选项。

### 8) 网关（Gateway）服务迁移和清理提示

Doctor 检测旧版网关（Gateway）服务（launchd/systemd/schtasks）并
提供删除它们和使用当前网关（Gateway）端口安装 OpenClaw 服务的选项。它还可以扫描额外的类网关（Gateway）服务并打印清理提示。
命名 profile 的 OpenClaw 网关（Gateway）服务被视为一等公民，不会
被标记为"额外"。

### 9) 安全警告

Doctor 在提供商（Provider）对无白名单的私信开放时，或
策略以危险方式配置时发出警告。

### 10) systemd linger（Linux）

如果作为 systemd 用户服务运行，doctor 确保启用 lingering 以使
网关（Gateway）在注销后保持存活。

### 11) 技能状态

Doctor 打印当前工作区（Workspace）可用/缺失/被阻止技能的快速摘要。

### 12) 网关（Gateway）认证检查（本地 Token）

Doctor 在本地网关（Gateway）缺少 `gateway.auth` 时发出警告并提供
生成 Token 的选项。使用 `openclaw doctor --generate-gateway-token` 在自动化中强制创建 Token。

### 13) 网关（Gateway）健康检查 + 重启

Doctor 运行健康检查并在网关（Gateway）看起来不健康时提供重启选项。

### 14) 通道（Channel）状态警告

如果网关（Gateway）健康，doctor 运行通道（Channel）状态探测并报告
警告及建议的修复方案。

### 15) 监管配置审计 + 修复

Doctor 检查已安装的监管配置（launchd/systemd/schtasks）中
缺失或过期的默认值（例如 systemd 的 network-online 依赖和
重启延迟）。当发现不匹配时，它推荐更新并可以
将服务文件/任务重写为当前默认值。

注意：

- `openclaw doctor` 在重写监管配置前会提示。
- `openclaw doctor --yes` 接受默认的修复提示。
- `openclaw doctor --repair` 无需提示应用推荐的修复。
- `openclaw doctor --repair --force` 覆盖自定义监管配置。
- 你始终可以通过 `openclaw gateway install --force` 强制完全重写。

### 16) 网关（Gateway）运行时 + 端口诊断

Doctor 检查服务运行时（PID、最后退出状态）并在
服务已安装但实际未运行时发出警告。它还检查网关（Gateway）端口（默认 `18789`）上的端口冲突并报告可能的原因（网关（Gateway）已在运行、SSH 隧道）。

### 17) 网关（Gateway）运行时最佳实践

Doctor 在网关（Gateway）服务运行在 Bun 或版本管理器管理的 Node 路径上时发出警告
（`nvm`、`fnm`、`volta`、`asdf` 等）。WhatsApp + Telegram 通道（Channel）需要 Node，
版本管理器路径可能在升级后失效，因为服务不会
加载你的 shell 初始化。Doctor 在系统 Node 安装可用时提供
迁移选项（Homebrew/apt/choco）。

### 18) 配置写入 + 向导元数据

Doctor 持久化任何配置变更并记录向导元数据以记录
doctor 运行。

### 19) 工作区（Workspace）提示（备份 + 记忆系统）

Doctor 在缺少工作区（Workspace）记忆系统时建议添加，并在工作区（Workspace）不在 git 下时打印备份提示。

工作区（Workspace）结构和 git 备份（推荐私有 GitHub 或 GitLab）的完整指南请参阅
[/concepts/agent-workspace](/concepts/agent-workspace)。
