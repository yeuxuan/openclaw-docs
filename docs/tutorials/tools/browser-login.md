---
title: "浏览器手动登录"
sidebarTitle: "手动登录"
---

# 浏览器手动登录（Manual Login）

有些网站需要滑块验证、短信验证码或 CAPTCHA，Agent 无法自动完成这类人机验证。通过手动登录（Manual Login）+ Chrome 配置文件（Chrome Profile）的方式，你可以让 Agent 继承你已有的登录状态。

---

## 工作原理

你先在 Chrome 中手动完成登录，然后将该浏览器配置文件的路径告诉 OpenClaw。Agent 启动浏览器时会直接加载这个配置文件，从而获得与你相同的登录态——无需再次输入密码或通过验证。

---

## 推荐流程：以 X/Twitter 为例

以下是在 X/Twitter 上使用手动登录的完整流程：

**第一步：用 Chrome 手动登录**

打开 Chrome 浏览器，正常登录你的 X/Twitter 账号，完成所有验证步骤。

**第二步：找到 Chrome 配置文件路径**

::: details 各系统默认路径

```bash
# macOS
~/Library/Application Support/Google/Chrome/Default

# Linux
~/.config/google-chrome/Default

# Windows
C:\Users\<你的用户名>\AppData\Local\Google\Chrome\User Data\Default
```

如果你使用了多个 Chrome 配置文件，可以在 Chrome 地址栏输入 `chrome://version/`，查看"个人资料路径"一栏。
:::

**第三步：在 OpenClaw 配置中指定该路径**

```json5
{
  tools: {
    browser: {
      profile: "/Users/yourname/Library/Application Support/Google/Chrome/Default"
    }
  }
}
```

**第四步：启动 Agent 任务**

Agent 使用该配置文件启动 Chrome 时，会自动继承你的登录状态，无需再次验证。

---

## 沙箱化浏览器访问

::: info 什么是沙箱化？
在隔离环境（沙箱）中使用已登录的配置文件时，Agent 的操作被限制在安全边界内，防止意外访问其他网站或泄露数据。
:::

你可以同时启用沙箱模式和 Chrome 配置文件：

```json5
{
  tools: {
    browser: {
      profile: "/Users/yourname/Library/Application Support/Google/Chrome/Default",
      sandbox: true
    }
  }
}
```

---

## 安全提示

::: warning 重要安全提醒
- **不要分享含有登录凭证的配置文件**：Chrome 配置文件中保存了你的 Cookie、密码和登录状态，分享给他人等于分享账号访问权限
- **不要将配置文件路径提交到版本控制**：避免在 Git 仓库中暴露本地路径信息
- **定期清理登录态**：任务完成后，如果不再需要 Agent 访问该账号，建议在 Chrome 中退出登录
:::

---

_下一步：[工具系统总览](/tutorials/tools/)_
