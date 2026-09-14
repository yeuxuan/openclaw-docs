---
title: "openclaw memory"
sidebarTitle: "memory"
---

# `openclaw memory`

`memory` 用来查看、索引、搜索和整理 OpenClaw 的记忆。记忆能让 Agent 在未来对话中找回重要背景。

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory index --force
openclaw memory search "deployment notes"
openclaw memory promote --apply
```

## 什么时候用

- 想确认记忆插件是否可用。
- Agent 记不住某些资料，需要重新索引。
- 想搜索历史知识。
- 想把短期记忆提升到长期记忆。

## 新手提醒

`status` 是看状态，`index` 是重建索引，`search` 是查记忆，`promote` 是整理沉淀。
不确定时先跑：

```bash
openclaw memory status --deep
```

继续阅读：[记忆 Memory](/tutorials/concepts/memory)。

## 空搜索结果和过期索引

正常的后台索引可以在搜索返回后继续，不会仅因尚未完成就发出警告。只有自动索引失败或索引身份不兼容时，搜索才提示结果可能不完整；JSON 输出会附带 `stale: true`、`warning`、`action`。只有没有 `stale` 时，才应把空 `results` 当成可靠的“没有匹配”。

## 按参与者清理前先预览

`memory forget --participant` 按原始 actor ID 跨身份命名空间匹配，不是仅匹配用户 profile；选中的是整条会话，也会包含其他参与者的内容。先结合 `--dry-run --json` 检查 `participantMatches` 中的类型化身份、歧义项和完整会话范围，再考虑删除。合并用户 profile 不会偷偷改变原始 ID 的选择含义。
