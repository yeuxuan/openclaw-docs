---
title: "更新故障排查"
sidebarTitle: "更新故障排查"
description: "OpenClaw 更新后 Gateway、插件、PATH 或版本状态异常时的分层恢复步骤。"
---

# 更新故障排查

更新命令报错时，先确认失败发生在哪一层：CLI 包替换、Gateway 重启、配置迁移，还是插件同步。不要一上来删除 `~/.openclaw`，这里保存着配置、凭据、会话和通道状态。

## 先跑这组只读检查

```bash
which openclaw
openclaw --version
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
```

然后再运行修复检查：

```bash
openclaw doctor --fix
```

重点看三个信号：

- `Update restart`：受管服务交接仍在等待或已经失败。
- `plugin load failed`：核心包可能已更新，但插件树没有完成收敛。
- `meta.lastTouchedVersion` 或“newer config”提示：当前 shell 找到的 CLI 比最后写配置的版本旧。

## 情况一：CLI 和 Gateway 指向不同安装

更新后 shell 里的 `openclaw` 可能来自旧 npm prefix，而 Gateway 服务已经指向另一个安装。先比较：

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

修正 PATH，让 `openclaw` 指向较新的安装，再刷新服务入口：

```bash
openclaw gateway install --force
openclaw gateway restart
```

不要长期设置 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`。它只适合已经确认风险的单次降级恢复，不是常规修复手段。

## 情况二：核心更新完成，插件没有收敛

先让 updater 重新执行 Doctor、托管插件同步和注册表刷新：

```bash
openclaw update repair
openclaw update repair --json
```

它不会安装新的核心包，也不会重启 Gateway。若结果仍指向某个插件：

```bash
openclaw plugins inspect <插件ID> --runtime --json
openclaw plugins doctor
openclaw gateway restart
```

如果 `postUpdate.plugins.status` 是 `warning`，核心更新通常已经成功；如果是 `error`，先修复启用插件的包、入口或配置，再允许 Gateway 重启。

## 情况三：包替换中途失败，updater 已不能正常运行

安装脚本可以绕开 updater，直接重装全局包：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

要恢复到已知版本：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

恢复后执行：

```bash
openclaw doctor --fix
openclaw gateway install --force
openclaw gateway restart
openclaw health
```

## 情况四：dev / git 更新失败

dev 通道要求干净的工作树，并且 fetch、preflight build、rebase 任一步失败都会停止。

如果原因是 `preflight-insufficient-space`，先释放预检暂存区（POSIX 默认在 checkout 的 `.artifacts`）和包管理器 store 所在磁盘的空间。确认 ENOSPC 后 updater 不会继续回退提交，也不会替你删除共享 store。旧版 updater 的第一次更新仍可能使用旧的系统临时目录，见 [update 预检说明](/tutorials/cli/update#dev-通道的预检查变化)。

再检查 checkout 和更新计划：

```bash
git status --short
git fetch --all --prune --tags
openclaw update --channel dev --dry-run
```

不要为通过更新而直接丢弃未提交改动。先提交、转移到其他分支，或在另一个干净 checkout 上更新。

包安装也不要使用 `openclaw update --tag main`；当前受支持的 main 路线是：

```bash
openclaw update --channel dev
```

## 情况五：受管 Gateway 重启失败

代码替换成功不代表服务已切换。若提示服务定义封存或写权限不明，不要反复 `install --force`；先检查归属，由部署维护者处理。新版 updater 会在可证明归属时用 `restart --preserve-definition` 保留定义重启；旧目标 CLI 不支持该参数时可能已换代码但激活失败，见 [update 服务保护](/tutorials/cli/update#代码更新和服务重启是两个结果)。

```bash
openclaw status --all
openclaw logs --follow
openclaw gateway status --deep
```

如果控制面返回：

| 状态 | 含义 | 处理 |
|------|------|------|
| `managed-service-handoff-started` | 外部 helper 已接管更新 | 等待它完成版本和健康检查 |
| `managed-service-handoff-unavailable` | 找不到安全的服务边界 | 在 Gateway 外部运行返回的 `handoff.command` |
| `managed-service-handoff-failed` | helper 未能启动 | 查看日志，终端运行 `openclaw update` |

`--no-restart` 只替换包或重建 checkout，不会让正在运行的 Gateway 自动切换到新代码。使用后必须在合适的维护窗口手动重启。

## 最后验收

```bash
openclaw --version
openclaw status --all
openclaw doctor
openclaw health
openclaw channels status --probe
```

回滚版本前先创建验证过的完整备份；仅恢复旧代码通常比恢复旧状态安全。完整流程见[更新与回滚](/tutorials/installation/updating)和[备份与恢复](/tutorials/installation/backups)。
