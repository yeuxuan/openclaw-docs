---
title: 沙箱（Sandbox）
sidebarTitle: "沙箱"
status: active
description: "OpenClaw Gateway：沙箱（Sandbox）。OpenClaw 可以在 Docker 容器中运行工具以减少爆炸半径。这是可选的，由配置控制（ 或 ）。如果沙箱（Sandbox）关闭，工具…"
---

# 沙箱（Sandbox）

OpenClaw 可以在 Docker 容器中运行工具以减少爆炸半径。这是可选的，由配置控制（`agents.defaults.sandbox` 或 `agents.entries.*.sandbox`）。如果沙箱（Sandbox）关闭，工具在宿主机上运行。网关（Gateway）始终在宿主机上；启用时工具执行在隔离的沙箱（Sandbox）中运行。

这不是完美的安全边界，但当模型做了一些蠢事时，它实质性地限制了文件系统和进程访问。

::: warning 角色强制沙箱的身份边界
当角色要求沙箱时，已证明的 Gateway profile 创建者按 profile 隔离，同 profile 创建的会话仍复用已有环境；通道、未知来源等非 profile 创建者则按规范会话分别隔离。原始 ID 相同不能复用 profile 的资源，后端失败也不会回退宿主机执行。

创建者命名空间迁移不会删除、采用或复制旧的来源不明环境。升级后这些会话可能看到新的空工作区；先保全旧文件，再由操作者显式恢复所需内容，不要把整个模糊归属环境复制到可信 profile。见[数据库升级恢复](/tutorials/reference/database-schemas)。
:::

---

## 先讲人话

沙箱就是给 AI 工具准备的“隔离小房间”。

没有沙箱时，工具直接在你的电脑上做事。
有沙箱时，很多工具会先被放进 Docker 容器里做事，能碰到的文件和进程更少。

这像让孩子在铺了垫子的房间里玩积木：不是绝对不会摔，但摔坏整间屋子的机会小很多。

::: tip 新手怎么选
第一次使用可以先保持默认。
等你要让 AI 跑命令、改文件、处理陌生项目，或者把 OpenClaw 放到团队环境时，再认真配置沙箱。
:::

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
  - 提权 exec 在宿主机上运行并绕过沙箱（Sandbox）。
  - 如果沙箱（Sandbox）关闭，`tools.elevated` 不改变执行（已在宿主机上）。参阅[提权模式](/tutorials/tools/elevated)。

---

## 模式

`agents.defaults.sandbox.mode` 控制何时使用沙箱（Sandbox）：

- `"off"`：不用沙箱，工具直接在宿主机运行。
- `"non-main"`：只把非 main 会话放进沙箱。这适合保留日常主会话，同时把旁支任务隔离开。
- `"all"`：每个会话都放进沙箱。安全感更强，但配置和排查也更复杂。
  注意：`"non-main"` 基于 `session.mainKey`（默认 `"main"`），而非智能体（Agent）id。群组/通道（Channel）会话（Session）使用自己的键，因此它们计为 non-main 并会被沙箱（Sandbox）化。

---

## 作用域

`agents.defaults.sandbox.scope` 控制创建多少容器：

- `"session"`（默认）：每段会话一个小房间，互相影响少。
- `"agent"`：每个 AI 助手一个小房间。
- `"shared"`：大家共用一个小房间，省资源，但隔离最弱。

---

## 工作区（Workspace）访问

`agents.defaults.sandbox.workspaceAccess` 控制沙箱（Sandbox）能看到什么：

- `"none"`（默认）：沙箱只看到自己的临时工作区，看不到你的主工作区。
- `"ro"`：只读。AI 可以看主工作区，但不能改。
- `"rw"`：可读可写。AI 可以看，也可以改。

不确定时优先从 `"none"` 或 `"ro"` 开始。
只有你明确希望 AI 在真实工作区改文件时，才考虑 `"rw"`。

入站媒体被复制到活动沙箱（Sandbox）工作区（Workspace）（`media/inbound/*`）。
技能说明：`read` 工具以沙箱（Sandbox）为根。使用 `workspaceAccess: "none"` 时，OpenClaw 将符合条件的技能镜像到沙箱（Sandbox）工作区（Workspace）（`.../skills`）以便可以读取。使用 `"rw"` 时，工作区（Workspace）技能可从 `/workspace/skills` 读取。

---

## 自定义绑定挂载

`agents.defaults.sandbox.docker.binds` 将额外的宿主机目录挂载到容器中。格式：`host:container:mode`（例如 `"/home/user/source:/source:rw"`）。

绑定挂载就是在沙箱小房间里开一扇指定的小门，让它能看到你电脑上的某个目录。
门开得越大，风险越大。

全局和每智能体（Agent）的绑定是合并的（不是替换）。在 `scope: "shared"` 下，每智能体（Agent）的绑定被忽略。

