---
title: "网络工具"
sidebarTitle: "网络工具"
---

# 网络工具（Web Tools）

网络工具（Web Tools）包括两个核心能力：**web_search**（搜索网络）和 **web_fetch**（抓取网页内容）。有了这两个工具，Agent 可以主动获取最新信息，不再局限于训练数据的截止日期。

---

## 快速上手

**第一步：获取 Brave Search API Key**

推荐使用 Brave Search 作为搜索提供商：

1. 访问 [brave.com/search/api](https://brave.com/search/api)
2. 注册账号并创建 API Key
3. 将 API Key 保存到环境变量：
   ```bash
   export BRAVE_API_KEY="your-api-key-here"
   ```

**第二步：配置网络工具**

```json5
{
  tools: {
    web: {
      search: {
        provider: "brave",
        apiKey: "${BRAVE_API_KEY}"
      },
      fetch: {
        enabled: true
      }
    }
  }
}
```

**第三步：让 Agent 搜索信息**

```text
帮我搜索 OpenAI 最新发布的模型信息
```

Agent 会自动调用 web_search，获取最新结果并整合到回复中。

---

## 搜索提供商选择

### Brave Search（推荐）

Brave Search 提供独立索引，不依赖 Google 或 Bing，隐私保护较好：

```json5
{
  tools: {
    web: {
      search: {
        provider: "brave",
        apiKey: "${BRAVE_API_KEY}",
        count: 10,          // 返回搜索结果数量
        safeSearch: "moderate"  // 安全过滤：off / moderate / strict
      }
    }
  }
}
```

### Perplexity（AI 增强搜索）

Perplexity 在搜索结果基础上增加了 AI 摘要，适合需要综合信息的场景：

```json5
{
  tools: {
    web: {
      search: {
        provider: "perplexity",
        apiKey: "${PERPLEXITY_API_KEY}",
        model: "sonar"  // Perplexity 使用的模型
      }
    }
  }
}
```

::: tip 如何选择
- 需要原始搜索结果 → 选 Brave Search
- 需要 AI 整合分析的摘要 → 选 Perplexity
- 搜索量较大、成本敏感 → 选 Brave Search（更经济）
:::

---

## 完整配置示例

```json5
{
  tools: {
    web: {
      search: {
        provider: "brave",
        apiKey: "${BRAVE_API_KEY}",
        count: 10,              // 每次搜索返回的结果数
        safeSearch: "moderate"  // 安全过滤级别
      },
      fetch: {
        enabled: true,
        maxSize: "1MB",         // 单次抓取的最大内容大小
        timeout: 15000          // 超时时间（毫秒）
      }
    }
  }
}
```

---

## web_search 配置详解

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `provider` | string | `"brave"` | 搜索提供商 |
| `apiKey` | string | - | API Key（必填） |
| `count` | number | `5` | 返回搜索结果数量 |
| `safeSearch` | string | `"moderate"` | 安全过滤：`off` / `moderate` / `strict` |

---

## web_fetch 配置详解

`web_fetch` 允许 Agent 直接访问指定 URL 并提取页面内容：

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | boolean | `true` | 是否启用网页抓取 |
| `maxSize` | string | `"1MB"` | 单次抓取内容大小上限 |
| `timeout` | number | `15000` | 请求超时时间（毫秒） |

::: warning
web_fetch 会访问任意 URL，请注意：
- 不要让 Agent 抓取包含敏感信息的内部网络地址
- 大型页面可能消耗大量 Token，建议设置合理的 `maxSize` 限制
:::

---

## Firecrawl 备用方案

当主要搜索工具失败或需要更复杂的网页内容提取时，可以配置 Firecrawl 作为备用：

::: details Firecrawl 集成配置
Firecrawl 提供更强大的网页内容提取能力，支持 JavaScript 渲染的动态页面：

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true,
        fallback: {
          provider: "firecrawl",
          apiKey: "${FIRECRAWL_API_KEY}"
        }
      }
    }
  }
}
```

Firecrawl 作为备用方案，只在主要抓取方法失败时启用，不影响正常操作流程。
:::

---

## 禁用网络工具

如果你的 Agent 不需要访问互联网（如处理敏感数据的内部 Agent），可以完全禁用：

```json5
{
  tools: {
    disabled: ["web"]
  }
}
```

---

_下一步：[LLM 任务工具](/tutorials/tools/llm-task) | [工具系统总览](/tutorials/tools/)_
