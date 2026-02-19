---
title: "记忆"
sidebarTitle: "记忆"
---

# 记忆（Memory）

OpenClaw 的记忆是 **智能体工作区中的纯 Markdown 文件**。这些文件是事实的来源；模型只"记得"写入磁盘的内容。

记忆搜索工具由活跃的记忆插件提供（默认：`memory-core`）。通过 `plugins.slots.memory = "none"` 禁用记忆插件。

---

## 记忆文件（Markdown）

默认的工作区布局使用两个记忆层：

- `memory/YYYY-MM-DD.md`
  - 每日日志（仅追加）。
  - 在会话开始时读取今天 + 昨天的内容。
- `MEMORY.md`（可选）
  - 精选的长期记忆。
  - **仅在主要的私人会话中加载**（绝不在群组上下文中）。

这些文件位于工作区下（`agents.defaults.workspace`，默认 `~/.openclaw/workspace`）。参见[智能体工作区](/concepts/agent-workspace)了解完整布局。

---

## 何时写入记忆

- 决策、偏好和持久性事实写入 `MEMORY.md`。
- 日常笔记和运行上下文写入 `memory/YYYY-MM-DD.md`。
- 如果有人说"记住这个"，就写下来（不要只保留在内存中）。
- 这个领域仍在发展中。提醒模型存储记忆会有帮助；它知道该怎么做。
- 如果你想让某些内容持久化，**请让机器人将其写入** 记忆。

---

## 自动记忆刷新（压缩前提醒）

当会话 **接近自动压缩** 时，OpenClaw 会触发一个 **静默的智能体轮次**，提醒模型在上下文被压缩 **之前** 写入持久记忆。默认提示词明确表示模型 _可以回复_，但通常 `NO_REPLY` 是正确的响应，这样用户永远不会看到这个轮次。

这由 `agents.defaults.compaction.memoryFlush` 控制：

