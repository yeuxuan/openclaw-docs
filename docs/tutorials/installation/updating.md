---
title: "更新"
sidebarTitle: "更新"
description: "OpenClaw 安装部署：更新。OpenClaw 迭代很快，更新时应按基础设施发布处理：更新、检查、重启、验证。"
---

# 更新

OpenClaw 迭代很快（尚未到 "1.0"）。建议把更新当成基础设施发布处理：先更新，再运行检查，然后重启（或使用会自动重启的 `openclaw update`），最后验证。

---

## 推荐：使用 `openclaw update`

当前首选路径是让 updater 识别 npm、pnpm、Bun 或 git 安装，执行更新、Doctor、插件同步和受管 Gateway 重启：

```bash
openclaw update --dry-run
openclaw update
```

`openclaw update` 没有 `--verbose`。需要诊断时用 `--dry-run`、`--json` 或 `openclaw update status --json`。

更新卡在 Doctor 或插件同步阶段时，先看[更新故障排查](/tutorials/installation/update-troubleshooting)，必要时运行 `openclaw update repair`。

### updater 已损坏时：重新运行安装脚本

如果 npm 包已经部分替换、导致 `openclaw update` 本身无法完成，再用安装脚本直接恢复包安装：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

安装脚本不会再次调用 updater；可以用 `--version <version-or-dist-tag>` 固定恢复目标。

普通原地升级也仍然可以重新运行网站安装脚本：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

注意事项：

- 如果你不想再次运行引导向导，添加 `--no-onboard`。
- 对于源码安装，使用：

  ```bash
  curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --no-onboard
  ```

  安装脚本会仅在仓库是干净状态时执行 `git pull --rebase`。

- 对于全局安装，脚本底层使用 `npm install -g openclaw@latest`。
- 官网安装脚本会在安装 OpenClaw 包时清理 npm 新鲜度过滤（例如 `min-release-age`）。
  如果你手动运行 npm，仍然会遵守你自己电脑上的 npm 策略。
- 历史说明：如果你的旧环境里仍有 `clawdbot` 命令，它只是兼容性垫片；新文档和新命令统一使用 `openclaw`。

---

## 更新之前

- 了解你的安装方式：全局（npm/pnpm）vs 从源码（git clone）。
- 了解你的网关运行方式：前台终端 vs 受管服务（launchd/systemd）。
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

Bun 1.4+ 在提供 WAL-reset-safe `node:sqlite` 时可显式用作 Gateway 运行时；
Node 仍是默认和推荐路线。详见 [Bun](/tutorials/installation/bun)。

