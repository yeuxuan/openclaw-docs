---
title: "OpenClaw 系统架构详解"
sidebarTitle: "系统架构详解"
description: "OpenClaw 架构说明：从 Gateway、通道、节点、插件到 Agent 执行链路，梳理源码里的主要模块和调用关系。"
---

# OpenClaw 系统架构详解

本文从源码视角梳理 OpenClaw 的系统架构，适合需要读源码、写插件或做二次开发的读者。

::: tip 如果你不是程序员，先看这里
这一页会出现很多源码名和英文术语。你不需要一次全懂。

先记住这条主线：

```text
聊天软件收到消息 -> Gateway 接住消息 -> Agent 思考 -> 模型生成回复 -> Gateway 把回复发回聊天软件
```

后面所有架构图，都只是在解释这条线里的每一段由谁负责。
:::

## 先把几个词翻成人话

| 文档里的词 | 人话解释 |
|------------|----------|
| Gateway | 总服务台。所有消息、控制 UI、节点和插件都先找它 |
| Control UI | 浏览器里的控制面板 |
| Channel | 聊天入口，比如 Telegram、WhatsApp、Discord |
| Agent | 真正负责思考和回复的 AI 助手 |
| Provider | AI 大脑从哪里来，比如 Claude、DeepSeek、Ollama |
| Tool | Agent 可以做的动作，比如读文件、跑命令、查网页 |
| Node | 接入 Gateway 的外部设备或远程机器 |
| Session | 一段独立聊天，防止不同人的上下文混在一起 |

如果你只是想配置 OpenClaw，看到这里已经够用了。
如果你想读源码、改插件、做二次开发，再继续往下看。

---

## 一、架构总览

OpenClaw 是一个多通道 AI 助手运行时，设计上主要解决这几件事：

- 自托管 Gateway：一个长期运行的 Gateway 统一管理会话、通道、节点、控制 UI 和事件流。
- 多通道统一接入：Telegram、WhatsApp、Discord、Slack、Signal、iMessage、WebChat 等使用同一套控制面。
- 插件化扩展：通道、工具、Provider、语音、媒体、搜索、后台服务都可以通过插件能力接入。
- 节点能力扩展：iOS、Android、macOS、远程机器都可以作为 Node 连接 Gateway，提供 Canvas、相机、语音或远程执行能力。
- 智能体内核稳定运行：Lane 队列、上下文守护、模型回退、工具审批，保证长期可靠执行。

如果只用一句话概括最新版架构：

```text
Gateway 是总服务台；Control UI、CLI、聊天通道和节点都连到它；Agent 在它背后调用模型、工具和记忆。
```

### 整体分层

```text
┌─────────────────────────────────────────────────────┐
│                   CLI 层                            │
│        entry.ts -> run-main.ts -> command-registry    │
├─────────────────────────────────────────────────────┤
│                  Gateway 层（控制平面）               │
│  WebSocket · HTTP/Control UI · 通道管理 · 节点管理     │
├──────────────┬──────────────┬────────────────────────┤
│  Channel 层  │   Routing 层 │    Plugin 层            │
│  多通道适配  │  路由 + 会话键│  manifest + 能力注册     │
├──────────────┴──────────────┴────────────────────────┤
│               Auto-Reply / Agent 执行层               │
│   dispatch -> get-reply -> agent-runner -> embedded PI  │
├─────────────────────────────────────────────────────┤
│                AI Provider 层                        │
│    Anthropic · OpenAI · Ollama · Bedrock · ...       │
├─────────────────────────────────────────────────────┤
│        节点 / 媒体 / 持久化 / 基础设施层                │
│ Nodes · Canvas · Config · Sessions · Security · Cron  │
└─────────────────────────────────────────────────────┘
```

### 模块关系全图

