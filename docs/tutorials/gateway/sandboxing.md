---
title: 沙箱（Sandbox）
sidebarTitle: "沙箱"
status: active
---

# 沙箱（Sandbox）

OpenClaw 可以**在 Docker 容器中运行工具**以减少爆炸半径。这是**可选的**，由配置控制（`agents.defaults.sandbox` 或 `agents.list[].sandbox`）。如果沙箱（Sandbox）关闭，工具在宿主机上运行。网关（Gateway）始终在宿主机上；启用时工具执行在隔离的沙箱（Sandbox）中运行。

这不是完美的安全边界，但当模型做了一些蠢事时，它实质性地限制了文件系统和进程访问。

---

## 什么被沙箱（Sandbox）化

- 工具执行（`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等）。
- 可选的沙箱（Sandbox）浏览器（`agents.defaults.sandbox.browser`）。
  - 默认情况下，沙箱（Sandbox）浏览器在浏览器工具需要时自动启动（确保 CDP 可达）。通过 `agents.defaults.sandbox.browser.autoStart` 和 `agents.defaults.sandbox.browser.autoStartTimeoutMs` 配置。
  - `agents.defaults.sandbox.browser.allowHostControl` 允许沙箱（Sandbox）会话（Session）显式目标指向宿主机浏览器。
  - 可选的白名单门控 `target: "custom"`：`allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

不被沙箱（Sandbox）化的：

- 网关（Gateway）进程本身。
- 任何显式允许在宿主机上运行的工具（例如 `tools.elevated`）。
  - **提权 exec 在宿主机上运行并绕过沙箱（Sandbox）。**
  - 如果沙箱（Sandbox）关闭，`tools.elevated` 不改变执行（已在宿主机上）。参阅[提权模式](/tools/elevated)。

---

## 模式

`agents.defaults.sandbox.mode` 控制**何时**使用沙箱（Sandbox）：

- `"off"`：无沙箱（Sandbox）。
- `"non-main"`：仅沙箱（Sandbox）化**非 main** 会话（Session）（如果你希望正常聊天在宿主机上则为默认值）。
- `"all"`：每个会话（Session）都在沙箱（Sandbox）中运行。
  注意：`"non-main"` 基于 `session.mainKey`（默认 `"main"`），而非智能体（Agent）id。群组/通道（Channel）会话（Session）使用自己的键，因此它们计为 non-main 并会被沙箱（Sandbox）化。

---

## 作用域

`agents.defaults.sandbox.scope` 控制**创建多少容器**：

- `"session"`（默认）：每个会话（Session）一个容器。
- `"agent"`：每个智能体（Agent）一个容器。
- `"shared"`：所有沙箱（Sandbox）会话（Session）共享一个容器。

---

## 工作区（Workspace）访问

`agents.defaults.sandbox.workspaceAccess` 控制**沙箱（Sandbox）能看到什么**：

- `"none"`（默认）：工具看到 `~/.openclaw/sandboxes` 下的沙箱（Sandbox）工作区（Workspace）。
- `"ro"`：在 `/agent` 以只读方式挂载智能体（Agent）工作区（Workspace）（禁用 `write`/`edit`/`apply_patch`）。
- `"rw"`：在 `/workspace` 以读写方式挂载智能体（Agent）工作区（Workspace）。

入站媒体被复制到活动沙箱（Sandbox）工作区（Workspace）（`media/inbound/*`）。
技能说明：`read` 工具以沙箱（Sandbox）为根。使用 `workspaceAccess: "none"` 时，OpenClaw 将符合条件的技能镜像到沙箱（Sandbox）工作区（Workspace）（`.../skills`）以便可以读取。使用 `"rw"` 时，工作区（Workspace）技能可从 `/workspace/skills` 读取。

---

## 自定义绑定挂载

`agents.defaults.sandbox.docker.binds` 将额外的宿主机目录挂载到容器中。格式：`host:container:mode`（例如 `"/home/user/source:/source:rw"`）。

全局和每智能体（Agent）的绑定是**合并**的（不是替换）。在 `scope: "shared"` 下，每智能体（Agent）的绑定被忽略。

`agents.defaults.sandbox.browser.binds` 仅将额外的宿主机目录挂载到**沙箱（Sandbox）浏览器**容器。

