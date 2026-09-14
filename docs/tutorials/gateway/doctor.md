---
title: "Doctor"
sidebarTitle: "Doctor"
description: "OpenClaw Gateway：Doctor。是 OpenClaw 的修复 + 迁移工具。它修复过期的 配置/状态，检查健康状况，并提供可操作的修复步骤。"
---

# Doctor

`openclaw doctor` 是 OpenClaw 的修复 + 迁移工具。它修复过期的
配置/状态，检查健康状况，并提供可操作的修复步骤。

---

## 先讲人话

Doctor 就是 OpenClaw 的“体检和小修理”命令。

当你不知道哪里坏了时，先跑它。
它会检查安装、配置、权限、Gateway、通道、沙箱、旧版本迁移等常见问题，然后告诉你下一步该做什么。

::: tip 新手记住这一条
遇到问题不要先翻一堆配置文件。
先运行：

```bash
openclaw doctor
```
:::

---

## 快速入门

```bash
openclaw doctor
```

它通常会边检查边问你是否要修复。
如果你看不懂某个提示，先不要用 `--force`，优先选择默认建议或回来看这篇说明。

### 修复常见问题

```bash
openclaw doctor --fix
```

这是官方文档和报错提示里最常见的修复命令。
它会应用 doctor 能安全处理的迁移和修复，适合“配置旧了、插件状态旧了、白名单格式要迁移”这类问题。

新手建议顺序：

```bash
openclaw doctor
openclaw doctor --fix
openclaw doctor
```

第一次先看问题，第二次修，第三次确认问题是否消失。

### 无头/自动化

```bash
openclaw doctor --yes
```

无需提示接受默认的非服务修复；Gateway 服务定义重写仍需交互确认。无头运行通常只报告服务配置漂移，不会悄悄重写服务定义。

```bash
openclaw doctor --repair
```

无需提示应用推荐的非服务修复；`--repair` 是 `--fix` 的别名，同样不跳过服务定义重写的交互确认。

```bash
openclaw doctor --repair --force
```

也应用激进的修复（覆盖自定义监管配置）。
新手不要一上来用这个，除非你已经知道它会改什么。

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

下面这份清单比较长。新手不用逐条背，只要知道 doctor 会覆盖三类问题：

- 安装状态：命令、服务、端口、UI 资源。
- 配置状态：旧配置迁移、权限、认证、模型。
- 运行状态：Gateway、通道、沙箱、日志和状态目录。

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

这一节更适合排查复杂问题或维护旧安装。
如果你只是普通使用者，读到这里可以先停；真遇到 doctor 报告某一项，再回来查对应小节。

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

Gateway 启动现在可对符合条件的单文件配置自动迁移确定性的旧键。只有完整结果（包括插件配置）验证通过才写入，并在 `openclaw.json.bak`、`.bak.1` 至 `.bak.4` 环形备份中保留旧配置。

含 `$include`、Nix 管理、由更新版本写入的配置，以及更新进行中且插件验证尚未完成的配置，不会在启动时自动迁移。迁移后仍无效就保持原文件不变并拒绝启动；交互终端可提示运行 Doctor 后重试一次，无头服务只输出修复命令：

```bash
openclaw doctor --fix
```

Doctor 的自动迁移窗口是有限的，通常只保留约两个月。当前仍可自动迁移的典型项包括
`agents.list` → keyed `agents.entries`，以及 `tools.exec.security` + `tools.exec.ask` →
`tools.exec.mode`。很老的 `routing.*`、顶层 `agent.*` / `identity` 等键可能已没有自动迁移
路径，需要对照[配置参考](/tutorials/gateway/configuration-reference)手工重写；不要假设升级后启动
Gateway 就会替你完成。改完先运行 `openclaw config validate`，再启动服务。

### 2b) OpenCode Zen 提供商（Provider）覆盖

如果你手动添加了 `models.providers.opencode`（或 `opencode-zen`），它
会覆盖 `@mariozechner/pi-ai` 的内置 OpenCode Zen 目录。这可能
强制所有模型使用单一 API 或将成本归零。Doctor 会发出警告以便你可以
移除覆盖并恢复每模型 API 路由 + 成本。

### 2c) Codex 路由修复

新版 Codex 原生运行时使用的是：

```text
openai/* 模型引用 + 默认 Codex runtime
```

旧配置里可能还留着 `openai-codex/*`。这很容易让人把“模型路线”和“Codex 登录资料”混在一起。
新安装优先写账号可用的 `openai/gpt-6-astra`；无权限时显式选择
`openai/gpt-5.5`。只有精确官方 HTTPS native route、无自定义请求覆盖且 runtime
策略为 unset/auto 时，OpenAI Agent turn 才可能隐式选择 Codex harness。

`openclaw doctor --fix` 现在会尝试修复这些旧路由：

- 把 `openai-codex/gpt-*` 改成 `openai/gpt-*`。
- 清理旧的 whole-agent runtime key 和会话 runtime pin。
- 只在 provider/model 级别需要显式运行时策略时，保留 `agentRuntime.id: "codex"` 或 `agentRuntime.id: "openclaw"`。
- 同步修复默认模型、fallback、heartbeat、subagent、compaction、hooks、通道模型覆盖和持久化会话里的旧路由状态。

