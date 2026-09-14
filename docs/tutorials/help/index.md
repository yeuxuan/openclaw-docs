---
title: "帮助与故障排查"
sidebarTitle: "帮助中心"
---

# 帮助与故障排查

OpenClaw 出问题时，不要先慌，也不要一上来就重装。
先像检查家里电器一样，一层一层看：电源有没有、总开关有没有开、连接线有没有松、设备本身有没有报错。

---

## 先跑这三步

```bash
openclaw doctor
openclaw gateway status
openclaw dashboard
```

它们分别帮你确认：

1. 环境是否正常：Node、依赖、配置有没有明显问题
2. 网关是否活着：OpenClaw 的总机有没有启动
3. 控制台能否打开：浏览器里能不能看到频道、会话、节点和错误信息

默认控制台地址通常是：

```text
http://127.0.0.1:18789/
```

---

## 常见入口

| 问题 | 先看哪里 |
|------|----------|
| 刚安装完，不知道下一步 | [快速入门](/tutorials/getting-started/getting-started) |
| 网关启动不了 | [网关故障排查](/tutorials/gateway/troubleshooting) |
| Agent 不回复 | [故障排查](/tutorials/help/troubleshooting) |
| 聊天频道断开 | [频道总览](/tutorials/channels/) 和对应频道页面 |
| 模型报错或扣费异常 | [模型提供商](/tutorials/providers/) |
| API Key 不生效 | [环境变量](/tutorials/help/environment) |
| 想看详细日志 | [调试指南](/tutorials/help/debugging) |
| 自动化任务没跑 | [自动化故障排查](/tutorials/automation/troubleshooting) |
| Node.js 运行时报错 | [Node.js 问题排查](/tutorials/help/node-issue) |

---

## 本模块包含

- [常见问题 FAQ](/tutorials/help/faq)：新手最常问的问题
- [调试指南](/tutorials/help/debugging)：如何看日志、开调试、定位根因
- [故障排查](/tutorials/help/troubleshooting)：Agent 不回复、Gateway 异常、通道断连
- [环境变量](/tutorials/help/environment)：变量加载顺序、密钥保存、替代语法
- [脚本约定](/tutorials/help/scripts)：自动化脚本怎么写得更稳
- [测试指南](/tutorials/help/testing)：单元测试、E2E、Live 测试
- [Node.js 问题排查](/tutorials/help/node-issue)：解决 Node + tsx 相关崩溃

---

## 排查顺序

### 1. 先看环境

```bash
openclaw doctor
node -v
```

当前 OpenClaw 推荐 Node 26.1+，也支持 Node 24.16+；Node 22、23、25 不受支持。
如果 Node 版本太旧，很多奇怪问题都会出现。

### 2. 再看网关

```bash
openclaw gateway status
```

网关是总机。总机没启动，频道、模型、工具都不会正常工作。

### 3. 再看控制台

```bash
openclaw dashboard
```

控制台里通常能看到频道状态、会话状态、节点连接和明显错误。

### 4. 最后看具体模块

- 模型错了，看 Provider 配置
- 频道错了，看 Channel 配置
- 工具错了，看 Tool 权限
- 自动化错了，看 Cron / Heartbeat / Webhook 配置

---

## 仍然解决不了

去 [OpenClaw GitHub Issues](https://github.com/openclaw/openclaw/issues) 搜索同类问题。
提问时尽量带上：

- OpenClaw 版本
- Node 版本
- 操作系统
- 你运行的命令
- 报错日志里最主要的几行
- 你使用的频道和模型提供商

这样别人更容易帮你定位问题。
