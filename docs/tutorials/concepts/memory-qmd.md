---
title: "QMD 记忆后端"
sidebarTitle: "QMD 记忆"
---

# QMD 记忆后端：把本地资料也变成可搜索记忆

QMD 可以理解成更强的本地记忆侧车。它能把你的本地文件、会话记录、项目资料拿来索引，让 OpenClaw 搜得更广、更准。

如果内置记忆是随身小本子，QMD 更像一个带目录的资料柜。

---

## 它适合谁？

适合这些用户：

- 本地有很多 Markdown、笔记或项目资料。
- 希望 Agent 能搜索以前的会话。
- 希望搜索时同时看关键词和语义。
- 愿意让本机运行额外索引服务或模型。

如果你刚安装 OpenClaw，可以先不用 QMD。先把基础通道和模型跑通，再来升级记忆。

---

## QMD 通常做什么？

| 能力 | 说明 |
|------|------|
| BM25 | 按关键词搜索 |
| 向量搜索 | 按意思搜索 |
| rerank | 重新排序，把更相关的结果放前面 |
| query expansion | 自动扩展查询词，提高召回 |
| extra paths | 索引额外文件夹 |
| transcripts | 索引会话记录 |

这些词听起来很技术，但目标只有一个：让 Agent 找资料时更像一个认真翻档案的人。

---

## 第一次搜索可能会慢

QMD 可能需要下载或加载本地模型，也可能要先给文件建索引。

所以第一次搜索慢，不一定是坏了。
它可能只是在整理资料柜。

---

## 想让 QMD 召回旧会话，还要多开几道门

很多人会以为只要开了 `memory.search.experimental.sessionMemory`，QMD 就会自动索引历史会话。
实际上还不够。

QMD 相关的最小思路是：

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

要点拆开看：

- `sessionMemory: true`：允许导出会话记录
- `sources: ["sessions"]`：搜索时真的去查会话片段
- `memory.qmd.sessions.enabled: true`：把会话内容真正导进 QMD 集合
- `tools.sessions.visibility`：决定当前会话能不能看见那些历史会话

当前默认可见性为 `agent`，非沙箱会话能召回同一 Agent 的其他会话，包括其他用户的对话。显式设置 `tree` 才收紧到当前及派生范围，但规范主会话仍能访问同 Agent 全部会话；`self` 才严格限制为当前会话。按发送者拆分 DM 不会自动缩小这些召回权限，沙箱限制和 Incognito 排除仍然生效。

---

## 出问题时会怎样？

理想情况下，QMD 不可用时，OpenClaw 可以回退到内置记忆或较简单的搜索方式。

这很重要。记忆增强是加分项，不应该让整个 Gateway 因为一个索引服务失败就完全不可用。

---

## 使用建议

1. 先跑通内置记忆。
2. 再打开 QMD。
3. 从一个小文件夹开始索引。
4. 确认搜索结果合理后，再扩大范围。
5. 不要一开始就把整个硬盘塞进去。

---

## 继续阅读

- [内置记忆引擎](/tutorials/concepts/memory-builtin)
- [记忆搜索](/tutorials/concepts/memory-search)
- [上下文引擎](/tutorials/concepts/context-engine)