`agents.defaults.sandbox.browser.binds` 仅将额外的宿主机目录挂载到沙箱（Sandbox）浏览器容器。

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
    entries: {
      build: {
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    },
  },
}
```

安全说明：

- 绑定绕过沙箱（Sandbox）文件系统：它们以你设置的模式（`:ro` 或 `:rw`）暴露宿主机路径。
- 敏感挂载（例如 `docker.sock`、密钥、SSH 密钥）除非绝对必要，否则应使用 `:ro`。
- 结合 `workspaceAccess: "ro"` 使用，如果你只需要对工作区（Workspace）的读访问；绑定模式保持独立。
- 参阅[沙箱（Sandbox） vs 工具策略 vs 提权](/tutorials/gateway/sandbox-vs-tool-policy-vs-elevated)了解绑定如何与工具策略和提权 exec 交互。

---

## 镜像 + 设置

默认镜像：`openclaw-sandbox:bookworm-slim`

构建一次：

```bash
scripts/sandbox-setup.sh
```

注意：默认镜像不包含 Node。如果技能需要 Node（或其他运行时），要么制作自定义镜像，要么通过 `sandbox.docker.setupCommand` 安装（需要网络出口 + 可写根 + root 用户）。

如果是 npm 安装而要构建 common 镜像，先构建默认镜像，再从同一 OpenClaw commit/tag 下载 `scripts/docker/sandbox/Dockerfile.common` 和根 `package.json` 到空目录，保留这两个文件名，在该目录运行：

```bash
docker build -t openclaw-sandbox-common:bookworm-slim -f Dockerfile.common .
```

`package.json` 提供固定 pnpm 版本，即使 `INSTALL_PNPM=0` 也必须在构建上下文中；宿主机无需另装 pnpm。完成后将 `agents.defaults.sandbox.docker.image` 设为 `openclaw-sandbox-common:bookworm-slim`。

沙箱（Sandbox）浏览器镜像：

```bash
scripts/sandbox-browser-setup.sh
```

默认情况下，沙箱（Sandbox）容器以无网络运行。使用 `agents.defaults.sandbox.docker.network` 覆盖。

Docker 安装和容器化网关（Gateway）在这里：[Docker](/tutorials/installation/docker)

---

## setupCommand（一次性容器设置）

`setupCommand` 在沙箱（Sandbox）容器创建后运行一次（不是每次运行）。它通过 `sh -lc` 在容器内执行。

路径：

- 全局：`agents.defaults.sandbox.docker.setupCommand`
- 每智能体（Agent）：`agents.entries.*.sandbox.docker.setupCommand`

常见陷阱：

- 默认 `docker.network` 是 `"none"`（无出口），所以包安装会失败。
- `readOnlyRoot: true` 阻止写入；设置 `readOnlyRoot: false` 或制作自定义镜像。
- `user` 必须是 root 才能安装包（省略 `user` 或设置 `user: "0:0"`）。
- 沙箱（Sandbox）exec 不继承宿主机 `process.env`。使用 `agents.defaults.sandbox.docker.env`（或自定义镜像）来设置技能 API 密钥。

---

## 工具策略 + 逃生通道

工具允许/拒绝策略仍在沙箱（Sandbox）规则之前适用。如果工具在全局或每智能体（Agent）被拒绝，沙箱（Sandbox）不会使其恢复。

`tools.elevated` 是一个显式的逃生通道，在宿主机上运行 `exec`。`/exec` 指令仅适用于授权发送者且按会话（Session）持久化；要硬性禁用 `exec`，使用工具策略拒绝（参阅[沙箱（Sandbox） vs 工具策略 vs 提权](/tutorials/gateway/sandbox-vs-tool-policy-vs-elevated)）。

也就是说：
沙箱不是万能许可。工具如果本来被禁止，进沙箱也不会突然变成允许。
反过来，提权执行会绕过沙箱，所以更要谨慎。

调试：

- 使用 `openclaw sandbox explain` 检查生效的沙箱（Sandbox）模式、工具策略和修复配置键。
- 参阅[沙箱（Sandbox） vs 工具策略 vs 提权](/tutorials/gateway/sandbox-vs-tool-policy-vs-elevated)了解"为什么被阻止？"的思维模型。保持锁定状态。

---

## 多智能体（Agent）覆盖

每个智能体（Agent）可以覆盖沙箱（Sandbox） + 工具：`agents.entries.*.sandbox` 和 `agents.entries.*.tools`（加上 `agents.entries.*.tools.sandbox.tools` 用于沙箱（Sandbox）工具策略）。参阅[多智能体（Agent）沙箱（Sandbox）和工具](/tutorials/tools/multi-agent-sandbox-tools)了解优先级。

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

- [沙箱（Sandbox）配置](/tutorials/gateway/configuration)
- [多智能体（Agent）沙箱（Sandbox）和工具](/tutorials/tools/multi-agent-sandbox-tools)
- [安全](/tutorials/gateway/security)
