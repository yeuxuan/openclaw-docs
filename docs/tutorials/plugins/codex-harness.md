---
title: "Codex Harness"
sidebarTitle: "Codex Harness"
---

# Codex Harness

Codex Harness 是 OpenClaw 接入 Codex 风格 Agent runtime 的路线之一。它关注代码任务、文件修改、工具权限、长任务和会话控制。

普通用户先使用默认配置。
需要代码仓库任务时，再看 [Agent 运行时](/tutorials/concepts/agent-runtimes) 和 [ACP Agents](/tutorials/tools/acp-agents)。

## 新手怎么理解

Codex Harness 不是单个工具，而是一整套代码任务运行方式。
它会影响文件修改、patch、测试、长任务、权限审批和会话记录。

普通用户先用默认 runtime；只有团队要定制代码智能体时，再深入读。

## 版本、停止和权限排障

当前上游快照随 `@openclaw/codex` 管理的 app-server 为 `0.151.0`，普通启动不取 PATH 上另一个 `codex`。显式自定义、远程或 macOS 桌面持有的 app-server 至少需要可解析的 `0.149.0`；更高版本仍要经过运行时兼容性检查。

- 停止活跃运行会先中断 turn，再停止该 Codex 线程拥有的后台终端。其他线程和有意后台运行的 `gateway_process` 不受影响；脱离原生终端所有权的进程不保证被清理。终端清理失败会报告错误，应检查该线程剩余终端再继续。
- `/codex permissions default`（以及 `guardian`、`guarded`、`approve`）选择 `guarded`，**不是清空会话权限设置**；状态显示 `default` 才表示未设置。
- `/codex permissions yolo` 选择 Full access，即使 Owner 也必须具有 `operator.admin`。
- 配对节点启动 exec-server 通常需要一次性的关键审批。明确选择的会话 Full access 只能在当前已准入回合和目标节点生效，且节点本地 `tools.exec` 策略和审批最低要求都允许 full/off 时才可替代该审批。本地 deny、ask、allowlist 不会被远程 Full access 抹掉。

配对节点的既有 Codex 会话可提供有界分页记录；符合条件的 stored/idle 会话，在节点允许所需 catalog/CLI-resume 命令且调用者有 `operator.admin` 时，可继续原生线程，不是在 Gateway 创建分支。配对节点归档仍不可用。
