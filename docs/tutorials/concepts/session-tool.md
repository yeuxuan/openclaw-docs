---
title: "会话工具"
sidebarTitle: "会话工具"
---

# 会话工具（Session Tools）

目标：小型、难以误用的工具集，以便智能体可以列出会话、获取历史记录并发送到另一个会话。

---

## 工具名称

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

---

## 键模型

- 主直接聊天桶始终是字面键 `"main"`（解析为当前智能体的主键）。
- 群聊使用 `agent:<agentId>:<channel>:group:<id>` 或 `agent:<agentId>:<channel>:channel:<id>`（传递完整键）。
- Cron 作业使用 `cron:<job.id>`。
- 钩子使用 `hook:<uuid>`，除非显式设置。
- 节点会话使用 `node-<nodeId>`，除非显式设置。

`global` 和 `unknown` 是保留值，永远不会被列出。如果 `session.scope = "global"`，我们为所有工具将其别名为 `main`，这样调用者永远看不到 `global`。

---

## sessions_list

以行数组形式列出会话。

参数：

- `kinds?: string[]` 过滤器：`"main" | "group" | "cron" | "hook" | "node" | "other"` 中的任意值
- `limit?: number` 最大行数（默认：服务器默认值，限制如 200）
- `activeMinutes?: number` 仅在 N 分钟内更新的会话
- `messageLimit?: number` 0 = 不包含消息（默认 0）；>0 = 包含最后 N 条消息

行为：

- `messageLimit > 0` 为每个会话获取 `chat.history` 并包含最后 N 条消息。
- 列表输出中过滤工具结果；使用 `sessions_history` 获取工具消息。
- 在 **沙箱化** 的智能体会话中运行时，会话工具默认为 **仅派生可见**（见下文）。

行结构（JSON）：

- `key`：会话键（字符串）
- `kind`：`main | group | cron | hook | node | other`
- `channel`：`whatsapp | telegram | discord | signal | imessage | webchat | internal | unknown`
- `displayName`（群组显示标签，如果可用）
- `updatedAt`（毫秒）
- `sessionId`
- `model`、`contextTokens`、`totalTokens`
- `thinkingLevel`、`verboseLevel`、`systemSent`、`abortedLastRun`
- `sendPolicy`（会话覆盖，如果设置）
- `lastChannel`、`lastTo`
- `deliveryContext`（规范化的 `{ channel, to, accountId }`，如果可用）
- `transcriptPath`（从存储目录 + sessionId 派生的尽力路径）
- `messages?`（仅当 `messageLimit > 0` 时）

---

## sessions_history

获取一个会话的记录。

参数：

- `sessionKey`（必需；接受会话键或来自 `sessions_list` 的 `sessionId`）
- `limit?: number` 最大消息数（服务器限制）
- `includeTools?: boolean`（默认 false）

行为：

- `includeTools=false` 过滤 `role: "toolResult"` 消息。
- 以原始记录格式返回消息数组。
- 当给定 `sessionId` 时，OpenClaw 将其解析为对应的会话键（缺失的 ID 报错）。

---

## sessions_send

向另一个会话发送消息。

参数：

- `sessionKey`（必需；接受会话键或来自 `sessions_list` 的 `sessionId`）
- `message`（必需）
- `timeoutSeconds?: number`（默认 >0；0 = 即发即忘）

行为：

- `timeoutSeconds = 0`：入队并返回 `{ runId, status: "accepted" }`。
- `timeoutSeconds > 0`：等待最多 N 秒完成，然后返回 `{ runId, status: "ok", reply }`。
- 如果等待超时：`{ runId, status: "timeout", error }`。运行继续；稍后调用 `sessions_history`。
- 如果运行失败：`{ runId, status: "error", error }`。
- 通知投递在主运行完成后运行，是尽力而为的；`status: "ok"` 不保证通知已被投递。
- 通过网关 `agent.wait`（服务器端）等待，因此重连不会丢失等待。
- 为主运行注入智能体间消息上下文。
- 会话间消息以 `message.provenance.kind = "inter_session"` 持久化，以便记录读取者可以区分路由的智能体指令和外部用户输入。
- 主运行完成后，OpenClaw 运行一个 **回复循环**：
  - 第 2 轮以后在请求者和目标智能体之间交替。
  - 精确回复 `REPLY_SKIP` 以停止乒乓。
  - 最大轮次为 `session.agentToAgent.maxPingPongTurns`（0–5，默认 5）。
- 循环结束后，OpenClaw 运行 **智能体间通知步骤**（仅目标智能体）：
  - 精确回复 `ANNOUNCE_SKIP` 保持沉默。
  - 任何其他回复发送到目标通道。
  - 通知步骤包含原始请求 + 第 1 轮回复 + 最新乒乓回复。

---

## 通道字段

- 对于群组，`channel` 是会话条目上记录的通道。
- 对于直接聊天，`channel` 映射自 `lastChannel`。
- 对于 cron/hook/node，`channel` 是 `internal`。
- 如果缺失，`channel` 是 `unknown`。

---

## 安全 / 发送策略

基于策略的按通道/聊天类型阻止（非按会话 ID）。

```json
{
  "session": {
    "sendPolicy": {
      "rules": [
        {
          "match": { "channel": "discord", "chatType": "group" },
          "action": "deny"
        }
      ],
      "default": "allow"
    }
  }
}
```

运行时覆盖（每会话条目）：

- `sendPolicy: "allow" | "deny"`（未设置 = 继承配置）
- 可通过 `sessions.patch` 或仅所有者的 `/send on|off|inherit`（独立消息）设置。

执行点：

- `chat.send` / `agent`（网关）
- 自动回复投递逻辑

---

## sessions_spawn

在隔离会话中派生子智能体运行，并将结果通知回请求者的聊天通道。

参数：

- `task`（必需）
- `label?`（可选；用于日志/UI）
- `agentId?`（可选；如果允许，在另一个智能体 ID 下派生）
- `model?`（可选；覆盖子智能体模型；无效值报错）
- `runTimeoutSeconds?`（默认 0；设置时在 N 秒后中止子智能体运行）
- `cleanup?`（`delete|keep`，默认 `keep`）

白名单：

- `agents.list[].subagents.allowAgents`：通过 `agentId` 允许的智能体 ID 列表（`["*"]` 允许任意）。默认：仅请求者智能体。

发现：

- 使用 `agents_list` 发现哪些智能体 ID 被允许用于 `sessions_spawn`。

行为：

- 启动一个新的 `agent:<agentId>:subagent:<uuid>` 会话，`deliver: false`。
- 子智能体默认使用完整工具集 **减去会话工具**（可通过 `tools.subagents.tools` 配置）。
- 子智能体不允许调用 `sessions_spawn`（无子智能体 → 子智能体派生）。
- 始终非阻塞：立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 完成后，OpenClaw 运行子智能体 **通知步骤** 并将结果发布到请求者的聊天通道。
- 在通知步骤中精确回复 `ANNOUNCE_SKIP` 保持沉默。
- 通知回复规范化为 `Status`/`Result`/`Notes`；`Status` 来自运行时结果（非模型文本）。
- 子智能体会话在 `agents.defaults.subagents.archiveAfterMinutes`（默认：60）后自动归档。
- 通知回复包含统计行（运行时间、Token、sessionKey/sessionId、记录路径和可选的成本）。

---

## 沙箱会话可见性

沙箱化的会话可以使用会话工具，但默认只能看到通过 `sessions_spawn` 派生的会话。

配置：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        // 默认值："spawned"
        sessionToolsVisibility: "spawned", // 或 "all"
      },
    },
  },
}
```
