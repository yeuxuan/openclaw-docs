---
title: "安装 Node.js"
sidebarTitle: "安装 Node.js"
description: "OpenClaw 安装部署：安装 Node.js。OpenClaw 推荐 Node.js 26.1+，并说明 Node 24.16+ 兼容线与自动恢复机制。"
---

# 安装 Node.js

OpenClaw 推荐 Node.js 26.1+，也兼容 Node 24.16+。Node 22、23、25，以及低于
24.16 / 26.1 的版本均不受支持。
官网安装脚本在 macOS 缺少 Node 时准备 Node 26，在 Linux 缺少 Node 时准备
Node 24 LTS；所以 Linux 自动安装后看到 Node 24 是正常结果，不代表降级失败。

> 已经装好了？先用 `node -v` 确认版本。不要只看主版本，还要核对 24.16 / 26.1 这两个最低小版本。

---

## 第一步：检查是否已安装

打开终端，输入：

```bash
node -v
```

- 看到 `v26.1.0` 或更高的 26.x：推荐版本
- 看到 `v24.16.0` 或更高的 24.x：可以使用
- 看到 Node 22、23、25，或低于上述最低小版本：需要升级
- 提示"找不到命令" : 没有安装，按下面步骤安装

::: tip CLI 现在可以提供私有 Node 恢复
如果 OpenClaw 因 Node 版本不兼容而无法启动，交互式终端会先查找 PATH、受管
Gateway 服务、nvm/fnm/Volta/Homebrew 中已有的兼容运行时；仍未找到时，可经你
确认把校验过的 Node 下载到 `~/.openclaw/tools/cli-node`，然后重试原命令。它不会
替换系统 Node，也不会自动修复或重启 Gateway 服务。CI、`--json`、`--yes` 和非交互
调用不会弹出安装提示；Alpine/musl 仍需手动安装。

`openclaw update` 还有一条独立的目标版本预检：更新开始后会读取目标 release 的
Node 要求，优先选择已有兼容运行时；在 macOS、Windows 和 glibc Linux 的 x64/ARM64
上，也可以安静地准备校验过的私有运行时。这条更新恢复对 `--yes` 和 `--json` 同样
生效，但不会修改系统 Node 或 shell。它只在原更新请求和安装所有权仍有效时继续；
Alpine/musl、其他架构和要求精确进程身份的命令仍需手动准备兼容 Node。
:::

---

## 第二步：安装 Node.js

根据你的操作系统，选择对应的安装方式：

### macOS

方式一：Homebrew（推荐）

如果你已经安装了 Homebrew，在终端运行（Homebrew 当前稳定 Node 即可）：

```bash
brew install node
```

方式二：直接下载

去 [nodejs.org](https://nodejs.org/) 下载 macOS 安装包（.pkg 文件），双击安装。

---

### Linux

Ubuntu / Debian 系统：

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Fedora / RHEL / CentOS 系统：

```bash
sudo dnf install nodejs
```

---

### Windows

方式一：winget（推荐，Windows 10/11 自带）

用管理员权限打开 PowerShell，运行：

```powershell
winget install OpenJS.NodeJS.LTS
```

方式二：Chocolatey

```powershell
choco install nodejs-lts
```

方式三：直接下载

去 [nodejs.org](https://nodejs.org/) 下载 Windows 安装包（.msi 文件），双击安装。

::: info Windows 用户提示
在 Windows 上，我们推荐使用 WSL2（Windows 的 Linux 子系统）运行 OpenClaw，体验更好。安装 WSL2：用管理员 PowerShell 运行 `wsl --install`，重启后进入 Ubuntu 子系统，再按 Linux 方式安装 Node.js。
:::

---

## 第三步：验证安装成功

安装后，打开新的终端窗口，再次运行：

```bash
node -v
npm -v
```

两个命令都能显示版本号，说明安装成功了。

---

## 使用版本管理器（进阶）

如果你需要在多个 Node.js 版本之间切换，可以用版本管理器：

::: details nvm / fnm / mise 安装方式

fnm（推荐，速度最快）：

```bash
# 安装 fnm
curl -fsSL https://fnm.vercel.app/install | bash

# 安装并使用 Node 26
fnm install 26
fnm use 26
```

nvm（macOS/Linux 经典选项）：

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

# 重新打开终端，然后安装 Node 26
nvm install 26
nvm use 26
```

::: warning 注意
确保版本管理器的初始化命令已经加入 `~/.zshrc` 或 `~/.bashrc`，否则每次打开新终端都需要重新设置。
:::

:::

---

## 常见问题

::: details 装完 Node 后，openclaw 命令还是找不到？

这通常是 PATH 路径没有配置好，系统不知道去哪里找 openclaw 命令。

诊断：

```bash
npm prefix -g
echo $PATH
```

查看 `npm prefix -g` 的输出路径，是否包含在 `$PATH` 里。

修复（macOS/Linux）：

把下面这行加到 `~/.zshrc` 或 `~/.bashrc` 的末尾：

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

然后运行：

```bash
source ~/.zshrc   # 或 source ~/.bashrc
```

修复（Windows）：

打开"设置" : 搜索"编辑系统环境变量" : 找到 PATH : 添加 `npm prefix -g` 命令输出的路径。

:::

::: details Linux 上 npm install 提示权限错误（EACCES）？

把 npm 的全局安装目录改到用户自己的文件夹里：

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

把最后那行 `export PATH=...` 加到 `~/.bashrc` 或 `~/.zshrc` 里，让它永久生效。

:::
