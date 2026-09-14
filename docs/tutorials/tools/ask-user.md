---
title: "Ask User"
sidebarTitle: "Ask User"
description: "让主会话在真正需要人类决定时暂停，并收集一到三个结构化答案。"
---

# Ask User

`ask_user` 用于只能由用户决定的问题。它不应替代 Agent 自己能从请求、代码或合理默认值推导出的日常选择。

这个工具只在主会话可用，子智能体和其他非主运行不会获得它。

## 交互方式

- 控制 UI 会在输入框上方显示问题面板。
- TUI 在 Gateway 和本地模式都支持方向键、数字键、Other 与 Skip；按 Esc 可先返回
  输入框，之后用 `/question` 重新打开。重连或切换会话后会恢复尚未结束的问题。
- Telegram 会把单题单选渲染为整行按钮，“其他”会切换到回复输入；Discord、
  Slack 对单题单选也可显示原生按钮。
- Mattermost 也支持单题单选原生按钮。所有通道都能用数字、选项文字或自定义文本
  回答；多选用逗号分隔。
- 系统自动提供“Other/其他”自由文本，Agent 不应重复声明这个选项。

默认超时 900 秒，可设置范围为 30 到 3600 秒。超时、取消或运行中止会返回 `status: "no_answer"`，随后 Agent 应根据已有信息继续，而不是无限等待。

这是等待人类的最长时间，不会延长显式的本轮运行预算；运行先超时或取消，问题也会提前结束。

每次最多 3 个问题，通常优先只问 1 个；推荐选项放第一项并明确标注。`ask_user` 不用于询问“是否继续执行已经明确授权的任务”。

::: warning 不要用 Ask User 收集密钥
API Key、Token 和密码必须通过 [Secrets 工具](/tutorials/tools/secrets)的遮罩输入
收集，不能作为 `ask_user` 的自由文本答案进入聊天记录。
:::

上游来源：[`docs/tools/ask-user.md`](https://github.com/openclaw/openclaw/blob/main/docs/tools/ask-user.md)。
