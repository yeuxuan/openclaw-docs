---
title: 沙箱（Sandbox）vs 工具策略 vs 提权
sidebarTitle: "沙箱"
status: active
---

# 沙箱（Sandbox）vs 工具策略 vs 提权

OpenClaw 有三个相关（但不同）的控制：

1. **沙箱（Sandbox）**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）决定**工具在哪里运行**（Docker vs 宿主机）。
2. **工具策略**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）决定**哪些工具可用/被允许**。
3. **提权**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）是一个**仅限 exec 的逃生通道**，在沙箱（Sandbox）中运行时可在宿主机上执行。

---

## 快速调试

使用检查器查看 OpenClaw _实际_在做什么：

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

它会输出：

- 生效的沙箱（Sandbox）模式/作用域/工作区（Workspace）访问
- 当前会话（Session）是否被沙箱（Sandbox）化（main vs non-main）
- 生效的沙箱（Sandbox）工具允许/拒绝（以及来源是 agent/global/default）
- 提权门控和修复配置键路径

---

## 沙箱（Sandbox）：工具在哪里运行

沙箱（Sandbox）由 `agents.defaults.sandbox.mode` 控制：

- `"off"`：所有内容在宿主机上运行。
- `"non-main"`：只有非 main 会话（Session）被沙箱（Sandbox）化（在群组/通道（Channel）中常见的"意外"）。
- `"all"`：所有内容都被沙箱（Sandbox）化。

参阅[沙箱（Sandbox）](/gateway/sandboxing)了解完整矩阵（作用域、工作区（Workspace）挂载、镜像）。

### 绑定挂载（安全快速检查）

- `docker.binds` _穿透_沙箱（Sandbox）文件系统：无论你挂载什么，在容器内都以你设置的模式（`:ro` 或 `:rw`）可见。
- 如果省略模式，默认为读写；对于源码/密钥推荐使用 `:ro`。
- `scope: "shared"` 忽略每个智能体（Agent）的绑定（仅应用全局绑定）。
- 绑定 `/var/run/docker.sock` 实际上将宿主机控制权交给了沙箱（Sandbox）；只有在有意为之时才这样做。
- 工作区（Workspace）访问（`workspaceAccess: "ro"`/`"rw"`）独立于绑定模式。

---

## 工具策略：哪些工具存在/可调用

两个层级重要：

- **工具 profile**：`tools.profile` 和 `agents.list[].tools.profile`（基础白名单）
- **模型提供商（Provider）工具 profile**：`tools.byProvider[provider].profile` 和 `agents.list[].tools.byProvider[provider].profile`
- **全局/每智能体（Agent）工具策略**：`tools.allow`/`tools.deny` 和 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **模型提供商（Provider）工具策略**：`tools.byProvider[provider].allow/deny` 和 `agents.list[].tools.byProvider[provider].allow/deny`
- **沙箱（Sandbox）工具策略**（仅在沙箱（Sandbox）化时适用）：`tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 和 `agents.list[].tools.sandbox.tools.*`

经验法则：

- `deny` 总是胜出。
- 如果 `allow` 非空，其他所有内容都被视为阻止。
- 工具策略是硬性限制：`/exec` 无法覆盖被拒绝的 `exec` 工具。
- `/exec` 仅更改授权发送者的会话（Session）默认值；它不授予工具访问权。
  模型提供商（Provider）工具键接受 `provider`（如 `google-antigravity`）或 `provider/model`（如 `openai/gpt-5.2`）。

### 工具组（简写）

工具策略（全局、智能体（Agent）、沙箱（Sandbox））支持 `group:*` 条目，可展开为多个工具：

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

可用的组：

- `group:runtime`：`exec`、`bash`、`process`
- `group:fs`：`read`、`write`、`edit`、`apply_patch`
- `group:sessions`：`sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status`
- `group:memory`：`memory_search`、`memory_get`
- `group:ui`：`browser`、`canvas`
- `group:automation`：`cron`、`gateway`
- `group:messaging`：`message`
- `group:nodes`：`nodes`
- `group:openclaw`：所有内置 OpenClaw 工具（不包括模型提供商（Provider）插件）

---

## 提权：仅限 exec 的"在宿主机运行"

提权**不会**授予额外工具；它仅影响 `exec`。

- 如果你在沙箱（Sandbox）中，`/elevated on`（或带 `elevated: true` 的 `exec`）在宿主机上运行（审批可能仍然适用）。
- 使用 `/elevated full` 跳过当前会话（Session）的 exec 审批。
- 如果你已经在直接运行，提权实际上是空操作（仍然受门控）。
- 提权**不是**技能作用域的，**不会**覆盖工具允许/拒绝。
- `/exec` 与提权是分开的。它仅为授权发送者调整每会话（Session）的 exec 默认值。

门控：

- 启用：`tools.elevated.enabled`（以及可选的 `agents.list[].tools.elevated.enabled`）
- 发送者白名单：`tools.elevated.allowFrom.<provider>`（以及可选的 `agents.list[].tools.elevated.allowFrom.<provider>`）

参阅[提权模式](/tools/elevated)。

---

## 常见的"沙箱（Sandbox）监禁"修复

### "工具 X 被沙箱（Sandbox）工具策略阻止"

修复配置键（选择其一）：

- 禁用沙箱（Sandbox）：`agents.defaults.sandbox.mode=off`（或每智能体（Agent）`agents.list[].sandbox.mode=off`）
- 在沙箱（Sandbox）内允许该工具：
  - 从 `tools.sandbox.tools.deny` 中移除它（或每智能体（Agent）`agents.list[].tools.sandbox.tools.deny`）
  - 或将其添加到 `tools.sandbox.tools.allow`（或每智能体（Agent）allow）

### "我以为这是 main，为什么被沙箱（Sandbox）化了？"

在 `"non-main"` 模式中，群组/通道（Channel）键_不是_ main。使用 main 会话（Session）键（由 `sandbox explain` 显示）或将模式切换为 `"off"`。
