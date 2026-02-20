---
title: "提升模式"
sidebarTitle: "提升模式"
---

# 提升模式（Elevated Mode）

提升模式（Elevated Mode）通过 `/elevated` 指令临时提升 Agent 的命令执行权限，让更多命令可以自动执行，无需逐次确认。这适合在你完全知晓风险的情况下，临时授予 Agent 更多自主权来完成复杂任务。

---

## 快速上手

在聊天界面中输入以下斜杠命令启用提升模式：

```text
/elevated on
```

完成任务后，关闭提升模式：

```text
/elevated off
```

你也可以通过斜杠命令同时发送任务：

```text
/elevated 帮我重构整个 src 目录的代码结构，包括移动文件和修改 import 路径
```

---

## 提升模式控制的内容

提升模式开启后，以下限制会被临时放宽：

| 操作类型 | 普通模式 | 提升模式 |
|----------|----------|----------|
| 运行列表中的命令 | 自动执行 | 自动执行 |
| 策略为 `ask` 的命令 | 每次询问 | 自动执行 |
| 文件修改操作 | 可能询问 | 自动执行 |
| 策略为 `deny` 的命令 | 拒绝 | **仍然拒绝** |

::: warning 重要
提升模式**不会绕过** `deny` 策略的命令。被明确拒绝的命令无论在什么模式下都不会执行。
:::

---

## 权限检查顺序（Resolution Order）

当 Agent 请求执行命令时，系统按以下顺序检查权限：

```text
1. 命令是否在 deny 列表中？
   → 是：直接拒绝（提升模式也无法绕过）

2. 命令是否在运行列表（Run List）中？
   → 是：自动执行

3. 是否处于提升模式？
   → 是：自动执行（跳过 ask 询问）
   → 否：按正常审批流程处理
```

---

## 会话默认值

默认情况下，提升模式在每个新会话开始时处于**关闭**状态。你可以在配置中修改默认行为：

```json5
{
  agents: {
    "my-dev-agent": {
      elevated: {
        defaultEnabled: false,   // 新会话默认关闭提升模式（推荐）
        requireConfirmation: true // 启用提升模式时是否需要额外确认
      }
    }
  }
}
```

::: tip
对于高度信任的本地开发环境，你可以将 `defaultEnabled` 设为 `true`，减少频繁的审批中断。但在多用户或生产环境中，强烈建议保持默认关闭。
:::

---

## 提升模式下的可用命令与运行列表

提升模式不是"无限制"，它仍然受到运行列表的约束。你可以为提升模式单独配置一份可用命令列表：

```json5
{
  tools: {
    exec: {
      elevated: {
        runList: [
          "mv *",           // 移动文件
          "cp -r *",        // 复制目录
          "mkdir -p *",     // 创建目录
          "npm run *",      // 运行 npm 脚本
          "git *"           // 所有 git 命令
        ]
      }
    }
  }
}
```

未在提升模式运行列表中的命令，即使在提升模式下也会触发 `ask` 确认。

---

## 日志与状态记录

提升模式期间的所有命令执行都会被记录，便于事后审查：

```bash
# 查看提升模式期间的执行历史
openclaw logs --filter elevated

# 查看当前 Agent 的权限状态
openclaw status --permissions
```

::: details 日志示例
```text
[2024-01-15 14:23:01] [ELEVATED] 执行命令: mv src/utils/helper.ts src/lib/helper.ts
[2024-01-15 14:23:02] [ELEVATED] 执行命令: git add .
[2024-01-15 14:23:03] [ELEVATED] 执行命令: git commit -m "refactor: move helper to lib"
[2024-01-15 14:23:10] [ELEVATED] 模式已关闭
```
:::

---

::: warning 安全提示
- 提升模式应该是临时的，完成任务后立即关闭
- 不要在不信任的 Agent 或工作区中启用提升模式
- 定期查看提升模式的执行日志，确认没有意外操作
- 如果 Agent 在提升模式下行为异常，立即输入 `/elevated off` 或 `/stop`
:::

---

_下一步：[执行审批（Exec Approvals）](/tutorials/tools/exec-approvals) | [执行工具（Exec Tool）](/tutorials/tools/exec)_
