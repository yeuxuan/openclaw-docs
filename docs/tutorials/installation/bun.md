---
title: "Bun（实验性）"
sidebarTitle: "Bun"
---

# Bun（实验性）

目标：使用 **Bun** 运行本仓库（可选，不推荐用于 WhatsApp/Telegram），同时不偏离 pnpm 工作流。

⚠️ **不推荐用于网关（Gateway）运行时**（WhatsApp/Telegram 存在 bug）。生产环境请使用 Node。

---

## 状态

- Bun 是一个可选的本地运行时，用于直接运行 TypeScript（`bun run …`、`bun --watch …`）。
- `pnpm` 是默认的构建工具，仍然完全支持（且被部分文档工具使用）。
- Bun 无法使用 `pnpm-lock.yaml`，会忽略它。

---

## 安装

默认方式：

```sh
bun install
```

注意：`bun.lock`/`bun.lockb` 已被 gitignore，因此不会产生仓库变动。如果你不想写入锁文件：

```sh
bun install --no-save
```

---

## 构建 / 测试（Bun）

```sh
bun run build
bun run vitest run
```

---

## Bun 生命周期脚本（默认被阻止）

Bun 可能会阻止依赖的生命周期脚本，除非显式信任（`bun pm untrusted` / `bun pm trust`）。
对于本仓库，常被阻止的脚本不是必需的：

- `@whiskeysockets/baileys` `preinstall`：检查 Node 主版本 >= 20（我们运行 Node 22+）。
- `protobufjs` `postinstall`：发出关于不兼容版本方案的警告（无构建产物）。

如果你遇到需要这些脚本的实际运行时问题，请显式信任它们：

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

---

## 注意事项

- 部分脚本仍然硬编码使用 pnpm（例如 `docs:build`、`ui:*`、`protocol:check`）。目前请通过 pnpm 运行这些脚本。