```json5
{
  agents: {
    defaults: {
      compaction: {
        reserveTokensFloor: 20000,
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 4000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

详情：

- **软阈值**：当会话 Token 估算超过 `contextWindow - reserveTokensFloor - softThresholdTokens` 时触发刷新。
- **默认静默**：提示词包含 `NO_REPLY`，因此不会投递任何内容。
- **两个提示词**：一个用户提示词加一个系统提示词附加提醒。
- **每个压缩周期一次刷新**（在 `sessions.json` 中跟踪）。
- **工作区必须可写**：如果会话在 `workspaceAccess: "ro"` 或 `"none"` 的沙箱中运行，刷新会被跳过。

关于完整的压缩生命周期，参见[会话管理 + 压缩](/reference/session-management-compaction)。

---

## 向量记忆搜索

OpenClaw 可以在 `MEMORY.md` 和 `memory/*.md` 上构建小型向量索引，以便语义查询即使在措辞不同时也能找到相关笔记。

默认值：

- 默认启用。
- 监视记忆文件的变化（带防抖）。
- 在 `agents.defaults.memorySearch` 下配置记忆搜索（不是顶级 `memorySearch`）。
- 默认使用远程嵌入。如果未设置 `memorySearch.provider`，OpenClaw 自动选择：
  1. 如果配置了 `memorySearch.local.modelPath` 且文件存在，则使用 `local`。
  2. 如果可以解析 OpenAI 密钥，则使用 `openai`。
  3. 如果可以解析 Gemini 密钥，则使用 `gemini`。
  4. 如果可以解析 Voyage 密钥，则使用 `voyage`。
  5. 否则记忆搜索保持禁用直到配置完成。
- 本地模式使用 node-llama-cpp，可能需要 `pnpm approve-builds`。
- 使用 sqlite-vec（如果可用）加速 SQLite 内的向量搜索。

远程嵌入 **需要** 嵌入提供商的 API 密钥。OpenClaw 从认证配置文件、`models.providers.*.apiKey` 或环境变量解析密钥。Codex OAuth 仅覆盖 chat/completions，**不满足** 记忆搜索的嵌入需求。对于 Gemini，使用 `GEMINI_API_KEY` 或 `models.providers.google.apiKey`。对于 Voyage，使用 `VOYAGE_API_KEY` 或 `models.providers.voyage.apiKey`。当使用自定义 OpenAI 兼容端点时，设置 `memorySearch.remote.apiKey`（和可选的 `memorySearch.remote.headers`）。

### QMD 后端（实验性）

设置 `memory.backend = "qmd"` 将内置的 SQLite 索引器替换为 [QMD](https://github.com/tobi/qmd)：一个结合了 BM25 + 向量 + 重排序的本地优先搜索辅助程序。Markdown 仍然是事实来源；OpenClaw 通过 shell 调用 QMD 进行检索。要点：

**前提条件**

- 默认禁用。通过配置选择启用（`memory.backend = "qmd"`）。
- 单独安装 QMD CLI（`bun install -g https://github.com/tobi/qmd` 或获取发布版本），并确保 `qmd` 二进制文件在网关的 `PATH` 上。
- QMD 需要允许扩展的 SQLite 构建（macOS 上 `brew install sqlite`）。
- QMD 通过 Bun + `node-llama-cpp` 完全本地运行，并在首次使用时从 HuggingFace 自动下载 GGUF 模型（不需要单独的 Ollama 守护进程）。
- 网关在 `~/.openclaw/agents/<agentId>/qmd/` 下运行 QMD，通过设置 `XDG_CONFIG_HOME` 和 `XDG_CACHE_HOME` 实现自包含的 XDG 主目录。
- 操作系统支持：一旦安装了 Bun + SQLite，macOS 和 Linux 可以直接使用。Windows 最好通过 WSL2 支持。

**辅助程序如何运行**

- 网关在 `~/.openclaw/agents/<agentId>/qmd/` 下写入自包含的 QMD 主目录（配置 + 缓存 + sqlite 数据库）。
- 通过 `qmd collection add` 从 `memory.qmd.paths`（加上默认的工作区记忆文件）创建集合，然后 `qmd update` + `qmd embed` 在启动时和可配置间隔（`memory.qmd.update.interval`，默认 5 分钟）运行。
- 网关现在在启动时初始化 QMD 管理器，因此即使在第一次 `memory_search` 调用之前也会启动定期更新计时器。
- 启动刷新现在默认在后台运行，因此聊天启动不会被阻塞；设置 `memory.qmd.update.waitForBootSync = true` 保持之前的阻塞行为。
- 搜索通过 `memory.qmd.searchMode` 运行（默认 `qmd search --json`；也支持 `vsearch` 和 `query`）。如果选择的模式在你的 QMD 构建上拒绝标志，OpenClaw 会重试 `qmd query`。如果 QMD 失败或二进制文件缺失，OpenClaw 自动回退到内置 SQLite 管理器，以便记忆工具继续工作。
- OpenClaw 目前不暴露 QMD 嵌入批量大小调优；批量行为由 QMD 自身控制。
- **首次搜索可能较慢**：QMD 可能在首次 `qmd query` 运行时下载本地 GGUF 模型（重排器/查询扩展）。
  - OpenClaw 在运行 QMD 时自动设置 `XDG_CONFIG_HOME`/`XDG_CACHE_HOME`。
  - 如果你想手动预下载模型（并预热 OpenClaw 使用的相同索引），使用智能体的 XDG 目录运行一次性查询。

    OpenClaw 的 QMD 状态位于你的 **状态目录** 下（默认 `~/.openclaw`）。你可以通过导出 OpenClaw 使用的相同 XDG 变量将 `qmd` 指向完全相同的索引：

    ```bash
    # 选择 OpenClaw 使用的相同状态目录
    STATE_DIR="${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"

    export XDG_CONFIG_HOME="$STATE_DIR/agents/main/qmd/xdg-config"
    export XDG_CACHE_HOME="$STATE_DIR/agents/main/qmd/xdg-cache"

    # （可选）强制索引刷新 + 嵌入
    qmd update
    qmd embed

    # 预热 / 触发首次模型下载
    qmd query "test" -c memory-root --json >/dev/null 2>&1
    ```

**配置选项（`memory.qmd.*`）**

- `command`（默认 `qmd`）：覆盖可执行文件路径。
- `searchMode`（默认 `search`）：选择哪个 QMD 命令支持 `memory_search`（`search`、`vsearch`、`query`）。
- `includeDefaultMemory`（默认 `true`）：自动索引 `MEMORY.md` + `memory/**/*.md`。
- `paths[]`：添加额外目录/文件（`path`、可选 `pattern`、可选稳定 `name`）。
- `sessions`：选择加入会话 JSONL 索引（`enabled`、`retentionDays`、`exportDir`）。
- `update`：控制刷新节奏和维护执行：（`interval`、`debounceMs`、`onBoot`、`waitForBootSync`、`embedInterval`、`commandTimeoutMs`、`updateTimeoutMs`、`embedTimeoutMs`）。
- `limits`：限制召回负载（`maxResults`、`maxSnippetChars`、`maxInjectedChars`、`timeoutMs`）。
- `scope`：与 [`session.sendPolicy`](/gateway/configuration#session) 相同的 schema。默认仅 DM（`deny` 全部，`allow` 直接聊天）；放宽它以在群组/通道中展示 QMD 结果。
  - `match.keyPrefix` 匹配 **规范化的** 会话键（小写，去除任何前导 `agent:<id>:`）。例如：`discord:channel:`。
  - `match.rawKeyPrefix` 匹配 **原始** 会话键（小写），包括 `agent:<id>:`。例如：`agent:main:discord:`。
  - 旧版：`match.keyPrefix: "agent:..."` 仍被视为原始键前缀，但建议使用 `rawKeyPrefix` 以保持清晰。
- 当 `scope` 拒绝搜索时，OpenClaw 记录一条带有派生 `channel`/`chatType` 的警告，以便更容易调试空结果。
- 来自工作区外部的片段在 `memory_search` 结果中显示为 `qmd/<collection>/<relative-path>`；`memory_get` 理解该前缀并从配置的 QMD 集合根目录读取。
- 当 `memory.qmd.sessions.enabled = true` 时，OpenClaw 将清理后的会话记录（用户/助手轮次）导出到 `~/.openclaw/agents/<id>/qmd/sessions/` 下的专用 QMD 集合中，以便 `memory_search` 可以召回最近的对话，而无需触及内置 SQLite 索引。
- 当 `memory.citations` 为 `auto`/`on` 时，`memory_search` 片段现在包含 `Source: <path#line>` 页脚；设置 `memory.citations = "off"` 将路径元数据保持为内部信息（智能体仍然接收路径用于 `memory_get`，但片段文本省略页脚，系统提示词警告智能体不要引用它）。

