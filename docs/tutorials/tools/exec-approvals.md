---
title: "执行审批"
sidebarTitle: "执行审批"
---

# 执行审批（Exec Approvals）

执行审批（Exec Approvals）系统让你精确控制 Agent 的命令执行权限——哪些命令可以自动执行，哪些需要你手动确认，哪些直接拒绝。这是 OpenClaw 安全机制的重要组成部分。

---

## 快速理解

当 Agent 需要执行命令时，系统会按以下流程决定是否执行：

```text
Agent 请求执行命令
        ↓
检查命令是否在安全 Binaries 列表中
        ↓
检查审批规则（策略配置）
        ↓
  ┌─────┴─────┐
auto（自动）  ask（询问）  deny（拒绝）
  ↓              ↓             ↓
直接执行    显示确认框       拒绝执行
              ↓
          等待用户确认
              ↓
        允许 → 执行 | 拒绝 → 取消
```

---

## 审批规则存储

审批规则存储在以下位置：

```bash
~/.openclaw/approvals.json
```

::: details 示例 approvals.json 格式
```json
{
  "rules": [
    {
      "pattern": "git *",
      "policy": "auto"
    },
    {
      "pattern": "npm install *",
      "policy": "ask"
    },
    {
      "pattern": "rm -rf *",
      "policy": "deny"
    }
  ]
}
```
:::

---

## 策略控制（Policy Knobs）

每条审批规则支持三种策略：

### `auto`（自动批准）

命令自动执行，无需确认。适合你完全信任且风险较低的命令：

```json5
{
  rules: [
    { pattern: "git status", policy: "auto" },
    { pattern: "git log *",  policy: "auto" },
    { pattern: "ls *",       policy: "auto" }
  ]
}
```

### `ask`（每次询问）

每次执行前都会弹出确认框，显示完整命令内容，由你决定是否允许：

```json5
{
  rules: [
    { pattern: "npm install *", policy: "ask" },
    { pattern: "docker *",      policy: "ask" }
  ]
}
```

### `deny`（拒绝执行）

命令会被直接拒绝，Agent 会收到拒绝通知并据此调整方案：

```json5
{
  rules: [
    { pattern: "sudo *",      policy: "deny" },
    { pattern: "rm -rf /",   policy: "deny" },  // 危险命令示例：删除根目录
    { pattern: "chmod 777 *", policy: "deny" }
  ]
}
```

---

## 运行列表（Run List）

运行列表是预批准的命令模式集合，匹配运行列表的命令自动执行，不需要逐次确认：

```json5
{
  runList: [
    "git add *",
    "git commit *",
    "git push origin *",
    "npm run build",
    "npm run test",
    "python3 *.py"
  ]
}
```

::: tip 使用通配符
运行列表支持 `*` 通配符匹配任意字符串。例如 `git *` 匹配所有 git 子命令。
:::

---

## 安全 Binaries（Safe Bins）

OpenClaw 内置了一份安全命令白名单（Safe Bins），这些命令被认为风险极低，会根据策略自动处理：

::: details 内置安全命令列表
以下命令默认归类为安全命令：

**文件查看**：`ls`、`cat`、`head`、`tail`、`grep`、`find`、`wc`、`sort`、`uniq`

**版本控制（只读）**：`git status`、`git log`、`git diff`、`git branch`

**系统信息**：`pwd`、`whoami`、`date`、`echo`、`env`、`which`

**包管理（只读）**：`npm list`、`pip list`、`pip show`

注意：即使在安全列表中，具体策略仍由规则配置决定。
:::

---

## 审批流程详解

当命令触发 `ask` 策略时，你会看到类似以下的确认界面：

```text
╔════════════════════════════════════════╗
║  Agent 请求执行命令                     ║
╠════════════════════════════════════════╣
║  命令：npm install lodash --save        ║
║  工作目录：/Users/you/my-project        ║
║                                        ║
║  [允许一次]  [总是允许]  [拒绝]         ║
╚════════════════════════════════════════╝
```

- **允许一次**：本次执行允许，下次同样命令还会询问
- **总是允许**：将此命令添加到运行列表，后续自动执行
- **拒绝**：本次拒绝，Agent 收到通知

---

## 通过 Control UI 管理规则

你可以通过 OpenClaw 的管理界面（Control UI）可视化管理审批规则，无需手动编辑 JSON 文件：

```bash
# 打开管理界面
openclaw control

# 或者直接管理审批规则
openclaw approvals list
openclaw approvals add "npm run *" --policy auto
openclaw approvals remove "npm run *"
```

---

## macOS IPC 通知

在 macOS 上，当命令需要审批时，OpenClaw 会通过系统通知推送审批请求。你可以在不切换窗口的情况下，直接从通知中心批准或拒绝：

::: details 配置 macOS 通知
确保系统偏好设置中允许 OpenClaw 发送通知：

1. 打开 **系统设置** → **通知**
2. 找到 OpenClaw，确保通知已启用
3. 推荐开启"横幅"或"提醒"样式，方便快速响应
:::

---

## 审批的安全影响（Implications）

::: warning 批准操作前请仔细阅读
- **"总是允许"会永久添加到运行列表**，后续相同模式的命令将不再询问
- 通配符范围越广，潜在风险越大（例如 `npm *` 覆盖所有 npm 命令）
- 定期审查运行列表，删除不再需要的规则
- 在生产环境中，建议所有命令都走 `ask` 策略，不使用 `auto`
:::

---

## 提升模式下的审批

使用 `/elevated` 命令可以临时放宽审批限制，详见[提升模式（Elevated Mode）](/tutorials/tools/elevated)。

---

_下一步：[提升模式（Elevated Mode）](/tutorials/tools/elevated) | [执行工具（Exec Tool）](/tutorials/tools/exec)_
