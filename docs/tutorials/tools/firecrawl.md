---
title: "Firecrawl 爬虫工具"
sidebarTitle: "Firecrawl"
---

# Firecrawl 爬虫工具

Firecrawl 是一个强大的网页内容抓取服务，能够绕过常见的反爬检测机制，支持 JavaScript 渲染页面的内容提取。当 OpenClaw 内置的 `web_fetch` 工具无法抓取某个页面时，可以自动切换到 Firecrawl。

---

## 为什么需要 Firecrawl？

许多现代网站采用了反爬措施：

- 需要 JavaScript 渲染才能显示内容（SPA 应用）
- 检测无头浏览器特征并拒绝访问
- 使用 Cloudflare 或其他 WAF 拦截爬虫请求

Firecrawl 通过隐身模式（Stealth Mode）和真实浏览器环境解决这些问题。

---

## 获取 API Key

1. 访问 [firecrawl.dev](https://firecrawl.dev) 注册账号
2. 在控制台找到 API Key
3. 将其配置到 OpenClaw 中

---

## 配置方法

在 OpenClaw 配置文件中添加 Firecrawl 配置：

```json5
{
  tools: {
    web: {
      fetch: {
        firecrawl: {
          apiKey: "${FIRECRAWL_API_KEY}"
        }
      }
    }
  }
}
```

::: tip 推荐使用环境变量
将 API Key 存储在环境变量 `FIRECRAWL_API_KEY` 中，避免将密钥直接写入配置文件。

```bash
# 在 shell 配置文件（~/.bashrc 或 ~/.zshrc）中添加
export FIRECRAWL_API_KEY="fc-your-api-key-here"
```
:::

---

## 作为 web_fetch 的备用（Fallback）

配置 Firecrawl 后，OpenClaw 会按以下策略决定是否使用它：

1. 首先尝试内置的 `web_fetch` 工具（免费、快速）
2. 如果抓取失败或返回内容不完整，自动切换到 Firecrawl
3. Firecrawl 使用隐身模式抓取，返回完整的页面内容

你也可以在任务中明确指定使用 Firecrawl：

```bash
openclaw run "用 Firecrawl 抓取 https://example.com 的最新价格信息"
```

---

## 隐身模式与机器人规避

::: info Firecrawl 如何绕过反爬检测？
- **真实浏览器指纹**：模拟真实用户的浏览器特征（User-Agent、字体、分辨率等）
- **JavaScript 渲染**：完整执行页面 JavaScript，等待动态内容加载完成
- **IP 轮换**：自动切换出口 IP，避免触发频率限制
- **行为模拟**：模拟人类的滚动、点击行为
:::

::: warning 合规使用提醒
使用 Firecrawl 抓取网站内容时，请遵守目标网站的使用条款（ToS）和 `robots.txt` 规定。不要将其用于未经授权的数据采集。
:::

---

## 常见问题

::: details API 调用失败怎么办？

1. 检查 API Key 是否正确配置且未过期
2. 确认账号余额是否充足（Firecrawl 按使用量计费）
3. 查看 Firecrawl 官方状态页确认服务是否正常
4. 检查目标 URL 是否在 Firecrawl 支持的抓取范围内

:::

::: details 抓取结果不完整怎么办？

某些页面需要登录后才能查看完整内容，这类情况 Firecrawl 也无法解决。建议结合浏览器工具和手动登录（Manual Login）来处理需要身份验证的页面。

:::

---

_下一步：[工具系统总览](/tutorials/tools/)_
