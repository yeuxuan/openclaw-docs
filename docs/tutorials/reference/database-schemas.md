---
title: "数据库版本与升级恢复"
sidebarTitle: "数据库版本"
description: "OpenClaw SQLite schema 升级、参与者与创建者身份迁移、旧版本拒绝打开及可恢复备份要求。"
---

# 数据库版本与升级恢复

OpenClaw 的控制面和各 Agent 使用独立 SQLite 数据库。升级程序和 Gateway 会检查兼容性，旧版本不能靠修改版本号来读取新数据。

| 数据 | 默认位置 |
|---|---|
| 全局控制面 | `~/.openclaw/state/openclaw.sqlite` |
| 单个 Agent | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` |

自定义状态目录会改变实际路径。数据库的 `PRAGMA user_version` 和 `schema_meta` 共同记录 schema；不要手工调低任一标记。相同 schema 数字也不保证表结构完全相同，部分新表或可空列可以在同版本增加。

## 升级前的安全顺序

1. 停止 Gateway 和其他数据库写入者，确认后台服务不会自动拉起旧进程。
2. 使用[备份命令](/tutorials/cli/backup)制作并验证包含 SQLite WAL 状态的一致性备份，不要只复制正在使用的主 `.sqlite` 文件。
3. 用目标新版本运行 `openclaw doctor --fix`，确认所有配置、默认布局和注册数据库通过 readiness 检查。
4. 成功后再恢复服务。共享库与 Agent 库分别提交；中途某个库失败时保持写入者停止，用同一新版本重跑 Doctor。

下面的版本变化来自 2026-08-31 上游主线快照，标记为尚未发布；安装的稳定版不一定已包含它们。

## 参与者与创建者身份

Agent schema **18** 将参与者唯一键改为 `(session_key, identity_namespace, actor_id)`。相同的 profile ID、通道发送者 ID、Agent ID 仍是不同身份。历史成员和贡献汇总保留，但无法证明的历史首次/末次输入时间保持未知，不从显示名、UUID 或 transcript 猜测补全。普通运行时拒绝旧参与者结构，不在活跃读写者背后自动迁移。

Agent schema **19** 与共享状态 schema **14** 为人类创建者保留来源：已验证 `profile`、`channel` 或 `unknown`。历史归属不明的任务保留内容，但不会自动得到某个 profile 的创建者权限；重新分配 owner 只改变责任，不修复授权。

角色强制沙箱下，已证明的 profile 继续使用原隔离资源；通道与未知来源改为规范会话隔离。旧的模糊归属工作区不会自动删除或采用，升级前应保全需要的文件，详见[沙箱](/tutorials/gateway/sandboxing)。

## 会话绑定结构

共享状态 schema **15** 去掉 `current_conversation_bindings` 的 `target_agent_id`、`target_session_id` 派生列，改用完整 `target_session_key` 定位。多个会话地址仍可绑定同一目标，通道/账号隔离、审批、有效期与解绑语义不变。未知触发器、索引依赖或校验失败会回滚，不会为了升级强行删除依赖。

## 遇到 newer schema version

这是安装版本不兼容，不是空数据库。Gateway 以状态码 `78` 退出以避免 systemd 无限重试；macOS 托管 LaunchAgent 也会暂停重试。旧安装的 `doctor --fix` 不能修复比它更新的 schema。

先核对 CLI 与后台服务的真实安装根目录；相同 OpenClaw 版本字符串可能对应不同主线提交和数据库形状。源码安装的运行态状态/拒绝信息报告的是构建 `dist/` 时记录的提交，不是当前 Git HEAD；构建身份未知时先在对应源码安装运行 `pnpm build`。

回退需停止所有写入者，将已验证的升级前备份恢复到单独状态目录，并搭配对应旧构建。不要调低 schema 标记，也不要重建已删除的派生列来伪造兼容。

上游来源：[Database schemas](https://github.com/openclaw/openclaw/blob/2e3bf941b7848fa9dfcbcfc8c9a89d99e2feeb30/docs/reference/database-schemas.md)。
