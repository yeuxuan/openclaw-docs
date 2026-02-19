---
title: "智能体循环"
sidebarTitle: "智能体循环"
---

# 智能体循环（Agent Loop）（OpenClaw）

智能体循环（Agent Loop）是智能体（Agent）的完整"真实"运行过程：接收输入 → 上下文（Context）组装 → 模型推理 → 工具执行 → 流式输出（Streaming）回复 → 持久化。它是将一条消息转化为操作和最终回复的权威路径，同时保持会话（Session）状态的一致性。

在 OpenClaw 中，一次循环是每个会话（Session）的单次串行运行，当模型思考、调用工具和输出流式内容时，会发出生命周期和流事件。本文档解释了这个完整循环是如何端到端连接的。

---

## 入口点

- 网关（Gateway）RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

---

## 工作原理（高层概览）

1. `agent` RPC 验证参数、解析会话（Session）（sessionKey/sessionId）、持久化会话（Session）元数据，然后立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行智能体（Agent）：
   - 解析模型 + thinking/verbose 默认值
   - 加载技能快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   - 如果嵌入循环未发出生命周期 **end/error** 事件，则补充发出
3. `runEmbeddedPiAgent`：
   - 通过每会话（Session）+ 全局队列串行化运行
   - 解析模型 + 认证配置并构建 pi 会话（Session）
   - 订阅 pi 事件并流式输出助手/工具增量数据
   - 强制超时 -> 超时则中止运行
   - 返回负载 + 用量元数据
4. `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw `agent` 流：
   - 工具事件 => `stream: "tool"`
   - 助手增量 => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` 使用 `waitForAgentJob`：
   - 等待 `runId` 的 **lifecycle end/error** 事件
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

---

## 队列 + 并发

- 运行按会话（Session）键（会话通道）串行化，也可以选择通过全局通道处理。
- 这可以防止工具/会话竞争，并保持会话历史的一致性。
- 消息通道（Channel）可以选择队列模式（collect/steer/followup）来输入到此通道系统。
  参见[命令队列](/concepts/queue)。

---

## 会话（Session）+ 工作区（Workspace）准备

- 解析并创建工作区（Workspace）；沙箱（Sandbox）运行可能重定向到沙箱工作区根目录。
- 加载技能（或重用快照）并注入到环境和提示词中。
- 解析引导/上下文文件并注入到系统提示词报告中。
- 获取会话写锁；在流式输出之前打开并准备 `SessionManager`。

---

## 提示词组装 + 系统提示词

- 系统提示词由 OpenClaw 的基础提示词、技能提示词、引导上下文和每次运行的覆盖项构建。
- 强制执行模型特定的限制和压缩（Compaction）保留 Token。
- 参见[系统提示词](/concepts/system-prompt)了解模型看到的内容。

---

## 钩子点（拦截位置）

OpenClaw 有两套钩子系统：

- **内部钩子**（网关钩子）：用于命令和生命周期事件的事件驱动脚本。
- **插件钩子**：智能体/工具生命周期和网关管道内的扩展点。

### 内部钩子（网关钩子）

- **`agent:bootstrap`**：在系统提示词最终确定之前构建引导文件时运行。用于添加/移除引导上下文文件。
- **命令钩子**：`/new`、`/reset`、`/stop` 和其他命令事件（参见钩子文档）。

参见[钩子](/automation/hooks)了解设置和示例。

### 插件钩子（智能体 + 网关生命周期）

这些在智能体循环或网关管道内运行：

- **`before_agent_start`**：在运行开始前注入上下文或覆盖系统提示词。
- **`agent_end`**：在完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或注解压缩（Compaction）周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数/结果。
- **`tool_result_persist`**：在工具结果写入会话记录之前同步转换它们。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息钩子。
- **`session_start` / `session_end`**：会话生命周期边界。
- **`gateway_start` / `gateway_stop`**：网关生命周期事件。

参见[插件](/tools/plugin#plugin-hooks)了解钩子 API 和注册详情。

---

## 流式输出（Streaming）+ 部分回复

- 助手增量从 pi-agent-core 流式输出并作为 `assistant` 事件发出。
- 块流式输出可以在 `text_end` 或 `message_end` 时发出部分回复。
- 推理流式输出可以作为单独的流或块回复发出。
- 参见[流式输出](/concepts/streaming)了解分块和块回复行为。

---

## 工具执行 + 消息工具

- 工具的 start/update/end 事件在 `tool` 流上发出。
- 工具结果在日志记录/发出之前会对大小和图像负载进行清理。
- 消息工具发送被追踪以抑制重复的助手确认。

---

## 回复整形 + 抑制

- 最终负载由以下内容组装：
  - 助手文本（和可选的推理）
  - 内联工具摘要（当 verbose + 允许时）
  - 模型出错时的助手错误文本
- `NO_REPLY` 被视为静默 Token，从出站负载中过滤。
- 消息工具重复项从最终负载列表中移除。
- 如果没有可渲染的负载且工具出错，则发出备用工具错误回复（除非消息工具已经发送了用户可见的回复）。

---

## 压缩（Compaction）+ 重试

- 自动压缩发出 `compaction` 流事件，并可能触发重试。
- 重试时，内存缓冲区和工具摘要会被重置以避免重复输出。
- 参见[压缩](/concepts/compaction)了解压缩管道。

---

## 事件流（当前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 发出（以及作为 `agentCommand` 的后备）
- `assistant`：来自 pi-agent-core 的流式增量
- `tool`：来自 pi-agent-core 的流式工具事件

---

## 聊天通道处理

- 助手增量被缓冲为聊天 `delta` 消息。
- 在 **lifecycle end/error** 时发出聊天 `final`。

---

## 超时

- `agent.wait` 默认值：30 秒（仅等待时间）。`timeoutMs` 参数可覆盖。
- 智能体运行时：`agents.defaults.timeoutSeconds` 默认 600 秒；在 `runEmbeddedPiAgent` 中止计时器中强制执行。

---

## 可能提前结束的场景

- 智能体超时（中止）
- AbortSignal（取消）
- 网关断开连接或 RPC 超时
- `agent.wait` 超时（仅等待，不停止智能体）
