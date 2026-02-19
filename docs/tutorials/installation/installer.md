---
title: "安装器内部机制"
sidebarTitle: "安装器内部机制"
---

# 安装器内部机制

OpenClaw 提供三个安装脚本，托管在 `openclaw.ai`。

| 脚本                               | 平台                 | 功能                                                                                          |
| ---------------------------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 如需安装 Node，通过 npm（默认）或 git 安装 OpenClaw，可运行引导。                                |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | 将 Node + OpenClaw 安装到本地前缀（`~/.openclaw`）。无需 root 权限。                              |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 如需安装 Node，通过 npm（默认）或 git 安装 OpenClaw，可运行引导。                                |

## 快速命令


  **install.sh：**

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
```

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
```


  **install-cli.sh：**

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
```

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
```


  **install.ps1：**

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

```powershell
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
```


::: info 说明
如果安装成功但在新终端中找不到 `openclaw`，请参见 [Node.js 故障排除](/install/node#故障排除)。
:::


---

## install.sh

::: tip 提示
推荐用于 macOS/Linux/WSL 上的大多数交互式安装。
:::


### 流程（install.sh）


  ### 步骤 1：检测操作系统

    支持 macOS 和 Linux（包括 WSL）。如果检测到 macOS，会在缺失时安装 Homebrew。

  ### 步骤 2：确保 Node.js 22+

    检查 Node 版本，如需安装 Node 22（macOS 上使用 Homebrew，Linux 上使用 NodeSource 设置脚本，适用于 apt/dnf/yum）。

  ### 步骤 3：确保 Git

    如果缺失则安装 Git。

  ### 步骤 4：安装 OpenClaw

    - `npm` 方式（默认）：全局 npm 安装
    - `git` 方式：克隆/更新仓库，使用 pnpm 安装依赖，构建，然后在 `~/.local/bin/openclaw` 安装包装器

  ### 步骤 5：安装后任务

    - 在升级和 git 安装时运行 `openclaw doctor --non-interactive`（尽力而为）
    - 在适当时尝试引导（TTY 可用、引导未被禁用、且引导/配置检查通过）
    - 默认设置 `SHARP_IGNORE_GLOBAL_LIBVIPS=1`


### 源码 checkout 检测

如果在 OpenClaw checkout 内运行（`package.json` + `pnpm-workspace.yaml`），脚本会提供选择：

- 使用 checkout（`git`），或
- 使用全局安装（`npm`）

如果没有 TTY 可用且未设置安装方法，默认使用 `npm` 并发出警告。

对于无效的方法选择或无效的 `--install-method` 值，脚本以退出码 `2` 退出。

### 示例（install.sh）


  **默认：**

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
```

  **跳过引导：**

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
```

  **Git 安装：**

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
```

  **试运行：**

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
```


::: details 标志参考

| 标志                            | 描述                                                     |
| ------------------------------- | -------------------------------------------------------- |
| `--install-method npm\|git`     | 选择安装方法（默认：`npm`）。别名：`--method`              |
| `--npm`                         | npm 方式的快捷方式                                        |
| `--git`                         | git 方式的快捷方式。别名：`--github`                       |
| `--version <version\|dist-tag>` | npm 版本或 dist-tag（默认：`latest`）                      |
| `--beta`                        | 如果可用使用 beta dist-tag，否则回退到 `latest`             |
| `--git-dir <path>`              | checkout 目录（默认：`~/openclaw`）。别名：`--dir`          |
| `--no-git-update`               | 跳过对现有 checkout 的 `git pull`                          |
| `--no-prompt`                   | 禁用提示                                                  |
| `--no-onboard`                  | 跳过引导                                                  |
| `--onboard`                     | 启用引导                                                  |
| `--dry-run`                     | 打印操作而不实际执行                                       |
| `--verbose`                     | 启用调试输出（`set -x`，npm notice 级别日志）               |
| `--help`                        | 显示用法（`-h`）                                           |

  

:::


::: details 环境变量参考

| 变量                                        | 描述                                    |
| ------------------------------------------- | --------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | 安装方法                                 |
| `OPENCLAW_VERSION=latest\|next\|<semver>`   | npm 版本或 dist-tag                      |
| `OPENCLAW_BETA=0\|1`                        | 如果可用使用 beta                         |
| `OPENCLAW_GIT_DIR=<path>`                   | checkout 目录                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 切换 git 更新                            |
| `OPENCLAW_NO_PROMPT=1`                      | 禁用提示                                 |
| `OPENCLAW_NO_ONBOARD=1`                     | 跳过引导                                 |
| `OPENCLAW_DRY_RUN=1`                        | 试运行模式                               |
| `OPENCLAW_VERBOSE=1`                        | 调试模式                                 |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm 日志级别                              |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | 控制 sharp/libvips 行为（默认：`1`）       |

  

:::


---

## install-cli.sh

::: info
设计用于希望将所有内容放在本地前缀（默认 `~/.openclaw`）下且不依赖系统 Node 的环境。
:::


### 流程（install-cli.sh）


  ### 步骤 6：安装本地 Node 运行时

    下载 Node 压缩包（默认 `22.22.0`）到 `<prefix>/tools/node-v<version>` 并验证 SHA-256。

  ### 步骤 7：确保 Git

    如果缺失 Git，在 Linux 上尝试通过 apt/dnf/yum 安装，macOS 上通过 Homebrew 安装。

  ### 步骤 8：在前缀下安装 OpenClaw

    使用 npm 的 `--prefix <prefix>` 安装，然后将包装器写入 `<prefix>/bin/openclaw`。


### 示例（install-cli.sh）


  **默认：**

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
```

  **自定义前缀 + 版本：**

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
```

  **自动化 JSON 输出：**

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
```

  **运行引导：**

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
```


::: details 标志参考

| 标志                   | 描述                                                                        |
| ---------------------- | --------------------------------------------------------------------------- |
| `--prefix <path>`      | 安装前缀（默认：`~/.openclaw`）                                              |
| `--version <ver>`      | OpenClaw 版本或 dist-tag（默认：`latest`）                                    |
| `--node-version <ver>` | Node 版本（默认：`22.22.0`）                                                 |
| `--json`               | 输出 NDJSON 事件                                                             |
| `--onboard`            | 安装后运行 `openclaw onboard`                                                |
| `--no-onboard`         | 跳过引导（默认）                                                             |
| `--set-npm-prefix`     | 在 Linux 上，如果当前前缀不可写则强制 npm 前缀为 `~/.npm-global`               |
| `--help`               | 显示用法（`-h`）                                                             |

  

:::


::: details 环境变量参考

| 变量                                        | 描述                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | 安装前缀                                                                        |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw 版本或 dist-tag                                                         |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node 版本                                                                        |
| `OPENCLAW_NO_ONBOARD=1`                     | 跳过引导                                                                        |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm 日志级别                                                                     |
| `OPENCLAW_GIT_DIR=<path>`                   | 旧版清理查找路径（用于移除旧的 `Peekaboo` 子模块 checkout）                        |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | 控制 sharp/libvips 行为（默认：`1`）                                              |

  

:::


---

## install.ps1

### 流程（install.ps1）


  ### 步骤 9：确保 PowerShell + Windows 环境

    需要 PowerShell 5+。

  ### 步骤 10：确保 Node.js 22+

    如果缺失，依次尝试通过 winget、Chocolatey、Scoop 安装。

  ### 步骤 11：安装 OpenClaw

    - `npm` 方式（默认）：使用选定的 `-Tag` 进行全局 npm 安装
    - `git` 方式：克隆/更新仓库，使用 pnpm 安装/构建，并在 `%USERPROFILE%\.local\bin\openclaw.cmd` 安装包装器

  ### 步骤 12：安装后任务

    在可能时将所需的 bin 目录添加到用户 PATH，然后在升级和 git 安装时运行 `openclaw doctor --non-interactive`（尽力而为）。


### 示例（install.ps1）


  **默认：**

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

  **Git 安装：**

```powershell
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
```

  **自定义 git 目录：**

```powershell
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
```

  **试运行：**

```powershell
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
```

  **调试跟踪：**

```powershell
# install.ps1 目前还没有专门的 -Verbose 标志。
Set-PSDebug -Trace 1
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
Set-PSDebug -Trace 0
```


::: details 标志参考

| 标志                      | 描述                                             |
| ------------------------- | ------------------------------------------------ |
| `-InstallMethod npm\|git` | 安装方法（默认：`npm`）                            |
| `-Tag <tag>`              | npm dist-tag（默认：`latest`）                     |
| `-GitDir <path>`          | checkout 目录（默认：`%USERPROFILE%\openclaw`）     |
| `-NoOnboard`              | 跳过引导                                          |
| `-NoGitUpdate`            | 跳过 `git pull`                                   |
| `-DryRun`                 | 仅打印操作                                        |

  

:::


::: details 环境变量参考

| 变量                             | 描述             |
| -------------------------------- | ---------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | 安装方法         |
| `OPENCLAW_GIT_DIR=<path>`          | checkout 目录    |
| `OPENCLAW_NO_ONBOARD=1`            | 跳过引导         |
| `OPENCLAW_GIT_UPDATE=0`            | 禁用 git pull    |
| `OPENCLAW_DRY_RUN=1`               | 试运行模式       |

  

:::


::: info 说明
如果使用了 `-InstallMethod git` 且缺少 Git，脚本会退出并打印 Git for Windows 的链接。
:::


---

## CI 和自动化

使用非交互式标志/环境变量以获得可预测的运行。


  **install.sh（非交互式 npm）：**

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
```

  **install.sh（非交互式 git）：**

```bash
OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
  curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
```

  **install-cli.sh（JSON）：**

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
```

  **install.ps1（跳过引导）：**

```powershell
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
```


---

## 故障排除


::: details 为什么需要 Git？

    Git 是 `git` 安装方法所需的。对于 `npm` 安装，仍然会检查/安装 Git 以避免依赖使用 git URL 时出现 `spawn git ENOENT` 错误。
  

:::


::: details 为什么 npm 在 Linux 上报 EACCES 错误？

    某些 Linux 配置将 npm 全局前缀指向 root 所有的路径。`install.sh` 可以将前缀切换到 `~/.npm-global` 并将 PATH 导出追加到 shell rc 文件（如果这些文件存在）。
  

:::


::: details sharp/libvips 问题

    脚本默认设置 `SHARP_IGNORE_GLOBAL_LIBVIPS=1` 以避免 sharp 使用系统 libvips 构建。要覆盖：

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
```

  

:::


::: details Windows："npm error spawn git / ENOENT"

    安装 Git for Windows，重新打开 PowerShell，重新运行安装器。
  

:::


::: details Windows："openclaw is not recognized"

    运行 `npm config get prefix`，追加 `\bin`，将该目录添加到用户 PATH，然后重新打开 PowerShell。
  

:::


::: details Windows：如何获取详细安装器输出

    `install.ps1` 目前不提供 `-Verbose` 开关。
    使用 PowerShell 跟踪进行脚本级诊断：

```powershell
Set-PSDebug -Trace 1
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
Set-PSDebug -Trace 0
```

  

:::


::: details 安装后找不到 openclaw

    通常是 PATH 问题。参见 [Node.js 故障排除](/install/node#故障排除)。
  

:::
