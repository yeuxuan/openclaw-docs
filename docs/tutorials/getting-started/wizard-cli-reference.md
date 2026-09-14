---
title: "CLI 入门引导参考"
sidebarTitle: "CLI 参考"
description: "OpenClaw 快速入门：CLI 入门引导参考。本页面是  的完整参考。 简要指南请参阅 入门引导向导 (CLI)。"
---

# CLI 入门引导参考

本页面是 `openclaw onboard` 的完整参考。
简要指南请参阅 [入门引导向导 (CLI)](/tutorials/getting-started/wizard)。

---

## 向导的功能

本地模式（默认）引导你完成以下步骤：

- 模型和认证设置（OpenAI Code 订阅 OAuth、Anthropic API 密钥或设置 Token，以及 MiniMax、GLM、Moonshot 和 AI Gateway 选项）
- 工作区（Workspace）位置和引导文件
- 网关（Gateway）设置（端口、绑定、认证、Tailscale）
- 通道（Channel）和提供商（Telegram、WhatsApp、Discord、Google Chat、Mattermost 插件、Signal）
- 守护进程安装（LaunchAgent 或 systemd 用户单元）
- 健康检查
- 技能设置

远程模式配置本机连接到其他位置的网关（Gateway）。
它不会在远程主机上安装或修改任何内容。

---

