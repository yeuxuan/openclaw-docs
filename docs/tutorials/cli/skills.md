---
title: "openclaw skills"
sidebarTitle: "skills"
---

# `openclaw skills`

`skills` 用来管理技能。技能不是插件，它更像给 Agent 的“做事说明书”，告诉它遇到某类任务时应该按什么步骤来。

```bash
openclaw skills list
openclaw skills list --eligible
openclaw skills info <name>
openclaw skills check --agent <id>
openclaw skills search "calendar"
openclaw skills install @owner/<slug>
openclaw skills verify @owner/<slug> --json
```

## 更新时会保护本地改动

普通更新会核对安装时记录的文件摘要；检测到技能目录有本地改动时会保留现状并拒绝覆盖：

```bash
openclaw skills update @owner/<slug>
```

确认要用上游版本替换本地改动时，才显式加 `--force`：

```bash
openclaw skills update @owner/<slug> --force
```

较老版本安装的技能没有摘要，需要先对单个技能做一次 forced update，之后才能正常验证增量。`openclaw skills update --all --force` 会一起覆盖所有检测到的本地修改，批量执行前应先备份或提交自己的改动。这里的 `--force` 与 `--force-install` 不同：后者用于 ClawHub 扫描尚未完成的 GitHub-backed 技能，不能替代本地修改确认。

## 什么时候用

- 想看当前有哪些技能。
- 写了一个本地技能，想先校验格式。
- 想从 ClawHub 搜索可安装技能。
- 某个 Agent 看不到技能，需要排查配置。

默认安装到所选 Agent 工作区的 `skills/`；`--global` 改为共享托管目录，不能与
`--agent` 同时使用。Git 与本地目录安装分别使用 `git:owner/repo[@ref]` 和
`./path/to/skill --as <name>`，源根目录必须有 `SKILL.md`。

需要审阅“从历史会话学到的技能”时使用 Workshop：

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

## 新手提醒

插件给 OpenClaw 增加能力；技能教 Agent 怎么用能力。
如果你只是想沉淀经验，比如“写周报按这个格式”，通常用技能就够了。

继续阅读：[技能系统](/tutorials/tools/skills)。
