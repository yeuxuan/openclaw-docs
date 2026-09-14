---
title: "配置"
sidebarTitle: "配置"
description: "OpenClaw Gateway：配置。OpenClaw 从  读取可选的 JSON5 配置。"
---

# 配置

OpenClaw 从 `~/.openclaw/openclaw.json` 读取可选的 JSON5 配置。

如果文件缺失，OpenClaw 使用安全的默认值。添加配置的常见原因：

- 连接通道（Channel）并控制谁可以向机器人发消息
- 设置模型、工具、沙箱（Sandbox）或自动化（cron、hooks）
- 调整会话（Session）、媒体、网络或 UI

参阅[完整参考](/tutorials/gateway/configuration-reference)了解所有可用字段。

::: tip 提示
第一次配置时，先用 `openclaw onboard` 交互式设置；需要完整模板时，再看[配置示例](/tutorials/gateway/configuration-examples)。
:::

## 先讲人话

配置文件就是 OpenClaw 的“设置表”。
它告诉 OpenClaw：

- 用哪个 AI 大脑。
- 哪些聊天软件可以接进来。
- 谁可以给你的 AI 发私信。
- 工具能不能运行命令、要不要进沙箱。
- 自动化任务什么时候触发。

第一次使用不要先手写配置。
优先让向导帮你填：

```bash
openclaw onboard
```

只有向导满足不了你的需求时，再回来改 `~/.openclaw/openclaw.json`。

## 最小配置

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## 编辑配置

推荐顺序是：先用向导，其次用 CLI，最后才直接编辑文件。

### 交互式向导

```bash
openclaw onboard       # 完整设置向导
openclaw configure     # 配置向导
```

### CLI

```bash
openclaw config get agents.defaults.workspace
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config unset tools.web.search.apiKey
```

### Control UI

打开 [http://127.0.0.1:18789](http://127.0.0.1:18789)，进入 Config 标签页。Control UI 会根据配置 schema 渲染表单，也提供 Raw JSON 编辑器用于处理复杂配置。

### 直接编辑

直接编辑 `~/.openclaw/openclaw.json`。Gateway 会监视文件并自动应用更改（参阅[热重载](#config-hot-reload)）。

直接编辑前，建议先备份一份：

```bash
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
```


## 严格验证

::: warning 注意
OpenClaw 仅接受完全匹配 schema 的配置。Gateway 启动会先尝试对符合条件的单文件配置迁移确定性的旧键；仍有未知键、格式错误的类型或无效值时会拒绝启动。唯一的根级例外是 `$schema`（string），供编辑器附加 JSON Schema 元数据。
:::

配置文件里多写、写错、写成不该有的类型，Gateway 可能会直接不启动。
所以改配置以后，先运行 doctor 检查。


自动迁移必须通过包括插件在内的完整验证，写入前保留 `.bak` 环形备份；`$include`、Nix 管理或更新版本写入的配置不会自动迁移。它不自动恢复 last-known-good，也不导入旧会话库。详情见 [Doctor 旧键迁移](/tutorials/gateway/doctor)。

迁移后仍验证失败时：

- 网关（Gateway）不启动
- 只有诊断命令可用（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 运行 `openclaw doctor` 查看确切问题
- 运行 `openclaw doctor --fix`（或 `--yes`）应用修复

## 常见任务

下面的折叠块像“菜谱”。
你要做哪件事，就打开哪一块，不需要从头读到尾。


::: details 设置通道（Channel）（WhatsApp、Telegram、Discord 等）

    每个通道（Channel）在 `channels.<provider>` 下有自己的配置部分。参阅专门的通道（Channel）页面了解设置步骤：

    - [WhatsApp](/tutorials/channels/whatsapp)：`channels.whatsapp`
    - [Telegram](/tutorials/channels/telegram)：`channels.telegram`
    - [Discord](/tutorials/channels/discord)：`channels.discord`
    - [Slack](/tutorials/channels/slack)：`channels.slack`
    - [Signal](/tutorials/channels/signal)：`channels.signal`
    - [iMessage](/tutorials/channels/imessage)：`channels.imessage`
    - [Google Chat](/tutorials/channels/googlechat)：`channels.googlechat`
    - [Mattermost](/tutorials/channels/mattermost)：`channels.mattermost`
    - [MS Teams](/tutorials/channels/msteams)：`channels.msteams`

    所有通道（Channel）共享相同的 DM 策略模式：

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",   // pairing | allowlist | open | disabled
      allowFrom: ["tg:123"], // 仅用于 allowlist/open
    },
  },
}
```



:::


::: details 选择和配置模型

    设置主模型和可选的回退模型：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-5",
        fallbacks: ["openai/gpt-5.2"],
      },
      models: {
        "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
        "openai/gpt-5.2": { alias: "GPT" },
      },
    },
  },
}
```

    - `agents.defaults.models` 定义模型目录，并作为 `/model` 的白名单。
    - 模型引用使用 `provider/model` 格式（例如 `anthropic/claude-opus-4-6`）。
    - 参阅[模型 CLI](/tutorials/concepts/models) 了解在聊天中切换模型，以及[模型故障转移](/tutorials/concepts/model-failover)了解认证轮换和回退行为。
    - 对于自定义/自托管模型提供商（Provider），参阅参考中的[自定义模型提供商（Provider）](/tutorials/gateway/configuration-reference)。



