---
title: "CLI 入门引导参考"
sidebarTitle: "CLI 参考"
---

# CLI 入门引导参考

本页面是 `openclaw onboard` 的完整参考。
简要指南请参阅 [入门引导向导 (CLI)](/start/wizard)。

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
    - 工作区布局：[智能体（Agent）工作区](/concepts/agent-workspace)。

  ### 步骤 4：网关（Gateway）

    - 提示输入端口、绑定地址、认证模式和 Tailscale 暴露设置。
    - 建议：即使在 loopback 上也保持 Token 认证，以确保本地 WS 客户端必须进行身份验证。
    - 仅当你完全信任每个本地进程时才禁用认证。
    - 非 loopback 绑定仍然需要认证。

  ### 步骤 5：通道（Channel）

    - [WhatsApp](/channels/whatsapp)：可选 QR 码登录
    - [Telegram](/channels/telegram)：bot token
    - [Discord](/channels/discord)：bot token
    - [Google Chat](/channels/googlechat)：服务账号 JSON + webhook 受众
    - [Mattermost](/channels/mattermost) 插件：bot token + 基础 URL
    - [Signal](/channels/signal)：可选 `signal-cli` 安装 + 账号配置
    - [BlueBubbles](/channels/bluebubbles)：推荐用于 iMessage；服务器 URL + 密码 + webhook
    - [iMessage](/channels/imessage)：旧版 `imsg` CLI 路径 + 数据库访问
    - DM 安全：默认为配对模式。首条 DM 发送验证码；通过
      `openclaw pairing approve <channel> <code>` 批准或使用白名单。

  ### 步骤 6：守护进程安装

    - macOS：LaunchAgent
      - 需要已登录的用户会话；对于无头环境，使用自定义 LaunchDaemon（未内置提供）。
    - Linux 和 Windows（通过 WSL2）：systemd 用户单元
      - 向导尝试 `loginctl enable-linger <user>` 以使网关在注销后保持运行。
      - 可能需要 sudo 提示（写入 `/var/lib/systemd/linger`）；它会先尝试不使用 sudo。
    - 运行时选择：Node（推荐；WhatsApp 和 Telegram 必需）。不推荐 Bun。

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

::: details Anthropic OAuth (Claude Code CLI)

    - macOS：检查 Keychain 项 "Claude Code-credentials"
    - Linux 和 Windows：如果存在则复用 `~/.claude/.credentials.json`

    在 macOS 上，选择"始终允许"以便 launchd 启动时不会阻塞。

  

:::

::: details Anthropic token（setup-token 粘贴）

    在任何机器上运行 `claude setup-token`，然后粘贴 Token。
    可以命名；留空使用默认名称。
  

:::

::: details OpenAI Code 订阅（Codex CLI 复用）

    如果 `~/.codex/auth.json` 存在，向导可以复用它。
  

:::

::: details OpenAI Code 订阅 (OAuth)

    浏览器流程；粘贴 `code#state`。

    当模型未设置或为 `openai/*` 时，将 `agents.defaults.model` 设置为 `openai-codex/gpt-5.3-codex`。

  

:::

::: details OpenAI API 密钥

    如果存在 `OPENAI_API_KEY` 则使用该值，否则提示输入密钥，然后保存到
    `~/.openclaw/.env` 以便 launchd 读取。

    当模型未设置、为 `openai/*` 或 `openai-codex/*` 时，将 `agents.defaults.model` 设置为 `openai/gpt-5.1-codex`。

  

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
    更多详情：[Vercel AI Gateway](/providers/vercel-ai-gateway)。
  

:::

::: details Cloudflare AI Gateway

    提示输入账号 ID、网关 ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    更多详情：[Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)。
  

:::

::: details MiniMax M2.1

    配置自动写入。
    更多详情：[MiniMax](/providers/minimax)。
  

:::

::: details Synthetic（Anthropic 兼容）

    提示输入 `SYNTHETIC_API_KEY`。
    更多详情：[Synthetic](/providers/synthetic)。
  

:::

::: details Moonshot 和 Kimi Coding

    Moonshot (Kimi K2) 和 Kimi Coding 的配置自动写入。
    更多详情：[Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)。
  

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

- OAuth 凭证：`~/.openclaw/credentials/oauth.json`
- 认证档案（API 密钥 + OAuth）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

::: info 说明
无头和服务器提示：在有浏览器的机器上完成 OAuth，然后将
`~/.openclaw/credentials/oauth.json`（或 `$OPENCLAW_STATE_DIR/credentials/oauth.json`）
复制到网关主机。
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

`openclaw agents add` 写入 `agents.list[]` 和可选的 `bindings`。

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

Signal 设置行为：

- 下载适当的发布资产
- 存储在 `~/.openclaw/tools/signal-cli/<version>/` 下
- 在配置中写入 `channels.signal.cliPath`
- JVM 构建需要 Java 21
- 可用时使用原生构建
- Windows 使用 WSL2，在 WSL 内遵循 Linux signal-cli 流程

---

## 相关文档

- 入门引导中心：[入门引导向导 (CLI)](/start/wizard)
- 自动化和脚本：[CLI 自动化](/start/wizard-cli-automation)
- 命令参考：[`openclaw onboard`](/cli/onboard)
