---
title: "系统提示词"
sidebarTitle: "系统提示词"
---

# 系统提示词（System Prompt）

OpenClaw 为每次智能体运行构建自定义系统提示词。该提示词由 **OpenClaw 拥有**，不使用 pi-coding-agent 默认提示词。

提示词由 OpenClaw 组装并注入每次智能体运行。

---

## 结构

提示词有意精简，使用固定的部分：

- **Tooling**：当前工具列表 + 简短描述。
- **Safety**：简短的安全提醒，避免权力寻求行为或绕过监督。
- **Skills**（如果可用）：告诉模型如何按需加载技能指令。
- **OpenClaw Self-Update**：如何运行 `config.apply` 和 `update.run`。
- **Workspace**：工作目录（`agents.defaults.workspace`）。
- **Documentation**：OpenClaw 文档的本地路径（仓库或 npm 包）以及何时阅读。
- **Workspace Files (injected)**：表示引导文件包含在下方。
- **Sandbox**（启用时）：指示沙箱运行时、沙箱路径，以及是否有提升的 exec 可用。
- **Current Date & Time**：用户本地时间、时区和时间格式。
- **Reply Tags**：支持的提供商的可选回复标签语法。
- **Heartbeats**：心跳提示和确认行为。
- **Runtime**：主机、操作系统、node、模型、仓库根目录（检测到时）、思考级别（一行）。
- **Reasoning**：当前可见性级别 + /reasoning 切换提示。

系统提示词中的安全护栏是建议性的。它们引导模型行为但不强制执行策略。使用工具策略、exec 审批、沙箱和通道白名单进行硬执行；操作员可以按设计禁用这些。

---

## 提示词模式

OpenClaw 可以为子智能体渲染更小的系统提示词。运行时为每次运行设置 `promptMode`（不是用户面向的配置）：

- `full`（默认）：包含上述所有部分。
- `minimal`：用于子智能体；省略 **Skills**、**Memory Recall**、**OpenClaw Self-Update**、**Model Aliases**、**User Identity**、**Reply Tags**、**Messaging**、**Silent Replies** 和 **Heartbeats**。Tooling、**Safety**、Workspace、Sandbox、Current Date & Time（已知时）、Runtime 和注入的上下文保持可用。
- `none`：仅返回基础身份行。

当 `promptMode=minimal` 时，额外注入的提示词标记为 **Subagent Context** 而非 **Group Chat Context**。

---

## 工作区引导注入

引导文件被修剪并附加到 **Project Context** 下，以便模型无需显式读取即可看到身份和配置文件上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅全新工作区）
- `MEMORY.md` 和/或 `memory.md`（工作区中存在时；可能注入其中一个或两个）

所有这些文件在每个轮次中 **注入到上下文窗口**，这意味着它们消耗 Token。保持简洁——特别是 `MEMORY.md`，它可能随时间增长并导致意外的高上下文使用和更频繁的压缩。

> **注意：** `memory/*.md` 每日文件 **不会** 自动注入。它们通过 `memory_search` 和 `memory_get` 工具按需访问，因此除非模型显式读取，否则不计入上下文窗口。

大型文件用标记截断。每文件最大大小由 `agents.defaults.bootstrapMaxChars`（默认：20000）控制。跨文件的总注入引导内容由 `agents.defaults.bootstrapTotalMaxChars`（默认：24000）限制。缺失的文件注入简短的缺失文件标记。

子智能体会话仅注入 `AGENTS.md` 和 `TOOLS.md`（其他引导文件被过滤以保持子智能体上下文精简）。

内部钩子可以通过 `agent:bootstrap` 拦截此步骤来修改或替换注入的引导文件（例如将 `SOUL.md` 替换为备选人设）。

要检查每个注入文件贡献了多少（原始 vs 注入、截断，加上工具 schema 开销），使用 `/context list` 或 `/context detail`。参见[上下文](/concepts/context)。

---

## 时间处理

系统提示词在用户时区已知时包含专用的 **Current Date & Time** 部分。为了保持提示词缓存稳定，它现在仅包含 **时区**（没有动态时钟或时间格式）。

当智能体需要当前时间时使用 `session_status`；状态卡包含时间戳行。

配置：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

参见[日期和时间](/date-time)了解完整行为详情。

---

## 技能

当存在合格技能时，OpenClaw 注入一个紧凑的 **可用技能列表**（`formatSkillsForPrompt`），包含每个技能的 **文件路径**。提示词指示模型使用 `read` 在列出的位置（工作区、托管或捆绑）加载 SKILL.md。如果没有合格技能，Skills 部分被省略。

```text
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这保持了基础提示词精简，同时仍然启用有针对性的技能使用。

---

## 文档

当可用时，系统提示词包含一个 **Documentation** 部分，指向本地 OpenClaw 文档目录（仓库工作区中的 `docs/` 或捆绑的 npm 包文档），并注明公共镜像、源仓库、社区 Discord 和 ClawHub（[https://clawhub.com](https://clawhub.com)）用于技能发现。提示词指示模型首先查阅本地文档了解 OpenClaw 行为、命令、配置或架构，并在可能时自行运行 `openclaw status`（仅在缺少访问权限时询问用户）。
