---
title: "安装"
sidebarTitle: "安装"
---

# 安装 OpenClaw

这篇只解决一件事：把 OpenClaw 装好，并确认它真的能打开。

如果你是第一次用，推荐路线是：

```text
安装 OpenClaw → 运行 onboard → 打开 dashboard → 发第一条消息
```

::: tip 新手先别纠结安装方式
如果你不知道该选 npm、Docker、云服务器还是 Kubernetes，就选“一键安装脚本”。
你现在的目标不是研究部署方式，而是先让 OpenClaw 在电脑上跑起来。
:::

---

## 先检查电脑环境

OpenClaw 支持：

- macOS
- Linux
- Windows

Windows 可以直接用 PowerShell 安装；如果你后面要做更完整的开发和本地工具调用，WSL2 通常更稳。

如果你只是想先聊天、先体验控制 UI，Windows PowerShell 也可以开始，不必一上来安装一整套开发环境。

### Node.js 版本

官方当前推荐 Node 26.1+。安装脚本在 macOS 缺少 Node 时安装 Node 26，在 Linux
缺少 Node 时通过 NodeSource 安装 Node 24 LTS。兼容版本必须满足下面任一条件：

- Node 24.16+
- Node 26.1+（推荐默认）

Node 22、23、25 不受支持。最省心的做法仍是一键安装脚本：缺少 Node 或版本不兼容时，脚本会准备合适的运行时。

检查命令：

```bash
node --version
```

如果你还没有 Node.js，先看[安装 Node.js](./node)。

---

## 方法一：一键安装脚本（最推荐）

### macOS / Linux / WSL2

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Windows PowerShell

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

这个脚本会帮你处理安装细节。新手不用纠结 npm、pnpm、路径这些问题。

它还会帮你绕开一些新手很难发现的问题。例如有些电脑的 npm 配了
`min-release-age` 这类“新包先等等再装”的策略，直接 `npm install -g`
可能装不到最新 OpenClaw；官网安装脚本会在安装 OpenClaw 这个包时清掉这类新鲜度限制。

---

## 方法二：用 npm 安装

如果你已经熟悉 Node.js，也可以手动装。
如果你不知道 npm 是什么，请回到“一键安装脚本”。

```bash
npm install -g openclaw@latest --allow-scripts=openclaw
openclaw onboard
```

第二行会启动新的 Quick start：复用并真实验证可用的 AI 登录或 API Key，保存配置，
再以前台 Gateway 打开 Dashboard。确认聊天正常后按 `Ctrl+C` 停止前台进程，需要
长期后台运行时再执行 `openclaw gateway install`。

::: warning 手动 npm 安装会遵守你自己的 npm 策略
如果公司电脑、CI 或旧环境里配置过 npm 镜像、代理、缓存策略、`min-release-age`，
手动 npm 安装可能会比官网脚本更容易遇到“装的不是最新版本”或“包暂时不可见”。
遇到这种情况，不要反复删配置，先改用上面的一键安装脚本。
:::

::: warning 新版 npm / pnpm 要显式允许构建脚本
npm 12 和 npm 11.16+ 使用：

```bash
npm install -g openclaw@latest --allow-scripts=openclaw
```

npm 11.15 及更早版本不支持 `--allow-scripts`，请去掉该参数，或先升级 npm。
使用 pnpm 全局安装时则运行：

```bash
pnpm add -g --allow-build=openclaw openclaw@latest
```
:::

### 不想依赖系统级 Node？

macOS、Linux 和 WSL2 可以把 Node 与 OpenClaw 安装到 `~/.openclaw`：

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

### 想直接安装 GitHub main？

如果你明确要跟官方仓库 `main` 分支，而不是 npm 最新稳定包，用官网安装脚本指定 git 安装：

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

这条命令适合测试最新版修复。普通用户仍然建议用默认脚本或 npm 稳定版。

### 从源码手工构建