**示例**

```json5
memory: {
  backend: "qmd",
  citations: "auto",
  qmd: {
    includeDefaultMemory: true,
    update: { interval: "5m", debounceMs: 15000 },
    limits: { maxResults: 6, timeoutMs: 4000 },
    scope: {
      default: "deny",
      rules: [
        { action: "allow", match: { chatType: "direct" } },
        // 规范化的会话键前缀（去除 `agent:<id>:`）。
        { action: "deny", match: { keyPrefix: "discord:channel:" } },
        // 原始会话键前缀（包含 `agent:<id>:`）。
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ]
    },
    paths: [
      { name: "docs", path: "~/notes", pattern: "**/*.md" }
    ]
  }
}
```

**引用与回退**

- `memory.citations` 无论后端如何都适用（`auto`/`on`/`off`）。
- 当 `qmd` 运行时，我们标记 `status().backend = "qmd"` 以便诊断显示哪个引擎提供了结果。如果 QMD 子进程退出或 JSON 输出无法解析，搜索管理器记录警告并返回内置提供商（现有 Markdown 嵌入），直到 QMD 恢复。

### 额外记忆路径

如果你想索引默认工作区布局之外的 Markdown 文件，添加显式路径：

```json5
agents: {
  defaults: {
    memorySearch: {
      extraPaths: ["../team-docs", "/srv/shared-notes/overview.md"]
    }
  }
}
```

注意：

- 路径可以是绝对的或相对于工作区的。
- 目录会递归扫描 `.md` 文件。
- 仅索引 Markdown 文件。
- 符号链接被忽略（文件或目录）。

### Gemini 嵌入（原生）

将提供商设置为 `gemini` 以直接使用 Gemini 嵌入 API：

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-001",
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

注意：

- `remote.baseUrl` 是可选的（默认为 Gemini API 基础 URL）。
- `remote.headers` 可让你在需要时添加额外的头。
- 默认模型：`gemini-embedding-001`。

