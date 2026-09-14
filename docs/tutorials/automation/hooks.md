---
title: "Hooks 事件钩子"
sidebarTitle: "Hooks 事件钩子"
description: "区分 OpenClaw 内部 Hooks、插件 hooks 与 HTTP webhook，按 HOOK.md 和 JavaScript handler 安装、启用并验证真实触发。"
---

# Hooks：在生命周期事件发生时执行小段代码

内部 hook 是 Gateway 进程内的 JavaScript/TypeScript handler，不是按文件名自动执行的 shell 脚本。它适合保存重置前上下文、记录命令或处理简短生命周期副作用。

| 需求 | 使用入口 |
|------|----------|
| 响应内部命令/会话事件 | 本页的 `HOOK.md` + handler，配置 `hooks.internal` |
| 修改提示、拦截工具、控制回复 | [插件 hooks](/tutorials/plugins/hooks) 的 `api.on(...)` |
| 让外部系统通过 HTTP 触发任务 | [Webhook](/tutorials/automation/webhook)，使用 `hooks.enabled` |

这些不是同一套系统；`message:received` 是内部事件，不能与插件的 `message_received` 混用。

::: warning Hook 是可信代码
它继承 Gateway 进程的文件、网络和环境权限，不是沙箱脚本。先审阅代码再启用，不要打印整份配置或环境变量。
:::

## 先用内置 hook 验证链路

在 **Gateway 所在主机**、使用同一配置/profile 执行：

```bash
openclaw hooks list
openclaw hooks info command-logger
openclaw hooks enable command-logger
openclaw gateway restart
```

若 Gateway 前台运行，停止后重新启动该进程。多 Agent 且没有隐式 owner 时，为 hook 命令增加 `--agent <id>`。

在可安全重置的测试对话发送 `/new` 或 `/reset`，然后检查 `~/.openclaw/logs/commands.log` 新增的 JSON 行，包括 action、时间和 sessionKey。自定义 stateDir 则读对应目录。这个实际写入才证明 hook 执行过，`hooks check` 的 ready/eligible 不足以证明已加载或已触发。

测试结束可禁用并重启：

```bash
openclaw hooks disable command-logger
openclaw gateway restart
```

command-logger 记录核心发出的 new/reset/stop 命令事件，不是所有 shell/斜杠命令；日志包含会话和发送者标识，需要自行管理访问与保留期。

## 写自己的 Hook

在新目录 `~/.openclaw/hooks/reset-greeting/` 创建两个文件；若目录已存在，先检查而不是覆盖。

`HOOK.md`：

```markdown
---
name: reset-greeting
description: "记录重置事件"
metadata:
  { "openclaw": { "events": ["command:new", "command:reset"] } }
---

# Reset greeting

仅处理授权的重置命令。
```

`handler.js`：

```javascript
export default function handler(event) {
  if (event.type !== "command" || !["new", "reset"].includes(event.action)) {
    return;
  }
  console.log("[reset-greeting] reset hook ran");
  event.messages.push("已触发重置钩子。");
}
```

依次执行 `openclaw hooks info reset-greeting`、`openclaw hooks enable reset-greeting`、重启 Gateway，再用普通非 ACP 绑定的测试对话验证日志。没有 `openclaw hooks run` 这种通用手动触发步骤。

handler 返回 `void` 或 `Promise<void>`；返回值不能阻断、取消或改写原操作。若要拦截工具，应使用插件 hooks。loader 按 handler.ts、handler.js、index.ts、index.js 顺序选第一个文件。

`event.messages` 也不是通用发消息 API：正常聊天的 new/reset 可尝试回复原通道，但 Control UI/webchat 或 sessions.reset RPC 不会把该数组交付到 UI。用日志验证触发，不能以“没有回复卡片”断言 hook 没运行。

## 目录和配置范围

- managed：`<stateDir>/hooks/`，通常是 `~/.openclaw/hooks/`。
- workspace：`<workspace>/hooks/`，不是项目的 `.openclaw/hooks/`；必须逐个显式启用，不能覆盖 bundled/plugin/managed 同名 hook。
- 附加目录：`hooks.internal.load.extraDirs`，只能加入可信位置。
- hook pack 使用统一的 `openclaw plugins install <path-or-spec>` 安装。

```json5
{
  hooks: {
    internal: {
      entries: {
        "session-memory": { enabled: true, messages: 15, llmSlug: false },
      },
    },
  },
}
```

`hooks.internal.enabled: false` 关闭内部 hooks。指定 entries 名称时形成选择列表；master 的 true 不会把它扩成全部。添加 extraDirs 可能打开更广的发现范围，不只是增加那一个目录，修改前检查现有选择。

`hooks list/info/check` 请求选定 Gateway 的清单；显式远程连接失败不会回退到本机。**enable/disable 只改本地配置**，不会通过 RPC 修改远程 Gateway。Agent 参数选择检查的工作区，不创建独立注册表，已保存 entries 仍是全局的；handler 如需仅处理一个 Agent，必须检查事件。

旧 `hooks.internal.handlers` 已退役。先把模块迁成 HOOK.md + handler 目录，再运行 Doctor；`doctor --fix` 会移除旧注册，不会替你创建可执行文件。

## session-memory：保存的是重置前片段

session-memory 响应 new/reset（含 soft reset）和自动 daily/idle rollover。自动过期在后续回合接纳时检查，不是在空闲时按日历自动写文件。

它会在旧对话活动窗口关闭前抓取片段，最多扫描 4096 条消息、8 MiB，然后后台写入 `<workspace>/memory/YYYY-MM-DD-HHMM.md`。重置不会等待文件或命名模型完成；看到日志 `Session context saved to ...` 后再检查文件。

默认保存最近 15 条用户/助手文本，`llmSlug: false` 不额外调用模型命名。它不是完整转录、不是模型摘要，也不是直接注入新会话的完整上下文；工具消息、静默标记等会过滤。启用 llmSlug 会把对话文本交给命名模型，失败则回退到时间戳。

继续阅读：[Hooks CLI](/tutorials/cli/hooks)、[插件 Hooks](/tutorials/plugins/hooks)、[记忆配置](/tutorials/reference/memory-config)。

上游来源：[Internal hooks](https://github.com/openclaw/openclaw/blob/2e3bf941b7848fa9dfcbcfc8c9a89d99e2feeb30/docs/automation/hooks.md)。
