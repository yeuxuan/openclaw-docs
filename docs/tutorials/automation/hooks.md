---
title: "Hooks 事件钩子系统"
sidebarTitle: "Hooks 事件钩子"
---

# Hooks 事件系统（Event-Driven Hooks）

Hooks 是 OpenClaw 的事件驱动插件机制。当系统内部发生特定事件时，OpenClaw 会自动找到对应的可执行脚本并运行它。你不需要修改核心代码，只需放置一个脚本文件，就能在任意系统节点插入自定义逻辑。

---

## 快速上手

**第一步：创建 Hooks 目录**

```bash
mkdir -p ~/.openclaw/hooks
```

**第二步：编写一个 Hook 脚本**

创建一个在会话启动时执行的脚本：

```bash
# 文件名即为事件名：session-started
cat > ~/.openclaw/hooks/session-started << 'SCRIPT'
#!/bin/bash
echo "[Hook] 会话已启动，时间：$(date)" >> ~/.openclaw/logs/session.log
SCRIPT

chmod +x ~/.openclaw/hooks/session-started
```

**第三步：验证 Hook 是否被识别**

```bash
openclaw hooks list
```

**第四步：手动触发测试**

```bash
openclaw hooks run session-started
```

::: tip 文件名即事件名
Hook 脚本的文件名就是它监听的事件名称。比如文件名为 `message-received`，就会在每次收到消息时自动执行。
:::

---

## 技术说明

### Hook 发现机制（Discovery）

OpenClaw 启动时会扫描以下两个目录中的可执行文件作为 Hook：

| 目录 | 说明 |
|------|------|
| `~/.openclaw/hooks/` | 全局 Hook，对所有项目生效 |
| `.openclaw/hooks/`（项目根目录） | 项目级 Hook，仅对当前项目生效 |

::: tip 优先级说明
同名 Hook 同时存在时，项目级（`.openclaw/hooks/`）优先级高于全局（`~/.openclaw/hooks/`）。
:::

---

### 支持的 Hook 事件

#### 会话生命周期

| 事件名 | 触发时机 |
|--------|---------|
| `session-started` | 新会话开始时 |
| `session-ended` | 会话结束时 |

#### 消息处理

| 事件名 | 触发时机 |
|--------|---------|
| `message-received` | 收到用户消息时 |
| `model-response` | 模型返回响应时 |

#### 智能体执行

| 事件名 | 触发时机 |
|--------|---------|
| `agent-started` | Agent 开始执行时 |
| `agent-finished` | Agent 执行完成时 |

#### 工具调用

| 事件名 | 触发时机 |
|--------|---------|
| `tool-called` | 工具被调用前 |
| `tool-result` | 工具返回结果后 |

#### 定时触发

| 事件名 | 触发时机 |
|--------|---------|
| `cron-started` | Cron 任务开始时 |
| `heartbeat` | 每个心跳间隔 |

---

### Hook 脚本规范

Hook 脚本可以用任何可执行语言编写（Bash、Python、Node.js 等），通过环境变量接收上下文信息：

```bash
#!/bin/bash
# 示例：记录工具调用信息

TOOL_NAME="${OPENCLAW_TOOL_NAME}"
AGENT_ID="${OPENCLAW_AGENT_ID}"
SESSION_ID="${OPENCLAW_SESSION_ID}"

echo "[$(date)] Agent=$AGENT_ID Tool=$TOOL_NAME Session=$SESSION_ID" \
  >> ~/.openclaw/logs/tool-audit.log
```

```python
#!/usr/bin/env python3
# 示例：Python Hook，在 model-response 时做内容过滤

import os
import sys

response = os.environ.get("OPENCLAW_MODEL_RESPONSE", "")

if "敏感词" in response:
    print("检测到敏感内容，已记录", file=sys.stderr)
    # 可以选择退出非零码来阻断（具体行为取决于 Hook 类型）
    sys.exit(1)
```

::: warning 脚本必须有可执行权限
确保脚本文件有执行权限，否则 Hook 不会被运行：
```bash
chmod +x ~/.openclaw/hooks/your-hook-name
```
:::

---

### 内置（Bundled）Hook 示例

OpenClaw 内置了几个开箱即用的 Hook，可直接启用：

::: details session-memory：跨会话记忆注入
在每个新会话开始时，将上次会话的关键信息注入当前上下文，实现跨会话记忆。

```bash
# 启用方式：在配置中引用内置 Hook
# openclaw/hooks/session-memory 已内置，无需手动创建
```
:::

::: details bootstrap-extra-files：启动时注入额外文件
会话启动时自动将指定文件内容注入 Agent 上下文，适合注入项目说明或规范文档。

```bash
# 配置示例
# 将 PROJECT_SPEC.md 在每次启动时自动注入
```
:::

::: details command-logger：命令记录
自动记录 Agent 执行的所有命令到日志文件，方便审计。
:::

::: details boot-md：启动时加载 BOOT.md
启动时自动读取项目根目录的 `BOOT.md` 文件，将其作为系统提示注入。
:::

---

### 配置示例

在 OpenClaw 配置文件中可以管理 Hooks 行为：

```json5
{
  hooks: {
    // 是否启用 Hook 系统
    enabled: true,
    // Hook 扫描目录列表
    dirs: [
      "~/.openclaw/hooks",
      ".openclaw/hooks"
    ]
  }
}
```

---

### CLI 命令

```bash
# 列出所有已发现的 Hook
openclaw hooks list

# 手动触发指定 Hook（用于测试）
openclaw hooks run <hook-name>

# 查看指定 Hook 的详细信息
openclaw hooks info <hook-name>
```

---

### 调试 Hook

启用详细日志模式来排查 Hook 执行问题：

```bash
# 方式一：临时环境变量
HOOK_DEBUG=1 openclaw start

# 方式二：在 Hook 脚本内部加调试输出
#!/bin/bash
set -x  # 开启 Bash 调试模式
echo "Hook 参数：$@"
env | grep OPENCLAW_  # 打印所有 OpenClaw 注入的环境变量
```

---

### 最佳实践

::: tip 编写高质量 Hook 的三个原则

**1. 幂等性（Idempotent）**
同一个 Hook 被多次执行，结果应该相同。避免重复追加、重复创建等副作用。

**2. 快速执行（Fast）**
Hook 是同步执行的，耗时过长会阻塞 Agent 响应。耗时操作应该异步处理或写入队列。

```bash
# 不推荐：同步等待耗时操作
curl -X POST https://slow-api.example.com/notify

# 推荐：后台异步处理
curl -X POST https://slow-api.example.com/notify &
```

**3. 安全处理敏感数据**
Hook 接收的环境变量可能包含用户消息内容。注意不要将敏感数据写入不安全的位置或传输到第三方。
:::

---

_下一步：[Cron 定时任务](./cron-jobs) | [Webhook 外部触发](./webhook) | [自动化概览](./index)_