如果你想使用 **自定义 OpenAI 兼容端点**（OpenRouter、vLLM 或代理），你可以使用 OpenAI 提供商的 `remote` 配置：

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_OPENAI_COMPAT_API_KEY",
        headers: { "X-Custom-Header": "value" }
      }
    }
  }
}
```

如果你不想设置 API 密钥，使用 `memorySearch.provider = "local"` 或设置 `memorySearch.fallback = "none"`。

回退：

- `memorySearch.fallback` 可以是 `openai`、`gemini`、`local` 或 `none`。
- 回退提供商仅在主嵌入提供商失败时使用。

批量索引（OpenAI + Gemini + Voyage）：

- 默认禁用。设置 `agents.defaults.memorySearch.remote.batch.enabled = true` 以启用大规模语料库索引（OpenAI、Gemini 和 Voyage）。
- 默认行为等待批处理完成；如需可调优 `remote.batch.wait`、`remote.batch.pollIntervalMs` 和 `remote.batch.timeoutMinutes`。
- 设置 `remote.batch.concurrency` 控制并行提交的批处理作业数（默认：2）。
- 批量模式在 `memorySearch.provider = "openai"` 或 `"gemini"` 时应用，并使用对应的 API 密钥。
- Gemini 批处理作业使用异步嵌入批处理端点，需要 Gemini Batch API 可用。

为什么 OpenAI 批处理快且便宜：

- 对于大规模回填，OpenAI 通常是我们支持的最快选项，因为我们可以在单个批处理作业中提交多个嵌入请求，并让 OpenAI 异步处理。
- OpenAI 为 Batch API 工作负载提供折扣定价，因此大规模索引运行通常比同步发送相同请求更便宜。
- 参见 OpenAI Batch API 文档和定价了解详情：
  - [https://platform.openai.com/docs/api-reference/batch](https://platform.openai.com/docs/api-reference/batch)
  - [https://platform.openai.com/pricing](https://platform.openai.com/pricing)

配置示例：

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      fallback: "openai",
      remote: {
        batch: { enabled: true, concurrency: 2 }
      },
      sync: { watch: true }
    }
  }
}
```

工具：

- `memory_search` — 返回带有文件 + 行范围的片段。
- `memory_get` — 通过路径读取记忆文件内容。

本地模式：

- 设置 `agents.defaults.memorySearch.provider = "local"`。
- 提供 `agents.defaults.memorySearch.local.modelPath`（GGUF 或 `hf:` URI）。
- 可选：设置 `agents.defaults.memorySearch.fallback = "none"` 以避免远程回退。

### 记忆工具如何工作

- `memory_search` 从 `MEMORY.md` + `memory/**/*.md` 对 Markdown 块（约 400 Token 目标，80 Token 重叠）进行语义搜索。返回片段文本（上限约 700 字符）、文件路径、行范围、分数、提供商/模型，以及是否从本地回退到远程嵌入。不返回完整文件负载。
- `memory_get` 读取特定的记忆 Markdown 文件（相对于工作区），可选从起始行读取 N 行。`MEMORY.md` / `memory/` 之外的路径会被拒绝。
- 两个工具仅在 `memorySearch.enabled` 对智能体解析为 true 时启用。

### 索引什么（以及何时）

- 文件类型：仅 Markdown（`MEMORY.md`、`memory/**/*.md`）。
- 索引存储：每智能体 SQLite 位于 `~/.openclaw/memory/<agentId>.sqlite`（可通过 `agents.defaults.memorySearch.store.path` 配置，支持 `{agentId}` Token）。
- 新鲜度：`MEMORY.md` + `memory/` 上的监视器标记索引为脏（防抖 1.5 秒）。同步在会话开始时、搜索时或按间隔计划，并异步运行。会话记录使用增量阈值触发后台同步。
- 重新索引触发器：索引存储嵌入 **提供商/模型 + 端点指纹 + 分块参数**。如果其中任何一个发生变化，OpenClaw 自动重置并重新索引整个存储。

### 混合搜索（BM25 + 向量）

启用后，OpenClaw 结合：

- **向量相似度**（语义匹配，措辞可以不同）
- **BM25 关键词相关性**（精确 Token 如 ID、环境变量、代码符号）

如果全文搜索在你的平台上不可用，OpenClaw 回退到仅向量搜索。

#### 为什么选择混合搜索？

向量搜索擅长"这意味着同一件事"：

- "Mac Studio gateway host" vs "the machine running the gateway"
- "debounce file updates" vs "avoid indexing on every write"

但在精确的高信号 Token 上可能较弱：

- ID（`a828e60`、`b3b9895a…`）
- 代码符号（`memorySearch.query.hybrid`）
- 错误字符串（"sqlite-vec unavailable"）

BM25（全文）恰好相反：在精确 Token 上很强，在改述上较弱。混合搜索是务实的中间方案：**使用两种检索信号**，这样你可以同时获得"自然语言"查询和"大海捞针"查询的良好结果。

#### 如何合并结果（当前设计）

实现草图：

1. 从两侧检索候选池：

- **向量**：按余弦相似度取前 `maxResults * candidateMultiplier` 个。
- **BM25**：按 FTS5 BM25 排名取前 `maxResults * candidateMultiplier` 个（越低越好）。

2. 将 BM25 排名转换为 0..1 范围的分数：

- `textScore = 1 / (1 + max(0, bm25Rank))`

3. 按块 ID 合并候选并计算加权分数：

- `finalScore = vectorWeight * vectorScore + textWeight * textScore`