:::


::: details 控制谁可以向机器人发消息

    DM 访问通过每个通道（Channel）的 `dmPolicy` 控制：

    - `"pairing"`（默认）：未知发送者获得一次性配对码以供审批
    - `"allowlist"`：仅 `allowFrom` 中的发送者（或已配对的允许存储）
    - `"open"`：允许所有入站 DM（需要 `allowFrom: ["*"]`）
    - `"disabled"`：忽略所有 DM

    对于群组，使用 `groupPolicy` + `groupAllowFrom` 或通道（Channel）特定的白名单。

    参阅[完整参考](/tutorials/gateway/configuration-reference)了解每通道（Channel）详情。



:::


::: details 设置群组聊天提及门控

    群组消息默认需要提及。按智能体（Agent）配置模式：

```json5
{
  agents: {
    entries: {
      main: {
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    },
  },
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    - 元数据提及：原生 @-提及（WhatsApp 点击提及、Telegram @bot 等）
    - 文本模式：`mentionPatterns` 中的正则模式
    - 参阅[完整参考](/tutorials/gateway/configuration-reference)了解每通道（Channel）覆盖和自聊模式。



:::


::: details 配置会话（Session）和重置

    会话（Session）控制对话连续性和隔离：

```json5
{
  session: {
    dmScope: "per-channel-peer",  // 推荐用于多用户
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 120,
    },
  },
}
```

    - `dmScope`：`main`（共享）| `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - 参阅[会话（Session）管理](/tutorials/concepts/session)了解作用域、身份链接和发送策略。
    - 参阅[完整参考](/tutorials/gateway/configuration-reference)了解所有字段。



:::


::: details 启用沙箱（Sandbox）

    在隔离的 Docker 容器中运行智能体（Agent）会话（Session）：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",  // off | non-main | all
        scope: "agent",    // session | agent | shared
      },
    },
  },
}
```

    先构建镜像：`scripts/sandbox-setup.sh`

    参阅[沙箱（Sandbox）](/tutorials/gateway/sandboxing)了解完整指南，以及[完整参考](/tutorials/gateway/configuration-reference)了解所有选项。



:::


::: details 设置心跳（定期签到）

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last",
      },
    },
  },
}
```

    - `every`：时间字符串（`30m`、`2h`）。设置 `0m` 禁用。
    - `target`：`last` | `whatsapp` | `telegram` | `discord` | `none`
    - 参阅[心跳](/tutorials/gateway/heartbeat)了解完整指南。



:::


::: details 配置 cron 作业

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    sessionRetention: "24h",
  },
}
```

    参阅 [Cron 作业](/tutorials/automation/cron-jobs)了解功能概览和 CLI 示例。



:::


::: details 设置 Webhook（hooks）

    在网关（Gateway）上启用 HTTP webhook 端点：

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "main",
        deliver: true,
      },
    ],
  },
}
```

    参阅[完整参考](/tutorials/gateway/configuration-reference)了解所有映射选项和 Gmail 集成。



:::


::: details 配置多智能体（Agent）路由

    使用独立工作区（Workspace）和会话（Session）运行多个隔离的智能体（Agent）：

```json5
{
  agents: {
    ownership: "explicit",
    entries: {
      home: { workspace: "~/.openclaw/workspace-home" },
      work: { workspace: "~/.openclaw/workspace-work" },
    },
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

    参阅[多智能体（Agent）](/tutorials/concepts/multi-agent)和[完整参考](/tutorials/gateway/configuration-reference)了解绑定规则和每智能体（Agent）访问 profile。



:::


::: details 将配置拆分为多个文件（$include）

    使用 `$include` 组织大型配置：

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/a.json5", "./clients/b.json5"],
  },
}
```

    - 单文件：替换包含对象
    - 文件数组：按顺序深度合并（后者优先）
    - 兄弟键：在 include 之后合并（覆盖 include 的值）
    - 嵌套 include：支持最多 10 级深度
    - 相对路径：相对于包含文件解析
    - 错误处理：对缺失文件、解析错误和循环 include 有清晰的错误消息



