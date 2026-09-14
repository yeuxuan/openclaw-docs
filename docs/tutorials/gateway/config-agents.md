---
title: "Agent 配置"
sidebarTitle: "Agent 配置"
---

# Agent 配置：决定 AI 助手怎么工作

`agents.*` 相关配置决定 Agent 的默认工作区、模型、技能、上下文文件、会话和消息行为。

你可以把它想成给助手准备工位：桌子在哪里、能看哪些说明书、能用哪些技能、一次能带多少资料。

---

## 最常见的配置

| 配置 | 作用 |
|------|------|
| `agents.defaults.workspace` | 默认工作区 |
| `agents.defaults.repoRoot` | 项目根目录提示 |
| `agents.defaults.skills` | 默认允许的技能 |
| `agents.defaults.contextInjection` | 是否注入工作区说明文件 |
| `agents.entries` | 按 Agent ID 配置多个 Agent |
| `multiAgent` | 多 Agent 路由 |
| `session` | 会话生命周期和绑定 |
| `messages` | 消息投递和格式 |
| `talk` | 语音/对话模式相关配置 |

---

## 工作区

默认工作区通常是：

```text
~/.openclaw/workspace
```

如果环境变量里设置了 `OPENCLAW_WORKSPACE_DIR`，默认工作区会先用它。
只有你在 `agents.defaults.workspace` 里显式写了路径，才会覆盖这个环境变量。

示意配置：

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace"
    }
  }
}
```

工作区里常见 `AGENTS.md`、`SOUL.md`、`USER.md` 等文件。它们会影响 Agent 的规则、风格和记忆。

---

## 技能 allowlist

如果你想限制 Agent 能用哪些技能，可以配置：

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"]
    },
    entries: {
      writer: {},
      "locked-down": { skills: [] }
    }
  }
}
```

意思是：

- `writer` 继承默认技能。
- `locked-down` 不允许任何技能。
- 单个 Agent 设置了自己的 skills，就以它自己的为准。

---

## 上下文注入

`contextInjection` 决定工作区说明文件什么时候进入系统提示词。

常见值：

| 值 | 说明 |
|----|------|
| `always` | 每次都注入 |
| `continuation-skip` | 安全续写时跳过，省上下文 |
| `never` | 完全不注入，适合自定义 runtime |

新手保持默认即可。

单个 Agent 也可以覆盖上下文注入和 bootstrap 大小限制：

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    entries: {
      docs: {
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000
      }
    }
  }
}
```

工作区说明文件被截断时，OpenClaw 会内置注入一个简短提醒，让 Agent 必要时再读原文件。这个提醒现在不可配置；旧的 `bootstrapPromptTruncationWarning` 不应继续写进新配置。

工具结果也有自己的上限。`toolResultMaxChars` 不写时，OpenClaw 会按模型上下文自动计算：

- 100K token 以下：约 16000 字符
- 100K+ token：约 32000 字符
- 200K+ token：约 64000 字符

普通用户建议保持未设置。需要确认实际生效值时运行：

```bash
openclaw doctor --deep
```

## `/model` 默认写到哪里

`agents.defaults.modelSelectionScope` 控制没有显式范围参数的模型切换：

```json5
{
  agents: {
    defaults: {
      modelSelectionScope: "session",
    },
  },
}
```

| 值 | 行为 |
|----|------|
| `session` | 只改当前会话 |
| `agent` | 同时更新当前 Agent 的显式 primary |
| `global` | 同时更新共享的 `agents.defaults.model` fallback |
| 未设置 | 保留各界面原有行为 |

显式 `/model <model> -s`、`-a`、`-g` 优先于该设置。`-a` 和 `-g` 需要
owner/admin 权限；普通用户的裸命令仍只改会话。Telegram 回调选择器和本地 TUI
始终保持 session-only。

---

## 图片质量

`agents.defaults.imageQuality` 控制文件图片、URL 图片、媒体引用进入模型前的压缩/细节策略。

```json5
{
  agents: {
    defaults: {
      imageQuality: "auto"
    }
  }
}
```

可选值：

| 值 | 适合场景 |
|----|----------|
| `auto` | 默认，让 OpenClaw 按模型和图片数量自动判断 |
| `efficient` | 省 token、低延迟 |
| `balanced` | 平衡清晰度和成本 |
| `high` | 截图、文档、图表需要更多细节 |

新手保持 `auto`。

---

## 配多个 Agent

你可以让不同 Agent 有不同工作区、工具和风格。例如：

- `main` 负责日常聊天。
- `docs` 负责写文档。
- `ops` 负责运维检查。

多 Agent 很强，但配置也更复杂。基础通道和模型没跑稳前，不建议一开始就拆很多 Agent。

当前配置使用对象形式的 `agents.entries`，对象键就是 Agent ID：

```json5
{
  agents: {
    ownership: "explicit",
    entries: {
      main: { workspace: "~/.openclaw/workspace" },
      docs: { workspace: "~/.openclaw/workspace-docs" }
    }
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "*" } },
  ],
}
```

旧的 `agents.list` 数组仍会被 Doctor 识别并迁移，但新配置和教程不应继续写旧格式：

```bash
openclaw doctor --fix
```

当 OpenClaw 创建多 Agent fleet 时，会写入 `agents.ownership: "explicit"`。`default`
字段已经退役；这种 fleet 没有默认 Agent。通道和环境服务要通过 `bindings` 或明确的
`agentId` 指向目标，避免消息或后台任务意外落到另一个 Agent。只有一个 Agent 的配置
不需要 `ownership` 标记，并会把唯一 Agent 作为隐式 owner。

### 指定 system Agent

显式多 Agent fleet 通常还应指定环境级工作的所有者：

```json5
{
  agents: {
    ownership: "explicit",
    defaults: {
      systemAgent: { agentId: "main" },
    },
    entries: {
      main: { workspace: "~/.openclaw/workspace" },
      docs: { workspace: "~/.openclaw/workspace-docs" },
    },
  },
}
```

它用于没有显式 `agentId` 的环境级工作，例如模型/认证状态、Doctor 的记忆检查、出站通道初始化、队列恢复、无作用域主会话和首次 onboarding。显式 `agentId` 始终优先。`openclaw sessions`、Hooks 状态、完整模型视图和 TUI 启动仍要求明确选择，因为自动采用 system Agent 会隐藏其他 Agent 的数据。

---

## Runtime 策略放在哪里

新版规则：Runtime 策略属于 provider 或 model，不属于整个 `agents.defaults`。

推荐写法：

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" }
      }
    }
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
      models: {
        "vllm/*": {
          agentRuntime: { id: "openclaw" }
        }
      }
    }
  }
}
```

