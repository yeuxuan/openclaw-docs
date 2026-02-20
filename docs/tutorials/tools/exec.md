---
title: "执行工具"
sidebarTitle: "执行工具"
---

# 执行工具（Exec Tool）

执行工具（Exec Tool）允许 Agent 在你的系统上运行 shell 命令——执行脚本、调用 CLI 工具、管理文件，甚至驱动整个开发工作流。你可以精确控制哪些命令允许自动执行，哪些需要你手动审批。

---

## 快速上手

**第一步：在配置中启用 exec 工具**

```json5
{
  tools: {
    exec: {
      enabled: true
    }
  }
}
```

**第二步：配置允许的命令（推荐）**

通过白名单限制 Agent 可以运行的命令：

```json5
{
  tools: {
    exec: {
      enabled: true,
      allowedBinaries: ["git", "npm", "python3", "ls", "cat"]
    }
  }
}
```

**第三步：尝试让 Agent 执行命令**

```text
帮我查看当前目录有哪些文件，并用 git 提交所有更改
```

---

## 完整配置示例

```json5
{
  tools: {
    exec: {
      enabled: true,
      allowedBinaries: ["git", "npm", "python3"],  // 命令白名单
      timeout: 30000                                 // 超时时间（毫秒）
    }
  }
}
```

### 配置项说明

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | boolean | `true` | 是否启用执行工具 |
| `allowedBinaries` | string[] | `[]` | 允许执行的命令白名单，空数组（`[]`）时所有命令都需要逐次审批确认 |
| `timeout` | number | `30000` | 命令执行超时时间（毫秒） |

---

## 授权模型（Authorization Model）

exec 工具采用分级授权策略，平衡灵活性与安全性：

### 免审批自动执行（Auto Approve）

在白名单（`allowedBinaries`）中的命令，且被标记为安全的操作，Agent 可以直接执行，无需你确认。

```json5
{
  tools: {
    exec: {
      allowedBinaries: ["git", "npm", "ls"]  // 这些命令自动执行
    }
  }
}
```

### 需要审批（Require Approval）

以下情况需要你手动确认后才会执行：

- 不在白名单中的命令
- 高风险操作（如删除文件、修改系统配置）
- 涉及网络传输的命令

审批提示示例：

```text
Agent 请求执行以下命令：
  rm -rf ./build

是否允许？[y/N]
```

::: tip 配置审批行为
更细粒度的审批规则配置，请参考 [执行审批（Exec Approvals）](/tutorials/tools/exec-approvals) 页面。
:::

---

## 会话覆盖

你可以在特定会话中临时覆盖全局 exec 配置：

```json5
{
  sessions: {
    "my-dev-session": {
      tools: {
        exec: {
          allowedBinaries: ["git", "npm", "python3", "docker"]  // 此会话允许额外命令
        }
      }
    }
  }
}
```

---

## 安全 Binaries（Safe Binaries）

OpenClaw 内置了一份预设安全命令列表，这些命令被认为风险较低，可以在没有明确白名单的情况下自动执行：

::: details 内置安全命令列表
常见安全命令包括：
- 文件查看：`ls`、`cat`、`head`、`tail`、`find`、`grep`
- 版本控制：`git status`、`git log`、`git diff`（只读操作）
- 包管理（只读）：`npm list`、`pip list`
- 系统信息：`pwd`、`whoami`、`date`、`echo`

注意：即使是"安全"命令，也会受到 `allowedBinaries` 白名单的约束。
:::

---

## apply_patch 工具

`apply_patch` 是 exec 工具的扩展能力，允许 Agent 直接对文件应用 diff 格式的补丁，而不需要执行完整的编辑命令：

::: details apply_patch 使用说明
Agent 可以生成标准 unified diff 格式的补丁并直接应用：

```json5
--- a/config.json
+++ b/config.json
@@ -1,5 +1,6 @@
 {
   "name": "my-project",
+  "version": "1.0.0",
   "enabled": true
 }
```

此操作受 exec 工具的授权模型保护，高风险文件修改会触发审批流程。
:::

---

::: warning 安全注意
- 不要将 `rm`、`sudo`、`chmod` 等高危命令加入自动执行白名单
- 对于生产环境，建议所有命令都走审批流程（不配置 `allowedBinaries`）
- 定期审查 Agent 的命令执行历史，确保没有异常操作
:::

---

_下一步：[执行审批（Exec Approvals）](/tutorials/tools/exec-approvals) | [技能系统（Skills）](/tutorials/tools/skills)_
