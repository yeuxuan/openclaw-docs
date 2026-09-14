---
title: "Cloud Sessions"
sidebarTitle: "Cloud Sessions"
description: "把会话执行放到已配对设备或临时云机器，同时由 Gateway 保管转录、凭据和工作区。"
---

# Cloud Sessions：会话留在 Gateway，工作放到别处跑

Cloud Session 仍是普通会话：出现在侧边栏、实时流式回复、保留同一份转录。
区别只是命令、文件编辑和工具工作在远端机器执行；Gateway 继续拥有模型凭据、
对话、工作区协调与放置记录。

| 位置 | 机器 | 适合场景 |
|------|------|----------|
| Gateway | 运行 Gateway 的主机 | 日常普通会话 |
| Paired device | 自己的 Mac、服务器或构建机 | 使用已有硬件扩容 |
| Cloud worker | Crabbox 租用的临时机器 | 长任务、突发容量、隔离执行 |

模型推理仍通过 Gateway 代理，Provider 凭据不会下发到远端机器。完成的文件改动会
协调回会话的 managed worktree。

## 让自己的机器承载会话

在远端设备运行：

```bash
openclaw connect <join-url> --service --session-host
```

设备通过出站连接接入 Gateway，默认按 CPU 核数提供 worker slots。可用
`nodeHost.workerRuns.capacity` 调整并发，也可设置
`nodeHost.workerRuns.isolation: "container"` 让每个托管会话运行在容器中。

设备短暂离线时，放置关系不会丢失；会话等待设备重连。已经开始产生副作用的工作
不会因重连而自动重放。

## 临时云 Worker

在 `cloudWorkers.profiles` 配置 Crabbox profile 后，OpenClaw 可以按需创建 AWS、
Hetzner 等后端的临时机器，执行初始化、注册临时节点，并在停止时释放。

持久数据仍在 Gateway；临时机不保存长期 Provider 凭据。详见
[Cloud Workers](/tutorials/gateway/cloud-workers)。

## 自动选择设备

Control UI 的 Place 选择器可选择 `Auto`。OpenClaw 会优先挑空闲 slots 最多的
已配对会话宿主，并在分配机器前失败时尝试其他候选。没有合适设备时会明确区分：
没有 session host、全部离线或全部满载。

## 空闲休眠与热镜像

Cloud Worker profile 可设置：

```json5
{
  suspendAfter: "2h",
  settings: {
    warmImage: true,
  },
}
```

`suspendAfter` 会在确认没有活跃 turn、排队消息和未协调结果后，先同步工作区再释放
机器。下条消息会自动创建替代机器。

有 Git 提交的项目启用 `warmImage` 后，会先准备干净的已提交 checkout 和节点 runtime，在节点注册前捕获镜像。同项目、同 profile 的后续会话不必等第一个会话停止就能复用；每个新会话仍使用新的节点注册和当前工作区文件，不恢复旧会话进程。

linked worktree 共享稳定项目身份，seed 命中时无需访问 origin 或完整传输 Git pack，私有或未发布提交也适用。提交改变可刷新项目镜像，首次派发仍包含准备/捕获成本。有效 class 已知且 `setupEnv` 为空时默认开启；转发宿主环境需显式选择开启，明确设置 `false` 始终冷启动。

分配一旦受理，原始冷启动或精确 checkpoint 选择就跨重试和 Gateway 重启保持不变，不会因镜像错误静默切换。升级提示旧镜像状态时，按 [Cloud Workers 的迁移与恢复说明](/tutorials/gateway/cloud-workers#升级旧暖镜像状态)处理。

## 哪些内容可能丢失

Gateway 中的转录、最近一次已协调的工作区、放置历史和模型凭据不会随远端机器
消失。唯一窗口是远端设备在上次工作区协调后产生、但尚未同步的文件。

离线的自有设备和失效的云 Worker 行为不同：云 Worker 可在下条消息自动替换；
自有设备会保持放置并等待重连。手动选择“Continue on Gateway”可能放弃设备上
尚未同步的文件，应先确认协调状态。

继续阅读：[Connect](/tutorials/cli/connect)、[Portals](/tutorials/gateway/portals)、
[Managed Worktrees](/tutorials/concepts/managed-worktrees)。
