---
title: "openclaw update"
sidebarTitle: "update"
---

# `openclaw update`

`update` 用来更新 OpenClaw。源码安装、全局包安装、稳定版、beta、dev 通道的细节不完全一样，所以升级前先看清自己是哪种安装方式。

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --dry-run
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --tag beta
openclaw update --no-restart
openclaw doctor
openclaw gateway restart
```

## 新手最稳路线

先做预演：

```bash
openclaw update --dry-run
```

确认没问题再更新：

```bash
openclaw update
```

更新完做体检：

```bash
openclaw doctor
openclaw status
```

如果只是使用了 `--no-restart`，且已确认受管服务归属和定义可维护，手动重启：

```bash
openclaw gateway restart
```

若更新提示服务定义被保护、无法检查服务或激活失败，先看本文“代码更新和服务重启是两个结果”，不要把普通重启当作绕过保护的手段。

## 常用选项

- `--dry-run`：只看看会发生什么，不真正改。
- `--no-restart`：更新后不自动重启 Gateway。
- `--channel stable|extended-stable|beta|dev`：切换并持久化更新通道。`extended-stable` 只支持包安装，不支持 git checkout。
- `--tag <dist-tag|version|spec>`：只对这一次更新指定 npm tag、版本号或 GitHub/git 规格。
  包安装不再接受 `--tag main`；要跟随 GitHub `main`，使用 `--channel dev` 进入受支持的 checkout + build 流程。
- `--yes`：跳过普通确认（如降级确认），不代表接受插件新增能力。
- `--accept-capabilities`：在审阅后，接受本次暂存插件产物声明的能力变化；不会关闭校验，也不会批准未来新增能力。`update repair` 和 `update wizard` 同样支持。
- `--json`：给脚本读取的 JSON 输出。新版本会把插件同步问题、beta 插件回退、产物校验漂移放在 `postUpdate.plugins` 里。
- `--acknowledge-clawhub-risk`：无人值守时明确接受社区 ClawHub 插件的信任提示；不要把它当成普通“跳过确认”。

::: warning `openclaw update` 没有 `--verbose`
排查更新计划使用 `--dry-run`，读取结构化结果使用 `--json`，只看通道和可用版本使用 `openclaw update status --json`。Gateway 的 `--verbose` 与日志级别是另一套开关。
:::

## 修复一次未收尾的更新

核心包已经换好、但 Doctor 或托管插件没有收敛时，运行：

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --json
```

`update repair` 会运行 `doctor --fix`、重新读取配置与安装记录、同步当前通道的托管插件并刷新插件注册表。它不会安装新的核心包，也不会重启 Gateway；修复完成后按输出决定是否手动重启。

需要新增能力授权的插件，不会因为 `--yes` 或 JSON 模式就被安装。先在交互终端运行 `openclaw update repair` 审阅变化；已审阅的自动化才使用 `openclaw update repair --accept-capabilities`。拒绝变化时可能保留旧插件并给出 warning；启用插件缺失或无效仍可能使收尾失败。

想交互式选择通道和重启策略时，可以使用：

```bash
openclaw update wizard
```

::: info Nix 模式
如果环境变量里有 `OPENCLAW_NIX_MODE=1`，真正会改文件的 `openclaw update` 会被禁用。
Nix 安装应该更新 flake/input，而不是让 OpenClaw 自己改安装目录。

仍然可以运行：

```bash
openclaw update status
openclaw update --dry-run
```
:::

## 看懂更新结果

如果你运行：

```bash
openclaw update --json
```

看到顶层 `status: "ok"`，通常说明 OpenClaw 主程序已经更新成功。

但还要继续看 `postUpdate.plugins`：

- `status: "ok"`：插件也同步好了。
- `status: "warning"`：主程序更新成功，但某个托管插件损坏、无法加载，或者 npm 插件产物校验不一致。
- `warnings`：告诉你哪个插件需要修。
- `integrityDrifts`：告诉你 npm 插件安装出来的文件和期望校验值不一样。

遇到 `warning` 不要慌，先按顺序做：

```bash
openclaw doctor --fix
openclaw plugins inspect <插件ID> --runtime --json
openclaw plugins doctor
```

如果你不知道 `<插件ID>` 是什么，先运行：

```bash
openclaw plugins list
```

简单理解：顶层 `status: "ok"` 表示主程序更新成功；`postUpdate.plugins.status: "warning"` 表示插件需要处理，但不代表主程序失败。