旧写法不要再用：

```json5
{
  agents: {
    defaults: {
      agentRuntime: { id: "codex" }
    }
  }
}
```

`agents.defaults.agentRuntime`、`agents.entries.*.agentRuntime`、会话里的 runtime pin、
`OPENCLAW_AGENT_RUNTIME` 都属于旧路线。新版 runtime 选择会忽略这些 whole-agent key。

如果你以前写过这些字段，运行：

```bash
openclaw doctor --fix
```

它会尽量清掉旧值，避免配置看起来存在但实际不生效。

常见 runtime id：

| id | 意思 |
|----|------|
| `auto` | 让已注册插件自己认领能处理的模型，否则回到 OpenClaw |
| `codex` | 使用 Codex app-server harness |
| `openclaw` | 使用 OpenClaw 内置运行时 |

`pi` 只是旧版兼容别名。新配置请写 `openclaw`。

`openai/*` 前缀本身不保证 Codex harness。精确官方 HTTPS native route、无自定义
请求覆盖且 runtime unset/auto 时才可能隐式选择；自定义端点和 authored
Completions route 会使用 OpenClaw runtime。

---

## provider 通配模型和本地服务

精确的 `agents.defaults.models["provider/model"]` 可设置 `codeMode: true` 或 `false`，省略则继承全局 `tools.codeMode`（包括显式 `"auto"`）；Agent 专用激活配置优先。它不改变 runtime 选择，也不控制原生 Codex Code Mode。Control UI 模型编辑器提供 Default / On / Off 三态。

`agents.defaults.models` 可以写 provider 通配项：

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
        "openai/gpt-5.6-sol": { alias: "gpt" }
      }
    }
  }
}
```

这表示“允许 vLLM provider 动态发现出来的模型”，不用一个个列。

如果你跑本地模型服务，还可以在 `models.providers.<provider>.localService` 配启动命令。
当选中的模型属于这个 provider，OpenClaw 会先探测健康地址；服务没起来才启动命令。

完整说明看 [Local model services](/tutorials/gateway/local-model-services)。

---

## Talk 配置

`talk` 控制语音对话。
它分两层：

- `talk.provider` + `talk.providers.<provider>`：传统语音播放，也就是 `talk.speak` 和 STT/TTS 模式里的 TTS。
- `talk.realtime.*`：浏览器或服务端实时语音会话。

示例：

```json5
{
  talk: {
    provider: "elevenlabs",
    speechLocale: "zh-CN",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime",
          voice: "alloy"
        }
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult"
    }
  }
}
```

如果配置里还写着旧字段：

- `talk.mode`
- `talk.transport`
- `talk.brain`
- `talk.model`
- `talk.voice`

运行：

```bash
openclaw doctor --fix
```

新版 doctor 会把这些旧的顶层 realtime selector 迁到 `talk.realtime`。

---

## 继续阅读

- [Agent 是什么](/tutorials/concepts/agent)
- [多智能体路由](/tutorials/concepts/multi-agent)
- [SOUL.md](/tutorials/concepts/soul)