切换更新通道（git + npm 安装方式）：

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --channel stable
openclaw update --channel extended-stable
```

使用 `--tag <dist-tag|version>` 进行一次性安装标签/版本。
如果传的是 GitHub 或 git 源码规格，新版 updater 会先打成临时 tarball，
再走分阶段全局 npm 安装。这样做是为了先验证包内容，再替换正在使用的全局安装。

`extended-stable` 只支持包安装，不支持 git checkout，也不会自动应用更新。参见 [开发通道](/tutorials/installation/development-channels) 了解通道语义和发行说明。

注意：对于 npm 安装，网关启动时会记录更新提示（检查当前通道标签）。
`update.checkOnStart: false` 会同时关闭自动更新检查、匿名功能统计和更新提示，
即使 `update.auto.enabled` 为 `true`。详见
[使用统计与更新检查](/tutorials/gateway/telemetry)。

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

对于源码安装（git checkout），推荐：

```bash
openclaw update
```

它运行一个相对安全的更新流程：

- 需要干净的工作树。
- 切换到选定的通道（标签或分支）。
- 获取 + 变基到配置的上游（dev 通道）。
- 安装依赖、构建、构建控制面板，并运行 `openclaw doctor`。
- 默认重启网关（使用 `--no-restart` 跳过）。

如果你通过 npm/pnpm 安装（无 git 元数据），`openclaw update` 会尝试通过你的包管理器更新。如果无法检测安装方式，请使用"更新（全局安装）"。

::: info Nix 用户不要直接改安装目录
如果环境里设置了 `OPENCLAW_NIX_MODE=1`，说明这个 OpenClaw 是由 Nix 管理的。
这时会禁用真正会改文件的 `openclaw update`，你应该更新 Nix flake/input。

还能安全运行的是：

```bash
openclaw update status
openclaw update --dry-run
```

它们只读，不会修改安装。
:::

### dev 通道 fetch 失败时

最新版 `openclaw update` 在 dev 通道下会更保守：如果 `git fetch --all --prune --tags` 失败，会立刻停止更新，不再继续 preflight、rebase 或 build。

这通常是好事。它避免在 refs 已经过期或 tag 冲突时继续操作，导致你以为更新了，其实 Gateway 还在旧 runtime 上。

如果你看到 `fetch-failed`：

```bash
git fetch --all --prune --tags
openclaw update --dry-run
```

先解决 git 报错，例如 tag 冲突、远端不可达、权限问题，再重新运行 `openclaw update`。

---

## 更新（控制面板 / RPC）

控制面板有更新并重启功能（RPC：`update.run`）。它现在分两种情况：

1. 源码 checkout：运行与 `openclaw update` 相同的源码更新流程。
2. npm/pnpm 全局安装：Gateway 先启动一个独立 helper，然后自己退出。
   helper 在 Gateway 进程外执行 `openclaw update --yes --json`。

```text
旧 Gateway 不要一边运行一边拆自己的安装目录。
先交给外面的 helper，等 helper 换好包、重启服务、确认健康以后，再报告结果。
```

如果控制面板返回：

| 返回 | 意思 | 你该做什么 |
|------|------|------------|
| `managed-service-handoff-started` | 已经把更新交给外部 helper | 等待重启完成，再跑 `openclaw status` |
| `managed-service-handoff-unavailable` | 没找到安全的服务边界 | 按返回里的 `handoff.command` 到终端手动运行 |
| `managed-service-handoff-failed` | helper 启动失败 | 看日志，必要时终端运行 `openclaw update` |

如果变基失败，网关会中止并在不应用更新的情况下重启。

---

## 更新（从源码）

从仓库 checkout：

推荐：

```bash
openclaw update
```

手动方式（先保存本地改动并确认工作树干净；不是 updater 全部预检的替代）：

```bash
git pull
corepack enable
pnpm install --frozen-lockfile
pnpm build
pnpm ui:build # 首次运行时自动安装 UI 依赖
openclaw doctor
openclaw health
```

注意事项：

- 当你运行打包的 `openclaw` 二进制文件（[`openclaw.mjs`](https://github.com/openclaw/openclaw/blob/main/openclaw.mjs)）或使用 Node 运行 `dist/` 时，`pnpm build` 很重要。
- 如果你从仓库 checkout 运行且没有全局安装，使用 `pnpm openclaw ...` 执行 CLI 命令。
- 如果你直接从 TypeScript 运行（`pnpm openclaw ...`），通常不需要重新构建，但配置迁移仍然适用，需要运行 doctor。
- 安装方式切换前，先用 `openclaw gateway status --deep` 确认受管服务归属；Doctor 检查不等于授权重定向服务。需要改绑时才显式使用 `gateway install --force`，并遵守服务定义保护。
- dev 通道需要临时准备 pnpm 时，新版 updater 优先使用 Corepack；失败后通过 npm 临时安装目标 checkout 固定的精确版本，而不是固定 `pnpm@11`。
- dev 更新会构建包含插件和 Control UI 的完整运行时，但不生成 TypeScript 声明；普通 `pnpm build` 和包构建仍生成声明。

### 源码服务器的参考脚本

在 checkout 中执行 `scripts/update-gateway.sh` 可完成服务器更新。它要求所有 tracked 文件干净（包括构建产物），不会先恢复构建输出；fetch 后固定目标提交，验证其 pnpm pin，再 fast-forward 或 rebase、frozen-lockfile 安装和构建。只有构建成功才重启。

该脚本要求 Corepack，使用临时 shim 和只含包管理器元数据的私有探测工作区，不全局激活。pnpm 元数据缺失、准备失败或版本不一致会在改 checkout 前停止。这个预检不代表本地分支 rebase 后一定可构建；后续安装/构建失败也不会自动回滚，应事先准备恢复路径。

正在运行的旧 updater/脚本不会因拉到新源码而改变引导逻辑。跨 pnpm pin 变化前，先确认实际调用的 launcher 同时支持目标和已知可用回滚版本。pnpm 12 仍可使用 `global/v11` 布局，不能仅因布局编号与 CLI 主版本不同就判断安装损坏。

---

## 更新后插件也要对齐

新版 `openclaw update` 不只更新主程序，还会在重启前做一次 post-core convergence。
```text
主程序更新好了，也要确认启用中的插件文件还在、package.json 能读、入口文件存在。
确认通过以后，才允许 Gateway 带着这套插件重启。
```

你可能在 `openclaw update --json` 里看到：

| 字段 | 意思 | 是否代表主程序失败 |
|------|------|--------------------|
| `postUpdate.plugins.status: "ok"` | 插件也同步好了 | 否 |
| `postUpdate.plugins.status: "warning"` | 主程序好了，但某个托管插件需要修 | 否 |
| `postUpdate.plugins.status: "error"` | 启用插件没有通过重启前校验 | 是，Gateway 不会用未验证插件重启 |

beta 通道还有一个常见 warning：某个插件没有 beta 版本，OpenClaw 会回退到记录的默认/最新版。
这不会让核心更新失败，但你应该读 warning，确认是不是你预期的插件版本。

遇到插件 warning，先按这个顺序修：

```bash
openclaw doctor --fix
openclaw plugins inspect <插件ID> --runtime --json
openclaw plugins doctor
```

---

## 始终运行：`openclaw doctor`

Doctor 是"安全更新"命令。它刻意保持无聊：修复 + 迁移 + 警告。

注意：如果你使用源码安装（git checkout），`openclaw doctor` 会先建议运行 `openclaw update`。

它通常做的事情：

- 迁移废弃的配置键 / 遗留配置文件位置。
- 审计 DM 策略并对有风险的"开放"设置发出警告。
- 检查网关健康状态并可以提供重启建议。
- 检测并迁移旧版网关服务（launchd/systemd；遗留 schtasks）到当前的 OpenClaw 服务。
- 在 Linux 上，确保 systemd 用户 lingering（使网关在注销后仍能存活）。

详情：[Doctor](/tutorials/gateway/doctor)

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

运行手册 + 确切服务标签：[网关运行手册](/tutorials/gateway/)

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

然后在已切换的 checkout 中选择该 ref 固定的工具链，再安装、构建和重启。先确认 Corepack 支持这个版本；以下 `&&` 确保构建失败不会继续重启：

```bash
corepack enable && corepack pnpm install --frozen-lockfile && corepack pnpm build && openclaw gateway restart
```

如果你之后想回到最新版本：

```bash
git checkout main
git pull
```

---

## 如果你遇到困难

- 再次运行 `openclaw doctor` 并仔细阅读输出（它通常会告诉你修复方法）。
- 若使用解压版 Chrome 扩展，运行
  `openclaw browser doctor --browser-profile chrome`；仍提示版本不一致时，在
  `chrome://extensions` 重新加载，必要时完全重启 Chrome。
- 想把只读诊断交给编码 Agent，运行 `openclaw triage`。
- 查看：[故障排除](/tutorials/gateway/troubleshooting)
- 在 Discord 上提问：[https://discord.gg/clawd](https://discord.gg/clawd)
