---
title: "开发通道"
sidebarTitle: "开发通道"
---

# 开发通道（Development Channels）

最后更新：2026-01-21

OpenClaw 提供三个更新通道（Channel）：

- **stable**：npm dist-tag `latest`。
- **beta**：npm dist-tag `beta`（测试中的构建）。
- **dev**：`main` 分支的最新提交（git）。npm dist-tag：`dev`（发布时）。

我们先将构建发布到 **beta**，测试后再将**经过验证的构建提升为 `latest`**，
版本号不变 — dist-tag 是 npm 安装的权威来源。

---

## 切换通道

Git checkout 方式：

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

- `stable`/`beta` 会检出最新匹配的标签（通常是同一个标签）。
- `dev` 切换到 `main` 并 rebase 到上游。

npm/pnpm 全局安装方式：

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

这会通过对应的 npm dist-tag（`latest`、`beta`、`dev`）进行更新。

当你**显式**使用 `--channel` 切换通道时，OpenClaw 也会对齐安装方式：

- `dev` 会确保存在一个 git checkout（默认 `~/openclaw`，可通过 `OPENCLAW_GIT_DIR` 覆盖），更新它，并从该 checkout 安装全局 CLI。
- `stable`/`beta` 使用匹配的 dist-tag 从 npm 安装。

提示：如果你想同时使用 stable 和 dev，保留两个克隆，并将网关（Gateway）指向 stable 那个。

---

## 插件与通道

当你使用 `openclaw update` 切换通道时，OpenClaw 也会同步插件来源：

- `dev` 优先使用 git checkout 中的内置插件。
- `stable` 和 `beta` 恢复使用 npm 安装的插件包。

---

## 标签最佳实践

- 为你希望 git checkout 落在的版本打标签（`vYYYY.M.D` 或 `vYYYY.M.D-<patch>`）。
- 保持标签不可变：永远不要移动或重用标签。
- npm dist-tag 仍然是 npm 安装的权威来源：
  - `latest` → stable
  - `beta` → 候选构建
  - `dev` → main 快照（可选）

---

## macOS 应用可用性

Beta 和 dev 构建**可能不包含** macOS 应用发布。这没问题：

- git 标签和 npm dist-tag 仍然可以发布。
- 在发行说明或更新日志中注明"此 beta 无 macOS 构建"。
