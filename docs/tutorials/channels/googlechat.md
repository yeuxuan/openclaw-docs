---
title: "Google Chat"
sidebarTitle: "Google Chat"
---

# Google Chat（Chat API）

状态：已就绪，支持通过 Google Chat API Webhook（仅 HTTP）进行私信和空间通信。

---

## 快速设置（新手）

1. 创建一个 Google Cloud 项目并启用 **Google Chat API**。
   - 前往：[Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - 如果尚未启用，请启用该 API。
2. 创建一个**服务账户**：
   - 点击 **Create Credentials** > **Service Account**。
   - 随意命名（例如 `openclaw-chat`）。
   - 权限留空（点击 **Continue**）。
   - 有访问权限的主体留空（点击 **Done**）。
3. 创建并下载 **JSON 密钥**：
   - 在服务账户列表中，点击刚创建的账户。
   - 转到 **Keys** 标签页。
   - 点击 **Add Key** > **Create new key**。
   - 选择 **JSON** 并点击 **Create**。
4. 将下载的 JSON 文件存储到网关主机上（例如 `~/.openclaw/googlechat-service-account.json`）。
5. 在 [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) 中创建 Google Chat 应用：
   - 填写**应用信息**：
     - **App name**：（例如 `OpenClaw`）
     - **Avatar URL**：（例如 `https://openclaw.ai/logo.png`）
     - **Description**：（例如 `Personal AI Assistant`）
   - 启用 **Interactive features**。
   - 在 **Functionality** 下，勾选 **Join spaces and group conversations**。
   - 在 **Connection settings** 下，选择 **HTTP endpoint URL**。
   - 在 **Triggers** 下，选择 **Use a common HTTP endpoint URL for all triggers** 并设置为你网关的公共 URL 后加 `/googlechat`。
     - _提示：运行 `openclaw status` 查找你网关的公共 URL。_
   - 在 **Visibility** 下，勾选 **Make this Chat app available to specific people and groups in &lt;Your Domain&gt;**。
   - 在文本框中输入你的邮箱地址（例如 `user@example.com`）。
   - 点击底部的 **Save**。
6. **启用应用状态**：
   - 保存后，**刷新页面**。
   - 查找 **App status** 部分（通常在保存后的顶部或底部附近）。
   - 将状态更改为 **Live - available to users**。
   - 再次点击 **Save**。
7. 使用服务账户路径 + Webhook audience 配置 OpenClaw：
   - 环境变量：`GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - 或配置：`channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`。
8. 设置 Webhook audience 类型 + 值（与你的 Chat 应用配置匹配）。
9. 启动网关。Google Chat 将 POST 到你的 Webhook 路径。

---

## 添加到 Google Chat

网关运行后且你的邮箱已添加到可见性列表中：

1. 前往 [Google Chat](https://chat.google.com/)。
2. 点击**直接消息**旁边的 **+**（加号）图标。
3. 在搜索栏中（通常用于添加联系人），输入你在 Google Cloud Console 中配置的**应用名称**。
   - **注意**：机器人_不会_出现在"应用市场"浏览列表中，因为它是私有应用。你必须按名称搜索。
4. 从结果中选择你的机器人。
5. 点击 **Add** 或 **Chat** 开始一对一对话。
6. 发送"Hello"以触发助手！

---

## 公共 URL（仅 Webhook）

Google Chat Webhook 需要公共 HTTPS 端点。为安全起见，**仅将 `/googlechat` 路径暴露到互联网**。将 OpenClaw 仪表板和其他敏感端点保持在你的私有网络上。

### 方案 A：Tailscale Funnel（推荐）

使用 Tailscale Serve 为私有仪表板服务，使用 Funnel 为公共 Webhook 路径服务。这使 `/` 保持私有，同时仅暴露 `/googlechat`。

1. **检查网关绑定的地址：**

   ```bash
   ss -tlnp | grep 18789
   ```

   注意 IP 地址（例如 `127.0.0.1`、`0.0.0.0` 或你的 Tailscale IP 如 `100.x.x.x`）。

2. **仅将仪表板暴露到 tailnet（端口 8443）：**

   ```bash
   # 如果绑定到 localhost (127.0.0.1 或 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # 如果仅绑定到 Tailscale IP (例如 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **仅公开暴露 Webhook 路径：**

   ```bash
   # 如果绑定到 localhost (127.0.0.1 或 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # 如果仅绑定到 Tailscale IP (例如 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **授权节点进行 Funnel 访问：**
   如果提示，访问输出中显示的授权 URL 以在你的 tailnet 策略中为此节点启用 Funnel。

5. **验证配置：**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

你的公共 Webhook URL 将是：
`https://<node-name>.<tailnet>.ts.net/googlechat`

你的私有仪表板保持仅 tailnet 访问：
`https://<node-name>.<tailnet>.ts.net:8443/`

在 Google Chat 应用配置中使用公共 URL（不带 `:8443`）。

> 注意：此配置在重启后持续有效。如需稍后移除，运行 `tailscale funnel reset` 和 `tailscale serve reset`。

### 方案 B：反向代理（Caddy）

如果你使用像 Caddy 这样的反向代理，仅代理特定路径：

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

使用此配置，任何对 `your-domain.com/` 的请求将被忽略或返回 404，而 `your-domain.com/googlechat` 被安全地路由到 OpenClaw。

### 方案 C：Cloudflare Tunnel

配置你的隧道入口规则以仅路由 Webhook 路径：

- **路径**：`/googlechat` -> `http://localhost:18789/googlechat`
- **默认规则**：HTTP 404（Not Found）

---

## 工作原理

1. Google Chat 向网关发送 Webhook POST。每个请求包含一个 `Authorization: Bearer <token>` 头。
2. OpenClaw 根据配置的 `audienceType` + `audience` 验证 Token：
   - `audienceType: "app-url"` → audience 是你的 HTTPS Webhook URL。
   - `audienceType: "project-number"` → audience 是 Cloud 项目编号。
3. 消息按空间路由：
   - 私信使用会话键 `agent:<agentId>:googlechat:dm:<spaceId>`。
   - 空间使用会话键 `agent:<agentId>:googlechat:group:<spaceId>`。
4. 私信访问默认为配对模式。未知发送者收到配对码；通过以下方式批准：
   - `openclaw pairing approve googlechat <code>`
5. 群组空间默认需要 @提及。如果提及检测需要应用的用户名，请使用 `botUser`。

---

## 目标

使用以下标识符进行投递和白名单：

- 直接消息：`users/<userId>`（推荐）或原始邮箱 `name@example.com`（可变主体）。
- 已弃用：`users/<email>` 被视为用户 ID，而非邮箱白名单。
- 空间：`spaces/<spaceId>`。

---

## 配置要点

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // 可选；帮助提及检测
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890", "name@example.com"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

说明：

- 服务账户凭据也可以通过 `serviceAccount`（JSON 字符串）内联传递。
- 如果未设置 `webhookPath`，默认 Webhook 路径为 `/googlechat`。
- 当 `actions.reactions` 启用时，可通过 `reactions` 工具和 `channels action` 使用表情回应。
- `typingIndicator` 支持 `none`、`message`（默认）和 `reaction`（reaction 需要用户 OAuth）。
- 附件通过 Chat API 下载并存储在媒体管道中（大小受 `mediaMaxMb` 限制）。

---

## 故障排查

### 405 Method Not Allowed

如果 Google Cloud Logs Explorer 显示如下错误：

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

这意味着 Webhook 处理器未注册。常见原因：

1. **通道未配置**：配置中缺少 `channels.googlechat` 部分。验证：

   ```bash
   openclaw config get channels.googlechat
   ```

   如果返回"Config path not found"，添加配置（参见[配置要点](#配置要点)）。

2. **插件未启用**：检查插件状态：

   ```bash
   openclaw plugins list | grep googlechat
   ```

   如果显示"disabled"，在配置中添加 `plugins.entries.googlechat.enabled: true`。

3. **网关未重启**：添加配置后，重启网关：

   ```bash
   openclaw gateway restart
   ```

验证通道正在运行：

```bash
openclaw channels status
# 应显示: Google Chat default: enabled, configured, ...
```

### 其他问题

- 检查 `openclaw channels status --probe` 查看认证错误或缺失的 audience 配置。
- 如果没有消息到达，确认 Chat 应用的 Webhook URL + 事件订阅。
- 如果提及门控阻止回复，将 `botUser` 设置为应用的用户资源名称并验证 `requireMention`。
- 发送测试消息时使用 `openclaw logs --follow` 查看请求是否到达网关。

相关文档：

- [网关配置](/gateway/configuration)
- [安全](/gateway/security)
- [表情回应](/tools/reactions)