需要开发或调试时，在仓库内使用 `package.json` 固定的 pnpm 版本：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
corepack enable
pnpm install && pnpm build && pnpm ui:build
pnpm add --global "openclaw@link:$PWD"
openclaw onboard
```

全局链接不会修改 checkout 的包文件；若全局 bin 不在 PATH，运行 `pnpm setup`、重新打开终端后重试。不需要全局 CLI 时，直接在仓库内运行 `pnpm openclaw ...`。

Corepack 会选择项目固定的版本，本次上游快照为 pnpm 12.3.4。没有 Corepack 时可显式安装该版本；npm 11.16+ 使用 `npm install -g pnpm@12.3.4 --allow-scripts=pnpm@12.3.4`，更旧 npm 去掉不支持的参数。不要关闭安装脚本或可选依赖，否则 pnpm 的原生执行文件可能无法安装。后续以实际 checkout 的固定版本为准。

---

## 方法三：其他安装方式

下面这些方式不是给第一天的新手准备的。
它们适合你已经知道自己为什么需要容器、云服务器或集群时再选。

| 方式 | 适合谁 |
|------|--------|
| [Docker 部署](./docker) | 想把 OpenClaw 放进容器里运行 |
| [备份与恢复](./backups) | 升级、迁移或长期运行前保护状态数据 |
| [Cloudflare Containers](./cloudflare) | 评估实验性的 Worker + Container + R2 部署 |
| [Daytona](./daytona) | 用带 SSH 和签名预览地址的云沙箱运行 |
| [ClawDock 迁移](./clawdock) | 已使用旧辅助脚本的用户迁移到 Docker Compose |
| [Docker VM Runtime](./docker-vm-runtime) | 云 VM + Docker 长期运行 |
| [Nix 安装](./nix) | 已经在使用 Nix 的用户 |
| [Bun 安装](./bun) | 明确要用 Bun 1.4+ 运行 CLI、Gateway 或节点宿主的用户 |
| [GCP](./gcp)、[Azure](./azure)、[DigitalOcean](./digitalocean)、[Oracle](./oracle)、[Hetzner](./hetzner) | 想把 Gateway 放到云服务器上的用户 |
| [Northflank](./northflank)、[Railway](./railway)、[Render](./render) | 想用一键云平台模板 |
| [Hostinger](./hostinger) | 想用托管面板或 VPS |
| [Raspberry Pi](./raspberry-pi) | 想在家里放一台小网关 |
| [Kubernetes](./kubernetes) | 团队已有集群 |

如果你只是想先用起来，不需要从这里开始。

---

## 安装后必须做的 3 个检查

安装命令跑完，不代表事情结束。
请一定做下面 3 个检查，它们能告诉你“真的装好了没有”。

### 1. 运行体检

```bash
openclaw doctor
```

它会检查配置、服务、权限和常见风险。

### 2. 查看 Gateway 状态

```bash
openclaw gateway status
```

Gateway 是 OpenClaw 的总服务台。它在，OpenClaw 才能接消息。

### 3. 打开控制 UI

```bash
openclaw dashboard
```

浏览器能打开控制 UI，并且能发出第一条消息，就说明安装主链路已经成功。

成功标准很简单：你能在浏览器里问一句话，AI 能回一句话。
如果还没做到，先不要继续接 Telegram、WhatsApp 或远程访问。

---

## 常见问题

::: details 安装完后提示 `openclaw: command not found`

这通常是系统 PATH 没找到 npm 的全局命令目录。

先看 npm 全局目录：

```bash
npm prefix -g
```

再把它的 `bin` 加到 PATH。以 zsh 为例：

```bash
echo 'export PATH="$(npm prefix -g)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

重新打开终端后再试：

```bash
openclaw --version
```

:::

::: details 我已经装过旧版本，怎么升级？

最简单是重新运行安装脚本：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

或者：

```bash
openclaw update
openclaw doctor
openclaw gateway restart
```

更完整的说明看[更新](/tutorials/installation/updating)；更新后 Gateway 起不来、插件丢失或出现新旧 CLI 冲突时，看[更新故障排查](/tutorials/installation/update-troubleshooting)。

:::

::: details 我从 Claude 或 Hermes 迁移过来怎么办？

先用 dry-run 预览迁移计划：

```bash
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
```

详细说明看 [从 Claude 迁移](/tutorials/installation/migrating-claude) 和 [从 Hermes 迁移](/tutorials/installation/migrating-hermes)。

:::

::: details 想卸载怎么办？

看[卸载说明](./uninstall)。

:::

---

## 下一步

安装完成后，回到[快速开始](/tutorials/getting-started/getting-started)，先用控制 UI 发出第一条消息，再去接 Telegram 或 WhatsApp。
