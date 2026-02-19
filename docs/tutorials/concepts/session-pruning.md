---
title: "会话修剪"
sidebarTitle: "会话修剪"
---

# 会话修剪（Session Pruning）

会话修剪在每次 LLM 调用之前从内存上下文中修剪 **旧的工具结果**。它 **不会** 重写磁盘上的会话历史（`*.jsonl`）。

---

## 何时运行

- 当启用 `mode: "cache-ttl"` 且该会话的上次 Anthropic 调用超过 `ttl` 时。
- 仅影响该请求发送给模型的消息。
- 仅对 Anthropic API 调用（和 OpenRouter Anthropic 模型）有效。
- 为获得最佳效果，将 `ttl` 与你的模型 `cacheControlTtl` 匹配。
- 修剪后，TTL 窗口重置，因此后续请求保持缓存直到 `ttl` 再次到期。

---

## 智能默认值（Anthropic）

- **OAuth 或 setup-token** 配置文件：启用 `cache-ttl` 修剪并将心跳设置为 `1h`。
- **API 密钥** 配置文件：启用 `cache-ttl` 修剪，将心跳设置为 `30m`，并在 Anthropic 模型上将 `cacheControlTtl` 默认为 `1h`。
- 如果你显式设置了这些值，OpenClaw **不会** 覆盖它们。

---

## 这改善了什么（成本 + 缓存行为）

- **为什么修剪：** Anthropic 提示缓存仅在 TTL 内适用。如果会话空闲超过 TTL，下一个请求会重新缓存完整提示，除非你先修剪。
- **什么变便宜了：** 修剪减少了 TTL 过期后第一个请求的 **cacheWrite** 大小。
- **为什么 TTL 重置重要：** 一旦修剪运行，缓存窗口重置，因此后续请求可以重用新缓存的提示，而不是重新缓存完整历史。
- **它不做什么：** 修剪不会添加 Token 或"加倍"成本；它只改变 TTL 后第一个请求被缓存的内容。

---

## 什么可以被修剪

- 仅 `toolResult` 消息。
- 用户 + 助手消息 **永远不会** 被修改。
- 最后 `keepLastAssistants` 个助手消息受保护；该截止点之后的工具结果不被修剪。
- 如果没有足够的助手消息来建立截止点，修剪被跳过。
- 包含 **图像块** 的工具结果被跳过（永远不被修剪/清除）。

---

## 上下文窗口估算

修剪使用估算的上下文窗口（字符 ≈ Token × 4）。基础窗口按以下顺序解析：

1. `models.providers.*.models[].contextWindow` 覆盖。
2. 模型定义 `contextWindow`（来自模型注册表）。
3. 默认 `200000` Token。

如果设置了 `agents.defaults.contextTokens`，它被视为解析窗口的上限（取最小值）。

---

## 模式

### cache-ttl

- 仅当上次 Anthropic 调用超过 `ttl`（默认 `5m`）时修剪才运行。
- 运行时：与之前相同的软修剪 + 硬清除行为。

---

## 软修剪 vs 硬清除

- **软修剪**：仅针对过大的工具结果。
  - 保留头尾，插入 `...`，并附加带原始大小的注释。
  - 跳过包含图像块的结果。
- **硬清除**：用 `hardClear.placeholder` 替换整个工具结果。

---

## 工具选择

- `tools.allow` / `tools.deny` 支持 `*` 通配符。
- deny 优先。
- 匹配不区分大小写。
- 空 allow 列表 => 所有工具被允许。

---

## 与其他限制的交互

- 内置工具已经截断自己的输出；会话修剪是额外的一层，防止长时间运行的聊天在模型上下文中累积过多工具输出。
- 压缩是独立的：压缩摘要化并持久化，修剪是每请求的临时操作。参见 [/concepts/compaction](/concepts/compaction)。

---

## 默认值（启用时）

- `ttl`：`"5m"`
- `keepLastAssistants`：`3`
- `softTrimRatio`：`0.3`
- `hardClearRatio`：`0.5`
- `minPrunableToolChars`：`50000`
- `softTrim`：`{ maxChars: 4000, headChars: 1500, tailChars: 1500 }`
- `hardClear`：`{ enabled: true, placeholder: "[Old tool result content cleared]" }`

---

## 示例

默认（关闭）：

```json5
{
  agent: {
    contextPruning: { mode: "off" },
  },
}
```

启用 TTL 感知修剪：

```json5
{
  agent: {
    contextPruning: { mode: "cache-ttl", ttl: "5m" },
  },
}
```

限制修剪到特定工具：

```json5
{
  agent: {
    contextPruning: {
      mode: "cache-ttl",
      tools: { allow: ["exec", "read"], deny: ["*image*"] },
    },
  },
}
```

参见配置参考：[网关配置](/gateway/configuration)
