---
title: "Cloud Workers"
sidebarTitle: "Cloud Workers"
description: "通过 Crabbox 把受管工作树会话派发到临时云机器，并在 Gateway 保留模型认证、转录和持久状态。"
---

# Cloud Workers：把重活放到临时云机器

Cloud Worker 会为会话创建一台可丢弃的云机器。命令、文件与工具工作在远端执行，
但 Gateway 继续拥有转录、模型认证、最近一次已协调的工作区和放置记录。

该功能默认关闭。没有配置 `cloudWorkers.profiles` 时，客户端不会显示 Cloud
目标，也不会意外创建付费资源。

## 运行边界

同一个 Crabbox profile 可承载两种模式：

- OpenClaw `worker-turn`：受限的 `openclaw worker` 在云机运行，模型推理仍由
  Gateway 代理。
- Codex `remote-exec`：Codex app-server 和模型认证留在 Gateway，云节点只运行
  显式授权的 exec-server。

云节点通过出站 WebSocket 连接 Gateway，不需要把工作端口公开到公网。Worker
失效或停止后，云租约会释放，环境所属的节点配对也会清理。

## 前置条件

- Gateway 用户的 `PATH` 中安装 Crabbox 0.41.1+；长期保持已放置 Worker 还需要
  包含 `crabbox heartbeat` 的较新版本。
- 租用机器上有 Node.js；通常在 profile 的 `setup` 中安装。
- 会话必须使用注册表管理的 Git worktree，不能把任意普通目录直接派发到云端。
- AWS Worker 不允许绑定 EC2 instance profile；Provider 会校验并拒绝带角色的
  租约，避免云机获得意外的长期云权限。

