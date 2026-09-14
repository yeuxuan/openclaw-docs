---
title: "安装后配置与常见问题"
sidebarTitle: "安装后配置"
description: "OpenClaw 快速入门：安装后配置与常见问题。完成首次安装后，这里汇总了你最可能需要做的事情：连接聊天软件、验证运行状态、日常管理命令，以及常见问题解决方法。"
---

# 安装后配置与常见问题

完成首次安装后，这里汇总了你最可能需要做的事情：打开控制 UI、连接聊天软件、验证运行状态、日常管理命令，以及常见问题解决方法。

---

## 第一件事：先打开控制 UI

安装完先不要急着接 Telegram 或 WhatsApp。先打开浏览器控制 UI，确认主链路能工作：

```bash
openclaw dashboard
```

如果能在浏览器里发消息并收到回复，说明 Gateway、Agent 和模型基本没问题。

---

## 第二件事：连接聊天软件

安装完 OpenClaw 只是第一步。要让 AI 能接收你的消息，还需要把你的聊天软件（通道）连接上来。

推荐先接 Telegram，最简单：

```bash
openclaw config set channels.telegram.enabled true
openclaw config set channels.telegram.botToken "把你的Token粘贴到这里"
openclaw config set channels.telegram.dmPolicy pairing
```

Telegram 不走扫码登录。把 BotFather 给你的 Token 写进配置后，重启网关：

```bash
openclaw gateway restart
```

→ 详细步骤请看 [接入 Telegram 教程](../channels/telegram)

支持的其他聊天软件：

| 软件 | 新手怎么开始 |
|------|--------------|
| Discord | 需要创建 Discord Bot，再把 Bot Token 写入配置。看[接入 Discord](../channels/discord) |
| WhatsApp | 用 `openclaw channels login --channel whatsapp` 扫码登录 |
| 飞书 | 需要飞书应用凭证。看[飞书接入教程](../channels/feishu) |

---

## 验证 OpenClaw 是否正常运行

安装完成后，可以用下面的命令检查各个部件是否正常：

```bash
openclaw doctor
```

这条命令会自动诊断所有问题，并给出修复建议。遇到问题时，首先跑这条命令。

更细致的状态检查：

```bash
openclaw gateway status    # 检查网关是否在运行
openclaw channels status --probe  # 检查所有通道的连接状态
openclaw dashboard         # 打开控制 UI
```

---

## 日常管理命令速查

### 源码开发者的工具链

源码 checkout 使用 `package.json` 固定的 pnpm，不要改用 npm/Bun 安装 workspace 依赖。仓库依赖默认有七天发布冷却期，可信的 `@openai/codex` / `@openai/codex-*` 除外；读取项目 `.npmrc` 的 npm 工具需要 npm 11.19+ 才能执行这些安装/打包规则。Node 22 已不受运行时支持，其自带 npm 10 也会忽略这些规则。全局发布包安装不继承仓库 `.npmrc`。

pnpm 同时管理根目录和插件依赖。旧 checkout 若曾清理插件本地依赖，更新后运行 `pnpm install --frozen-lockfile` 恢复。开发 worker 的 PATH 包含 `node_modules/.bin` 时，`codex` 可能变成 workspace 固定版本；用预期可执行文件的绝对路径验证版本并启动 worker，不要修改 OpenClaw 托管 app-server 的版本固定值来修复 shell 选择问题。

### 网关管理

```bash
openclaw onboard --install-daemon  # 首次安装后台服务
openclaw gateway stop      # 停止网关
openclaw gateway restart   # 重启网关
openclaw gateway status    # 查看状态
```

### 查看实时日志

```bash
openclaw logs --follow
```

遇到问题时运行这条命令，可以看到实时的日志输出，帮助排查原因。

### 配对管理（控制谁能使用你的 AI）

当有人第一次给你的 Bot 发消息时，OpenClaw 不会直接让 AI 回复，而是先发出一个"配对码"等待你审批。这是安全保护机制。

```bash
openclaw pairing list telegram              # 查看待审批的请求
openclaw pairing approve telegram <CODE>    # 批准（把 CODE 换成实际的码）
openclaw pairing reject telegram <CODE>     # 拒绝
```

### 修改配置

```bash
openclaw configure                 # 打开完整配置向导
openclaw configure --section model # 只修改 AI 模型
```

---

## 更换或添加 AI 模型

如果你想换一个 AI 模型，或者添加备用模型：

```bash
openclaw configure --section model
```

常用模型对比：

| 模型 | 适合场景 | 花费 |
|------|----------|------|
| `claude-opus-4-6` | 最复杂的任务 | 最高 |
| `claude-sonnet-4-6` | 日常使用（推荐） | 中等 |
| `claude-haiku-4-5` | 大量简单问答 | 最低 |

---

## 从外部访问 OpenClaw（远程连接）

默认情况下，OpenClaw 只在你的本地电脑上运行，你出门后无法远程管理它。

如果你需要从手机或其他设备远程访问，推荐使用 Tailscale（免费）：

1. 在运行 OpenClaw 的电脑和你的手机上分别安装 Tailscale
2. 登录同一个账号，两台设备就像在同一个局域网内
3. 用 Tailscale 分配的 IP 地址访问 OpenClaw

→ 详细配置请看 [网关认证与远程访问](../gateway/)

---

## 如何更新 OpenClaw

推荐重新运行安装脚本，或使用内置更新命令：

```bash
openclaw update
openclaw doctor
openclaw gateway restart
```

如果你是 npm 全局安装，也可以：

```bash
npm install -g openclaw@latest
openclaw doctor
openclaw gateway restart
```

更完整的流程看[更新指南](/tutorials/installation/updating)。

---

## 常见问题

::: details 网关停止了怎么重启？

```bash
openclaw onboard --install-daemon
```

如果已经安装为系统服务，重启电脑后会自动恢复。
:::

::: details 想彻底卸载 OpenClaw？

```bash
openclaw service uninstall   # 先停止系统服务
npm uninstall -g openclaw    # 再卸载程序
```

配置和聊天记录保存在 `~/.openclaw/`，手动删除即可完全清除。
:::

::: details AI 回复变慢了，怎么排查？

1. 先跑 `openclaw doctor` 自动诊断
2. 查看实时日志 `openclaw logs --follow`，找报错信息
3. 检查你的 API 密钥是否还有额度（登录 AI 服务商后台查看）
:::

::: details 怎么完全重置配置？

```bash
openclaw onboard --reset
```

这会重置所有配置，但不会删除聊天记录。
:::
