---
title: "直接运行 Agent"
sidebarTitle: "直接运行 Agent"
---

# 直接运行 Agent（Agent Send）

`openclaw agent` 命令让你可以直接向 Agent 发送消息并获取响应，完全不需要打开聊天界面。这非常适合在脚本、CI/CD 流水线或命令行自动化中集成 AI 能力。

---

## 快速上手

最简单的使用方式：

```bash
openclaw agent --message "帮我总结今天的工作内容"
```

Agent 会处理请求并将结果输出到终端。

---

## 基本示例

### 发送单条消息

```bash
openclaw agent --message "用一句话解释什么是递归"
```

### 指定特定 Agent

```bash
openclaw agent --agent "code-reviewer" --message "请审查以下代码：$(cat main.py)"
```

### 读取文件内容作为消息

```bash
openclaw agent --message "$(cat prompt.txt)"
```

### 在脚本中使用

```bash
#!/bin/bash

# 自动生成提交说明
DIFF=$(git diff --staged)
COMMIT_MSG=$(openclaw agent --message "根据以下 git diff 生成简洁的提交说明：

$DIFF" --output text)

echo "生成的提交说明：$COMMIT_MSG"
git commit -m "$COMMIT_MSG"
```

---

## 常用标志（Flags）

| 标志 | 类型 | 说明 |
|------|------|------|
| `--agent` | string | 指定要使用的 Agent 名称（默认使用默认 Agent） |
| `--message` | string | 发送给 Agent 的消息内容（必填） |
| `--session` | string | 指定会话 Key（用于保持对话连续性） |
| `--output` | string | 输出格式：`text`（默认）或 `json` |
| `--timeout` | number | 等待响应的超时时间（秒，默认 60） |
| `--no-stream` | flag | 禁用流式输出，等待完整响应后输出 |

---

## 会话持久化

通过 `--session` 标志，多次调用可以共享同一个会话上下文：

```bash
# 第一次调用，创建会话
openclaw agent --session "my-work-session" --message "我今天要重构用户认证模块"

# 第二次调用，继续同一会话
openclaw agent --session "my-work-session" --message "刚才说的模块，从哪个文件开始比较好？"

# Agent 会记住第一次的上下文，给出相关建议
```

::: tip
会话 Key 可以自定义，建议使用有意义的名称（如项目名 + 日期）便于管理。不指定 `--session` 时，每次调用都是独立的无状态请求。
:::

---

## 输出格式

### 文本格式（默认）

```bash
openclaw agent --message "2+2等于几" --output text

# 输出：
# 4
```

### JSON 格式

适合在脚本中解析 Agent 的结构化响应：

```bash
openclaw agent --message "用 JSON 格式列出三种编程语言" --output json

# 输出：
# {
#   "response": "...",
#   "sessionId": "abc123",
#   "tokensUsed": 150,
#   "model": "claude-sonnet-4-6",
#   "duration": 1234
# }
```

::: details 使用 jq 解析 JSON 输出
```bash
# 只提取响应文本
openclaw agent --message "问题" --output json | jq -r '.response'

# 提取 Token 使用量
openclaw agent --message "问题" --output json | jq '.tokensUsed'
```
:::

---

## 在 CI/CD 中使用

将 AI 能力集成到自动化流水线：

```yaml
# GitHub Actions 示例
- name: AI Code Review
  run: |
    PR_DIFF=$(git diff main...HEAD)
    REVIEW=$(openclaw agent \
      --agent "code-reviewer" \
      --message "请审查以下 PR 变更，指出潜在问题：

$PR_DIFF" \
      --output text)
    echo "$REVIEW" >> $GITHUB_STEP_SUMMARY
  env:
    OPENCLAW_API_KEY: ${{ secrets.OPENCLAW_API_KEY }}
```

---

## 流式输出

默认情况下，`openclaw agent` 会以流式方式逐步输出 Agent 的响应（类似打字效果）。如果你需要等待完整响应后一次性输出（例如赋值给变量），使用 `--no-stream`：

```bash
# 流式输出（实时显示）
openclaw agent --message "写一首关于编程的诗"

# 等待完整响应（适合脚本赋值）
RESULT=$(openclaw agent --message "写一首关于编程的诗" --no-stream)
echo "$RESULT"
```

---

## 超时设置

对于可能耗时较长的任务，可以延长超时时间：

```bash
openclaw agent \
  --message "分析整个项目的代码质量并生成详细报告" \
  --timeout 300   # 5 分钟超时
```

---

::: info 与聊天界面的区别
`openclaw agent` 是无状态的单次调用模式（除非指定 `--session`）。它不会显示工具调用过程、不支持交互式确认，适合自动化场景。如果你需要交互式的多轮对话，请使用聊天界面。
:::

---

_下一步：[子智能体（Sub-Agents）](/tutorials/tools/subagents) | [工具系统总览](/tutorials/tools/)_
