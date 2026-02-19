---
title: "网关（Gateway）使用指南"
sidebarTitle: "网关"
---

# 网关（Gateway）——AI 助手的"指挥部"

## 什么是网关？

把 OpenClaw 想象成一个邮局：

- **网关（Gateway）** = 邮局本身，所有信件（消息）都要经过这里
- **AI 助手** = 邮局里处理信件的工作人员
- **通道（Telegram/WhatsApp等）** = 各种送信方式

网关必须持续运行，AI 助手才能随时响应你的消息。

---

## 快速检查：网关现在在运行吗？

打开终端，输入：

```bash
openclaw gateway status
```

- **看到 `Runtime: running`** → 网关正在运行，一切正常
- **看到 `Runtime: stopped`** → 网关没有运行，需要启动
- **提示"连接失败"** → 网关没有运行，需要启动

---

## 如何启动网关？

### 方式一：后台静默运行（推荐日常使用）

如果你在[快速入门](/tutorials/getting-started/getting-started)时已经选择了"安装为服务"，网关会自动在后台运行，就像电脑开机自动连网一样，不需要你管。

检查并重启服务：

```bash
# 查看状态
openclaw gateway status

# 重启（如果有问题）
openclaw gateway restart

# 停止
openclaw gateway stop
```

### 方式二：在终端窗口中手动运行（适合测试）

如果你只是想临时运行或者测试，可以直接在终端里启动：

```bash
openclaw gateway --port 18789
```

这样网关会在终端窗口里运行，关掉终端窗口就停止了。

::: tip 什么时候用哪种方式？
- **日常使用**：用后台服务（方式一）
- **测试/排查问题**：用手动运行（方式二），这样可以实时看到日志信息
:::

---

## 设置开机自动启动

让网关随电脑开机自动启动，这样你不用每次手动启动。

**macOS 用户：**

```bash
openclaw gateway install
```

运行这个命令后，网关会被注册为系统服务，开机自动启动。

**Linux 用户：**

```bash
openclaw gateway install
```

然后启用服务：

```bash
systemctl --user enable --now openclaw-gateway.service
```

---

## 检查所有东西是否正常

一次性检查网关和所有连接的聊天软件是否正常：

```bash
openclaw doctor
```

这个命令就像是"体检"，会自动找出问题并提示你怎么修复。

---

## 查看实时日志

想看网关都在干什么？可以查看实时日志：

```bash
openclaw logs --follow
```

按 `Ctrl + C` 退出日志查看。

---

## 常见问题

::: details 网关启动失败，提示"端口已被占用"？

有另一个程序占用了 18789 端口，或者你已经有一个网关在运行了。

强制关闭占用端口的进程并重新启动：

```bash
openclaw gateway --force
```

或者换一个端口：

```bash
openclaw gateway --port 18790
```

:::

::: details 网关一直崩溃，怎么排查？

先运行自动诊断：

```bash
openclaw doctor
```

然后查看详细日志：

```bash
openclaw logs --follow
```

如果还是解决不了，可以在 [GitHub Issues](https://github.com/openclaw/openclaw/issues) 提问，把日志内容贴上去。

:::

::: details 网关在运行，但 AI 没有回复？

检查聊天软件（通道）是否正常连接：

```bash
openclaw channels status --probe
```

如果某个通道显示错误，参考对应通道的故障排查文档：[通道故障排查](/tutorials/channels/troubleshooting)

:::

::: details 想从外网（比如在公司）访问家里的 OpenClaw？

推荐使用 Tailscale（一种安全的内网穿透工具）来实现远程访问。

基本步骤：
1. 在运行 OpenClaw 的电脑上安装 Tailscale
2. 配置 OpenClaw 使用 Tailscale 地址
3. 在另一台设备上也安装 Tailscale，就可以通过 Tailscale 内网地址访问了

详细配置：[认证与安全](/tutorials/gateway/authentication)

:::

---

## 常用命令速查表

| 命令 | 作用 |
|------|------|
| `openclaw gateway status` | 查看网关运行状态 |
| `openclaw gateway start` | 启动网关 |
| `openclaw gateway stop` | 停止网关 |
| `openclaw gateway restart` | 重启网关 |
| `openclaw gateway install` | 设置开机自启动 |
| `openclaw logs --follow` | 实时查看日志 |
| `openclaw doctor` | 自动诊断并修复问题 |
| `openclaw dashboard` | 打开控制面板（浏览器） |
