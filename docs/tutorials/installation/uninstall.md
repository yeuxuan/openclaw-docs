---
title: "卸载"
sidebarTitle: "卸载"
---

# 卸载

两种路径：

- **简单路径**：如果 `openclaw` 仍然已安装。
- **手动移除服务**：如果 CLI 已被删除但服务仍在运行。

---

## 简单路径（CLI 仍已安装）

推荐：使用内置卸载器：

```bash
openclaw uninstall
```

非交互式（自动化 / npx）：

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

手动步骤（效果相同）：

1. 停止网关（Gateway）服务：

```bash
openclaw gateway stop
```

2. 卸载网关服务（launchd/systemd/schtasks）：

```bash
openclaw gateway uninstall
```

3. 删除状态 + 配置：

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

如果你将 `OPENCLAW_CONFIG_PATH` 设置为状态目录之外的自定义位置，也需要删除该文件。

4. 删除你的工作区（Workspace）（可选，会移除智能体文件）：

```bash
rm -rf ~/.openclaw/workspace
```

5. 移除 CLI 安装（选择你使用的那个）：

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. 如果你安装了 macOS 应用：

```bash
rm -rf /Applications/OpenClaw.app
```

注意事项：

- 如果你使用了 profile（`--profile` / `OPENCLAW_PROFILE`），对每个状态目录重复步骤 3（默认为 `~/.openclaw-<profile>`）。
- 在远程模式下，状态目录位于**网关主机**上，因此也需要在那里执行步骤 1-4。

---

## 手动移除服务（CLI 未安装）

当网关服务持续运行但 `openclaw` 缺失时使用此方法。

### macOS (launchd)

默认标签为 `bot.molt.gateway`（或 `bot.molt.<profile>`；旧版 `com.openclaw.*` 可能仍然存在）：

```bash
launchctl bootout gui/$UID/bot.molt.gateway
rm -f ~/Library/LaunchAgents/bot.molt.gateway.plist
```

如果你使用了 profile，将标签和 plist 名称替换为 `bot.molt.<profile>`。如果存在旧版 `com.openclaw.*` plist，也一并移除。

### Linux (systemd 用户单元)

默认单元名称为 `openclaw-gateway.service`（或 `openclaw-gateway-<profile>.service`）：

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows（计划任务）

默认任务名称为 `OpenClaw Gateway`（或 `OpenClaw Gateway (<profile>)`）。
任务脚本位于你的状态目录下。

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

如果你使用了 profile，删除匹配的任务名称和 `~\.openclaw-<profile>\gateway.cmd`。

---

## 常规安装 vs 源码 checkout

### 常规安装（install.sh / npm / pnpm / bun）

如果你使用了 `https://openclaw.ai/install.sh` 或 `install.ps1`，CLI 是通过 `npm install -g openclaw@latest` 安装的。
使用 `npm rm -g openclaw`（或 `pnpm remove -g` / `bun remove -g`，取决于你的安装方式）移除。

### 源码 checkout（git clone）

如果你从仓库 checkout 运行（`git clone` + `openclaw ...` / `bun run openclaw ...`）：

1. 在删除仓库**之前**卸载网关服务（使用上面的简单路径或手动移除服务）。
2. 删除仓库目录。
3. 如上所述移除状态 + 工作区。
