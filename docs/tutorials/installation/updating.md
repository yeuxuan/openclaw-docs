---
title: "更新"
sidebarTitle: "更新"
---

# 更新

OpenClaw 迭代很快（尚未到 "1.0"）。将更新视为基础设施发布：更新 → 运行检查 → 重启（或使用 `openclaw update`，它会重启） → 验证。

---

## 推荐：重新运行网站安装脚本（原地升级）

**首选**更新路径是重新运行网站的安装脚本。它会检测现有安装、原地升级，
并在需要时运行 `openclaw doctor`。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

注意事项：

- 如果你不想再次运行引导向导，添加 `--no-onboard`。
- 对于**源码安装**，使用：

  ```bash
  curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --no-onboard
  ```

  安装脚本会**仅在**仓库是干净状态时执行 `git pull --rebase`。

- 对于**全局安装**，脚本底层使用 `npm install -g openclaw@latest`。
- 历史说明：`clawdbot` 作为兼容性垫片仍然可用。

---

## 更新之前

- 了解你的安装方式：**全局**（npm/pnpm）vs **从源码**（git clone）。
- 了解你的网关运行方式：**前台终端** vs **受管服务**（launchd/systemd）。
- 快照你的自定义配置：
  - 配置：`~/.openclaw/openclaw.json`
  - 凭据：`~/.openclaw/credentials/`
  - 工作区：`~/.openclaw/workspace`

---

## 更新（全局安装）

全局安装（选一种）：

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

我们**不推荐**使用 Bun 作为网关运行时（WhatsApp/Telegram 存在 bug）。

切换更新通道（git + npm 安装方式）：

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --channel stable
```

使用 `--tag <dist-tag|version>` 进行一次性安装标签/版本。

参见 [开发通道](/install/development-channels) 了解通道语义和发行说明。

注意：对于 npm 安装，网关启动时会记录更新提示（检查当前通道标签）。通过 `update.checkOnStart: false` 禁用。

然后：

```bash
openclaw doctor
openclaw gateway restart
openclaw health
```

注意事项：

- 如果你的网关作为服务运行，`openclaw gateway restart` 优于直接杀死 PID。
- 如果你固定在特定版本，参见下面的"回滚 / 版本固定"。

---

## 更新（`openclaw update`）

对于**源码安装**（git checkout），推荐：

```bash
openclaw update
```

它运行一个相对安全的更新流程：

- 需要干净的工作树。
- 切换到选定的通道（标签或分支）。
- 获取 + 变基到配置的上游（dev 通道）。
- 安装依赖、构建、构建控制面板，并运行 `openclaw doctor`。
- 默认重启网关（使用 `--no-restart` 跳过）。

如果你通过 **npm/pnpm** 安装（无 git 元数据），`openclaw update` 会尝试通过你的包管理器更新。如果无法检测安装方式，请使用"更新（全局安装）"。

---

## 更新（控制面板 / RPC）

控制面板有**更新并重启**功能（RPC：`update.run`）。它：

1. 运行与 `openclaw update` 相同的源码更新流程（仅限 git checkout）。
2. 写入带有结构化报告（stdout/stderr 尾部）的重启标记文件。
3. 重启网关并向最后一个活跃会话（Session）发送报告。

如果变基失败，网关会中止并在不应用更新的情况下重启。

---

## 更新（从源码）

从仓库 checkout：

推荐：

```bash
openclaw update
```

手动方式（大致等效）：

```bash
git pull
pnpm install
pnpm build
pnpm ui:build # 首次运行时自动安装 UI 依赖
openclaw doctor
openclaw health
```

注意事项：

- 当你运行打包的 `openclaw` 二进制文件（[`openclaw.mjs`](https://github.com/openclaw/openclaw/blob/main/openclaw.mjs)）或使用 Node 运行 `dist/` 时，`pnpm build` 很重要。
- 如果你从仓库 checkout 运行且没有全局安装，使用 `pnpm openclaw ...` 执行 CLI 命令。
- 如果你直接从 TypeScript 运行（`pnpm openclaw ...`），通常不需要重新构建，但**配置迁移仍然适用** → 运行 doctor。
- 在全局安装和 git 安装之间切换很容易：安装另一种方式，然后运行 `openclaw doctor`，网关服务入口点就会被重写为当前安装。

---

## 始终运行：`openclaw doctor`

Doctor 是"安全更新"命令。它刻意保持无聊：修复 + 迁移 + 警告。

注意：如果你使用**源码安装**（git checkout），`openclaw doctor` 会先建议运行 `openclaw update`。

它通常做的事情：

- 迁移废弃的配置键 / 遗留配置文件位置。
- 审计 DM 策略并对有风险的"开放"设置发出警告。
- 检查网关健康状态并可以提供重启建议。
- 检测并迁移旧版网关服务（launchd/systemd；遗留 schtasks）到当前的 OpenClaw 服务。
- 在 Linux 上，确保 systemd 用户 lingering（使网关在注销后仍能存活）。

详情：[Doctor](/gateway/doctor)

---

## 启动 / 停止 / 重启网关

CLI（不论操作系统均可使用）：

```bash
openclaw gateway status
openclaw gateway stop
openclaw gateway restart
openclaw gateway --port 18789
openclaw logs --follow
```

如果你使用受管服务：

- macOS launchd（应用包内的 LaunchAgent）：`launchctl kickstart -k gui/$UID/bot.molt.gateway`（使用 `bot.molt.<profile>`；旧版 `com.openclaw.*` 仍可用）
- Linux systemd 用户服务：`systemctl --user restart openclaw-gateway[-<profile>].service`
- Windows（WSL2）：`systemctl --user restart openclaw-gateway[-<profile>].service`
  - `launchctl`/`systemctl` 仅在服务已安装时有效；否则运行 `openclaw gateway install`。

运行手册 + 确切服务标签：[网关运行手册](/gateway)

---

## 回滚 / 版本固定（出问题时）

### 版本固定（全局安装）

安装一个已知正常的版本（将 `<version>` 替换为最后一个正常工作的版本）：

```bash
npm i -g openclaw@<version>
```

```bash
pnpm add -g openclaw@<version>
```

提示：要查看当前发布的版本，运行 `npm view openclaw version`。

然后重启 + 重新运行 doctor：

```bash
openclaw doctor
openclaw gateway restart
```

### 版本固定（源码）按日期

选择某个日期的提交（示例："2026-01-01 时的 main 状态"）：

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
```

然后重新安装依赖 + 重启：

```bash
pnpm install
pnpm build
openclaw gateway restart
```

如果你之后想回到最新版本：

```bash
git checkout main
git pull
```

---

## 如果你遇到困难

- 再次运行 `openclaw doctor` 并仔细阅读输出（它通常会告诉你修复方法）。
- 查看：[故障排除](/gateway/troubleshooting)
- 在 Discord 上提问：[https://discord.gg/clawd](https://discord.gg/clawd)
