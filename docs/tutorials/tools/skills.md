---
title: "技能系统"
sidebarTitle: "技能系统"
description: "理解 OpenClaw Skills 的当前目录优先级、ClawHub 安装、Agent 可见性、刷新方式与 Skill Workshop。"
---

# 技能系统（Skills）

Skill 是一个包含 `SKILL.md` 的目录。它给 Agent 提供专门说明、脚本和参考资料，
不会因为“装进目录”就自动获得新的工具、凭据或系统权限。

## 先用正确的目录

当前加载优先级从高到低如下；同名 Skill 由更高优先级来源覆盖：

| 优先级 | 来源 | 目录 |
|--------|------|------|
| 1 | 当前 Agent 工作区 | `<workspace>/skills` |
| 2 | 项目 Agent 技能 | `<workspace>/.agents/skills` |
| 3 | 默认状态下的个人 Agent 技能 | `~/.agents/skills` |
| 4 | 共享托管技能 | `<state-dir>/skills` |
| 5 | Skill Workshop 草拟/应用技能 | `<state-dir>/agents/<agentId>/agent/workshop-skills` |
| 6 | OpenClaw 内置技能、Custodian 技能 | 随安装包提供 |
| 7 | `skills.load.extraDirs` 与插件技能 | 配置或插件提供 |

不要继续使用旧教程里的 `<workspace>/.openclaw/skills`。Codex CLI 自己的
`$CODEX_HOME/skills` 也不是 OpenClaw 技能根目录；需要迁移时先运行：

```bash
openclaw migrate plan codex
openclaw migrate codex
```

每个根目录最多向下发现 6 层。找到 `SKILL.md` 后不会再扫描该技能目录的子层。
技能名来自 frontmatter 的 `name`，缺失时才使用目录名。

## 创建一个最小 Skill

```bash
mkdir -p ./skills/code-review
```

创建 `./skills/code-review/SKILL.md`：

```markdown
---
name: code-review
description: 审查代码的安全性、正确性和可维护性。
---

# Code Review

当用户要求审查代码时，先定位可复现证据，再按严重级别报告问题。
```

然后检查发现与依赖状态：

```bash
openclaw skills list --verbose
openclaw skills info code-review
openclaw skills check
```

默认 watcher 会在下一次 Agent turn 刷新技能快照；关闭 watcher 后需要开启新会话。
正在运行的会话使用已捕获的快照，不应假定磁盘修改会立刻改写当前 turn。

## 搜索和安装 ClawHub Skill

```bash
openclaw skills search "calendar"
openclaw skills install @owner/<slug>
openclaw skills verify @owner/<slug> --json
openclaw skills update @owner/<slug>
```

- 不带查询词的 `search` 浏览 ClawHub Trending。
- 默认安装到当前 Agent 工作区的 `skills/`；`--agent <id>` 选择另一个 Agent，
  `--global` 安装到共享托管目录，两者不能同时使用。
- 也可安装 `git:owner/repo[@ref]` 或根目录含 `SKILL.md` 的本地目录；它们不是
  ClawHub 原生版本，不能使用 ClawHub `--version`。
- `update` 默认保护本地改动；`--force` 会覆盖已检测到的修改，应先审阅 diff。
- 社区 Skill 在下载前经过 ClawHub 信任检查。`--force-install` 只用于仍在等待扫描
  的 GitHub-backed 条目，不能绕过恶意/阻止结论。

::: warning 安装 Skill 仍然是供应链操作
先看发布者、扫描结论、`SKILL.md`、脚本和依赖。Skill 内容会进入 Agent 上下文；
依赖安装还可能执行代码。不要把 API Key 写进 Skill 文本。
:::

## Agent 可见性与共享边界

目录优先级和 Agent 可见性是两件事。用 `agents.defaults.skills` 设置共享允许列表，
用 `agents.entries.<id>.skills` 为某个 Agent 完整替换该列表：

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    entries: {
      writer: { default: true },
      docs: { skills: ["docs-search"] }
    }
  }
}
```

`openclaw skills check --agent <id>` 会同时报告前置依赖和该 Agent 实际可见性。
共享 Gateway 上的个人技能库还可在 **Plugins → Skills** 中创建、导入和分享；
“分享给团队”只改变发现与管理边界，不授予新工具、凭据或主机权限。

## 从历史工作学习：Skill Workshop

Skill Workshop 把“从会话中学到的经验”变成可审阅提案，而不是静默改写现有技能。
你可以在普通聊天里引导学习过程，也可以用 CLI 审核：

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
```

提案应用前应核对范围、支持文件和安全影响。某个 Agent 学到的 Workshop Skill
默认只属于该 Agent；需要多人复用时再发布到共享托管目录或个人技能库。

## 排障顺序

```bash
openclaw skills list --verbose
openclaw skills info <name> --json
openclaw skills check --agent <id> --json
```

重点检查：目录是否正确、frontmatter `name` 是否冲突、所需二进制/环境变量是否
存在、Agent allowlist 是否排除、远程 Gateway 是否是你真正查询的那一台。显式
选择远程 Gateway 后，连接失败不会回退到客户端本地技能列表。

继续阅读：[创建自定义技能](/tutorials/tools/creating-skills)、
[技能配置参考](/tutorials/tools/skills-config)、[Skills CLI](/tutorials/cli/skills)、
[Skill Workshop](/tutorials/tools/skill-workshop)。
