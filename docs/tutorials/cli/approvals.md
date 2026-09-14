---
title: "openclaw approvals"
sidebarTitle: "approvals"
description: "查看、替换和处理本机、Gateway 或节点上的执行审批，并管理自动化 standing grants。"
---

# `openclaw approvals`

`approvals` 管理本机、Gateway 或节点宿主的执行审批。省略目标参数时操作本机
共享 SQLite 中的审批记录；`--gateway` 指向 Gateway，`--node <id>` 指向节点。

```bash
openclaw approvals get
openclaw approvals get --gateway
openclaw approvals get --node <id-or-name>
```

旧名 `openclaw exec-approvals` 仍是别名。

## 查看和处理待审批请求

```bash
openclaw approvals pending
openclaw approvals pending --json
openclaw approvals resolve <id> allow-once
openclaw approvals resolve <id> allow-always
openclaw approvals resolve <id> deny --reason "Unexpected command"
```

对普通 Exec 请求，`allow-always` 的准确含义是“总是在这里允许”：它同时绑定
精确参数和当前工作目录。同一命令换到另一个目录仍会重新询问。

自动化任务中的 `allow-always` 会创建 scoped standing grant。默认一直有效，直到撤销；
也可以为本次授权指定期限：

```bash
openclaw approvals resolve <id> allow-always --expires-in-days 30
openclaw approvals grants list
openclaw approvals grants revoke <grant-id>
```

编辑或删除自动化会使它的 standing grant 失效。

## 从文件替换审批策略

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
openclaw approvals set --node <id-or-name> --file ./exec-approvals.json
```

`set` 接受 JSON5，并替换目标宿主的完整策略；写入前先用 `get` 留存当前配置。

## 本机快捷策略

`openclaw exec-policy` 只同步本机的 `tools.exec.*` 请求策略和本机审批记录：

```bash
openclaw exec-policy show
openclaw exec-policy preset cautious
openclaw exec-policy preset yolo
openclaw exec-policy preset deny-all
```

它不会推送 Gateway 或节点策略。远端宿主仍用 `approvals set --gateway` 或
`approvals set --node`。

审批记录当前位于：

```text
$OPENCLAW_STATE_DIR/state/openclaw.sqlite#exec_approvals_config
```

升级后若旧的“总是允许”规则没有绑定工作目录，运行 `openclaw doctor --fix`；
Doctor 只移除失效的自动生成规则，不删除手写 allowlist。

继续阅读：[执行审批机制](/tutorials/tools/exec-approvals)。
