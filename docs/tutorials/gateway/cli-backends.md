---
title: "CLI 后端"
sidebarTitle: "CLI 后端"
---

# CLI 后端（回退运行时）

OpenClaw 可以运行**本地 AI CLI** 作为 API 提供商（Provider）不可用、
被限速或暂时异常时的**纯文本回退**。这是有意保守的设计：

- **工具被禁用**（无工具调用）。
- **文本输入 → 文本输出**（可靠）。
- **支持会话（Session）**（后续对话保持连贯）。
- **可以传递图片**（如果 CLI 接受图片路径）。

这被设计为**安全网**而非主要路径。当你
需要"始终可用"的文本响应而不依赖外部 API 时使用。

---

## 初学者快速入门

你可以**无需任何配置**使用 Claude Code CLI（OpenClaw 内置默认配置）：

```bash
openclaw agent --message "hi" --model claude-cli/opus-4.6
```

Codex CLI 也开箱即用：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.3-codex
```

如果你的网关（Gateway）在 launchd/systemd 下运行且 PATH 较少，只需添加
命令路径：

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

就是这样。除了 CLI 本身外，不需要密钥或额外的认证配置。

---

## 作为回退使用

将 CLI 后端添加到你的回退列表中，使其仅在主模型失败时运行：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/opus-4.6", "claude-cli/opus-4.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/opus-4.6": {},
        "claude-cli/opus-4.5": {},
      },
    },
  },
}
```

注意：

- 如果你使用 `agents.defaults.models`（白名单），必须包含 `claude-cli/...`。
- 如果主提供商（Provider）失败（认证、限速、超时），OpenClaw 会
  接下来尝试 CLI 后端。

---

## 配置概览

所有 CLI 后端配置位于：

```text
agents.defaults.cliBackends
```

每个条目以**提供商（Provider）id** 为键（例如 `claude-cli`、`my-cli`）。
提供商（Provider）id 成为你的模型引用的左侧部分：

```text
<provider>/<model>
```

### 配置示例

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-opus-4-5": "opus",
            "claude-sonnet-4-5": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

---

## 工作原理

1. **选择后端**：基于提供商（Provider）前缀（`claude-cli/...`）。
2. **构建系统提示**：使用相同的 OpenClaw 提示 + 工作区（Workspace）上下文。
3. **执行 CLI**：使用会话（Session）id（如果支持），以保持历史一致性。
4. **解析输出**：（JSON 或纯文本）并返回最终文本。
5. **持久化会话（Session）id**：每个后端保存会话（Session）id，以便后续使用相同的 CLI 会话（Session）。

---

## 会话（Session）

- 如果 CLI 支持会话（Session），设置 `sessionArg`（例如 `--session-id`）或
  `sessionArgs`（占位符 `{sessionId}`）当 ID 需要插入到
  多个标志中时。
- 如果 CLI 使用带有不同标志的**恢复子命令**，设置
  `resumeArgs`（恢复时替换 `args`）和可选的 `resumeOutput`
  （用于非 JSON 恢复）。
- `sessionMode`：
  - `always`：始终发送会话（Session）id（如果没有存储则使用新 UUID）。
  - `existing`：仅在之前存储过会话（Session）id 时发送。
  - `none`：从不发送会话（Session）id。

---

## 图片（直通）

如果你的 CLI 接受图片路径，设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会将 base64 图片写入临时文件。如果设置了 `imageArg`，这些
路径会作为 CLI 参数传递。如果未设置 `imageArg`，OpenClaw 会将
文件路径附加到提示中（路径注入），这对于从纯路径自动
加载本地文件的 CLI 来说已经足够（Claude Code CLI 行为）。

---

## 输入/输出

- `output: "json"`（默认）尝试解析 JSON 并提取文本 + 会话（Session）id。
- `output: "jsonl"` 解析 JSONL 流（Codex CLI `--json`）并提取
  最后一条智能体（Agent）消息以及存在时的 `thread_id`。
- `output: "text"` 将 stdout 视为最终响应。

输入模式：

- `input: "arg"`（默认）将提示作为最后一个 CLI 参数传递。
- `input: "stdin"` 通过 stdin 发送提示。
- 如果提示很长且设置了 `maxPromptArgChars`，则使用 stdin。

---

## 默认值（内置）

OpenClaw 为 `claude-cli` 提供默认配置：

- `command: "claude"`
- `args: ["-p", "--output-format", "json", "--dangerously-skip-permissions"]`
- `resumeArgs: ["-p", "--output-format", "json", "--dangerously-skip-permissions", "--resume", "{sessionId}"]`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

OpenClaw 也为 `codex-cli` 提供默认配置：

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

仅在需要时覆盖（常见：绝对 `command` 路径）。

---

## 限制

- **无 OpenClaw 工具**（CLI 后端不会收到工具调用）。某些 CLI
  可能仍会运行自己的智能体（Agent）工具。
- **无流式传输**（CLI 输出收集后返回）。
- **结构化输出**取决于 CLI 的 JSON 格式。
- **Codex CLI 会话（Session）**通过文本输出恢复（非 JSONL），这比初始的 `--json` 运行
  结构化程度低。OpenClaw 会话（Session）仍然正常工作。

---

## 故障排查

- **找不到 CLI**：将 `command` 设置为完整路径。
- **模型名称错误**：使用 `modelAliases` 将 `provider/model` → CLI 模型进行映射。
- **无会话（Session）连续性**：确保设置了 `sessionArg` 且 `sessionMode` 不是
  `none`（Codex CLI 当前无法使用 JSON 输出恢复）。
- **图片被忽略**：设置 `imageArg`（并验证 CLI 支持文件路径）。