- 当设置时（包括 `[]`），它替换浏览器容器的 `agents.defaults.sandbox.docker.binds`。
- 当省略时，浏览器容器回退到 `agents.defaults.sandbox.docker.binds`（向后兼容）。

示例（只读源码 + docker socket）：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/run/docker.sock:/var/run/docker.sock"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

安全说明：

- 绑定绕过沙箱（Sandbox）文件系统：它们以你设置的模式（`:ro` 或 `:rw`）暴露宿主机路径。
- 敏感挂载（例如 `docker.sock`、密钥、SSH 密钥）除非绝对必要，否则应使用 `:ro`。
- 结合 `workspaceAccess: "ro"` 使用，如果你只需要对工作区（Workspace）的读访问；绑定模式保持独立。
- 参阅[沙箱（Sandbox） vs 工具策略 vs 提权](/gateway/sandbox-vs-tool-policy-vs-elevated)了解绑定如何与工具策略和提权 exec 交互。

---

## 镜像 + 设置

默认镜像：`openclaw-sandbox:bookworm-slim`

构建一次：

```bash
scripts/sandbox-setup.sh
```

注意：默认镜像**不**包含 Node。如果技能需要 Node（或其他运行时），要么制作自定义镜像，要么通过 `sandbox.docker.setupCommand` 安装（需要网络出口 + 可写根 + root 用户）。

沙箱（Sandbox）浏览器镜像：

```bash
scripts/sandbox-browser-setup.sh
```

默认情况下，沙箱（Sandbox）容器以**无网络**运行。使用 `agents.defaults.sandbox.docker.network` 覆盖。

Docker 安装和容器化网关（Gateway）在这里：[Docker](/install/docker)

---

## setupCommand（一次性容器设置）

`setupCommand` 在沙箱（Sandbox）容器创建后运行**一次**（不是每次运行）。它通过 `sh -lc` 在容器内执行。

路径：

- 全局：`agents.defaults.sandbox.docker.setupCommand`
- 每智能体（Agent）：`agents.list[].sandbox.docker.setupCommand`

常见陷阱：

- 默认 `docker.network` 是 `"none"`（无出口），所以包安装会失败。
- `readOnlyRoot: true` 阻止写入；设置 `readOnlyRoot: false` 或制作自定义镜像。
- `user` 必须是 root 才能安装包（省略 `user` 或设置 `user: "0:0"`）。
- 沙箱（Sandbox）exec **不**继承宿主机 `process.env`。使用 `agents.defaults.sandbox.docker.env`（或自定义镜像）来设置技能 API 密钥。

---

## 工具策略 + 逃生通道

工具允许/拒绝策略仍在沙箱（Sandbox）规则之前适用。如果工具在全局或每智能体（Agent）被拒绝，沙箱（Sandbox）不会使其恢复。

`tools.elevated` 是一个显式的逃生通道，在宿主机上运行 `exec`。`/exec` 指令仅适用于授权发送者且按会话（Session）持久化；要硬性禁用 `exec`，使用工具策略拒绝（参阅[沙箱（Sandbox） vs 工具策略 vs 提权](/gateway/sandbox-vs-tool-policy-vs-elevated)）。

调试：

- 使用 `openclaw sandbox explain` 检查生效的沙箱（Sandbox）模式、工具策略和修复配置键。
- 参阅[沙箱（Sandbox） vs 工具策略 vs 提权](/gateway/sandbox-vs-tool-policy-vs-elevated)了解"为什么被阻止？"的思维模型。保持锁定状态。

---

## 多智能体（Agent）覆盖

每个智能体（Agent）可以覆盖沙箱（Sandbox） + 工具：`agents.list[].sandbox` 和 `agents.list[].tools`（加上 `agents.list[].tools.sandbox.tools` 用于沙箱（Sandbox）工具策略）。参阅[多智能体（Agent）沙箱（Sandbox）和工具](/tools/multi-agent-sandbox-tools)了解优先级。

---

## 最小启用示例

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

---

## 相关文档

- [沙箱（Sandbox）配置](/gateway/configuration#agentsdefaults-sandbox)
- [多智能体（Agent）沙箱（Sandbox）和工具](/tools/multi-agent-sandbox-tools)
- [安全](/gateway/security)
