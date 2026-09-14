---
title: "Permission Modes 权限模式"
sidebarTitle: "权限模式"
description: "OpenClaw 工具系统：配置 tools.exec.mode，控制 host exec、自动审批、人工审批和 ACPX Harness 权限。"
---

# Permission Modes 权限模式

权限模式决定 Agent 在运行主机命令、写文件，或向后端 Harness 请求更高权限时，需要经过什么审批。

建议默认从 `tools.exec.mode: "auto"` 开始：OpenClaw 会先放行确定安全的 allowlist 命令；没命中的命令再走自动审查，必要时回退到人工审批。

::: info 注意
`tools.exec.mode` 和 `tools.exec.host=auto` 不是一回事。`tools.exec.host` 决定命令在哪里跑；`tools.exec.mode` 决定 host exec 怎么审批。

有活跃沙箱时，`host=auto` 会保持在沙箱内，并拒绝单次 `host=gateway` / `host=node` 覆盖；要固定到某个 host，应显式配置 `tools.exec.host`。
:::

---

## 推荐默认值

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

查看最终生效策略：

```bash
openclaw exec-policy show
```

---

## Host Exec 模式

| 模式 | 行为 | 适合场景 |
|------|------|----------|
| `deny` | 禁止 host exec | 完全不允许主机命令 |
| `allowlist` | 只运行 allowlist 命令 | 命令集合明确且固定 |
| `ask` | allowlist 直接运行，其他询问人工 | 每个新命令都要人看 |
| `auto` | allowlist 直接运行，其他先自动审查 | 编码会话需要实用但受控的访问 |
| `full` | 不提示，直接运行 host exec | 完全可信主机和会话 |

更完整的 allowlist schema、本地审批文件和安全命令策略见 [执行审批](/tutorials/tools/exec-approvals)。

---

## Codex Guardian 映射

在原生 Codex app-server 会话里，`tools.exec.mode: "auto"` 通常会映射成 Codex Guardian 自动审查审批：

| Codex 字段 | 常见值 |
|------------|--------|
| `approvalPolicy` | `on-request` |
| `approvalsReviewer` | `auto_review` |
| `sandbox` | `workspace-write` |

`auto` 模式不会沿用旧的不安全覆盖项，例如 `approvalPolicy: "never"` 或 `sandbox: "danger-full-access"`。只有你明确想跳过审批时，才使用 `tools.exec.mode: "full"`。

---

## ACPX Harness 权限

ACPX 会话没有交互式 TTY 权限弹窗，所以它有单独的 Harness 配置。受支持的表单或 URL 请求仍可能在通道投递的 turn 中作为 Gateway 问题交给操作者，但那不等同于执行权限审批。

| 设置 | 常见值 | 含义 |
|------|--------|------|
| `permissionMode` | `approve-reads` | 只自动批准读取 |
| `permissionMode` | `approve-all` | 自动批准写入和 shell 命令 |
| `permissionMode` | `deny-all` | 拒绝所有权限请求 |
| `nonInteractivePermissions` | `fail` | 遇到需要提示时失败 |
| `nonInteractivePermissions` | `deny` | 拒绝提示并尽量继续 |

示例：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

ACPX 权限不会放宽 host exec 审批；host exec 审批也不会放宽 ACPX Harness 提示。

---

## 排查

如果改完模式后命令仍然提示或失败，检查两层：

```bash
openclaw approvals get
openclaw exec-policy show
```

通常取 OpenClaw 配置和本机 approvals 文件中更严格的结果。但经授权设置的会话 `permissionMode: "full"` 在有效 security 仍为 full 时，会绕过宿主审批下限；单轮 security 收紧可恢复下限，只收紧 ask 不会。若必须硬性禁止命令，应通过工具策略 deny exec。会话模式与本页 host exec 模式是不同配置层，详见[会话权限模式](/tutorials/gateway/permission-modes)。
