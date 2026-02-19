---
title: "迁移指南"
sidebarTitle: "迁移指南"
---

# 将 OpenClaw 迁移到新机器

本指南将 OpenClaw 网关（Gateway）从一台机器迁移到另一台，**无需重新进行引导**。

迁移在概念上很简单：

- 复制**状态目录**（`$OPENCLAW_STATE_DIR`，默认：`~/.openclaw/`）— 包含配置、认证、会话和通道状态。
- 复制你的**工作区（Workspace）**（默认 `~/.openclaw/workspace/`）— 包含你的智能体文件（记忆、提示词等）。

但在**配置文件**、**权限**和**不完整复制**方面有常见的陷阱。

---

## 开始之前（你在迁移什么）

### 1) 确定你的状态目录

大多数安装使用默认值：

- **状态目录：** `~/.openclaw/`

但如果你使用以下方式，可能会不同：

- `--profile <name>`（通常变为 `~/.openclaw-<profile>/`）
- `OPENCLAW_STATE_DIR=/some/path`

如果你不确定，在**旧机器**上运行：

```bash
openclaw status
```

在输出中查找 `OPENCLAW_STATE_DIR` / profile 的提及。如果你运行多个网关，对每个 profile 重复操作。

### 2) 确定你的工作区

常见默认值：

- `~/.openclaw/workspace/`（推荐工作区）
- 你创建的自定义文件夹

你的工作区是 `MEMORY.md`、`USER.md` 和 `memory/*.md` 等文件所在的位置。

### 3) 了解你将保留什么

如果你**同时**复制状态目录和工作区，你将保留：

- 网关配置（`openclaw.json`）
- 认证配置 / API 密钥 / OAuth Token
- 会话历史 + 智能体状态
- 通道状态（例如 WhatsApp 登录/会话）
- 你的工作区文件（记忆、技能笔记等）

如果你**仅**复制工作区（例如通过 Git），你**不会**保留：

- 会话
- 凭据
- 通道登录

这些存储在 `$OPENCLAW_STATE_DIR` 下。

---

## 迁移步骤（推荐）

### 步骤 0 — 备份（旧机器）

在**旧机器**上，先停止网关以确保文件不会在复制过程中被修改：

```bash
openclaw gateway stop
```

（可选但推荐）归档状态目录和工作区：

```bash
# 如果你使用 profile 或自定义位置，请调整路径
cd ~
tar -czf openclaw-state.tgz .openclaw

tar -czf openclaw-workspace.tgz .openclaw/workspace
```

如果你有多个 profile/状态目录（例如 `~/.openclaw-main`、`~/.openclaw-work`），分别归档每一个。

### 步骤 1 — 在新机器上安装 OpenClaw

在**新机器**上，安装 CLI（如需要也安装 Node）：

- 参见：[安装](/install)

在此阶段，引导创建一个新的 `~/.openclaw/` 是可以的 — 你将在下一步覆盖它。

### 步骤 2 — 将状态目录 + 工作区复制到新机器

**同时**复制：

- `$OPENCLAW_STATE_DIR`（默认 `~/.openclaw/`）
- 你的工作区（默认 `~/.openclaw/workspace/`）

常用方法：

- `scp` 传输压缩包并解压
- 通过 SSH 使用 `rsync -a`
- 外部驱动器

复制后确保：

- 隐藏目录已包含（例如 `.openclaw/`）
- 文件所有权对于运行网关的用户是正确的

### 步骤 3 — 运行 Doctor（迁移 + 服务修复）

在**新机器**上：

```bash
openclaw doctor
```

Doctor 是"安全无聊"的命令。它修复服务、应用配置迁移并警告不匹配的地方。

然后：

```bash
openclaw gateway restart
openclaw status
```

---

## 常见陷阱（以及如何避免）

### 陷阱：profile / 状态目录不匹配

如果你在旧网关上使用了 profile（或 `OPENCLAW_STATE_DIR`），而新网关使用了不同的值，你会看到以下症状：

- 配置更改不生效
- 通道缺失 / 已登出
- 空的会话历史

修复：使用你迁移的**相同** profile/状态目录运行网关/服务，然后重新运行：

```bash
openclaw doctor
```

### 陷阱：仅复制 `openclaw.json`

`openclaw.json` 是不够的。许多提供商将状态存储在：

- `$OPENCLAW_STATE_DIR/credentials/`
- `$OPENCLAW_STATE_DIR/agents/<agentId>/...`

始终迁移整个 `$OPENCLAW_STATE_DIR` 文件夹。

### 陷阱：权限 / 所有权

如果你以 root 身份复制或更改了用户，网关可能无法读取凭据/会话。

修复：确保状态目录 + 工作区的所有者是运行网关的用户。

### 陷阱：在远程/本地模式之间迁移

- 如果你的 UI（WebUI/TUI）指向**远程**网关，远程主机拥有会话存储 + 工作区。
- 迁移你的笔记本电脑不会移动远程网关的状态。

如果你处于远程模式，请迁移**网关主机**。

### 陷阱：备份中的密钥

`$OPENCLAW_STATE_DIR` 包含密钥（API 密钥、OAuth Token、WhatsApp 凭据）。像对待生产密钥一样对待备份：

- 加密存储
- 避免通过不安全的渠道分享
- 如果你怀疑泄露，轮换密钥

---

## 验证清单

在新机器上确认：

- `openclaw status` 显示网关正在运行
- 你的通道仍然连接（例如 WhatsApp 不需要重新配对）
- 面板打开并显示现有会话
- 你的工作区文件（记忆、配置）已存在

---

## 相关链接

- [Doctor](/gateway/doctor)
- [网关故障排除](/gateway/troubleshooting)
- [OpenClaw 将数据存储在哪里？](/help/faq#where-does-openclaw-store-its-data)