如果看到 `postUpdate.plugins.status: "error"`，情况更严重一些：
OpenClaw 已经发现启用中的插件不完整、`package.json` 无法读取、入口文件缺失，或者配置快照无效。
这时顶层 `status` 会变成 `"error"`，Gateway 不会带着未验证的插件集重启。

先修复插件，再重新更新：

```bash
openclaw doctor --fix
openclaw plugins inspect <插件ID> --runtime --json
openclaw update
```

beta 通道还有一种常见 warning：某个插件没有 beta 版本，OpenClaw 会回退到记录的默认/最新版。
这不会让主程序更新失败，但你应该确认这个插件版本符合预期。

## dev 通道的预检查变化

如果你使用 `dev` 通道，更新前会在临时 worktree 安装依赖、构建并校验配置。POSIX 默认把暂存目录放在 checkout 已忽略的 `.artifacts` 区域，与源码使用同一文件系统，避免挤满系统临时盘；Windows 仍使用较短的系统盘路径。
如果最新提交构建失败，它会往前找最多 10 个提交，选择最新一个能构建成功的版本。

默认不会跑 lint，因为很多用户的小机器比 CI 慢。确实需要 lint 时，再这样开：

```bash
OPENCLAW_UPDATE_PREFLIGHT_LINT=1 openclaw update --channel dev
```

普通用户用 `stable` 通道时，不需要管这一段。

确认磁盘已满（ENOSPC）时会立即以 `preflight-insufficient-space` 停止，不会继续尝试更旧提交。检查暂存区与包管理器 store 所在磁盘，不要为了重试删除共享 store。清理暂存区失败也会保留在更新结果中。

dev 通道如果需要 pnpm，新版 updater 会优先走 Corepack；还不行时，再通过 npm 临时安装**目标 checkout 固定的精确 pnpm 版本**。
如果 pnpm 仍然启动失败，更新会提前停止，而不是在 pnpm 工作区里误跑 `npm run build`。

正在运行的旧 updater 仍使用旧暂存路径和旧引导代码；把目标源码更新到新提交，并不会修复第一次跳转。跨 pnpm 版本更新前，应先确认现有入口能运行目标和回滚版本所需的工具链。

## 代码更新和服务重启是两个结果

更新代码不等于获准改写原生服务定义。Linux 服务定义被封存或写权限无法验证时，新版 updater 跳过服务元数据刷新；能确认属于当前安装且可检查的服务，使用 `gateway restart --preserve-definition` 重启并验证健康状态，不做自动修复。

目标 CLI 太旧、不认识该选项时，代码可能已更新，但激活会以非零状态退出，服务也可能仍停止。先运行 `openclaw gateway status --deep`，由部署维护者通过原生服务管理器重启或修复定义；不要去掉保护选项盲目重试。服务检查本身不可用时，updater 会警告并保持服务控制和文件不变。`--no-restart` 仍然跳过重启。

交互更新会显示步骤和耗时，失败步骤保留标准输出与错误输出的末尾诊断；超时会单独标记。`--json` 不输出进度动画，stdout 保持机器可读。

## 控制面板里点“更新并重启”时发生了什么

控制面板调用的是 Gateway 的 `update.run`。
对源码 checkout，它跑的就是源码更新流程。
对 npm/pnpm 这类全局安装，新版不会让正在运行的 Gateway 直接拆自己的安装目录，
而是做一个 managed-service handoff：

```text
Gateway 启动外部 helper → Gateway 退出 → helper 更新包 → helper 重启 Gateway → helper 验证新版本和健康状态
```

看结果时记住这三个值：

| 值 | 意思 |
|----|------|
| `managed-service-handoff-started` | 已经交给 helper，等它更新和重启 |
| `managed-service-handoff-unavailable` | 没找到可托管的服务边界，按返回里的命令手动跑 |
| `managed-service-handoff-failed` | helper 没启动成功，看日志后手动运行 `openclaw update` |

## 升级后先查什么

1. `openclaw status` 看版本和 Gateway 是否在线。
2. `openclaw doctor` 看配置是否需要迁移。
3. `openclaw plugins doctor` 看插件是否还兼容。
4. `openclaw channels status --probe` 看聊天通道是否真的能连。

继续阅读：[更新 OpenClaw](/tutorials/installation/updating)。