```mermaid
flowchart LR
  subgraph 入口层
    A[entry.ts] --> B[run-main.ts]
  end

  subgraph 命令层
    B --> C{tryRouteCli}
    C -->|快路径| D[直接执行]
    C -->|普通路径| E[buildProgram]
    E --> F[command-registry]
  end

  subgraph 网关层
    F -->|gateway 命令| G[startGatewayServer]
    G --> H[WebSocket 服务]
    G --> I[HTTP 服务 + Control UI]
    G --> J[ChannelManager]
    G --> K[NodeRegistry]
    G --> L[ConfigReloader]
    G --> Q[PluginMetadataSnapshot]
  end

  subgraph 消息处理
    H --> M[authorizeGatewayMethod]
    M --> N[chat.send]
    M --> O[agent.*]
    M --> P[sessions.*]
  end

  subgraph 智能体执行
    N --> R[runEmbeddedPiAgent]
    R --> S[Lane 队列]
    S --> T[runEmbeddedAttempt]
    T --> U[LLM 流式调用]
    T --> V[工具执行]
    U --> W[回复发往通道]
  end

  subgraph 持久化
    X[(Config)] -.-> G
    Y[(Sessions)] -.-> T
    Z[(Media)] -.-> V
  end

  subgraph 节点
    K --> AA[iOS / Android / macOS / node host]
    AA --> AB[Canvas / Camera / Voice / system.run]
  end
```

---

## 二、核心组件详解

### 2.1 CLI 层

源码位置：`src/entry.ts`、`src/cli/`

CLI 是系统的启动入口，负责环境初始化和命令分发。

人话解释：CLI 就是你在终端里输入的 `openclaw ...` 命令。
你输入命令后，CLI 先判断你想做什么，再把任务交给对应模块。

```text
入口流程：
entry.ts
  ├── 设置进程名 "openclaw"
  ├── 处理 --no-color 标志
  ├── 通过 respawn 注入 --disable-warning=ExperimentalWarning
  ├── Windows argv 归一化（normalizeWindowsArgv）
  ├── CLI Profile 解析（parseCliProfileArgs / applyCliProfileEnv）
  └── run-main.ts
        ├── 加载 .env，标准化环境变量
        ├── tryRouteCli() -> 快路径命令（直接执行，跳过完整注册）
        │   例：status / health / sessions / agents list /
        │       memory status / config get / models list
        └── buildProgram() + registerCoreCliByName()
              -> 按主命令名懒加载注册对应子命令模块
```

快路径设计：`src/cli/program/routes.ts` 定义了可绕过完整命令注册、直接执行的命令（如 `status`、`health`），显著缩短冷启动时间。

懒加载命令注册：`command-registry.ts` 按需加载子命令模块，避免一次性全量加载。

---

### 2.2 Gateway 层（控制平面）

源码位置：`src/gateway/`

Gateway 是整个系统的核心，必须常驻运行。它暴露两个接口：

人话解释：Gateway 要像电话总机一样一直开着。
它停了，控制 UI、聊天通道、节点和自动任务都会受影响。

| 接口 | 默认地址 | 用途 |
|------|----------|------|
| WebSocket | `127.0.0.1:18789` | 主控制协议，所有方法调用、事件推送 |
| HTTP | 同端口 | Control UI、Hooks 回调、工具调用、Webhook、OpenResponses |

#### Gateway 启动序列

```mermaid
flowchart TD
  A[startGatewayServer] --> B[读取配置 + 迁移旧格式]
  B --> C[applyPluginAutoEnable]
  C --> D[loadGatewayPlugins]
  D --> E[resolveGatewayRuntimeConfig]
  E --> F[createGatewayRuntimeState\nHTTP + WS + broadcast]
  F --> G[NodeRegistry 节点注册]
  F --> H[createChannelManager]
  F --> I[startGatewayDiscovery mDNS]
  G --> J[attachGatewayWsHandlers]
  H --> J
  I --> J
  J --> K[startGatewayMaintenanceTimers\n心跳 / 健康检查]
  K --> L[buildGatewayCronService 定时任务]
  L --> M[startGatewaySidecars\nBrowser / Memory / Plugin]
  M --> N[startGatewayConfigReloader 热重载]
  N --> O[返回 close 句柄]
```

#### WebSocket 协议层（4 层结构）

```text
1. 连接层  server/ws-connection.ts + server/ws-connection/message-handler.ts
   └── 握手认证、Challenge/Response、10s 握手超时保护

2. 协议层  gateway/protocol/index.ts
   └── AJV 帧结构校验、统一错误码

3. 方法层  server-methods.ts + server-methods/*
   └── authorizeGatewayMethod（role + scope）+ 方法分发

4. 事件层  server-broadcast.ts + server-chat.ts
   └── 流式事件广播、慢消费者丢弃、幂等缓存
```

#### 三个"总闸"

