---
title: "OpenAI 认证方式怎么选"
sidebarTitle: "OpenAI 认证"
description: "比较 Codex 登录、Sign in with ChatGPT Beta 与 OpenAI Platform API Key，区分模型访问、运行时、个人账号和 Agent 共享凭据。"
---

# OpenAI 认证：Codex、ChatGPT 登录和 API Key 怎么选

OpenClaw 当前有三条 OpenAI 认证路线。不要只看“都能登录”，要按模型权限、计费方式和所需能力选择：

| 方式 | 适合场景 | 用量/计费 | 主要边界 |
|------|----------|-----------|----------|
| Codex 浏览器 OAuth / 设备码 | 使用 ChatGPT 账号可用的 Codex 模型 | Codex 额度 | OpenAI 托管插件还需要带 connector scope 的原生 Codex 授权；OpenClaw 登录本身不授予。 |
| Sign in with ChatGPT (Beta)，简称 SIWC | 让 OpenClaw 作为独立 App 使用符合条件的 Responses 模型 | 共享 Codex 额度 | 暂不支持 OpenAI 托管插件、`image_generate`、转写、实时语音等额外能力。 |
| OpenAI Platform API Key | 使用 Platform 项目模型、API 计费和项目权限 | API 项目账单 | 没有 OAuth 自动刷新；密钥轮换由项目所有者负责。 |

三种方式都可以配合 OpenClaw 自己的工具和本地插件。OpenAI 托管的 connected apps、OpenClaw 插件、Codex 原生插件是三套不同权限，不会因为“登录了 OpenAI”就互相打通。

## Agent 共享凭据和个人账号不是一回事

- Agent 默认使用的凭据：Settings → Models → Connect provider，或 `openclaw models auth login`。
- 某个团队成员为自己的新会话连接账号：Settings → Profile → Connected accounts，或 `openclaw models accounts login`。
- Dashboard / Mac App 连接 Gateway 的 token：只是 Gateway 访问凭据，不是模型账号。

例如把 SIWC 连接为个人账号：

```bash
openclaw models accounts login openai --method siwc
```

个人连接不会替换 Agent 的共享凭据。默认只影响新会话，现有会话保留原账号选择；协作者继续同一会话时也沿用该会话选择。

## 配置 Agent 的 OpenAI 凭据

在运行目标 OpenClaw 安装的机器上执行：

```bash
# 本机浏览器完成 Codex OAuth
openclaw models auth login --provider openai --method oauth

# 远程/无头机器：在另一台设备上输入设备码
openclaw models auth login --provider openai --method device-code

# Sign in with ChatGPT (Beta)
openclaw models auth login --provider openai --method siwc

# OpenAI Platform API Key
openclaw models auth login --provider openai --method api-key
```

不写 `--method` 时，OpenAI 默认走 Codex 浏览器 OAuth。可用 `--agent <agentId>` 指定 Agent，用 `--profile-id openai:<name>` 给凭据命名；`--set-default` 会选中该 Provider 推荐模型，否则保留现有默认模型。

SIWC 登录时必须同意模型 token sharing。只完成基础身份授权时，Profile 可能保存成功，但仍不能发起模型请求。

## 模型访问和 Agent runtime 要分开选

认证决定“使用哪个 OpenAI 服务和账号”；[Agent runtime](/tutorials/concepts/agent-runtimes) 决定“谁来运行 Agent 循环与工具”。

- 选择 Codex 登录，不代表必须使用原生 Codex harness；OpenClaw runtime 也可以通过 Codex 服务调用模型。
- 选择原生 Codex harness 时，仍可使用 Codex 登录、SIWC 或 API Key，但 SIWC 需要受管本地进程。
- SIWC 在原生 Codex harness 中支持自动的回合内压缩，但不能手动 `/compact`；其他两种方式在 thread 符合条件时可使用原生压缩。

因此排障时至少同时确认：当前 `provider/model`、选中的 auth profile、实际 endpoint，以及 `agentRuntime.id`。

## 能力别混为一谈

- 文件/图片输入取决于模型，不等于获得 Files API 或图片生成权限。
- SIWC 不能直接给 `image_generate` 使用；需要另配支持该能力的 OpenClaw auth profile。
- 音频转写、TTS、实时语音、记忆 embeddings 都可能需要单独凭据或 Provider。
- OpenAI 托管插件要求原生 Codex harness、外部账号连接和带 `api.connectors.invoke` 的授权；设备码和 OpenClaw 浏览器 OAuth 当前都不提供这项 scope。
- 原生 Codex 用户目录里的 `codex login` 不会自动成为 OpenClaw 工具可用的认证 Profile。

## 验证不要只看“已连接”

在会话中用模型/账号选择器确认账号，再运行 `/status` 检查认证方式和 endpoint，并发送一条真实消息。CLI 的模型认证探针也只是模型路线检查，不能替代图片、音频、插件或 Agent runtime 的端到端测试。

OpenAI 模型和迁移说明见 [OpenAI Provider](/tutorials/providers/openai)。

上游来源：[`docs/providers/openai/authentication.md`](https://github.com/openclaw/openclaw/blob/fb4653dbea6650c0fae516151fa87fda5ee4aaf9/docs/providers/openai/authentication.md)。
