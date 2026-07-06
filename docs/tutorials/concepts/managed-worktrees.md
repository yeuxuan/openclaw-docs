---
title: "托管 Worktree"
sidebarTitle: "托管 Worktree"
description: "OpenClaw 核心概念：托管 Worktree。给 Agent 任务分配隔离的 Git 分支和 checkout，并支持快照、清理和恢复。"
---

# 托管 Worktree

如果你希望 Agent 改代码时不要直接在主仓库里乱跑，`managed worktrees` 就是 OpenClaw 官方给出的隔离方案。

可以先把它理解成：

- 每个任务单独开一个 Git 分支
- 每个任务单独用一个 checkout 目录
- 任务结束后，干净的 worktree 可以自动回收
- 有未提交改动或未推送 commit 时，会尽量保留，并支持做快照恢复

这比手工 `git worktree add` 更适合长期让 Agent 自动跑任务。

---

## 它解决什么问题

普通工作区适合日常聊天和轻量改动，但一旦开始做这些事，就容易互相污染：

- 多个任务并行改同一个仓库
- Workboard 卡片要各自跑独立任务
- 想让 Agent 试验改动，但又不想碰主 checkout
- 任务跑到一半失败，希望能把现场留住

托管 Worktree 的目标，就是让每个任务有自己独立的小工位。

---

## 目录和命名

OpenClaw 不会把临时目录塞进你的源码仓库，而是把托管 worktree 放到自己的状态目录下，大致结构类似：

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

同时会创建对应分支：

```text
openclaw/<name>
```

如果你没手动指定名字，OpenClaw 会自动生成一个 `wt-xxxxxxxx` 形式的名称。

---

## 新手该怎么理解“托管”

和你自己手动建 `git worktree` 的差别，主要在这里：

| 项目 | 手工 worktree | 托管 Worktree |
|------|------|------|
| 创建位置 | 你自己决定 | OpenClaw 统一放到状态目录 |
| 分支命名 | 你自己管 | OpenClaw 统一生成/复用 |
| 清理 | 你自己删 | OpenClaw 可按规则回收 |
| 现场保留 | 你自己想办法 | OpenClaw 可先快照再删 |
| 给 Agent 用 | 需要自己拼流程 | Workboard / Session 可直接接入 |

如果你只是偶尔手工改代码，普通 Git worktree 就够。
如果你要让 Agent 经常并行工作，托管 Worktree 更省心。

---

## 两个常见入口

### 1. 给会话单独开工作副本

在支持的客户端里，新建聊天时可以选择在 worktree 中开启新会话。

适合场景：

- 想让这一整段对话都在独立分支里进行
- 不想影响当前主工作区
- 需要给同一个仓库同时开多个并行任务

### 2. 给 Workboard 卡片分配隔离 checkout

[Workboard 插件](/tutorials/plugins/workboard) 可以把卡片工作区物化成托管 worktree。

这对自动 dispatch 特别有用：

- 卡片 A 改登录逻辑
- 卡片 B 改文档
- 卡片 C 跑测试修复

三张卡片可以各自在自己的 checkout 里跑，互不踩文件。

---

## `.worktreeinclude` 是干什么的

有些文件虽然被 `.gitignore` 忽略，但新建 worktree 时你仍然想带过去，比如：

- `.env.local`
- 某些本地 fixture
- 测试依赖的生成文件

这时可以在仓库根目录放一个：

```text
.worktreeinclude
```

写法沿用 gitignore 风格，例如：

```gitignore
.env.local
fixtures/generated/**
```

这样 OpenClaw 创建新 worktree 时，会把这些“已忽略但未跟踪”的文件一起复制过去。

注意：

- 已跟踪文件本来就会被 Git 带过去
- OpenClaw 不会粗暴覆盖目标文件
- 这不是密钥同步工具，敏感文件仍要谨慎管理

---

## `.openclaw/worktree-setup.sh` 是干什么的

如果你的仓库在每个新 checkout 里都要做固定准备动作，比如：

- 安装依赖
- 生成本地配置
- 复制某些测试资源

可以在仓库里放一个可执行脚本：

```text
.openclaw/worktree-setup.sh
```

OpenClaw 创建托管 worktree 后会执行它，并传入：

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

如果脚本失败，这次创建会中止，避免留下半成品 checkout。

实用理解：

- `.worktreeinclude` 解决“带哪些文件过去”
- `worktree-setup.sh` 解决“过去以后还要做什么准备”

---

## 自动清理和快照恢复

这是托管 Worktree 最值得注意的部分。

OpenClaw 不会无脑删除任务 checkout，而是先判断：

- 工作区是不是干净
- 有没有未推送 commit
- 当前有没有锁或正在被使用

默认策略可以先这样理解：

- 干净且没有未推送提交：可以安全回收
- 脏工作区或有未推送提交：优先保留
- 长时间闲置：可能先做快照，再回收

被回收前，OpenClaw 会尽量把已跟踪文件和未忽略的未跟踪文件做成快照，后续还能恢复回来。

所以它更像：

```text
先留档，再打扫
```

而不是：

```text
任务完了直接删目录
```

---

## CLI 命令

```bash
openclaw worktrees list
openclaw worktrees create /path/to/repo --name docs-fix
openclaw worktrees remove <id>
openclaw worktrees restore <id>
openclaw worktrees gc
```

如果你只是想先看看状态，优先用：

```bash
openclaw worktrees list --json
```

如果你要手动测试回收和恢复，建议先在一个临时仓库演练，再上真实项目。

---

## 什么时候值得用

优先考虑托管 Worktree 的场景：

- 你经常让 Agent 改代码
- 你在用 Workboard 做并行任务
- 你担心多个任务互相污染主工作区
- 你希望失败任务还能保留现场

不一定非要用它的场景：

- 只是在单机上偶尔问答
- 很少让 Agent 直接改仓库
- 只有一个轻量任务，不需要并行隔离

---

## 相关页面

- [智能体工作区](/tutorials/concepts/agent-workspace)
- [Workboard 插件](/tutorials/plugins/workboard)
- [Workboard CLI](/tutorials/cli/workboard)
- [沙箱](/tutorials/gateway/sandboxing)
