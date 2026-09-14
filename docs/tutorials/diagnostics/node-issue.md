---
title: "Node + tsx 崩溃排查"
sidebarTitle: "Node tsx 崩溃"
---

# Node + tsx 崩溃排查

某些开发环境里，使用 Node + `tsx` 直接运行源码可能遇到 `__name is not a function` 这类启动崩溃。

普通用户不需要处理这个问题。它主要影响源码开发和 watch 模式。

建议：

- 使用官方安装包或构建产物。
- 使用 Node 26.1+ 推荐版本，或 Node 24.16+ 兼容版本。
- 源码开发时先运行类型检查和构建。
- 遇到 `tsx` loader 问题时，尝试固定 Node/tsx 版本。

继续阅读：[安装 Node.js](/tutorials/installation/node)。