| 总闸 | 源码 | 作用 |
|------|------|------|
| 连接总闸 | `message-handler.ts` | `connect` 握手必须成功，否则关闭 WS |
| 权限总闸 | `authorizeGatewayMethod` | role/scope 不符合直接拒绝 |
| 带宽总闸 | `MAX_PAYLOAD_BYTES` | 防止单连接拖垮系统 |

#### 配置热重载

`startGatewayConfigReloader` 监听配置文件变化。能热更新的配置会直接调用 `applyHotReload`，不能热更新的配置会请求进程重启，不需要手动杀掉 Gateway。

---

### 2.3 Channel 层（通道适配器）

源码位置：`src/channels/`、`extensions/*/`、`src/plugin-sdk/`

通道是消息的"入口"与"出口"。最新版架构里，通道边界更清晰：

- 核心负责统一会话、路由、权限、消息工具和回复流。
- 通道插件负责平台自己的协议细节，比如 Telegram Bot API、Slack Socket Mode、Matrix homeserver、WhatsApp QR 连接等。
- 插件通过 `openclaw.plugin.json` 先声明自己，再通过 SDK 注册能力。

通道通常以能力注册的形式进入系统：

```typescript
// 通道注册示意
registerChannel({
  id: "telegram",
  label: "Telegram",
  start: async (accountId, config) => { /* 启动 bot */ },
  stop: async (accountId) => { /* 停止 */ },
  send: async (target, message) => { /* 发送消息 */ },
})
```

常见通道：

| 通道 | selectionLabel | 说明 |
|------|----------------|------|
| Telegram | Telegram (Bot API) | 官方 Bot，入门首选 |
| WhatsApp | WhatsApp (QR link) | 绑定手机号，推荐独立设备 |
| Discord | Discord (Bot API) | 官方 Bot，支持良好 |
| Slack | Slack (Socket Mode) | 企业通讯，Socket Mode |
| Google Chat | Google Chat (Chat API) | Google Workspace |
| Signal | Signal (signal-cli) | 私密通讯，需额外配置 |
| iMessage | iMessage (`imsg`) | 当前 macOS 原生路线；BlueBubbles 插件已移除 |
| WebChat | WebChat | 浏览器聊天入口 |
| Matrix / Mattermost / Teams / LINE / Zalo / QQ / WeChat | 插件通道 | 通过插件能力接入 |

账号是一级实体：同一通道可运行多个 `accountId`，每个账号独立运行状态，故障隔离。

---

### 2.4 Node 层（节点能力）

源码位置：`src/node-host/`、`src/gateway/server-methods/nodes.ts`、`src/gateway/node-registry.ts`、`apps/`

节点是连接到 Gateway 的设备或远程执行宿主。节点不是另一个 Gateway，而是 Gateway 的外接能力。

典型节点：

- iOS 节点：Canvas、相机、语音、位置等。
- Android 节点：聊天、语音、Canvas、相机、设备命令等。
- macOS 节点：菜单栏应用、Canvas、桌面能力。
- headless node host：远程命令执行或自动化宿主。

节点连接时会声明 `role: "node"`，并上报自己的 commands/caps。Gateway 端通过设备配对批准它，再按权限调用。

---

### 2.5 Routing 层（路由与会话键）

源码位置：`src/routing/`

路由层负责把"某条入站消息"稳定映射到"某个 Agent + 某个 Session"。

#### 路由匹配优先级（从高到低）

```text
1. peer 精确匹配（私聊对象 ID）
2. parent peer 继承匹配（线程/回复链）
3. guild + roles（服务器 + 角色组合）
4. guild（整个服务器）
5. team（团队）
6. account（账号）
7. channel（整个通道）
8. default agent（兜底）
```

#### Session Key 设计

Session Key 用来做并发隔离和持久化分区。格式（`src/routing/session-key.ts`）：

```text
私聊（DM）：agent:{agentId}:{channel}:{accountId}:direct:{peerId}
群聊/频道：agent:{agentId}:{channel}:{accountId}:{peerKind}:{peerId}

其中 peerKind = direct | group | channel | thread | ...
```

路由匹配阶段使用 `channel + accountId + peer + guildId + teamId + memberRoleIds` 等多个维度决策，但编入 Key 字符串的仅是 `agentId + channel + accountId + peerKind + peerId`。

作用：
- 同一会话消息串联（历史上下文）
- 并发队列按 session 隔离（Lane 机制）
- 存储文件按 session 定位