注意：

- `vectorWeight` + `textWeight` 在配置解析中归一化为 1.0，因此权重表现为百分比。
- 如果嵌入不可用（或提供商返回零向量），我们仍然运行 BM25 并返回关键词匹配。
- 如果无法创建 FTS5，我们保持仅向量搜索（不会硬失败）。

这不是"信息检索理论上完美的"，但它简单、快速，并且倾向于改善真实笔记的召回率/精确率。如果以后想做得更精致，常见的下一步是互惠排名融合（RRF）或分数归一化（最小/最大或 z-score）后再混合。

配置：

```json5
agents: {
  defaults: {
    memorySearch: {
      query: {
        hybrid: {
          enabled: true,
          vectorWeight: 0.7,
          textWeight: 0.3,
          candidateMultiplier: 4
        }
      }
    }
  }
}
```

### 嵌入缓存

OpenClaw 可以在 SQLite 中缓存 **块嵌入**，这样重新索引和频繁更新（特别是会话记录）不需要重新嵌入未更改的文本。

配置：

```json5
agents: {
  defaults: {
    memorySearch: {
      cache: {
        enabled: true,
        maxEntries: 50000
      }
    }
  }
}
```

### 会话记忆搜索（实验性）

你可以选择索引 **会话记录** 并通过 `memory_search` 展示它们。这受实验性标志控制。

```json5
agents: {
  defaults: {
    memorySearch: {
      experimental: { sessionMemory: true },
      sources: ["memory", "sessions"]
    }
  }
}
```

注意：

- 会话索引是 **选择加入的**（默认关闭）。
- 会话更新带防抖，一旦超过增量阈值就 **异步索引**（尽力而为）。
- `memory_search` 永远不会在索引上阻塞；结果在后台同步完成之前可能略有延迟。
- 结果仍然仅包含片段；`memory_get` 仍然限于记忆文件。
- 会话索引按智能体隔离（仅索引该智能体的会话日志）。
- 会话日志位于磁盘上（`~/.openclaw/agents/<agentId>/sessions/*.jsonl`）。任何具有文件系统访问权限的进程/用户都可以读取它们，因此将磁盘访问视为信任边界。对于更严格的隔离，在不同的操作系统用户或主机下运行智能体。

增量阈值（显示默认值）：

```json5
agents: {
  defaults: {
    memorySearch: {
      sync: {
        sessions: {
          deltaBytes: 100000,   // ~100 KB
          deltaMessages: 50     // JSONL 行数
        }
      }
    }
  }
}
```

### SQLite 向量加速（sqlite-vec）

当 sqlite-vec 扩展可用时，OpenClaw 将嵌入存储在 SQLite 虚拟表（`vec0`）中，并在数据库中执行向量距离查询。这使搜索保持快速，无需将每个嵌入加载到 JS 中。

配置（可选）：

```json5
agents: {
  defaults: {
    memorySearch: {
      store: {
        vector: {
          enabled: true,
          extensionPath: "/path/to/sqlite-vec"
        }
      }
    }
  }
}
```

注意：

- `enabled` 默认为 true；禁用时，搜索回退到在存储嵌入上的进程内余弦相似度计算。
- 如果 sqlite-vec 扩展缺失或加载失败，OpenClaw 记录错误并继续使用 JS 回退（无向量表）。
- `extensionPath` 覆盖捆绑的 sqlite-vec 路径（适用于自定义构建或非标准安装位置）。

### 本地嵌入自动下载

- 默认本地嵌入模型：`hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf`（约 0.6 GB）。
- 当 `memorySearch.provider = "local"` 时，`node-llama-cpp` 解析 `modelPath`；如果 GGUF 缺失，它会 **自动下载** 到缓存（或 `local.modelCacheDir`，如果设置了），然后加载。下载支持断点续传。
- 原生构建要求：运行 `pnpm approve-builds`，选择 `node-llama-cpp`，然后 `pnpm rebuild node-llama-cpp`。
- 回退：如果本地设置失败且 `memorySearch.fallback = "openai"`，我们自动切换到远程嵌入（`openai/text-embedding-3-small`，除非被覆盖）并记录原因。

### 自定义 OpenAI 兼容端点示例

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_REMOTE_API_KEY",
        headers: {
          "X-Organization": "org-id",
          "X-Project": "project-id"
        }
      }
    }
  }
}
```

注意：

- `remote.*` 优先于 `models.providers.openai.*`。
- `remote.headers` 与 OpenAI 头合并；remote 在键冲突时优先。省略 `remote.headers` 则使用 OpenAI 默认值。
