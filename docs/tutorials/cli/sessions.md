---
title: "openclaw sessions"
sidebarTitle: "sessions"
---

# `openclaw sessions`

`sessions` 用来查看已经保存的会话记录。会话记录是“聊过什么、什么时候活跃过”的账本，不等于通道是否在线。

```bash
openclaw sessions
openclaw sessions --limit 200
openclaw sessions --json
```

## 什么时候用

- 想找最近的对话记录。
- 想确认某个 Agent 或通道有没有产生会话。
- 想把会话列表交给脚本处理。

## 不要误用

不要用 `sessions` 判断 Discord、Telegram、Slack 是否在线。安静的通道可能已经连上了，但还没有产生新会话。

检查通道在线状态请用：

```bash
openclaw channels status --probe
openclaw status --deep
```

会话里可能有敏感上下文，导出或分享前先确认目的和权限。

## 列表和进度输出

终端表格会按窗口宽度排版，长模型名和标记会换行；长会话键可能只显示首尾。脚本和精确定位应使用 `openclaw sessions --json` 获取完整键，而不是复制表格缩略值。

JSON 行仅在会话设置了颜色时包含 `color`，清除颜色后会省略该字段。`sessions progress --follow` 跟随选中的 SQLite 会话，不应再把它当成旧 trajectory 文件的通用 tail 命令。

## 清理计数与删除失败

需要清理时先预览范围：

```bash
openclaw sessions cleanup --all-agents --dry-run --json
```

实际 artifact 清理只把成功删除的文件计入释放空间；删除失败不会虚增 freed bytes，该文件仍计入磁盘占用。无引用 artifact 和旧式磁盘预算清理会继续处理其他合格文件；规范 SQLite archive 修剪遇到删除错误则停止，以保留数据库恢复副本。

若用量仍高于目标，先解决文件系统权限或删除错误，再重试；不要把“尝试删除数量”当成空间已释放，也不要为追求计数手工丢弃恢复副本。