## 本地流程详情


  ### 步骤 1：检测现有配置

    - 如果 `~/.openclaw/openclaw.json` 存在，选择保留、修改或重置。
    - 重新运行向导不会清除任何内容，除非你明确选择重置（或传入 `--reset`）。
    - 如果配置无效或包含旧版字段，向导会停止并要求你在继续之前运行 `openclaw doctor`。
    - 重置使用 `trash` 并提供范围选项：
      - 仅配置
      - 配置 + 凭证 + 会话
      - 完全重置（同时移除工作区）

  ### 步骤 2：模型和认证

    - 完整选项矩阵在 [认证和模型选项](#认证和模型选项) 中。

  ### 步骤 3：工作区（Workspace）

    - 默认 `~/.openclaw/workspace`（可配置）。
    - 生成首次运行引导所需的工作区文件。
    - 工作区布局：[智能体（Agent）工作区](/tutorials/concepts/agent-workspace)。

  ### 步骤 4：网关（Gateway）

    - 提示输入端口、绑定地址、认证模式和 Tailscale 暴露设置。
    - 建议：即使在 loopback 上也保持 Token 认证，以确保本地 WS 客户端必须进行身份验证。
    - 仅当你完全信任每个本地进程时才禁用认证。
    - 非 loopback 绑定仍然需要认证。

  ### 步骤 5：通道（Channel）

    - [WhatsApp](/tutorials/channels/whatsapp)：可选 QR 码登录
    - [Telegram](/tutorials/channels/telegram)：bot token
    - [Discord](/tutorials/channels/discord)：bot token
    - [Google Chat](/tutorials/channels/googlechat)：服务账号 JSON + webhook 受众
    - [Mattermost](/tutorials/channels/mattermost) 插件：bot token + 基础 URL
    - [Signal](/tutorials/channels/signal)：可选 `signal-cli` 安装 + 账号配置
    - [iMessage](/tutorials/channels/imessage)：macOS 当前原生 `imsg` 路线，需要 Messages 数据库访问
    - BlueBubbles 插件已移除；旧安装按[迁移说明](/tutorials/channels/imessage-from-bluebubbles)切换
    - DM 安全：默认为配对模式。首条 DM 发送验证码；通过
      `openclaw pairing approve <channel> <code>` 批准或使用白名单。

  ### 步骤 6：守护进程安装

    - macOS：LaunchAgent
      - 需要已登录的用户会话；对于无头环境，使用自定义 LaunchDaemon（未内置提供）。
    - Linux 和 Windows（通过 WSL2）：systemd 用户单元
      - 向导尝试 `loginctl enable-linger <user>` 以使网关在注销后保持运行。
      - 可能需要 sudo 提示（写入 `/var/lib/systemd/linger`）；它会先尝试不使用 sudo。
    - 运行时选择：Node 是默认且推荐的运行时。Bun 1.4+ 在提供 WAL-reset-safe
      `node:sqlite` 时可显式选择；使用 `--daemon-runtime bun` 安装 Bun Gateway。

  ### 步骤 7：健康检查

    - 启动网关（如需要）并运行 `openclaw health`。
    - `openclaw status --deep` 会向状态输出添加网关健康探测（Telegram + Discord）。

  ### 步骤 8：技能

    - 读取可用技能并检查依赖。
    - 让你选择包管理器：npm 或 pnpm（不推荐 bun）。
    - 安装可选依赖（某些在 macOS 上使用 Homebrew）。

  ### 步骤 9：完成

    - 摘要和后续步骤，包括 iOS、Android 和 macOS 应用选项。


::: info 说明
如果未检测到 GUI，向导会打印控制面板 UI 的 SSH 端口转发指令，而不是打开浏览器。
如果控制面板 UI 资源缺失，向导会尝试构建它们；回退方式是 `pnpm ui:build`（自动安装 UI 依赖）。
:::

---

## 远程模式详情

远程模式配置本机连接到其他位置的网关（Gateway）。

::: info
远程模式不会在远程主机上安装或修改任何内容。
:::


你需要设置的内容：

- 远程网关 URL（`ws://...`）
- Token（如果远程网关需要认证，推荐使用）

::: info 说明
- 如果网关仅限 loopback，请使用 SSH 隧道或 tailnet。
- 发现提示：
  - macOS：Bonjour（`dns-sd`）
  - Linux：Avahi（`avahi-browse`）
:::

---

## 认证和模型选项


::: details Anthropic API 密钥（推荐）

    如果存在 `ANTHROPIC_API_KEY` 则使用该值，否则提示输入密钥，然后为守护进程保存。


:::

::: details Anthropic Claude CLI

    交互式引导会优先检测同一 Gateway 主机、同一系统用户已经登录的 Claude CLI。
    OpenClaw 通过 Anthropic 官方 Agent SDK 运行，不读取、复制或刷新 Claude CLI
    的原生登录 Token。先用 `claude auth status --text` 验证登录。



:::

::: details Anthropic token（setup-token 粘贴）

    在任何机器上运行 `claude setup-token`，然后通过
    `openclaw models auth login --provider anthropic --method setup-token`
    粘贴 Token。可以命名；留空使用默认名称。


:::

::: details OpenAI ChatGPT/Codex 订阅 (OAuth)

    浏览器流程；粘贴 `code#state`。

    当前统一使用 `openclaw models auth login --provider openai` 和 `openai:*`
    profile ID。新安装在账号可用时使用 `openai/gpt-6-astra`；无权限时显式选择
    `openai/gpt-5.5`。`openai-codex/*` 和 `openai-codex:*` 只作为旧迁移来源。



:::

::: details OpenAI API 密钥

    如果存在 `OPENAI_API_KEY` 则使用该值，否则提示输入密钥，然后保存到
    `~/.openclaw/.env` 以便 launchd 读取。

    新安装且尚未配置 primary 时，优先设置 `openai/gpt-6-astra`。刷新认证不会
    覆盖现有显式 primary；需要改默认模型时运行 `openclaw models set`。



:::

::: details xAI (Grok) API 密钥

    提示输入 `XAI_API_KEY` 并配置 xAI 作为模型提供商。


:::

::: details OpenCode Zen

    提示输入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）。
    设置 URL：[opencode.ai/auth](https://opencode.ai/auth)。


:::

::: details API 密钥（通用）

    为你存储密钥。


:::

::: details Vercel AI Gateway

    提示输入 `AI_GATEWAY_API_KEY`。
    更多详情：[Vercel AI Gateway](/tutorials/providers/vercel-ai-gateway)。


:::

::: details Cloudflare AI Gateway

    提示输入账号 ID、网关 ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    更多详情：[Cloudflare AI Gateway](/tutorials/providers/cloudflare-ai-gateway)。


:::

::: details MiniMax M2.1

    配置自动写入。
    更多详情：[MiniMax](/tutorials/providers/minimax)。


:::

::: details Synthetic（Anthropic 兼容）

    提示输入 `SYNTHETIC_API_KEY`。
    更多详情：[Synthetic](/tutorials/providers/synthetic)。


:::

::: details Moonshot 和 Kimi Coding

    Moonshot (Kimi K2) 和 Kimi Coding 的配置自动写入。
    更多详情：[Moonshot AI (Kimi + Kimi Coding)](/tutorials/providers/moonshot)。


:::

::: details 自定义提供商

    兼容 OpenAI 和 Anthropic 端点。

    非交互参数：
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（可选；回退到 `CUSTOM_API_KEY`）
    - `--custom-provider-id`（可选）
    - `--custom-compatibility <openai|anthropic>`（可选；默认 `openai`）



:::

::: details 跳过

    不配置认证。


:::


模型行为：

- 从检测到的选项中选择默认模型，或手动输入提供商和模型。
- 向导会运行模型检查，如果配置的模型未知或缺少认证会发出警告。

凭证和档案路径：

- Agent 本地认证档案：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  中的 `auth_profile_store`。
- 共享认证档案：`~/.openclaw/state/openclaw.sqlite`；Agent 本地档案优先。
- `auth-profiles.json`、单 Agent `auth.json` 和
  `~/.openclaw/credentials/oauth.json` 只作为旧版迁移来源。运行
  `openclaw doctor --fix` 导入；新登录不会再写这些 JSON 文件。

::: info 无头和服务器
在 Gateway 主机上、以运行 Gateway 的同一系统用户执行
`openclaw configure --section model`。浏览器 OAuth 可以在本机浏览器打开链接，
再把重定向 URL 或授权码粘贴回 SSH 终端。不要复制 `auth-profiles.json`，也
不要为迁移登录而替换整份 SQLite 数据库。完成后用
`openclaw models status --agent <agentId>` 验证。
:::

---

## 输出和内部机制

`~/.openclaw/openclaw.json` 中的典型字段：

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（如果选择了 Minimax）
- `gateway.*`（模式、绑定、认证、Tailscale）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.signal.*`、`channels.imessage.*`
- 通道白名单（Slack、Discord、Matrix、Microsoft Teams），当你在提示中选择加入时（名称会尽可能解析为 ID）
- `skills.install.nodeManager`
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 写入 `agents.entries.*` 和可选的 `bindings`。

WhatsApp 凭证存放在 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
会话（Session）存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。

::: info 说明
部分通道以插件形式提供。在入门引导中选中时，向导会在通道配置之前
提示安装插件（npm 或本地路径）。
:::


网关向导 RPC：

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

客户端（macOS 应用和控制面板 UI）可以渲染步骤，无需重新实现入门引导逻辑。

setup 被另一个操作占用时，`wizard.start` 和模型设置启动/激活方法返回 `UNAVAILABLE`，其中 `details.code` 为 `SETUP_ADMISSION_BUSY`。它明确表示这次操作没有开始，可以等竞争操作结束后由用户重新发起。

向导终态 `error` 表示本次操作已结束，但不代表之前的写入回滚。普通请求失败、超时、断线或找不到向导，都不能证明 setup 没有执行；客户端应保留“结果未知”，不要自动重试激活或显示成功。

Signal 设置行为：

- 下载适当的发布资产
- 存储在 `~/.openclaw/tools/signal-cli/<version>/` 下
- 在配置中写入 `channels.signal.cliPath`
- JVM 构建需要 Java 21
- 可用时使用原生构建
- Windows 使用 WSL2，在 WSL 内遵循 Linux signal-cli 流程

---

## 相关文档

- 入门引导中心：[入门引导向导 (CLI)](/tutorials/getting-started/wizard)
- 自动化和脚本：[CLI 自动化](/tutorials/getting-started/wizard-cli-automation)
- 命令参考：[`openclaw onboard`](/tutorials/getting-started/wizard-cli-reference)
