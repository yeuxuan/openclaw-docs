---
title: "安装"
sidebarTitle: "安装"
---

# 安装 OpenClaw

这篇文章教你怎么把 OpenClaw 装到你的电脑上。总共有三种方式，**大多数人用第一种就够了**。

---

## 先检查：你的电脑能不能用？

OpenClaw 支持以下操作系统：

- **macOS**（苹果电脑）✓
- **Linux**（Ubuntu、Debian 等）✓
- **Windows**（推荐使用 WSL2，见下方说明）✓

**唯一的要求：电脑上要有 Node.js 22 版本或更新的版本。**

怎么检查是否已安装？打开终端，输入：

```bash
node --version
```

- 看到 `v22.x.x` 或更大的数字 → 可以直接安装
- 看到版本太低或"找不到命令" → 先看[安装 Node.js](./node)

::: info Windows 用户特别说明
在 Windows 上，我们**强烈建议**用 WSL2（Windows 的 Linux 子系统）来运行 OpenClaw。
WSL2 的安装方法：用管理员权限打开 PowerShell，输入 `wsl --install`，重启后即可。

不熟悉 WSL2？可以先阅读微软的[官方教程](https://learn.microsoft.com/zh-cn/windows/wsl/install)。
:::

---

## 方法一：一键安装脚本（推荐，大多数人用这个）

这是最简单的方式，脚本会自动帮你处理所有事情。

**macOS / Linux / WSL2：**

打开终端，复制粘贴这行命令，按回车：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

**Windows（在 PowerShell 里运行）：**

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

**这个脚本会做什么？**

1. 检查你有没有 Node.js，没有的话自动帮你装
2. 安装 OpenClaw 软件
3. 自动启动设置向导，引导你完成首次配置

**安装成功后会看到：**

```text
✓ OpenClaw installed successfully!
Run "openclaw onboard" to get started.
```

---

## 方法二：手动用 npm 安装

如果你已经有 Node.js 22+，也可以用 npm 手动安装：

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

安装完后，运行第二行命令来启动设置向导。

::: tip 遇到安装错误？
如果提示 `sharp` 相关错误，试试这个命令：
```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```
:::

---

## 方法三：其他高级安装方式

| 方式 | 适合谁 |
|------|--------|
| [Docker 部署](./docker) | 想在容器里运行的技术用户 |
| [Nix 安装](./nix) | 使用 Nix 包管理器的用户 |
| [从源码编译](/tutorials/getting-started/setup) | 开发者，想改代码的人 |

---

## 安装完成后：验证一切是否正常

安装并完成初始设置后，用这三个命令检查状态：

```bash
openclaw doctor         # 自动检测和修复配置问题
openclaw status         # 查看网关（指挥部）是否在运行
openclaw dashboard      # 打开控制面板（会自动打开浏览器）
```

**全部正常的话：**
- `doctor` 会显示"没有发现问题"
- `status` 会显示"running"（运行中）
- `dashboard` 会打开浏览器，显示控制面板界面

---

## 常见问题

::: details 安装完后输入 "openclaw" 提示找不到命令？

这是因为系统不知道 openclaw 安装在哪里。需要告诉它：

```bash
# 先查看 npm 的安装路径
npm prefix -g

# 然后把这个路径加到系统路径里
# 把下面这行加到 ~/.zshrc 或 ~/.bashrc 文件末尾
export PATH="$(npm prefix -g)/bin:$PATH"

# 让修改立即生效
source ~/.zshrc   # 或者 source ~/.bashrc
```

然后重新打开终端，再试一次 `openclaw --version`。

:::

::: details 安装过程中断，怎么重新安装？

直接重新运行安装命令就可以，不需要先卸载。安装脚本会自动覆盖旧版本。

:::

::: details 想卸载怎么办？

参考[卸载说明](./uninstall)。

:::

---

## 下一步

安装好了？直接去[快速入门教程](/tutorials/getting-started/getting-started)完成初始配置，5 分钟内就能和 AI 说话！
