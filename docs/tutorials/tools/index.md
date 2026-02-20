---
title: "工具系统"
sidebarTitle: "工具系统"
---

# 工具系统（Tool System）

OpenClaw 通过工具（Tools）让 Agent 拥有超越对话的实际执行能力——搜索网页、控制浏览器、运行命令，甚至协调其他 Agent。你可以按需启用、禁用或扩展这些工具，灵活组合出适合你场景的工作流。

---

## 工具分类

### 内置工具

这些工具随 OpenClaw 开箱即用，无需额外安装：

| 工具 | 说明 | 文档 |
|------|------|------|
| [browser（浏览器）](/tutorials/tools/browser) | 控制真实浏览器，实现网页自动化 | → |
| [exec（执行命令）](/tutorials/tools/exec) | 在系统上执行 shell 命令 | → |
| [web（网络工具）](/tutorials/tools/web) | 网络搜索与网页抓取 | → |

---

### 扩展工具

通过配置扩展 Agent 能力：

| 工具 | 说明 | 文档 |
|------|------|------|
| [skills（技能）](/tutorials/tools/skills) | 注入预定义指令集，扩展 Agent 行为 | → |
| [subagents（子智能体）](/tutorials/tools/subagents) | 启动并协调其他 Agent | → |
| [slash-commands（斜杠命令）](/tutorials/tools/slash-commands) | 用户或 Agent 触发的快捷指令 | → |

---

### 平台工具

与外部平台集成的高级工具：

| 工具 | 说明 |
|------|------|
| clawhub（工具中心） | 从社区获取工具和技能 |
| lobster（工作流） | 可视化工作流编排 |
| [firecrawl（爬虫）](/tutorials/tools/web) | 高级网页内容提取 |

---

## 工具策略（Tool Policy）

工具策略控制哪些工具可以被使用，以及在什么条件下使用。你可以在全局配置中统一设置，也可以为每个 Agent 单独配置。

```json5
{
  tools: {
    // 全局启用/禁用某些工具
    disabled: ["exec"],

    // 或者按 Agent 配置
    agents: {
      "my-agent": {
        disabled: ["browser", "web"]
      }
    }
  }
}
```

::: tip 最小权限原则
只为 Agent 启用它实际需要的工具。限制工具范围不仅能降低安全风险，也能让 Agent 的行为更加可预测。
:::

---

## 禁用工具

如果你不需要某个工具，或者出于安全考虑需要关闭它，可以在配置中指定：

```json5
{
  tools: {
    disabled: ["browser", "exec"]
  }
}
```

也可以在启动时通过命令行标志传入：

```bash
openclaw start --disable-tools browser,exec
```

::: warning
禁用工具后，Agent 将无法使用该工具，即使用户明确要求也不会执行。请确保你了解禁用某工具对 Agent 功能的影响。
:::

---

## 下一步

- 了解各工具的详细用法，点击上方表格中的链接
- 如需自定义 Agent 行为，参考 [技能系统（Skills）](/tutorials/tools/skills)
- 如需控制命令执行权限，参考 [执行审批（Exec Approvals）](/tutorials/tools/exec-approvals)

---

_下一步：[浏览器工具（Browser Tool）](/tutorials/tools/browser)_
