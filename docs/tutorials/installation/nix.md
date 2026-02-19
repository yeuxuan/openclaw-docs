---
title: "Nix"
sidebarTitle: "Nix"
---

# Nix 安装

使用 Nix 运行 OpenClaw 的推荐方式是通过 **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — 一个开箱即用的 Home Manager 模块。

## 快速开始

将以下内容粘贴给你的 AI 智能体（Claude、Cursor 等）：

```text
I want to set up nix-openclaw on my Mac.
Repository: github:openclaw/nix-openclaw

What I need you to do:
1. Check if Determinate Nix is installed (if not, install it)
2. Create a local flake at ~/code/openclaw-local using templates/agent-first/flake.nix
3. Help me create a Telegram bot (@BotFather) and get my chat ID (@userinfobot)
4. Set up secrets (bot token, Anthropic key) - plain files at ~/.secrets/ is fine
5. Fill in the template placeholders and run home-manager switch
6. Verify: launchd running, bot responds to messages

Reference the nix-openclaw README for module options.
```

> **完整指南：[github.com/openclaw/nix-openclaw](https://github.com/openclaw/nix-openclaw)**
>
> nix-openclaw 仓库是 Nix 安装的权威来源。本页面仅为快速概览。

## 你将获得

- 网关（Gateway）+ macOS 应用 + 工具（whisper、spotify、cameras）— 全部版本固定
- 可在重启后存活的 Launchd 服务
- 带声明式配置的插件系统
- 即时回滚：`home-manager switch --rollback`

---

## Nix 模式运行时行为

当设置了 `OPENCLAW_NIX_MODE=1` 时（nix-openclaw 会自动设置）：

OpenClaw 支持 **Nix 模式**，使配置具有确定性并禁用自动安装流程。
通过导出以下变量启用：

```bash
OPENCLAW_NIX_MODE=1
```

在 macOS 上，GUI 应用不会自动继承 shell 环境变量。你也可以
通过 defaults 启用 Nix 模式：

```bash
defaults write bot.molt.mac openclaw.nixMode -bool true
```

### 配置 + 状态路径

OpenClaw 从 `OPENCLAW_CONFIG_PATH` 读取 JSON5 配置，并将可变数据存储在 `OPENCLAW_STATE_DIR` 中。
如需要，你还可以设置 `OPENCLAW_HOME` 来控制用于内部路径解析的基础主目录。

- `OPENCLAW_HOME`（默认优先级：`HOME` / `USERPROFILE` / `os.homedir()`）
- `OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）
- `OPENCLAW_CONFIG_PATH`（默认：`$OPENCLAW_STATE_DIR/openclaw.json`）

在 Nix 下运行时，将这些显式设置为 Nix 管理的位置，以使运行时状态和配置
不进入不可变存储。

### Nix 模式下的运行时行为

- 自动安装和自变更流程被禁用
- 缺失的依赖会显示 Nix 特定的修复消息
- UI 在存在时显示只读 Nix 模式横幅

## 打包说明（macOS）

macOS 打包流程需要一个稳定的 Info.plist 模板位于：

```
apps/macos/Sources/OpenClaw/Resources/Info.plist
```

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 将此模板复制到应用包中并修补动态字段
（bundle ID、版本/构建号、Git SHA、Sparkle 密钥）。这使 plist 对于 SwiftPM
打包和 Nix 构建（不依赖完整的 Xcode 工具链）保持确定性。

## 相关链接

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) — 完整设置指南
- [向导](/start/wizard) — 非 Nix CLI 设置
- [Docker](/install/docker) — 容器化设置