---

### 2.6 Auto-Reply / Agent 执行层

源码位置：`src/auto-reply/`、`src/agents/`

这是系统最复杂的部分，分为 5 个子层：

#### 执行流水线总览

```mermaid
flowchart TD
  A[入站消息] --> B[dispatch.ts\n流程控制 + 资源释放]
  B --> C[dispatch-from-config.ts\n去重 + Hooks + TTS]
  C --> D[get-reply.ts\n路由解析 + 指令处理 + 媒体预处理]
  D --> E[get-reply-run.ts\n系统前缀 + 会话重置 + 队列策略]
  E --> F[agent-runner-execution.ts\nrunReplyAgent]
  F --> G[runEmbeddedPiAgent\n调度层]
  G --> H{Lane 排队}
  H --> I[runEmbeddedAttempt\n执行层]
  I --> J[LLM 流式调用]
  I --> K[工具执行]
  J --> L[回复拼装]
  K --> L
  L --> M[routeReply 发往通道]
```

#### 各子层职责

| 子层 | 文件 | 核心职责 |
|------|------|----------|
| 调度控制 | `dispatch.ts` | typing/block/final 事件、资源保证释放 |
| 消息编排 | `dispatch-from-config.ts` | 去重、Hooks、TTS 应用 |
| 决策构建 | `get-reply.ts` | 路由解析、指令解析、媒体预处理 |
| 执行组装 | `get-reply-run.ts` | 系统前缀、队列策略、模型思考等级 |
| Agent 调度 | `pi-embedded-runner/run.ts` | Lane 排队、模型选择、执行循环 |
| 单次执行 | `pi-embedded-runner/run/attempt.ts` | 真实 LLM 调用 + 工具执行 |
| 事件订阅 | `pi-embedded-subscribe.ts` | 流式文本/工具事件分离收集 |
| 模型回退 | `model-fallback.ts` | 多候选模型轮换 |

#### Lane 并发模型

```text
每个 Session 独占一个 Session Lane（队列）
所有 Session 共享一个 Global Lane（全局并发控制）
Lane 由 concurrency（最大同时执行数）和 maxPending（最大排队数）控制

消息到来：进入 sessionLane -> 进入 globalLane -> 执行
新消息到来时的 QueueMode（src/auto-reply/reply/queue/types.ts）：
  - interrupt    ：中断当前 run，立即执行新消息
  - steer        ：把新消息追加到当前 run 的上下文中继续执行
  - steer-backlog：steer 的变体，同时保留待处理消息
  - followup     ：等当前 run 结束后再执行
  - collect      ：收集多条消息合并后再执行（防抖批处理）
  - queue        ：普通排队，依序执行
```

#### 上下文守护（防止"越聊越炸"）

```text
上下文稳定 = 窗口预检 + 历史卫生 + 配对修复 + 压缩重试 + 超时快照兜底

CONTEXT_WINDOW_HARD_MIN_TOKENS = 16000   // 硬红线，触发拒绝
CONTEXT_WINDOW_WARN_BELOW_TOKENS = 32000 // 软警告，触发压缩
```

---

### 2.6 AI Provider 层

源码位置：`src/providers/`、`src/agents/auth-profiles/`

Provider 层抽象了所有 AI 模型服务的接入差异。

#### 支持的 Provider（部分，完整列表见 `src/agents/models-config.providers.ts`）

| Provider | 认证方式 | 说明 |
|----------|----------|------|
| Anthropic (Claude) | API Key | 原生最优支持 |
| OpenAI (GPT) | API Key | 广泛兼容 |
| Ollama | 本地 HTTP | 无需云服务，完全私有 |
| AWS Bedrock | IAM | 企业级云服务 |
| Google Gemini | API Key | 多模态支持 |
| GitHub Copilot | OAuth | 企业授权 |
| Qwen（通义）| Portal OAuth | 阿里云 |
| Moonshot（Kimi）| API Key | 月之暗面 |
| Together / HuggingFace | API Key | 开源模型托管 |
| Cloudflare AI Gateway | API Key | 代理聚合层 |

#### Auth Profile 轮换机制

支持配置多个 Auth Profile（不同 Key），当某个 Key 遇到限流或认证失败时，自动轮换到下一个：

