---
title: "openclaw onboard"
sidebarTitle: "onboard"
---

# `openclaw onboard`

`onboard` 是新手向导。它会先发现并真实验证一个可用模型，再准备工作区、Gateway 和会话；测试失败的 Provider 不会覆盖原来可用的配置。

推荐首次启动：

```bash
openclaw onboard
```

选择 **Quick start** 后，OpenClaw 会发现已有 AI 登录或 Key，只保存真实请求验证
通过的路线，随后用前台 Gateway 打开 Dashboard。SSH 或无桌面环境会打印一次性
Dashboard 地址和端口转发提示；想始终留在终端里可以加 `--tui`。

## 什么时候用

- 第一次在一台机器上安装 OpenClaw。
- 你想先验证模型、Gateway 和 Dashboard 的最短路径。
- 你不确定配置文件、端口、服务该怎么准备。

## 默认流程

1. 发现本机已有的 AI 登录、API Key 和本地模型。
2. 对候选模型发起真实请求，只保存验证通过的路线。
3. 发现 Claude Code、Codex 或 Hermes 记忆时询问是否导入。
4. 准备工作区、Gateway 和会话，并启动前台 Gateway。
5. 桌面环境打开已认证 Dashboard；无头环境打印隧道提示。

## 推荐流程

```bash
openclaw onboard
openclaw gateway install
openclaw doctor
```

这三条可以理解成：

1. 前台验证模型、Gateway 和 Dashboard。
2. 按 `Ctrl+C` 后安装后台服务。
3. 做一次体检。

## 跑完以后看哪里

默认 Gateway 监听本机 `127.0.0.1:18789`。如果你在服务器上安装，通常不要直接暴露到公网，而是用 SSH tunnel、反向代理和 token 保护。

需要传统逐步向导、远程 Gateway 或更细的 Provider 选项时运行 `openclaw onboard --classic`。远程模式要显式提供新 URL 和一种凭据；Token 与密码不能同时传：

```bash
openclaw onboard --classic \
  --mode remote \
  --remote-url wss://gateway.example.com \
  --remote-password '<password>'
```

只改 `--remote-url` 不会复用旧的远程凭据。`--gateway-token`、`--gateway-token-ref-env` 和 `--gateway-password` 属于本地 Gateway，在 remote 模式下会被拒绝。多 Agent 环境中，Provider 设置只更新配置的 system Agent，不覆盖其他 Agent 的模型。

远程 setup 会复用所选 Gateway 的设备配对，包括经回环地址转发的远程连接；就绪探针不会创建新配对。模型激活要求 Gateway 重启时，交互向导最多等待 45 秒，必须观察到新的启动标识和成功推理，连接到旧进程不算完成。

超时或缺少启动标识时，向导会说明设置已经保存并停止，不会再试另一个 Provider。先检查远程 Gateway，再在已连接终端重新运行裸 `openclaw`；如果明确提示 Gateway 没有提供 boot identity，先更新并重启远程 Gateway。

如果向导中断，不要从头乱改配置，先跑：

```bash
openclaw doctor
openclaw logs --follow
```

模型已经可用、只想继续配置频道或插件时，改用 [`openclaw setup`](/tutorials/cli/setup)。继续阅读：[安装向导](/tutorials/getting-started/wizard)。
