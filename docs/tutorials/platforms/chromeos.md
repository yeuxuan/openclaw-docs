---
title: "ChromeOS"
sidebarTitle: "ChromeOS"
description: "在 Chromebook 的 Crostini Linux 容器中安装和运行 OpenClaw Gateway。"
---

# ChromeOS

ChromeOS 通过 Crostini 提供 Debian Linux 容器。OpenClaw Gateway 就运行在这个容器里，因此大部分步骤与 [Linux](/tutorials/platforms/linux) 相同。

## 快速安装

先在 ChromeOS 设置中打开“Linux 开发环境”，然后在它提供的终端中运行：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw onboard --install-daemon
openclaw gateway status
```

个人 Chromebook 优先使用原生 npm/安装脚本，而不是 Crostini 里的 Docker。容器重建时，Docker 内部的 Claude Code 等 CLI 登录更容易丢失；原生安装会把它保存在 Crostini 文件系统。

OpenClaw 推荐 Node 26.1+，也支持 Node 24.16+。Node 22、23、25 不受支持。Node 仍是
默认运行时；Bun 1.4+ 在提供 WAL-reset-safe `node:sqlite` 时，也可以作为 CLI、
Gateway 和节点宿主的显式可选运行时。

## Provider Key 放哪里

Gateway 作为 systemd 用户服务运行，不会继承你刚在终端执行的 `export`。把密钥写到：

```bash
~/.openclaw/.env
```

然后重启：

```bash
openclaw gateway restart
```

ChromeOS 重启后，Crostini 不一定自动启动。先打开一次 Linux Terminal，再检查 `openclaw gateway status`；不要把 Chromebook 当成无人值守的常开服务器。

上游来源：[`docs/platforms/chromeos.md`](https://github.com/openclaw/openclaw/blob/main/docs/platforms/chromeos.md)。
