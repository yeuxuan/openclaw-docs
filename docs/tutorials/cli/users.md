---
title: "openclaw users"
sidebarTitle: "users"
description: "列出 Gateway 持久用户 Profile、关联新邮箱，并在确认身份后合并重复 Profile。"
---

# `openclaw users`

`openclaw users` 通过 Gateway RPC 管理“人”的持久 Profile。它和 CLI 的 `--profile` 不是一回事：后者选择隔离的 OpenClaw 配置/状态目录，前者用于识别团队成员。

## 列出 Profile

```bash
openclaw users list
openclaw users list --json
```

需要 `operator.read`。输出包含持久 Profile ID、显示名和邮箱别名；关联或合并时应使用 ID，不要按显示名猜人。

远程 Gateway 可在子命令后传入：

```bash
openclaw users list --url wss://team.example.com --token "$TOKEN" --timeout 10000 --json
```

## 把新邮箱关联到已有的人

```bash
openclaw users link-email new-address@example.com --to <profile-id>
```

需要 `operator.admin`。如果旧 Profile 移走最后一个邮箱别名，它会合并到目标；仍有其他别名时则继续作为独立 Profile 保留。

迁移 Cloudflare Access / OIDC 邮箱时，还要同步修改 `gateway.auth.identityScopes` 或代理 allowlist。关联邮箱会保留 Profile 与角色，但不会自动复制旧邮箱获得的 scope。

## 合并重复 Profile

```bash
openclaw users merge <source-profile-id> --into <target-profile-id>
openclaw users merge <source-profile-id> --into <target-profile-id> --json
```

目标必须是现存、未被合并且不同于来源的 Profile。共享 Owner 不能作为来源或目标。对已经完成的同向合并重复执行是安全的；来源已经指向另一个幸存者时会失败并提示真实目标。

合并后：

- 目标保留自己的角色、显示名、主身份以及冲突的偏好/账号选择。
- 登录、通道关联和个人账号按既有合并规则跟随幸存者。
- 历史记录保持原归属；来源 Profile 过去捕获的权限不会转移。
- JSON 的 `movedAliasKinds` 会说明实际移动了 `email`、`provider` 或 `channel` 哪些别名类型。

只有确认两个 Profile 确实属于同一个人时才合并；显示名相同不是证据。团队部署流程见[团队 Gateway 生产部署](/tutorials/gateway/team-server)。

上游来源：[`docs/cli/users.md`](https://github.com/openclaw/openclaw/blob/fb4653dbea6650c0fae516151fa87fda5ee4aaf9/docs/cli/users.md)。
