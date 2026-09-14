---
title: "插件依赖解析"
sidebarTitle: "依赖解析"
---

# 插件依赖解析

插件可能依赖其他包、SDK 或能力。OpenClaw 需要在加载前判断依赖是否可用。

排查方向：

- 依赖包是否安装。
- 插件路径是否正确。
- 版本是否兼容。
- source checkout 是否执行过依赖安装。
- 打包版是否包含该插件。

不要把依赖错误误认为“通道坏了”。先看 Gateway 启动日志。

## 新手排查顺序

```bash
openclaw plugins inspect <id>
openclaw plugins doctor
openclaw logs --follow
```

如果是本地插件，确认你在插件目录安装过依赖，并且 `openclaw.plugin.json` 指向的入口文件真实存在。
如果是 npm 或 ClawHub 插件，确认安装记录没有损坏。

## 源码安装和本地依赖

OpenClaw 源码工作区使用 pnpm，在 OpenClaw checkout 根目录运行：

```bash
pnpm install
pnpm build
```

这不是本站 VitePress 文档仓库的安装命令。源码工作区不能用根目录 `npm install` 代替 pnpm workspace 准备。

当前 postinstall 和构建准备会**保留**插件局部的 `node_modules`、版本及 workspace 链接，由 pnpm 管理；不要按旧说明手动清掉它们。运行时优先 `dist/extensions`，然后 `dist-runtime/extensions`，都没有才使用 `extensions`；修改源码后要重新构建才会更新已选的构建树。

官方插件发布时在独立临时目录安装并打包运行依赖，不会借发布过程重写源码依赖树。运行时加载不会自动运行包管理器；缺失依赖应在安装/构建阶段修复。
