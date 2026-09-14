---
title: "Bun 运行 OpenClaw"
sidebarTitle: "Bun"
description: "使用 Bun 1.4+ 显式运行 OpenClaw CLI、Gateway 和节点宿主，并说明与 pnpm 工作区的边界。"
---

# Bun 运行 OpenClaw

::: warning 先记住默认路线
Node 仍是 OpenClaw 的首选、默认和推荐运行时。只有 Bun 1.4+ 且内置
`node:sqlite` 满足 WAL 重置安全要求时，才可显式选择 Bun；旧版或 SQLite
不安全的 Bun 会被拒绝。
:::

当前 Bun 可以运行 CLI、Gateway 和受管节点宿主，不再是“绝对不能运行
Gateway”。不过源码仓库仍以 pnpm 工作区为准，安装依赖不要改用 `bun install`。

## 源码仓库中的正确用法

```bash
pnpm install
bun run build
bun run vitest run
```

当前 Bun 无法正确解析本仓库的 `pnpm-workspace.yaml` 布局，`bun install`
会在工作区解析阶段失败。依赖安装和部分内部脚本仍应使用 pnpm。

## 用 Bun 运行并安装 Gateway

在源码 checkout 中运行向导，并明确把受管 Gateway 安装为 Bun 运行时：

```bash
bun openclaw.mjs onboard --install-daemon --daemon-runtime bun
```

受管节点宿主需要单独选择运行时：

```bash
bun openclaw.mjs node install --runtime bun
```

如果是全局 Bun 安装，先允许 OpenClaw 的生命周期脚本：

```bash
bun add -g --trust openclaw@latest
bun run --bun openclaw onboard --install-daemon --daemon-runtime bun
```

普通 `openclaw` 可执行文件仍带 Node shebang；`bun run --bun` 才会强制用
Bun 启动 CLI。

## SQLite 要求

可接受的 SQLite 版本范围是：

- 3.51.3+
- 3.50.7+（仅 3.50.x）
- 3.44.6+（仅 3.44.x）

Doctor 会接受满足要求的 Bun 1.4+ 服务；不安全或过旧的 Bun 服务会被建议
迁移回 Node。生产环境若没有明确理由选择 Bun，仍建议保持 Node。

## 生命周期脚本

Bun 默认阻止依赖生命周期脚本。源码仓库中常见的 `baileys` preinstall 和
`protobufjs` postinstall 通常不产生必需构建产物；确有运行时问题时再显式信任：

```bash
bun pm trust baileys protobufjs
```

部分脚本内部仍会调用 pnpm，例如文档、UI 和协议检查；这类任务直接用 pnpm
执行最稳妥。

## 相关文档

- [安装总览](/tutorials/installation/)
- [安装 Node.js](/tutorials/installation/node)
- [升级 OpenClaw](/tutorials/installation/updating)
