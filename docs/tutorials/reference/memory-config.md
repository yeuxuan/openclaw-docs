---
title: "Memory Config"
sidebarTitle: "记忆配置"
---

# Memory Config

记忆配置决定 OpenClaw 如何保存、搜索和注入长期信息。

常见选择：

- 内置 SQLite 记忆。
- QMD 本地资料后端。
- Honcho 或外部记忆服务。
- Dreaming 后台整理。

继续阅读：[记忆 Memory](/tutorials/concepts/memory)。

## 新手怎么选

个人使用先用内置记忆，不要一开始就接复杂外部服务。
团队知识库多、数据量大、需要更强检索时，再考虑 QMD、Wiki 或外部后端。

配置后先检查：

```bash
openclaw memory status --deep
openclaw doctor
```

## 会话记录召回的最小配置

如果你希望 `memory_search` 能召回旧会话，不要只开一个实验开关就收工。

内置记忆后端常见最小配置：

```json5
{
  memory: {
    search: {
      experimental: { sessionMemory: true },
      sources: ["memory", "sessions"],
    },
  },
  tools: {
    sessions: { visibility: "agent" },
  },
}
```

如果你用的是 QMD，还要再补一层会话导出：

```json5
{
  memory: {
    search: {
      experimental: { sessionMemory: true },
      sources: ["memory", "sessions"],
    },
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
  tools: {
    sessions: { visibility: "agent" },
  },
}
```

三个常见坑：

- 只开 `sessionMemory`，却没把 `"sessions"` 放进 `sources`
- 用 QMD，但没开 `memory.qmd.sessions.enabled`
- 显式设置了 `tools.sessions.visibility = "tree"` 或 `"self"`，却期望普通会话能召回同 Agent 的任意旧会话

当前默认值是 `agent`，非沙箱会话可召回同 Agent 的其他会话，也可能包括其他用户的对话。`tree` 限定当前及派生会话，但规范主会话仍有同 Agent 全部会话的例外；`self` 才是严格的当前会话范围。

按发送者拆分 DM 上下文不等于禁止跨会话召回。多人场景应显式选择较窄范围或拆分 Agent；沙箱限制和 Incognito 排除仍然生效。`rememberAcrossConversations` 不会扩大普通会话工具的可见范围。

## 搜索结果数量

未传工具参数 `maxResults` 时，`memory_search` 的 `corpus=memory` 和 `corpus=sessions` 使用 `memory.search.query.maxResults`（默认 `6`）；`corpus=wiki`、`corpus=all` 保持独立的默认 `10`。单次显式传入 `maxResults` 会覆盖对应默认值。
