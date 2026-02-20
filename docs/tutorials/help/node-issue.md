---
title: "Node.js 问题排查"
sidebarTitle: "Node.js 问题"
---

# Node.js 问题排查（Node.js Troubleshooting）

本页专门记录 Node.js 运行时与 OpenClaw 工具链配合时出现的已知问题和解决方案。

---

## 问题：`__name is not a function` 崩溃

### 现象

在使用 **Node.js + tsx**（TypeScript 执行器）运行 OpenClaw 相关代码时，出现如下崩溃：

```text
TypeError: __name is not a function
    at <anonymous> (...)
```

进程随即终止，无法正常启动。

### 环境条件

- 运行时：Node.js（v18 或更高）
- TypeScript 执行器：`tsx`（特定版本）
- 操作系统：macOS / Linux / Windows WSL

### 根本原因

这是 `tsx` 与某些打包工具或构建输出之间的兼容性问题。`tsx` 在转换代码时，某些版本会错误地处理 `__name` 辅助函数，导致运行时找不到该函数定义。

---

## 解决方案

按优先级从高到低尝试以下方案：

### 方案 1：降级 tsx 版本（推荐）

将 `tsx` 降级到已知稳定的版本：

```bash
# 查看当前版本
npx tsx --version

# 安装指定稳定版本
npm install -D tsx@3.12.2

# 或使用 bun
bun add -d tsx@3.12.2
```

::: tip
`tsx@3.12.x` 系列对大多数 OpenClaw 用例是稳定的。如果你使用的是 `4.x`，遇到此问题的概率较高。
:::

### 方案 2：使用 ts-node 替代

如果降级 tsx 不可行，改用 `ts-node` 作为 TypeScript 执行器：

```bash
# 安装 ts-node
npm install -D ts-node

# 运行脚本
npx ts-node your-script.ts
```

同时在 `tsconfig.json` 中确认以下配置：

```json5
{
  compilerOptions: {
    module: "CommonJS",    // ts-node 默认需要 CommonJS
    target: "ES2020"
  }
}
```

### 方案 3：直接运行编译后的 JS

先用 `tsc` 将 TypeScript 编译为 JavaScript，再用 Node.js 直接执行，绕过 tsx / ts-node 的转换问题：

```bash
# 编译 TypeScript
npx tsc

# 运行编译后的 JS
node dist/your-script.js
```

::: details tsconfig.json 参考配置
```json5
{
  compilerOptions: {
    target: "ES2020",
    module: "CommonJS",
    outDir: "./dist",
    rootDir: "./src",
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true
  },
  include: ["src/**/*"],
  exclude: ["node_modules", "dist"]
}
```
:::

---

## 排查步骤

如果上述方案都未能解决，按以下步骤进一步排查：

1. **确认 Node.js 版本**
   ```bash
   node --version
   # 需要 v18.0.0 或更高
   ```

2. **清理依赖缓存，重新安装**
   ```bash
   rm -rf node_modules
   npm install
   # 或
   bun install
   ```

3. **检查是否有版本冲突**
   ```bash
   npm ls tsx
   npm ls ts-node
   ```

4. **查看完整错误堆栈**
   ```bash
   NODE_OPTIONS="--stack-trace-limit=50" npx tsx your-script.ts
   ```

---

::: warning 已知影响版本
- `tsx@4.0.0` ~ `tsx@4.6.x`：在部分场景下出现此问题
- `tsx@3.12.2`：已验证稳定
- `tsx@4.7.0+`：官方已修复，可尝试升级到最新版

建议在锁定版本（`package-lock.json` 或 `bun.lockb`）中固定 tsx 版本，避免自动升级引入问题。
:::

---

## 参考资料

- [tsx GitHub Issues](https://github.com/privatenumber/tsx/issues) —— 搜索 `__name` 查看相关 Issue
- [ts-node 文档](https://typestrong.org/ts-node/) —— ts-node 配置参考
- [Node.js 版本要求](../getting-started/index) —— OpenClaw 对 Node.js 版本的官方要求

---

_下一步：[帮助中心](./index)_