::: tip 现在不要再写 `agentRuntime.id: "pi"`
`pi` 只是旧版兼容别名。新配置如果必须指定 OpenClaw 内置运行时，请写 `openclaw`。
多数 OpenAI Agent 配置不需要手动写 runtime。
:::

如果你以前手动写过 Codex 模型配置，升级后优先跑：

```bash
openclaw doctor --fix
```

### 2d) Talk 配置迁移

新版 Talk 配置把“普通语音播放”和“实时语音会话”分开：

- 语音播放：`talk.provider` + `talk.providers.<provider>`
- 实时语音：`talk.realtime.*`

如果旧配置里还有这些顶层字段：

- `talk.mode`
- `talk.transport`
- `talk.brain`
- `talk.model`
- `talk.voice`

或者旧的：

- `talk.voiceId`
- `talk.voiceAliases`
- `talk.modelId`
- `talk.outputFormat`
- `talk.apiKey`

运行：

```bash
openclaw doctor --fix
openclaw gateway restart
```

doctor 会把它们迁到当前结构。

### 3) 旧版状态迁移（磁盘布局）

Doctor 可以将旧的磁盘布局迁移到当前结构：

- 会话（Session）存储 + 转录：
  - 把 `~/.openclaw/sessions/` 或每个 Agent 的 `sessions/` 目录中的旧版
    `sessions.json` 与 JSONL 历史导入
    `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- 智能体（Agent）目录：
  - 从 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp 认证状态（Baileys）：
  - 从旧版 `~/.openclaw/credentials/*.json`（除 `oauth.json`）
  - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`（默认账户 id：`default`）

旧版会话文件的导入与修复现在只由显式 Doctor 运行负责。Gateway 和本地 CLI
启动时只使用 SQLite，不会导入、恢复或改写旧会话 JSON/JSONL；若发现旧会话库，
会拒绝就绪并打印当前 profile 对应的 `doctor --fix` 命令，而不是用空历史继续运行。

升级时先停止 Gateway、备份状态，再运行 `openclaw doctor --fix`，成功后重启。
Doctor 会在保留旧目录作为备份时发出警告；WhatsApp 认证也仍只通过
`openclaw doctor` 迁移。

### 4) 状态完整性检查（会话（Session）持久化、路由和安全）

状态目录是运维核心。如果它消失，你会丢失
会话（Session）、凭证、日志和配置（除非你在其他地方有备份）。

Doctor 检查：

- 状态目录缺失：警告灾难性的状态丢失，提示重新创建
  目录，并提醒它无法恢复丢失的数据。
- 状态目录权限：验证可写性；提供修复权限的选项
  （当检测到所有者/组不匹配时发出 `chown` 提示）。
- 会话目录权限：检查现有会话与存储目录是否可写；新 profile 尚未生成归档目录属于
  正常状态，需要时才会创建。
- 旧版转录不匹配：仅在尚未导入的旧会话条目缺少转录文件时警告；SQLite 会话不依赖
  已归档的 JSONL。
- 旧版主会话“1 行 JSONL”：仅检查尚未导入、历史未正常累积的旧转录。
- 多个状态目录：当多个 `~/.openclaw` 文件夹存在于
  不同的 home 目录或当 `OPENCLAW_STATE_DIR` 指向其他位置时发出警告（历史可能
  在安装之间分裂）。
- 远程模式提醒：如果 `gateway.mode=remote`，doctor 提醒你在
  远程主机上运行它（状态在那里）。
- 配置文件权限：当 `~/.openclaw/openclaw.json`
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
- `openclaw doctor --yes`、`--fix`、`--repair` 自动处理非服务修复，服务定义重写仍需交互确认。
- `openclaw doctor --fix --force` 可以覆盖托管服务定义，但不会修改操作者维护的 systemd drop-in，也不能越过服务所有权边界。
- Linux 上，匹配的 systemd 单元仍在运行时不会重写启动命令；先用 `systemctl --user cat <unit>.service` 检查实际生效的定义和 drop-in。
- `OPENCLAW_SERVICE_REPAIR_POLICY=external` 让服务生命周期保持只读：报告健康状况，但不安装、启动、重启或重写服务。
- 恢复 Gateway token 前会检查已安装与计划服务文件的访问权限。检查被阻止时，服务修复不会改 token 或对应配置；应恢复检查权限或联系部署所有者，`--force` 也不能绕过。

报 `newer schema version` 时，不要对旧安装反复运行 `doctor --fix`。先确认 CLI 和服务使用同一份支持当前数据库的安装。涉及 Agent schema 18/19 的迁移需停止所有写入者并验证备份，详见[数据库版本与升级恢复](/tutorials/reference/database-schemas)。嵌入提供商健康检查不是数据库迁移；向量服务不可用时保留已有语义索引，不会因此替换成纯全文索引。

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
[/concepts/agent-workspace](/tutorials/concepts/agent-workspace)。
