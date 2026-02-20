---
title: "浏览器工具"
sidebarTitle: "浏览器工具"
---

# 浏览器工具（Browser Tool）

浏览器工具让 Agent 能够控制真实的浏览器——打开网页、点击元素、填写表单、截图，实现完整的网页自动化。你不需要手动编写爬虫，Agent 会像真人一样操作浏览器。

---

## 快速上手

**第一步：安装 Playwright**

```bash
npx playwright install chromium
```

**第二步：确认浏览器工具已启用**

浏览器工具默认启用。检查你的配置文件，确保没有将其列入 `disabled`：

```json5
{
  tools: {
    browser: {
      enabled: true
    }
  }
}
```

**第三步：让 Agent 使用浏览器**

直接告诉 Agent 需要访问某个网页，它会自动调用浏览器工具：

```text
帮我打开 https://example.com 并截图首页
```

---

## 配置说明

```json5
{
  tools: {
    browser: {
      enabled: true,
      remote: false,        // false = 使用本地浏览器，true = 使用远程浏览器服务
      profile: "default"    // 浏览器配置文件名称
    }
  }
}
```

### 配置项说明

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | boolean | `true` | 是否启用浏览器工具 |
| `remote` | boolean | `false` | 是否使用远程浏览器服务 |
| `profile` | string | `"default"` | 浏览器配置文件（隔离 Cookie 和登录状态） |

---

## 本地 vs 远程浏览器

### 本地浏览器（默认）

Agent 直接控制你计算机上安装的 Chromium 浏览器。适合个人使用场景。

```json5
{
  tools: {
    browser: {
      remote: false
    }
  }
}
```

### 远程浏览器

通过 [Browserless](https://browserless.io) 等云端浏览器服务运行。适合服务器部署、无 GUI 环境或需要大规模并发的场景。

```json5
{
  tools: {
    browser: {
      remote: true,
      remoteUrl: "wss://chrome.browserless.io?token=${BROWSERLESS_TOKEN}"
    }
  }
}
```

::: tip Browserless 集成
使用 Browserless 时，你需要注册账号并获取 API Token。云端浏览器不占用本地资源，适合持续运行的自动化任务。
:::

---

## Node Browser 代理（Node Browser Agent）

在分布式节点部署中，可以为每个节点配置独立的浏览器代理，实现隔离的浏览器会话管理。

::: details 查看分布式节点配置示例
```json5
{
  nodes: {
    "worker-1": {
      tools: {
        browser: {
          enabled: true,
          remote: true,
          remoteUrl: "wss://node1.browserless.io?token=${NODE1_TOKEN}"
        }
      }
    }
  }
}
```
:::

---

## 快照（Snapshot）和引用（Refs）

Agent 在浏览器操作过程中可以保存页面快照，便于后续引用和分析。

```bash
# 手动截图并保存
openclaw browser screenshot --output ./screenshots/page.png

# 打开指定网址
openclaw browser open https://example.com
```

快照保存后，Agent 可以通过引用（Ref）在后续步骤中访问截图内容，无需重新加载页面。

---

## 等待功能（Wait）

浏览器工具支持等待特定元素加载后再继续操作，避免因页面未完全加载导致的失败：

::: details 等待策略说明
- **等待元素出现**：等待页面中某个 CSS 选择器对应的元素出现
- **等待网络空闲**：等待页面所有网络请求完成
- **固定时间等待**：等待指定毫秒数

这些策略由 Agent 根据任务自动选择，通常不需要手动配置。
:::

---

## CDP 调试连接

你可以通过 Chrome DevTools Protocol（CDP）连接到 Agent 正在控制的浏览器，实时查看操作过程：

::: details 如何连接 CDP 调试
1. 启动带调试端口的 OpenClaw：
   ```bash
   openclaw start --browser-debug-port 9222
   ```
2. 在 Chrome 浏览器地址栏输入：
   ```
   chrome://inspect
   ```
3. 点击 "Configure..." 添加 `localhost:9222`，即可看到 Agent 控制的浏览器标签页。
:::

---

## 安全与隔离

::: warning 安全注意
- **Cookie 隔离**：不同 `profile` 配置完全隔离，Agent 无法跨配置文件访问登录状态
- **登录凭证处理**：不要让 Agent 在不受信任的网站输入真实密码。建议为自动化场景创建专用账号
- **沙箱运行**：本地浏览器运行在 Playwright 的沙箱环境中，与系统其他浏览器实例隔离
:::

---

## CLI 命令参考

```bash
# 打开网页
openclaw browser open <url>

# 截取当前页面截图
openclaw browser screenshot [--output <path>]

# 查看当前浏览器状态
openclaw browser status
```

---

_下一步：[执行工具（Exec Tool）](/tutorials/tools/exec)_
