---
title: "openclaw triage"
sidebarTitle: "triage"
description: "运行只读健康检查，生成脱敏诊断包和可直接交给编码 Agent 的排障提示。"
---

# `openclaw triage`

当 OpenClaw 出问题但你不知道从哪里查时，先运行：

```bash
openclaw triage
```

它会运行只读 Doctor 检查，收集已有的脱敏诊断信息，并生成一份有大小上限的
Markdown 排障提示。它不会修改配置、重启服务或自动应用修复。

## 会收集什么

生成的提示通常包含：

- OpenClaw、操作系统和 Node.js 版本
- 按优先级整理的 Doctor findings 与修复建议
- 脱敏诊断包路径
- Gateway 无法连接时的具体原因

诊断包包含脱敏配置、Gateway 状态和健康快照、运维日志摘要及可用稳定性诊断。
它不包含 Secret、Token、原始聊天内容或原始日志。

输出写入状态目录下权限仅限当前用户的 `logs/support/`。提示中提供给 Agent 的
路径会折叠为 `~` 或 `$OPENCLAW_STATE_DIR`，终端打印的交接命令仍保留 shell
实际需要的绝对路径。

## 交给编码 Agent

交互终端中，Triage 会检测本机可用的交接路线：

1. 已配置模型的 OpenClaw 内置 Agent
2. `PATH` 中的 Claude Code
3. `PATH` 中的 Codex CLI
4. 只打印命令，由你自己决定何时运行

手动交接示例：

```bash
claude "$(cat '<prompt-path>')"
codex exec - < '<prompt-path>'
openclaw triage --run
```

选择外部 Agent 会在当前环境中启动它，因此自定义的
`OPENCLAW_STATE_DIR` 会继续生效。选择内置 Agent 前，Triage 会先做一次真实
模型检查，避免把故障诊断交给一个尚未配置的模型。

## 常用参数

| 参数 | 作用 |
|------|------|
| `--json` | 返回路径、finding 数量、检测到的 Agent 和交接命令 |
| `--no-export` | 不生成诊断压缩包，只生成排障提示 |
| `--run` | 验证模型后运行一次内置 Agent 排障 |

`--json` 不能和 `--run` 同时使用。非交互环境与 JSON 模式都不会自动启动
任何 Agent。

## 与 Doctor 的区别

- `openclaw doctor`：让人阅读检查结果，也可显式使用 `--fix` 修复。
- `openclaw triage`：始终保持只读，把检查结果整理成 Agent 可直接接手的上下文。

继续阅读：[Doctor](/tutorials/cli/doctor)、[故障排查](/tutorials/help/troubleshooting)。