```text
runWithModelFallback():
  遍历候选 profile 列表
  -> 尝试执行
  -> 失败（限流/认证）-> 标记冷却 -> 轮换下一个
  -> 全部失败 -> 返回最终错误
```

---

### 2.7 Plugin 系统

源码位置：`src/plugins/`

插件是 OpenClaw 的扩展骨架。最新版不要只理解成“加载一个 JS 文件”，而要理解成四层：

```text
manifest 元数据
  -> 启用/加载规划
  -> runtime register(api)
  -> registry / lookup table 被 Gateway、CLI、Agent 消费
```

常见注入点包括：

```text
插件可注入：
  ① channel    -> 新通道（Telegram/Discord/...）
  ② tool       -> 新 Agent 工具（bash/browser/...）
  ③ provider   -> 新 AI Provider
  ④ hook       -> 生命周期钩子（message_received/gateway_stop/...）
  ⑤ http-route -> 新 HTTP 路由（Webhook 处理等）
```

插件加载流程（最新版心智模型）：

```text
loadGatewayPlugins()
  -> 构建 PluginMetadataSnapshot
  -> 扫描 bundled / workspace / global / config 插件
  -> 读取 openclaw.plugin.json
  -> 校验 manifest + config schema
  -> 按当前场景做 activation planning
  -> 加载需要的插件运行时代码
  -> register(api) 注册能力
  -> registry / lookup table 供 Gateway、CLI、Agent 使用
```

---

### 2.8 持久化 / 基础设施层

| 子系统 | 源码 | 说明 |
|--------|------|------|
| Config | `src/config/io.ts` | TOML 格式配置，热重载支持 |
| Sessions | `src/config/sessions/store.ts` | 会话历史持久化，按 sessionKey 分区 |
| Media | `src/media/store.ts` + `server.ts` | 媒体文件管理，有 TTL 和安全校验 |
| Security | `src/security/audit.ts` | 操作审计日志 |
| Cron | `src/cron/` | 定时任务（会话清理、维护等） |
| Daemon | `src/daemon/` | 守护进程管理，保证 Gateway 常驻 |
| Memory | `src/memory/` | Agent 记忆 sidecar |

---

## 三、消息完整旅程

以"在 Telegram 发送一条消息"为例：

```text
① 用户发消息
   Telegram 服务器 -> Telegram Bot（Webhook / Long Poll）

② 通道适配器接收
   Telegram 插件（通过 Plugin Registry 注册）
   -> 构造标准 InboundMessage 对象

③ 路由解析
   src/routing/resolve-route.ts
   -> 计算 agentId + sessionKey

④ 自动回复调度
   src/auto-reply/dispatch.ts
   -> 触发 message_received hooks
   -> 显示 typing 指示器

⑤ 回复决策
   get-reply.ts
   -> 解析 @指令（/think、/model、/reset 等）
   -> 媒体理解预处理（图片/文件）

⑥ 执行组装
   get-reply-run.ts
   -> 拼装系统提示、用户上下文
   -> 确定队列策略（interrupt/steer/followup）

⑦ Agent 调度
   runEmbeddedPiAgent()
   -> 进入 sessionLane 队列
   -> 进入 globalLane 队列

⑧ 单次执行
   runEmbeddedAttempt()
   -> 上下文窗口预检
   -> 发起 LLM 流式调用（Anthropic API）

⑨ 流式输出处理
   pi-embedded-subscribe.ts
   -> 收集文本 token
   -> 检测工具调用（tool_use 事件）

⑩ 工具执行（如有）
   openclaw-tools.ts -> bash / browser / file 等工具
   -> 结果追加到会话上下文
   -> 继续 LLM 调用（多轮 agentic loop）

⑪ 回复下发
   routeReply()
   -> 通道适配器 send()
   -> Telegram API 发送消息

⑫ 用户收到回复
```

---

## 四、安全架构

### 4.1 配对（Pairing）机制

陌生来源的消息不会直接触发 AI 回复，而是进入等待审批流：

```text
未配对消息 -> 发出配对码 -> 人工审批
                              ↓ approve
                           加入白名单 -> 允许 AI 回复
                              ↓ reject
                           永久拒绝
```

### 4.2 工具执行审批

危险工具（如 bash 命令）可配置需要人工审批：

```text
工具调用请求
  -> 检查 dangerous-tools.ts 规则
  -> 需要审批 -> 推送审批请求到控制端
              -> 等待 approve/reject
  -> 免审批   -> 直接执行
```

