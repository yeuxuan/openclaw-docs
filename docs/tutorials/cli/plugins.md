---
title: "openclaw plugins"
sidebarTitle: "plugins"
---

# `openclaw plugins`

`plugins` 用来管理 Gateway 插件。插件可以给 OpenClaw 增加通道、模型 provider、工具、搜索、语音、诊断等能力。

把它想成手机里的“应用管理”：先安装，再启用，出问题就体检。

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins enable <name>
openclaw plugins disable <name>
openclaw plugins install <path-or-spec>
openclaw plugins update <id-or-spec>
openclaw plugins update --all
openclaw plugins reload <id>
openclaw plugins inspect <id>
openclaw plugins doctor
openclaw plugins marketplace entries
openclaw plugins marketplace list <source>
openclaw plugins marketplace refresh
```

## 什么时候用

- 新接入一个官方或社区插件。
- 升级后发现某个通道、模型或工具不见了。
- 想确认某个插件到底有没有启用。
- 插件报错，需要看 manifest、runtime 或诊断结果。

## 新手最稳路线

1. 先看现状：

```bash
openclaw plugins list --verbose
```

2. 安装插件：

```bash
openclaw plugins install @openclaw/example
```

3. 启用插件：

```bash
openclaw plugins enable example
```

4. 重启或检查 Gateway：

```bash
openclaw gateway restart
openclaw plugins doctor
```

## Marketplace 相关命令怎么分

如果你最近看到文档或终端里出现 `marketplace entries`，可以这样理解：

- `openclaw plugins marketplace entries`
  看的是当前配置好的 OpenClaw marketplace feed 里有哪些条目
- `openclaw plugins marketplace list <source>`
  看的是你手动指定的某个 marketplace 文件、仓库或 URL
- `openclaw plugins marketplace refresh`
  刷新当前配置的 hosted feed 快照，并告诉你这次到底用了线上结果、已接受快照，还是 bundled fallback

常见写法：

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh --json
```

如果你只想看“官方 feed 目前认得哪些插件”，优先用 `marketplace entries`。

## `update` 和 `dry-run` 的一个细节

如果某个 npm 插件当初是精确版本 pin 装进去的，那么：

- `openclaw plugins update <id>` 会继续沿用这个已记录的安装规格
- `openclaw plugins update <id> --dry-run` 不会偷偷替你跳到 `latest`

但如果 OpenClaw 同时发现这个包的 registry 默认线更新了，dry run 会把“你当前还锁在旧 pin 上”这件事说清楚，并提示你显式执行对应的 `@latest` 升级命令。

这对排查“为什么 dry run 说有更新，但真正 `update <id>` 没跳版本”很有帮助。

## 看不懂输出怎么办

先记三件事：

- `enabled` 表示已经启用。
- `disabled` 表示装了但没开。
- `Format: openclaw` 表示原生 OpenClaw 插件；`Format: bundle` 表示兼容包。

如果安装很慢或失败，再加生命周期追踪：

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install <path-or-spec>
```

继续阅读：[插件专题](/tutorials/plugins/)。

## 安装配置和检查结果

安装前配置无效时，`plugins install` 通常会停止，先运行 `openclaw doctor --fix` 并核对修改。Gateway 启动可做安全的旧字段迁移，但迁移后仍无效的插件配置会拒绝加载；热重载也不会接受无效配置。新插件缺少必填配置时可能先以 disabled 状态记录，补好 `plugins.entries.<id>.config` 再启用。

`plugins inspect <id>` 默认只看静态元数据，不导入插件运行时代码；需要已注册工具、服务或命令时再加 `--runtime`。多入口包检查任意子插件都会显示共享安装记录，`inspect --all --json` 也会逐项携带该记录；归属缺失或有歧义时会省略，而不是猜一个不相关安装来源。

受支持的安装、更新、启用和禁用会刷新运行时，不需要例行重启 Gateway。手工修改
manifest 或源码时使用 `plugins reload <id>`；普通配置编辑在默认 hybrid 模式下也
可热重载，但插件声明的 restart policy 仍可能要求完整重启。
