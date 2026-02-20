---
title: "Linux 浏览器问题排查"
sidebarTitle: "Linux 浏览器排查"
---

# Linux 浏览器问题排查（Linux Browser Troubleshooting）

在 Linux 上启动浏览器工具时，你可能会遇到 CDP（Chrome DevTools Protocol）连接失败的问题。本文帮助你快速定位并解决这些问题。

---

## 根本原因：Linux 沙箱权限限制

Linux 系统对浏览器进程的沙箱权限有严格限制，尤其是在非 root 用户下运行时。Chromium 的内置沙箱机制在某些 Linux 环境中无法正常工作，导致浏览器无法启动。

---

## 解决方案

### 方案一：安装 Google Chrome（推荐）

Snap 版本的 Chromium 有额外的权限限制，推荐使用 Google Chrome 的 deb 包。

```bash
# 下载 Google Chrome 稳定版
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb

# 安装
sudo dpkg -i google-chrome-stable_current_amd64.deb

# 如果依赖缺失，运行修复
sudo apt-get install -f
```

::: info 为什么不推荐 Snap 版 Chromium？
Snap 软件包在沙箱内运行，有额外的系统调用限制（seccomp 过滤），这与 Chrome 自身的沙箱机制产生冲突，导致 CDP 无法正常启动。
:::

---

### 方案二：添加 `--no-sandbox` 启动标志

如果你在非 root 用户环境下仍然遇到权限问题，可以为 Chrome 添加 `--no-sandbox` 标志。

::: warning 安全提醒
`--no-sandbox` 会禁用 Chrome 的进程沙箱，仅建议在受控的开发/测试环境中使用，不建议在生产环境或处理敏感数据时使用。
:::

在 OpenClaw 配置中指定启动参数：

```json5
{
  tools: {
    browser: {
      launchArgs: ["--no-sandbox", "--disable-setuid-sandbox"]
    }
  }
}
```

---

### 方案三：指定 Chrome 可执行文件路径

如果系统中安装了多个浏览器版本，可以明确指定 OpenClaw 使用哪个：

```json5
{
  tools: {
    browser: {
      executablePath: "/usr/bin/google-chrome-stable"
    }
  }
}
```

---

## 验证连接是否正常

安装完成后，运行以下命令验证 Chrome 可以正常启动并接受 CDP 连接：

```bash
# 以远程调试模式启动 Chrome
google-chrome-stable --remote-debugging-port=9222 --no-sandbox &

# 验证 CDP 端点可访问
curl http://localhost:9222/json/version
```

如果返回 JSON 响应，说明 CDP 连接正常。

---

## 常见错误及解决方法

| 错误信息 | 可能原因 | 解决方法 |
|----------|----------|----------|
| `Failed to launch browser` | Chrome 未安装或路径错误 | 安装 Google Chrome 并确认路径 |
| `Permission denied` | 沙箱权限限制 | 添加 `--no-sandbox` 标志 |
| `Connection refused` on port 9222 | Chrome 未启动或端口被占用 | 检查是否有其他 Chrome 实例正在运行 |
| `Error: spawn EACCES` | 可执行文件没有执行权限 | 运行 `chmod +x /usr/bin/google-chrome-stable` |

::: details 完整调试日志查看方法

```bash
# 查看 OpenClaw 的浏览器启动日志
openclaw logs --filter browser

# 或者直接测试 Chrome 启动
google-chrome-stable --headless --remote-debugging-port=9222 2>&1 | head -50
```
:::

---

_下一步：[工具系统总览](/tutorials/tools/)_
