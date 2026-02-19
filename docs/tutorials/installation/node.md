---
title: "安装 Node.js"
sidebarTitle: "安装 Node.js"
---

# 安装 Node.js

OpenClaw 需要 **Node.js 22 或更新版本**。这篇文章教你怎么安装它。

> **已经装好了？** 先用 `node -v` 确认版本，看到 `v22.x.x` 或更大的数字就可以跳过这篇。

---

## 第一步：检查是否已安装

打开终端，输入：

```bash
node -v
```

- 看到 `v22.x.x` 或更大 → 已经满足要求，不需要安装
- 看到 `v18.x.x` 或更小的版本 → 需要升级
- 提示"找不到命令" → 没有安装，按下面步骤安装

---

## 第二步：安装 Node.js

根据你的操作系统，选择对应的安装方式：

### macOS

**方式一：Homebrew（推荐）**

如果你已经安装了 Homebrew，在终端运行：

```bash
brew install node
```

**方式二：直接下载**

去 [nodejs.org](https://nodejs.org/) 下载 macOS 安装包（.pkg 文件），双击安装。

---

### Linux

**Ubuntu / Debian 系统：**

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Fedora / RHEL / CentOS 系统：**

```bash
sudo dnf install nodejs
```

---

### Windows

**方式一：winget（推荐，Windows 10/11 自带）**

用管理员权限打开 PowerShell，运行：

```powershell
winget install OpenJS.NodeJS.LTS
```

**方式二：Chocolatey**

```powershell
choco install nodejs-lts
```

**方式三：直接下载**

去 [nodejs.org](https://nodejs.org/) 下载 Windows 安装包（.msi 文件），双击安装。

::: info Windows 用户提示
在 Windows 上，我们推荐使用 **WSL2**（Windows 的 Linux 子系统）运行 OpenClaw，体验更好。安装 WSL2：用管理员 PowerShell 运行 `wsl --install`，重启后进入 Ubuntu 子系统，再按 Linux 方式安装 Node.js。
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

**fnm（推荐，速度最快）：**

```bash
# 安装 fnm
curl -fsSL https://fnm.vercel.app/install | bash

# 安装并使用 Node 22
fnm install 22
fnm use 22
```

**nvm（macOS/Linux 经典选项）：**

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

# 重新打开终端，然后安装 Node 22
nvm install 22
nvm use 22
```

::: warning 注意
确保版本管理器的初始化命令已经加入 `~/.zshrc` 或 `~/.bashrc`，否则每次打开新终端都需要重新设置。
:::

:::

---

## 常见问题

::: details 装完 Node 后，openclaw 命令还是找不到？

这通常是 PATH 路径没有配置好，系统不知道去哪里找 openclaw 命令。

**诊断：**

```bash
npm prefix -g
echo $PATH
```

查看 `npm prefix -g` 的输出路径，是否包含在 `$PATH` 里。

**修复（macOS/Linux）：**

把下面这行加到 `~/.zshrc` 或 `~/.bashrc` 的末尾：

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

然后运行：

```bash
source ~/.zshrc   # 或 source ~/.bashrc
```

**修复（Windows）：**

打开"设置" → 搜索"编辑系统环境变量" → 找到 PATH → 添加 `npm prefix -g` 命令输出的路径。

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
