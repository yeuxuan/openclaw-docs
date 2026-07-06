---
title: "Attach CLI"
sidebarTitle: "attach"
description: "OpenClaw CLI：使用 openclaw attach 为 Claude Code 临时注入绑定到指定 Gateway 会话的 MCP 配置。"
---

# `openclaw attach`

`attach` 的用途不是普通聊天，而是把 Claude Code 临时“挂”到某个 OpenClaw Gateway 会话上。

你可以先把它理解成：

- OpenClaw 临时发一张短时通行证
- Claude Code 只带这张通行证启动
- 它只能访问这一张会话允许的 MCP 能力
- 进程结束后，这张通行证会自动失效

这比把一堆常驻 MCP 配置长期写死在本机里更安全。

---

## 什么时候用

适合这些场景：

- 你想让 Claude Code 直接使用 OpenClaw Gateway 提供的 MCP 工具
- 你需要把外部 harness 临时接到某个会话
- 你不想让 Claude Code 顺手加载本机其他“环境里原本就有”的 MCP 服务

如果你只是本地正常运行 OpenClaw，本页不是必读。

---

## 最常见的 3 个命令

```bash
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

可以先这样记：

- 直接 `openclaw attach`：挂到默认主会话
- `--session`：明确指定挂到哪段会话
- `--ttl`：这张临时授权活多久
- `--print-config`：只打印临时配置，不直接启动 Claude Code

---

## 它具体做了什么

`openclaw attach` 启动时会做两件关键事：

1. 向 Gateway 申请一份短时 MCP grant
2. 用严格 MCP 配置启动 Claude Code

官方启动方式会带上类似这样的参数：

```text
--strict-mcp-config --mcp-config <path>
```

这很重要，因为它的目的就是：

- 只让这次启动使用 OpenClaw 给出的那份临时配置
- 不把本机其他“顺手发现的 MCP server”一并带进去

换句话说，`attach` 不是“再多连一个 MCP”，而是“受控地只连这一个”。

---

## 常用参数

| 参数 | 用途 |
|------|------|
| `--session <key>` | 把临时授权绑到某个 Gateway 会话 |
| `--ttl <ms>` | 请求授权存活时长，单位毫秒 |
| `--bin <path>` | 指定 Claude Code 可执行文件路径 |
| `--print-config` | 只生成并打印临时 `.mcp.json`，不直接启动 Claude Code |

如果你不确定会话 key，先从状态页或已有会话列表里确认，再传给 `--session`。

---

## 最容易忽略的安全点

### 1. Token 走环境变量，不走命令行参数

这意味着 bearer token 不会直接裸露在 `ps` 这类命令里。

对临时授权来说，这比把 token 直接拼进 argv 更稳妥。

### 2. 正常启动结束后会自动撤销 grant

如果不是 `--print-config` 模式，Claude Code 进程退出后，OpenClaw 会回收这次临时授权。

### 3. `--print-config` 更适合调试

因为它不会自动启动 Claude Code，也不会立刻回收 grant。

所以这个模式更适合：

- 看生成出来的 MCP 配置
- 调试外部启动流程
- 集成到你自己的包装脚本里

---

## 一个实用示例

如果你希望某次 Claude Code 只接入某个指定会话：

```bash
openclaw attach --session agent:main:telegram:123 --ttl 300000
```

这更适合：

- 临时排查某个会话
- 限定 MCP 工具访问边界
- 给外部协作工具一个最小权限入口

---

## 排障思路

### Claude Code 没启动

先确认可执行文件路径对不对：

```bash
openclaw attach --bin /absolute/path/to/claude
```

### 看起来没接到 OpenClaw 的 MCP

优先用：

```bash
openclaw attach --print-config
```

先检查打印出的临时配置，再看你后续的启动命令是不是确实用了那份配置。

### 会话不对

大多数这类问题不是 `attach` 坏了，而是 `--session` 绑错了对象。

如果你在多个智能体、多聊天入口、多 profile 间切换，先确认 session key 再启动。

---

## 什么时候不用它

下面这些场景通常不需要 `attach`：

- 只是普通使用 OpenClaw Dashboard
- 只是想在 OpenClaw 自己的聊天通道里继续对话
- 没有要把 Claude Code / 外部 harness 接进 Gateway

它更偏“外部工具桥接”，不是新手日常必备命令。

---

## 相关页面

- [Gateway CLI](/tutorials/cli/gateway)
- [MCP CLI](/tutorials/cli/mcp)
- [ACP CLI](/tutorials/cli/acp)
- [插件专题](/tutorials/plugins/)
