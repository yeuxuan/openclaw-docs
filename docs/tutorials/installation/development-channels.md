---
title: "开发通道"
sidebarTitle: "开发通道"
description: "OpenClaw 的 stable、extended-stable、beta 与 dev 更新通道、切换方式和风险边界。"
---

# 开发通道（Development Channels）

OpenClaw 提供四个更新通道（Channel）：

- stable：npm dist-tag `latest`，适合大多数用户。
- extended-stable：npm dist-tag `extended-stable`，跟随较慢的受支持月份版本；仅支持包安装，只提示更新，不会自动应用。
- beta：npm dist-tag `beta`；如果 beta 不存在或比 stable 更旧，会回退到 `latest`。
- dev：`main` 分支的移动最新提交（git）；可能包含未完成或破坏性变化，不应用于生产 Gateway。

我们先将构建发布到 beta，测试后再将经过验证的构建提升为 `latest`，
版本号不变；npm 安装时以 dist-tag 为准。

---

## 切换通道

Git checkout 方式：

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

- `stable`/`beta` 会检出最新匹配的标签；beta 缺失或落后时回退到 stable。
- `extended-stable` 不支持 git checkout，命令会保持 checkout 不变并要求改用包安装。
- `dev` 切换到 `main` 并 rebase 到上游。

npm/pnpm 全局安装方式：

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

其中 stable、beta 使用 npm dist-tag，extended-stable 使用经过校验的精确包版本；
dev 会切换到受支持的 Git checkout + build 流程，不把 `main` 当作 npm dist-tag。

当你显式使用 `--channel` 切换通道时，OpenClaw 会同时调整安装来源：

- `dev` 会准备一个 git checkout（默认 `~/openclaw`，可通过 `OPENCLAW_GIT_DIR` 覆盖），更新后再从这个 checkout 安装全局 CLI。
- `stable`/`beta` 使用匹配的 dist-tag 从 npm 安装。
- `extended-stable` 会解析公开选择器、校验精确包并安装该版本；解析或校验失败时不会回退到其他通道。

提示：如果你想同时使用 stable 和 dev，保留两个克隆，并将网关（Gateway）指向 stable 那个。

---

## 插件与通道

当你使用 `openclaw update` 切换通道时，OpenClaw 也会同步插件来源：

- `dev` 优先使用 git checkout 中的内置插件。
- `stable` 和 `beta` 恢复使用 npm 安装的插件包。
- `extended-stable` 会把符合条件的官方 npm 插件对齐到已安装核心的精确版本。

## 一次性指定版本或 dist-tag

`--tag` 只影响当前一次包安装，不会修改持久化通道：

```bash
openclaw update --tag 2026.7.1
openclaw update --tag beta
```

包安装会拒绝 `openclaw update --tag main`。要跟随 GitHub `main`，使用：

```bash
openclaw update --channel dev
```

即使持久化了 `update.channel: "dev"`，包安装显式传入一次性 `--tag` 时仍走包更新，不切换 Git；同时显式传 `--channel dev` 则以通道为准，走 checkout 流程。

建议先加 `--dry-run` 预览目标版本、安装方式和是否会触发降级确认。

---

## 标签怎么打

- 为你希望 git checkout 落在的版本打标签（`vYYYY.M.D` 或 `vYYYY.M.D-<patch>`）。
- 保持标签不可变：永远不要移动或重用标签。
- npm dist-tag 仍然是 npm 安装的权威来源：
  - `latest` : stable
  - `extended-stable` : 较慢的受支持月份版本
  - `beta` : 候选构建
  - `dev` 通道不依赖 npm `dev` tag，而是构建 Git `main` checkout。

---

## macOS 应用可用性

Beta 和 dev 构建可能不包含 macOS 应用发布。这没问题：

- git 标签和 npm dist-tag 仍然可以发布。
- 在发行说明或更新日志中注明"此 beta 无 macOS 构建"。
