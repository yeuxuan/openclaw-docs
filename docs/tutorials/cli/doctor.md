---
title: "openclaw doctor"
sidebarTitle: "doctor"
---

# `openclaw doctor`

`doctor` 是 OpenClaw 的体检命令。你可以把它当成“先别猜，先检查”的按钮。

```bash
openclaw doctor
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --generate-gateway-token
```

安装后、升级后、出问题时，都先跑它。

## 它会检查什么

- 配置文件是不是合法。
- Gateway 服务是否安装、启动、可访问。
- 通道 token、allowlist、配对、账号状态是否可疑。
- 插件是否缺失、无效或配置坏了。
- 沙箱、记忆、模型、SecretRef 是否准备好。

## 新手最稳流程

```bash
openclaw doctor
```

先读输出。如果它建议修复，再运行：

```bash
openclaw doctor --fix
```

如果是在服务器或无人值守环境里，可以用：

```bash
openclaw doctor --fix --non-interactive
```

只想做机器可读、只读检查时使用：

```bash
openclaw doctor --json
openclaw doctor --lint --json
```

这两种只读姿态不能和 `--repair`、`--fix`、`--force`、`--yes` 或 `--generate-gateway-token` 混用；显式 `--lint` 也不能夹带 session SQLite 修复参数。

## 重要提醒

`doctor --fix` 会修改配置前备份。它适合修复常见问题，但不应该代替你理解高风险改动。看到 Gateway token、公网暴露、插件权限这类提示时，要认真看。

如果 `openclaw.json` 无法解析且找不到 last-known-good 配置，`doctor --fix` 会保持原文件不变并退出，不再自动生成 `openclaw.json.clobbered.<timestamp>`。先运行 `openclaw config validate` 查看精确位置，再手工修复或重新生成配置。

升级后的旧“总是允许”Exec 规则若没有绑定工作目录，会被标记为失效。
`openclaw doctor --fix` 只清除这类自动生成规则，保留手写 allowlist；随后在正确
目录重新运行工作流并选择“总是允许这里”。正常 `openclaw update` 的收尾也会
自动执行这项安全迁移。

如果只是想生成可交给编码 Agent 的脱敏排障上下文，不要使用 `--fix`，改用
[`openclaw triage`](/tutorials/cli/triage)。

## 旧版会话迁移

当前会话行和转录默认保存在
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。Gateway 和本地 CLI
启动时不会再自动导入、恢复或改写旧版 `sessions.json` / JSONL；若启动发现旧会话库，
会拒绝就绪并给出针对当前 profile 的 Doctor 命令，避免以“空历史”误启动。

升级旧安装时，先停 Gateway 并备份状态，再执行：

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --fix
openclaw gateway start
```

需要更细的只读检查或定向导入时，可使用：

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents --json
```

`inspect` 和 SQLite 维护不要求旧文件仍存在；`dry-run`、`import`、`validate`
只选择仍存在的旧版来源。不要在 Gateway 运行时执行 `import`、`compact`、
`recover` 或 `restore`。

显式修复（`--fix`、`--repair`、`--yes`）结束前，Doctor 会检查已有配置库、默认布局库和已注册库的运行时 schema 是否就绪，包括注册前就迁移失败的库。必要迁移仍被阻塞时会非零退出；停下 Gateway 和其他 OpenClaw 进程后再重试，不能只看到部分成功日志就启动服务。检查不会创建缺失数据库。

数据库 schema 升级会报告路径及前后版本；只有真实改写转录或 trajectory 行时才报告媒体迁移及计数。无变化的重跑不应重复打印成功迁移。

设备配对、Active Memory 和 Microsoft Teams 旧状态导入若提示容量或保留校验失败，不要删除旧 JSON 来消除警告。Doctor 会保留来源供检查和重试；Teams 的会话、poll 元数据/投票及 SSO token 以已有 SQLite 值优先，校验失败也不代表导入期间被淘汰的行会自动回滚。

继续阅读：[Gateway 故障排查](/tutorials/gateway/troubleshooting)。
