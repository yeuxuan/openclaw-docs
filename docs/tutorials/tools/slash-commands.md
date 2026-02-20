---
title: "斜杠命令"
sidebarTitle: "斜杠命令"
---

# 斜杠命令（Slash Commands）

斜杠命令（Slash Commands）是以 `/` 开头的快捷指令，你可以在聊天窗口中随时输入，用于控制 Agent 行为、切换模式或触发预设操作。Agent 也可以在合适的时机建议你使用斜杠命令。

---

## 快速上手

在聊天界面输入 `/` 即可看到可用命令列表。以下是几个常用命令：

```text
/think        让 Agent 深度思考当前问题
/verbose      开启详细输出模式，显示 Agent 的推理过程
/reset        清除当前会话上下文，重新开始
/model        切换当前使用的 AI 模型
```

---

## 内置斜杠命令

| 命令 | 说明 |
|------|------|
| `/think` | 触发深度思考模式，Agent 会更仔细地分析问题 |
| `/verbose` | 开启详细模式，显示工具调用、推理步骤等内部信息 |
| `/reset` | 清除会话上下文，开始新的对话 |
| `/model <模型名>` | 切换当前会话的 AI 模型 |
| `/help` | 显示所有可用命令列表 |
| `/debug` | 切换调试模式 |
| `/elevated` | 临时提升 Agent 权限（参见提升模式文档） |
| `/stop` | 停止当前正在执行的操作 |
| `/summary` | 生成当前会话的摘要 |

---

## 自定义斜杠命令

你可以在配置文件中定义自己的斜杠命令：

```json5
{
  slashCommands: {
    "/summary": {
      description: "生成对话摘要",
      prompt: "请总结到目前为止的对话内容，包括主要讨论的话题、做出的决策和待办事项"
    },
    "/standup": {
      description: "生成每日站会报告",
      prompt: "根据今天的对话，生成一份简洁的日报，包括：完成了什么、遇到了什么问题、下一步计划"
    },
    "/reset": {
      description: "重置会话",
      action: "clearContext"   // 内置动作，清除上下文
    }
  }
}
```

### 命令配置字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `description` | string | 命令描述，显示在命令列表中 |
| `prompt` | string | 触发命令时发送给 Agent 的提示词 |
| `action` | string | 内置动作（`clearContext`、`toggleVerbose` 等） |
| `model` | string | 此命令使用的特定模型（可选） |

::: details 可用内置动作（action）列表
| 动作名 | 说明 |
|--------|------|
| `clearContext` | 清除当前会话上下文，相当于 `/reset` |
| `toggleVerbose` | 切换详细日志输出模式，相当于 `/verbose` |
:::

---

## 模型选择

不同的斜杠命令可以指定不同的 AI 模型，适合需要调用专用模型的场景：

```json5
{
  slashCommands: {
    "/analyze": {
      description: "深度分析",
      prompt: "请对以下内容进行深入分析...",
      model: "claude-opus-4-5"   // 分析任务使用更强的模型
    },
    "/quick": {
      description: "快速回复",
      prompt: "简短回答：",
      model: "claude-haiku-4-5"  // 简单任务使用轻量模型
    }
  }
}
```

---

## 使用场景

### 聊天界面

直接在消息框中输入命令：

```text
你：/think 帮我设计一个用户认证系统的架构

Agent：[深度思考模式] 正在分析用户认证系统的设计方案...
```

### Gateway API

通过 API 发送斜杠命令：

```bash
curl -X POST https://your-openclaw/api/message \
  -d '{"text": "/verbose\n请分析这段代码的性能问题"}'
```

### 自动化脚本

在 `openclaw agent` 命令中使用：

```bash
openclaw agent --message "/reset 你是一个代码审查专家，请审查以下代码：$(cat code.py)"
```

---

## 调试覆盖

使用 `/debug` 命令可以临时切换调试模式，查看 Agent 的内部状态：

::: details 调试模式显示的信息
- 工具调用的完整参数和返回值
- Token 使用量统计
- 每步推理的耗时
- 当前激活的技能列表
- 上下文窗口使用率
:::

---

## 动态修改配置

部分斜杠命令可以动态修改当前会话的配置，无需重启 OpenClaw：

```text
/model claude-opus-4-5    ← 切换模型，立即生效
/verbose on               ← 开启详细模式
/verbose off              ← 关闭详细模式
```

::: info
通过斜杠命令修改的配置只影响当前会话，不会持久化到配置文件。重启或新建会话后恢复默认设置。
:::

---

_下一步：[网络工具（Web Tools）](/tutorials/tools/web) | [工具系统总览](/tutorials/tools/)_