:::


## 配置热重载 {#config-hot-reload}

Gateway 会监视 `~/.openclaw/openclaw.json` 并自动应用更改，大多数设置无需手动重启。

### 重载模式

| 模式                    | 行为                                                                     |
| ---------------------- | ----------------------------------------------------------------------- |
| `hybrid`（默认）    | 安全更改即时热应用。关键更改自动重启。                                       |
| `hot`              | 仅热应用安全更改。需要重启时记录警告，由你处理。                                |
| `restart`          | 任何配置更改都重启网关（Gateway），无论安全与否。                              |
| `off`              | 禁用文件监视。更改在下次手动重启时生效。                                      |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 热应用 vs 需要重启

大多数字段无需停机即可热应用。在 `hybrid` 模式中，需要重启的更改会自动处理。

| 类别              | 字段                                                                   | 需要重启？ |
| ----------------- | -------------------------------------------------------------------- | --------- |
| 通道（Channel）    | `channels.*`、`web`（WhatsApp），所有内置和扩展通道（Channel）             | 否        |
| 智能体（Agent）和模型 | `agents`、`models`                                                   | 否        |
| 自动化             | `hooks`、`cron`、`agents.defaults.heartbeat`                         | 否        |
| 会话（Session）和消息 | `session`、`messages`                                                | 否        |
| 工具和媒体          | `tools`、`browser`、`skills`、`audio`、`talk`                          | 否        |
| UI 和其他           | `ui`、`logging`、`bindings`                                           | 否        |
| 网关（Gateway）服务器 | `gateway.*`（port、bind、auth、tailscale、TLS、HTTP）                  | 是    |
| 基础设施            | `discovery`、`canvasHost`、`plugins`                                   | 是    |

::: info 说明
`gateway.reload` 和 `gateway.remote` 是例外，更改它们不会触发重启。
:::


## 配置 RPC（程序化更新）


::: details config.apply（完整替换）

    验证 + 写入完整配置并一步重启网关（Gateway）。

    ::: warning 注意
`config.apply` 替换整个配置。对于部分更新使用 `config.patch`，或使用 `openclaw config set` 设置单个键。
:::


    参数：

    - `raw`（string）：整个配置的 JSON5 载荷
    - `baseHash`（可选）：来自 `config.get` 的配置哈希（当配置存在时必需）
    - `sessionKey`（可选）：重启后唤醒 ping 的会话（Session）键
    - `note`（可选）：重启哨兵的备注
    - `restartDelayMs`（可选）：重启前延迟（默认 2000）

```bash
openclaw gateway call config.get --params '{}'  # 获取 payload.hash
openclaw gateway call config.apply --params '{
  "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
  "baseHash": "<hash>",
  "sessionKey": "agent:main:whatsapp:dm:+15555550123"
}'
```



:::


::: details config.patch（部分更新）

    将部分更新合并到现有配置中（JSON merge patch 语义）：

    - 对象递归合并
    - `null` 删除键
    - 数组替换

    参数：

    - `raw`（string）：仅包含要更改键的 JSON5
    - `baseHash`（必需）：来自 `config.get` 的配置哈希
    - `sessionKey`、`note`、`restartDelayMs`：与 `config.apply` 相同

```bash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```



:::


## 环境变量

OpenClaw 从父进程读取环境变量，另外还有：

- 当前工作目录中的 `.env`（如果存在）
- `~/.openclaw/.env`（全局回退）

两个文件都不会覆盖现有的环境变量。你也可以在配置中设置内联环境变量：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

::: details Shell 环境导入（可选）

  如果启用且预期的键未设置，OpenClaw 运行你的登录 shell 并仅导入缺失的键：

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

等效环境变量：`OPENCLAW_LOAD_SHELL_ENV=1`

:::


::: details 配置值中的环境变量替换

  在任何配置字符串值中使用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

规则：

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`
- 缺失/空变量在加载时抛出错误
- 使用 `$${VAR}` 转义为字面输出
- 在 `$include` 文件中可用
- 内联替换：`"${BASE}/v1"` 会变成 `"https://api.example.com/v1"`

:::


参阅[环境](/tutorials/help/environment)了解完整优先级和来源。

## 完整参考

有关完整的逐字段参考，请参阅[配置参考](/tutorials/gateway/configuration-reference)。

---

_相关：[配置示例](/tutorials/gateway/configuration-examples) · [配置参考](/tutorials/gateway/configuration-reference) · [Doctor](/tutorials/gateway/doctor)_
