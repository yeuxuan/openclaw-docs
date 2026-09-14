---
title: "openclaw gateway"
sidebarTitle: "gateway"
---

# `openclaw gateway`

`gateway` 管理 OpenClaw 的核心服务。Gateway 是聊天通道、Web 控制台、节点、插件和 Agent 会话之间的中转站。

```bash
openclaw gateway run
openclaw gateway status
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
```

## 什么时候用

- 想查看 Gateway 是否在线。
- 安装或重装后台服务。
- 配置改完需要重启。
- 服务器上排查端口、鉴权、服务状态。

## 新手路线

第一次安装仍然推荐：

```bash
openclaw onboard --install-daemon
```

日常排障：

```bash
openclaw gateway status
openclaw doctor
openclaw logs --follow
```

默认本机端口通常是 `127.0.0.1:18789`。不要在没有 token 或反向代理保护的情况下直接暴露到公网。

## 启动迁移与服务保护

启动时，符合条件的单文件配置可自动迁移确定性的旧键，包括非交互服务启动；完整校验通过后才写入，并保留 `.bak`。`$include`、Nix 管理、由更新版本写入的配置不参与。无法自动修复时，交互终端才会询问是否执行 `doctor --fix`；非交互环境只打印修复命令，不会任意改配置。

Linux 上 `gateway install --force` 也不能绕过服务定义保护。看到 `SERVICE_DEFINITION_SEALED` 或 `SERVICE_DEFINITION_UNKNOWN`，先按原因标签检查；`[unsafe-permissions]` 可从目录元数据入手：

```bash
ls -ld ~/.config ~/.config/systemd ~/.config/systemd/user
```

新安装缺少目录是正常的。仅在确认目录属于你且不需要共享写入时，对精确路径运行 `chmod go-w <path>`；不要递归改权限、接管系统目录或用 sudo 绕过检查。外部维护的 unit、专属 drop-in 或封存挂载应由部署维护者处理。

需要保留现有服务定义时：

```bash
openclaw gateway restart --preserve-definition
```

它只重启可检查的原生服务，不改定义、环境、wrapper 或权限，并在已安装启动器的端口检查健康；不恢复无托管监听进程，不能和 `--safe` 或 external supervision 混用。旧 CLI 不认识该选项会在重启前拒绝。`daemon restart` 旧入口支持同一选项。

继续阅读：[Gateway 使用指南](/tutorials/gateway/)。
