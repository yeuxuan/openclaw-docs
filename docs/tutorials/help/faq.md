---
title: "常见问题 FAQ"
sidebarTitle: "FAQ"
description: "OpenClaw 帮助：常见问题（Frequently Asked Questions）。收集了使用 OpenClaw 时最频繁被问到的问题。如果你刚开始上手，建议先把这页快速过一遍。"
---

# 常见问题（Frequently Asked Questions）

收集了使用 OpenClaw 时最频繁被问到的问题。如果你刚开始上手，建议先把这页快速过一遍。

---

::: details OpenClaw 和 Claude 有什么区别？
OpenClaw 是一个 Agent 运行框架，负责管理 Agent 的生命周期、工具调用、通道连接和 Gateway 路由等基础设施。

Claude 是 Anthropic 开发的 AI 语言模型，是 OpenClaw 支持的众多 AI 后端之一。

简单来说：OpenClaw 是"壳"，Claude（或其他模型）是"大脑"。你可以在 OpenClaw 里切换使用不同的 AI 模型，而不需要改动其他配置。
:::

::: details 如何更新 OpenClaw？
运行以下命令即可更新到最新版本：

```bash
openclaw update
```

更新通常会重启受管 Gateway，但 `--no-restart`、服务定义保护或激活失败时不会。运行 `openclaw gateway status --deep` 核对实际版本和状态，见[更新故障排查](/tutorials/installation/update-troubleshooting)。
:::

::: details 团队可以共用一个 OpenClaw 吗？
可以。可信团队可共用 Gateway、群聊与 Control UI 会话，并用逐人身份和角色管理操作范围。一个 Gateway 仍是一个信任域；互不信任的客户/组织必须分开部署，不能把 owner 或角色当成恶意租户隔离。按[团队设置](/tutorials/getting-started/teams)操作。
:::

::: details 支持哪些操作系统？
OpenClaw 官方支持：

- macOS（Apple Silicon 和 Intel 均支持）
- Linux（Ubuntu 20.04+、Debian 11+ 等主流发行版）
- Windows 原生 PowerShell，或 Windows WSL2（Windows Subsystem for Linux）

原生 Windows 可以开始安装和使用；需要更完整的本地开发与工具环境时，WSL2 通常更方便。见 [Windows](/tutorials/platforms/windows)。
:::

::: details 如何重置配置？
如果配置出错或想从头开始，运行：

```bash
openclaw reset --dry-run
```

::: warning 注意
先备份并核对范围，再运行交互式 `openclaw reset`。`config` 只重置配置；`config+creds+sessions` 还移除凭据和会话；`full` 包括整个状态目录及工作区。它不是日常修复命令，保留数据的排障应先使用 `openclaw doctor`。
:::
:::

---

::: details 为什么 Agent 不回复？
Agent 不回复通常有以下几个原因，按顺序逐一检查：

1. API Key 无效或过期
   ```bash
   openclaw models status
   ```
   确认对应模型提供商的 API Key 已正确设置。

2. 网络连接问题
   确认你能正常访问 AI 模型的 API 端点（如 `api.anthropic.com`）。

3. Gateway 未运行
   ```bash
   openclaw gateway status
   ```
   如果 Gateway 未运行，先执行 `openclaw onboard --install-daemon` 安装后台服务；已经安装过服务时，执行 `openclaw gateway restart`。

4. 查看日志定位具体错误
   ```bash
   openclaw logs
   ```
:::

::: details 如何查看日志？
```bash
# 查看所有日志
openclaw logs

# 跟随 Gateway 日志
openclaw logs --follow

# 查看最近 100 条
openclaw logs --limit 100
```

更多调试选项请参考 [调试指南](./debugging)。
:::

::: details 如何卸载 OpenClaw？
```bash
openclaw uninstall
```

这会交互选择要移除的服务、状态或工作区；CLI 包本身不会移除，需要按原包管理器单独卸载。先备份，再预览作用范围，不使用旧文案中的 `--purge`：

```bash
openclaw backup create --verify
openclaw uninstall --dry-run
```

::: warning 不可逆操作
`--state` 移除状态与配置，`--workspace` 移除工作区，`--all` 还包含服务与 macOS App。只有确认备份可恢复并确实要删除时才选择这些范围。详见[卸载](/tutorials/installation/uninstall)。
:::
:::

---

::: details 数据存储在哪里？
OpenClaw 的所有数据默认存储在：

```text
~/.openclaw/
```

目录结构如下：

```text
~/.openclaw/
├── openclaw.json     # 主配置文件
├── state/openclaw.sqlite # 共享运行状态
├── agents/           # 各 Agent 的数据库和状态
└── workspace/        # 默认工作区，可另行配置
```

状态根目录可通过 `OPENCLAW_STATE_DIR` 修改；配置文件、工作区和日志也可能单独指定。用 `openclaw config file` 核对配置位置，详见 [环境变量](./environment)。
:::

::: details 支持哪些 AI 模型？
OpenClaw 支持多种 AI 模型后端：

| 提供商 | 代表模型 |
|--------|----------|
| Anthropic | 当前可用的 Claude 模型 |
| OpenAI | 当前账号可用的 OpenAI 模型 |
| Ollama | 本机部署且满足功能要求的模型 |
| 其他 | 兼容 OpenAI API 格式的任意模型 |

用 `openclaw configure --section model` 选择模型并配置鉴权，不要把旧的顶层 `model` 字段写回配置。当前支持方式见[模型提供商](/tutorials/providers/)。
:::

::: details 如何在多台设备间同步？
通过 Gateway 远程连接实现多设备访问：

1. 在主机上启动 Gateway，通过 SSH 隧道、Tailscale 或有身份认证的代理提供入口，不直接公开裸端口
2. 在其他设备的 Control UI 中登录，并按提示批准设备配对
3. 所有设备共享同一个 Gateway 实例，配置和会话状态保持一致

聊天通道的 `openclaw pairing approve <channel> <code>` 与 Control UI 设备配对不是同一件事。命令行远程连接请按 [`onboard` 远程模式](/tutorials/cli/onboard)配置 URL 和鉴权。

更多内容请参考 [Gateway 配置指南](../gateway/index)。
:::

---

_下一步：[调试指南](./debugging)_
