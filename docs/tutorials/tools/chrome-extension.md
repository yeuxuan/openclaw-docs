---
title: "Chrome 扩展"
sidebarTitle: "Chrome 扩展"
---

# Chrome 扩展（Chrome Extension）

OpenClaw 的 Chrome 扩展让浏览器与 Agent 深度集成，你可以直接在浏览器中控制 Agent、查看状态，以及连接远程 OpenClaw 实例。

---

## 安装方式

### 方式一：从 Chrome 应用商店安装

在 Chrome 应用商店搜索"OpenClaw"，点击"添加至 Chrome"即可完成安装。

### 方式二：加载未打包扩展（开发者模式）

如果你需要使用开发版或自定义版本：

1. 打开 Chrome，在地址栏输入 `chrome://extensions/`
2. 开启右上角的"开发者模式"开关
3. 点击"加载已解压的扩展程序"
4. 选择 OpenClaw 扩展所在的本地目录

::: details 扩展文件默认路径

```bash
# macOS/Linux
~/.openclaw/extensions/chrome

# Windows
C:\Users\<你的用户名>\.openclaw\extensions\chrome
```
:::

---

## 基本使用

安装后，Chrome 工具栏会出现 OpenClaw 图标，Badge 显示当前连接状态：

| Badge 颜色 | 含义 |
|-----------|------|
| 绿色 | 已连接到 OpenClaw 实例 |
| 灰色 | 未连接 |
| 红色 | 连接出错 |

点击图标可以打开控制面板，查看当前运行的 Agent 并发送指令。

---

## 附加与分离（Attach / Detach）

你可以将扩展连接到特定的 Agent 会话：

**附加（Attach）**：在控制面板选择目标 Agent 会话，点击"附加"后扩展会与该 Agent 绑定，Agent 的浏览器操作将通过当前 Chrome 窗口执行。

**分离（Detach）**：完成任务后点击"分离"，断开扩展与 Agent 的绑定关系。

---

## 连接远程 OpenClaw 实例

如果你的 OpenClaw 运行在远程服务器上，可以通过 Gateway 连接：

```json5
{
  tools: {
    browser: {
      extension: {
        gatewayUrl: "wss://your-server.example.com/gateway"
      }
    }
  }
}
```

::: tip 端口转发方法
如果远程实例没有公网访问，可以通过 SSH 端口转发建立连接：

```bash
# 将远程 3000 端口映射到本地
ssh -N -L 3000:localhost:3000 user@your-server.example.com
```

然后在扩展中填写本地地址 `ws://localhost:3000/gateway`。
:::

---

## 沙箱化与权限隔离

::: info 扩展权限说明
Chrome 扩展运行在独立的权限上下文中。OpenClaw 扩展仅申请以下必要权限：
- `activeTab`：访问当前活动标签页
- `storage`：保存连接配置
- `nativeMessaging`：与本地 OpenClaw 进程通信

扩展不会读取你浏览器中的密码或其他敏感数据。
:::

---

## 安全含义

::: warning 注意事项
- 不要将扩展连接到不可信的远程 OpenClaw 实例
- 远程 Gateway URL 应使用 WSS（加密 WebSocket），不要使用明文 WS
- 定期检查已连接的 Agent 会话，及时分离不再需要的连接
:::

---

_下一步：[工具系统总览](/tutorials/tools/)_
