---
title: "xAI"
sidebarTitle: "xAI"
---

# xAI

xAI 可用于 Grok 模型、Grok Search、X 搜索和远程 code execution 等能力。

新配置当前默认使用 `xai/grok-4.6`。未显式选择模型时，xAI 的 `web_search`、
`x_search` 和 `code_execution` 也会使用 Grok 4.6；这可能改变账号可用性或费用，
所以已有显式选择会被保留。旧订阅若仍指向已退役的 Auto，可先运行
`openclaw doctor --fix`，或手动选择可用模型。

配置：

```bash
export XAI_API_KEY="..."

openclaw models list --provider xai
openclaw models set xai/grok-4.6
```

常见用途：

- Grok 模型回复。
- [Grok Search](/tutorials/tools/grok-search)。
- [Code Execution](/tutorials/tools/code-execution)。

如果你只想做网页搜索，先看 Grok Search；如果想跑远程 Python 分析，再看 Code Execution。
