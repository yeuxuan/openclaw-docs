---
title: "Buzz"
sidebarTitle: "Buzz"
description: "把 OpenClaw Agent 接入托管或自托管 Buzz 团队房间。"
---

# Buzz

Buzz 是官方通道插件，可让 Agent 在 Buzz 团队房间中收发 Markdown、线程消息和结构化 Diff。当前主要支持群组房间；私信、媒体文件、原生 Reaction 和自动管理员审批尚未覆盖。

## 安装和向导

```bash
openclaw plugins install @openclaw/buzz
openclaw gateway restart
openclaw channels add --channel buzz
```

准备 Buzz Workspace 的 `wss://` Relay 地址，并让房间 Owner/Admin 把向导显示的 Bot 公钥以 `Bot` 角色加入目标房间：

```bash
buzz channels add-member \
  --channel <ROOM_UUID> \
  --pubkey <BOT_PUBLIC_KEY> \
  --role bot
```

不要把人类 Owner 的私钥交给 OpenClaw。私钥只属于专用 Bot 身份，并留在 Gateway。

发送测试：

```bash
openclaw message send \
  --channel buzz \
  --target buzz:<ROOM_UUID> \
  --message "Hello from OpenClaw"
```

一个 Bot 可服务多个房间，并通过标准 `bindings` 把不同房间路由到不同 Agent。自动化中优先使用稳定的 `buzz:<ROOM_UUID>`，不要依赖可能重复的房间名。

## 多账号与密钥

同一 Gateway 可以运行多个独立 Buzz 身份。再次运行 `openclaw channels add --channel buzz`，选择已有账号或新增命名账号；新增账号不会替换原来的根身份。

命名账号放在 `channels.buzz.accounts.<id>`。策略、投递设置可继承根配置，但 `name`、`relayUrl`、`privateKey`、`authTag`、`groups`、`defaultTo` 不继承，必须为各账号单独准备。显式 `accounts.default` 同样拥有独立身份，不能借用根凭据或 `BUZZ_*` 环境变量。

通过 `defaultAccount` 选择省略 `--account` 时使用的账号；指定发送时加 `--account <id>`，路由则在 `bindings[].match` 加 `accountId`。只停一个账号可设 `channels.buzz.accounts.<id>.enabled: false`；当前不要用 `channels remove` 来停用或删除 Buzz 账号。

向导可解析账号已有的 `privateKey` / `authTag` SecretRef，且不会把引用替换成明文。密钥无法解析时，它会报错并停止保存账号改动；先修复密钥来源，再运行向导。至少选择一个已经授权的房间才能完成配置。

## 回复放在线程还是房间顶层

默认 `channels.buzz.replyToMode: "all"` 让自动回复在线程内。设为 `"off"` 后，自动回复及输入中提示转到房间顶层；入站线程上下文、会话身份不变。显式指定 thread/reply 目标的工具或 CLI 发送仍遵循该目标。

上游来源：[`docs/channels/buzz.md`](https://github.com/openclaw/openclaw/blob/main/docs/channels/buzz.md)。