后端支持情况以安装的 Crabbox 和其[提供商文档](https://crabbox.sh/providers/index.html)为准。当前允许不配置 `settings.class`，但能保存 profile 不等于后端能承载会话：必须支持固定 ID 的 `warmup --lease-id`、`run --script-stdin`、租约检查和按规范租约 ID 清理。不要删掉 `--lease-id` 绕过能力报错，否则中断重试可能重复创建付费资源。

## 配置示例

```json5
{
  cloudWorkers: {
    profiles: {
      aws: {
        provider: "crabbox",
        install: "bundle",
        suspendAfter: "45m",
        settings: {
          provider: "aws",
          class: "standard",
          ttl: "8h",
          idleTimeout: "45m",
          warmImage: true,
          setup: "test -x /usr/bin/node || (curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash - && sudo apt-get install -y nodejs)",
        },
      },
    },
  },
}
```

`settings.setup` 会在每次 provision 和中断重试时执行，必须幂等，不能写入长期
凭据。`class` 可省略，由 Crabbox 选择资源；在 **Settings → Advanced** 编辑无 class 的 profile。`null`、空字符串和非字符串不是“省略”。图形 class 编辑器仍要求选择值，切换后端时不会自动改 class，保存前要确认新后端支持它。

`suspendAfter` 会在安全同步工作区后释放空闲机器；下条消息自动创建替代机器。
当前在有效 class 已知且 `setupEnv` 为空或未配置时，`warmImage` 默认开启；无有效 class 或转发了非空 `setupEnv` 时默认冷启动。显式 `true` 仍要求 class 已知，显式 `false` 始终禁用镜像。

### 暖镜像在什么时候捕获

对于已有 Git 提交的项目，首次派发先执行 profile setup、准备所受理 commit 的干净 checkout 和已验证的节点 runtime，再在节点注册前捕获所需镜像。之后才注入节点注册凭据、会话改动和符合条件的未跟踪文件。同项目、同 profile 的后续会话可以立即复用镜像，不必等首个 Worker 停止。没有准备好 Git 项目的路径，仍在符合条件的已注册 Worker 退出清理时捕获。

同仓库的 linked worktree 共享稳定项目身份，独立 clone 则不共享。镜像里的 pristine seed 记录精确 commit；命中时跳过 origin 访问和完整 Git pack 传输，包括私有或未发布提交。commit 改变会准备新 seed，并可刷新同一项目镜像。首次派发包含准备和捕获开销，不能承诺与后续派发一样快。

镜像会产生快照存储费用。清理会去掉逐租约身份、设备 Token 和会话状态，但 npm 缓存、按内容寻址的节点 runtime / worker bundle 安装、干净 Git seed 和 `setup` 在其他目录写入的内容会保留。它不是恢复某个会话进程的快照；每次暖启动都是新租约、新节点注册和当前会话文件覆盖。仅在相互信任的工作负载间复用；不接受仓库内容保留时明确设置 `warmImage: false`。

### 重试不能改变已受理的镜像选择

首次分配命令之前，Gateway 持久记录有效 class，以及冷启动或精确 checkpoint 的选择。重试和 Gateway 重启沿用该选择；checkpoint fork 失败会报错，不会改用新镜像或冷启动。应修复提供商错误，或先停止该分配，再创建替代分配。

项目镜像在请求 commit 改变或满 24 小时时于准备阶段刷新；非项目镜像在满 24 小时后的合适 Worker 停止时刷新。旧镜像在替代品记录成功且不再被现有分配引用前保留；删除义务会跨重启保留并重试，容量满时提示清理，不会驱逐尚有分配或未完成清理的记录来腾位置。

项目捕获结果不确定时会阻止在该源机器上注册节点，避免新凭据进入仍可能进行的捕获。租约清理仍可执行，已有可用镜像仍可服务新分配。

Worker 每次启动的完整节点调用事件和受管输入行分别不得超过 25 MiB。Gateway 可裁去较旧完整回合，但不拆丢最新 provider replay checkpoint；最小重放单元也放不下时会在移交前失败并提示重试，而不是悄悄丢失关键上下文。

## 上线前验证

```bash
openclaw config validate --json
openclaw plugins inspect crabbox --runtime --json
openclaw gateway call environments.list --params '{}'
crabbox list --provider aws --json
crabbox providers --json
crabbox providers describe aws --json
crabbox doctor --provider aws --json
```

修改 Profile 需要 Gateway 重启；默认 hybrid reload 会自动处理，否则运行
`openclaw gateway restart`。`environments.list` 应出现配置的 profile。

`crabbox list` 是只读检查；`crabbox warmup` 会创建租约，`crabbox stop` /
`release` 会销毁租约，不应当作普通诊断命令运行。

只读 readiness 不能证明实际分配、setup、节点注册和清理均成功。镜像捕获卡住时，可先运行 `openclaw crabbox warm-images --json` 看项目键、分配选择/阶段与恢复 selector；超过 20 分钟只是告警，不代表可以接管。恢复前必须停止原 Gateway、捕获进程和对应 Worker，并在 Crabbox 核对快照和未跟踪资源；Doctor 不会自动清掉这些捕获义务。

## 升级旧暖镜像状态

暖镜像状态使用原 `warm-images` 插件命名空间中的 v2 格式，不改变 SQLite schema 版本。先停止所属 Gateway 和原捕获进程，再运行 `openclaw doctor --fix`。Doctor 保留旧镜像元数据、捕获 selector 和待删除义务，但不会推测旧分配曾冷启动还是使用了哪个 checkpoint；不支持的记录保持原样并告警，runtime 不会静默转换。

旧 `warm-leases` 只记录已注册 class，无法证明最初分配选择，会阻止新的暖镜像分配。按 Doctor 报告逐租约核对并完成提供商清理，停止 Worker 和所属进程后，才使用其返回的精确 selector：

```bash
openclaw crabbox warm-images --recover <legacy-allocation-selector> --acknowledge-provider-cleanup
openclaw doctor --fix
```

该恢复只删除仍与 selector 匹配的旧记录，不会代你停止机器或证明提供商资源已经消失。清理结果不确定就保留记录；未解决分配、捕获或删除义务时，不要混用新旧写入者或降级。

## 派发会话

Control UI 新建会话时，在 Place 选择器中选 `Cloud · profile`。它只有在以下
条件都满足时可用：

1. 当前连接具备 `operator.admin`。
2. Gateway 至少公布一个可用 Profile。
3. 选择的目录是可创建 managed worktree 的 Git checkout。
4. 当前 Agent runtime 声明支持对应云放置模式。

也可以先创建 worktree 会话，再调用：

```bash
openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

不要期待失败时回退到 Gateway 本机执行：云端 Provider、沙箱、节点命令或审批
不满足时会失败关闭，避免本应隔离的工作偷偷在主机运行。

继续阅读：[Cloud Sessions](/tutorials/gateway/cloud-sessions)、
[Portals](/tutorials/gateway/portals)、[Managed Worktrees](/tutorials/concepts/managed-worktrees)。
