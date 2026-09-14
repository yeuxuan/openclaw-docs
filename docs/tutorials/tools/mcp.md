---
title: "连接 MCP Server"
sidebarTitle: "MCP"
description: "从控制 UI、CLI 或配置把第三方 MCP Server 的工具接入 OpenClaw。"
---

# 连接 MCP Server

MCP Server 可以向 Agent 提供工具、资源和 Prompt。OpenClaw 的连接定义保存在 `mcp.servers`，接进来的工具仍受 Tool Profile 和 Policy 限制；连接 MCP 不会绕过权限控制。

这里讲的是“把第三方 MCP 接到 OpenClaw”。如果要把 OpenClaw 通道会话提供给其他 MCP Client，请使用 `openclaw mcp serve`。

## 从 CLI 添加并探测

本地 stdio：

```bash
openclaw mcp add local-tools \
  --command node \
  --arg ./dist/mcp-server.js \
  --cwd /srv/openclaw-tools

openclaw mcp doctor local-tools --probe
```

远程 Streamable HTTP，并只暴露部分工具：

```bash
openclaw mcp add docs \
  --url https://mcp.example.com/mcp \
  --transport streamable-http \
  --include 'search,read_*'

openclaw mcp doctor docs --probe
```

保存配置只表示字段已写入；还要运行 `doctor --probe`，确认服务可达并确实返回了工具清单。

## 直接配置

```json5
{
  mcp: {
    servers: {
      docs: {
        url: "https://mcp.example.com/mcp",
        transport: "streamable-http",
        enabled: true,
        connectionTimeoutMs: 5000,
        requestTimeoutMs: 20000,
        toolFilter: { include: ["search", "read_*"] },
      },
    },
  },
}
```

HTTP Server 需要 OAuth 时设置相应认证元数据，然后运行：

```bash
openclaw mcp login <name>
```

Stdio 启动失败先检查 Gateway 进程能否找到 `command`，以及 `cwd` 是否存在。修改后正在运行的 Gateway/Agent 可能还需要 reload 或重启。

上游来源：[`docs/tools/mcp.md`](https://github.com/openclaw/openclaw/blob/main/docs/tools/mcp.md)。
