---
title: "Claude Max API 代理"
sidebarTitle: "Claude Max API 代理"
---

# Claude Max API 代理

**claude-max-api-proxy** 是一个社区工具，可以将你的 Claude Max/Pro 订阅暴露为 OpenAI 兼容的 API 端点。这允许你使用任何支持 OpenAI API 格式的工具来使用你的订阅。

---

## 为什么使用它？

| 方式                    | 费用                                                | 适用场景                                   |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| Anthropic API           | 按 Token 计费（Opus 约 $15/M 输入，$75/M 输出）    | 生产应用，大流量                           |
| Claude Max 订阅         | $200/月 固定费用                                    | 个人使用，开发，无限用量                   |

如果你有 Claude Max 订阅并希望与 OpenAI 兼容的工具一起使用，这个代理可以为你节省大量费用。

---

## 工作原理

```text
Your App → claude-max-api-proxy → Claude Code CLI → Anthropic (via subscription)
     (OpenAI format)              (converts format)      (uses your login)
```

该代理：

1. 在 `http://localhost:3456/v1/chat/completions` 接受 OpenAI 格式的请求
2. 将其转换为 Claude Code CLI 命令
3. 以 OpenAI 格式返回响应（支持流式传输）

---

## 安装

```bash
# 需要 Node.js 20+ 和 Claude Code CLI
npm install -g claude-max-api-proxy

# 验证 Claude CLI 已认证
claude --version
```

---

## 使用方法

### 启动服务器

```bash
claude-max-api
# 服务器运行在 http://localhost:3456
```

### 测试

```bash
# 健康检查
curl http://localhost:3456/health

# 列出模型
curl http://localhost:3456/v1/models

# 聊天补全
curl http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### 与 OpenClaw 一起使用

你可以将 OpenClaw 指向该代理作为自定义 OpenAI 兼容端点：

```json5
{
  env: {
    OPENAI_API_KEY: "not-needed",
    OPENAI_BASE_URL: "http://localhost:3456/v1",
  },
  agents: {
    defaults: {
      model: { primary: "openai/claude-opus-4" },
    },
  },
}
```

---

## 可用模型

| 模型 ID           | 映射到          |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

---

## 在 macOS 上自动启动

创建一个 LaunchAgent 来自动运行代理：

```bash
cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.claude-max-api</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
EOF

launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
```

---

## 链接

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **问题反馈:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

---

## 注意事项

- 这是一个**社区工具**，非 Anthropic 或 OpenClaw 官方支持
- 需要一个有效的 Claude Max/Pro 订阅，且 Claude Code CLI 已完成认证
- 代理在本地运行，不会向任何第三方服务器发送数据
- 完全支持流式响应

---

## 另请参阅

- [Anthropic 提供商](/providers/anthropic) - OpenClaw 与 Claude setup-token 或 API 密钥的原生集成
- [OpenAI 提供商](/providers/openai) - 用于 OpenAI/Codex 订阅