### 4.3 Gateway 鉴权层级

鉴权由 `src/gateway/server-methods.ts` 的 `authorizeGatewayMethod()` 执行：

```text
角色（Role）：
  operator  -> 常规客户端（控制台、CLI、配对设备等）
  node      -> 节点角色（node-host，仅允许 node.* 方法）

Scope（operator 角色的细粒度权限）：
  operator.read      -> 读取状态、会话、配置等
  operator.write     -> 写入配置、发送消息、控制 Agent
  operator.admin     -> 管理员操作（通道管理、系统级控制）
  operator.approvals -> 工具执行审批
  operator.pairing   -> 配对管理（approve/reject/list）
```

### 4.4 审计日志

所有敏感操作写入审计日志（`src/security/audit.ts`），包括：配置变更、工具执行、权限变更、连接事件。

---

## 五、部署架构

### 5.1 单机部署（默认）

```text
┌─────────────────────────────────┐
│          用户电脑               │
│                                 │
│  openclaw gateway               │
│  ├── 127.0.0.1:18789 (WS/HTTP) │
│  ├── Channel sidecars           │
│  └── Memory sidecar             │
│                                 │
│  ~/.openclaw/                   │
│  ├── config.toml                │
│  ├── sessions/                  │
│  └── workspace/                 │
└─────────────────────────────────┘
         ↓ 通过 Tailscale / VPN
  远程设备（手机/平板）
```

### 5.2 服务器部署

```text
┌──────────────────────────────────────┐
│           云服务器 / VPS             │
│                                      │
│  Docker / systemd 守护 openclaw      │
│  ├── Gateway :18789                  │
│  ├── 反向代理（nginx/caddy）         │
│  │   └── TLS 终止 + 外网暴露         │
│  └── 持久化卷挂载                    │
└──────────────────────────────────────┘
```

### 5.3 守护进程管理

`src/daemon/` 提供守护进程能力：

- 进程崩溃自动重启
- PID 文件管理
- 优雅关停（`SIGTERM` -> drain -> close）

---

## 六、核心源码索引

| 模块 | 关键文件 |
|------|----------|
| CLI 入口 | `src/entry.ts`, `src/cli/run-main.ts` |
| 命令注册 | `src/cli/program/build-program.ts`, `src/cli/program/command-registry.ts` |
| Gateway 主入口 | `src/gateway/server.impl.ts` |
| WS 握手认证 | `src/gateway/server/ws-connection.ts`, `src/gateway/auth.ts` |
| 方法鉴权 | `src/gateway/server-methods.ts` |
| 通道管理 | `src/gateway/server-channels.ts` |
| 路由解析 | `src/routing/resolve-route.ts`, `src/routing/session-key.ts` |
| 自动回复入口 | `src/auto-reply/dispatch.ts`, `src/auto-reply/reply/get-reply.ts` |
| Agent 调度 | `src/agents/pi-embedded-runner/run.ts` |
| 单次执行 | `src/agents/pi-embedded-runner/run/attempt.ts` |
| 工具系统 | `src/agents/pi-tools.ts`, `src/agents/openclaw-tools.ts` |
| 上下文守护 | `src/agents/context-window-guard.ts` |
| 模型回退 | `src/agents/model-fallback.ts` |
| 子智能体 | `src/agents/tools/sessions-spawn-tool.ts` |
| 技能系统 | `src/agents/skills.ts` |
| 插件加载 | `src/plugins/loader.ts`, `src/plugins/registry.ts` |
| 配置 IO | `src/config/io.ts` |
| 会话存储 | `src/config/sessions/store.ts` |
| 媒体管理 | `src/media/store.ts`, `src/media/server.ts` |
| 安全审计 | `src/security/audit.ts` |

---

## 七、扩展阅读

- [Gateway 网络模型](/tutorials/gateway/network-model)
- [OpenClaw 是怎么工作的（入门版）](/tutorials/concepts/architecture)
- [Agent 执行循环](/tutorials/concepts/agent-loop)
- [会话管理](/tutorials/concepts/session)
- [模型故障转移](/tutorials/concepts/model-failover)
- [插件开发（源码剖析 · 插件系统）](/beginner-openclaw-guide/08-插件系统)
- [智能体框架总览](/beginner-openclaw-guide/12-智能体框架总览)
