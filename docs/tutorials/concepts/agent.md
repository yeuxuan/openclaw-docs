---
title: "智能体运行时"
sidebarTitle: "智能体运行时"
---

# 智能体运行时（Agent Runtime）

**智能体（Agent）** 是 OpenClaw 里真正"思考"的部分——它接收你的消息，调用 AI 模型，把回复发回给你。每个智能体有自己的工作区、记忆和配置。

---

## 工作区（Workspace）（必需）

OpenClaw 使用单一的智能体工作区目录（`agents.defaults.workspace`）作为智能体工具和上下文的 **唯一** 工作目录（`cwd`）。

建议：使用 `openclaw setup` 在缺失时创建 `~/.openclaw/openclaw.json` 并初始化工作区文件。

完整工作区布局 + 备份指南：[智能体工作区](/concepts/agent-workspace)

如果启用了 `agents.defaults.sandbox`，非主会话可以在 `agents.defaults.sandbox.workspaceRoot` 下使用每会话工作区覆盖此设置（参见[网关配置](/gateway/configuration)）。

---

## 引导文件（注入的）

在 `agents.defaults.workspace` 中，OpenClaw 期望以下用户可编辑文件：

- `AGENTS.md` — 操作指令 + "记忆"
- `SOUL.md` — 人设、边界、语调
- `TOOLS.md` — 用户维护的工具备注（例如 `imsg`、`sag`、约定）
- `BOOTSTRAP.md` — 一次性首次运行仪式（完成后删除）
- `IDENTITY.md` — 智能体名称/风格/表情符号
- `USER.md` — 用户资料 + 首选称呼

在新会话的第一轮，OpenClaw 将这些文件的内容直接注入到智能体上下文中。

空白文件会被跳过。大型文件会被修剪和截断并附加标记，以保持提示词精简（阅读文件获取完整内容）。

如果文件缺失，OpenClaw 会注入一行"缺失文件"标记（`openclaw setup` 会创建安全的默认模板）。

`BOOTSTRAP.md` 仅在 **全新工作区**（没有其他引导文件存在）时创建。如果你在完成仪式后删除它，后续重启不应重新创建它。

要完全禁用引导文件创建（用于预置的工作区），设置：

```json5
{ agent: { skipBootstrap: true } }
```

---

## 内置工具

核心工具（read/exec/edit/write 及相关系统工具）始终可用，受工具策略约束。`apply_patch` 是可选的，由 `tools.exec.applyPatch` 控制。`TOOLS.md` **不** 控制哪些工具存在；它只是关于你希望如何使用它们的指导。

---

## 技能

OpenClaw 从三个位置加载技能（工作区在名称冲突时优先）：

- 捆绑的（随安装包附带）
- 托管/本地：`~/.openclaw/skills`
- 工作区：`<workspace>/skills`

技能可以通过配置/环境进行门控（参见[网关配置](/gateway/configuration)中的 `skills`）。

## pi-mono 集成

OpenClaw 复用了 pi-mono 代码库的部分内容（模型/工具），但 **会话管理、发现和工具连接由 OpenClaw 拥有**。

- 没有 pi-coding 智能体运行时。
- 不会参考 `~/.pi/agent` 或 `<workspace>/.pi` 设置。

---

## 会话（Sessions）

会话记录存储为 JSONL 格式：

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

会话 ID 是稳定的，由 OpenClaw 选择。
旧版 Pi/Tau 会话文件夹 **不会** 被读取。

## 流式传输中的导向

当队列模式为 `steer` 时，入站消息会被注入到当前运行中。队列在 **每次工具调用后** 检查；如果存在排队的消息，当前助手消息中剩余的工具调用会被跳过（工具结果显示为 "Skipped due to queued user message."），然后排队的用户消息在下一个助手响应之前注入。

当队列模式为 `followup` 或 `collect` 时，入站消息会被保留直到当前轮次结束，然后使用排队的负载开始新的智能体轮次。参见[队列](/concepts/queue)了解模式 + 防抖/上限行为。

块流式输出会在完成的助手块完成后立即发送；默认 **关闭**（`agents.defaults.blockStreamingDefault: "off"`）。通过 `agents.defaults.blockStreamingBreak`（`text_end` vs `message_end`；默认为 text_end）调整边界。通过 `agents.defaults.blockStreamingChunk`（默认为 800–1200 字符；优先段落分隔，然后换行；最后是句子）控制软块分块。通过 `agents.defaults.blockStreamingCoalesce` 合并流式块以减少单行刷屏（发送前基于空闲的合并）。非 Telegram 通道需要显式设置 `*.blockStreaming: true` 来启用块回复。详细工具摘要在工具启动时发出（无防抖）；Control UI 在可用时通过智能体事件输出工具输出。更多详情：[流式输出 + 分块](/concepts/streaming)。

## 模型引用

配置中的模型引用（例如 `agents.defaults.model` 和 `agents.defaults.models`）通过在 **第一个** `/` 处分割来解析。

- 配置模型时使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含提供商前缀（例如：`openrouter/moonshotai/kimi-k2`）。
- 如果省略提供商，OpenClaw 将输入视为别名或 **默认提供商** 的模型（仅在模型 ID 中没有 `/` 时有效）。

---

## 配置（最小化）

至少设置：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（强烈建议）

---

_下一步：[群组聊天](/channels/group-messages)_
