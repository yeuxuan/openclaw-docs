---
title: "Gateway Portals"
sidebarTitle: "Portals"
description: "通过 Gateway 让操作者安全访问 Agent 启动的本地开发服务器。"
---

# Gateway Portals

Portal 把 Gateway 主机上运行的开发服务器代理到操作者浏览器，并在“控制 UI → Portals”里显示。HTTP、WebSocket 与热更新都走同一个 Portal。

你可以直接对 Agent 说“在 Portal 里打开这个应用”。打开 Portal 只建立代理监听；Agent 仍要用后台 `exec` 启动服务，并在该命令环境里提供 `PORT` 和 `PUBLIC_URL`。

## 声明工作区开发服务

可在仓库提交 `.openclaw/portals.json`：

```json
{
  "portals": [
    {
      "name": "web",
      "command": "pnpm dev",
      "cwd": ".",
      "port": 3000,
      "title": "App",
      "description": "Use the seeded test account."
    }
  ]
}
```

Gateway 不会自动执行这里的命令；它只帮助 Agent 发现可用服务。

## 权限和网络边界

`portal` 属于 `group:ui` 和 `coding` Profile，沙箱会话不会获得它。要全局关闭：

```json5
{
  tools: { deny: ["portal"] }
}
```

Portal 监听与 Gateway 相同的网络接口。Gateway 绑定 LAN 或 tailnet 时，Portal 端口也会出现在该网络上；访问仍需要 Portal Token，但不希望宿主机开放这些应用端口时，应直接 deny 该工具。

每个 Portal 使用独立 Origin、Token 和 Cookie 前缀，Token 不会转发给目标应用。Gateway 重启后 Portal 会全部结束。

出现 502 时，通常是目标应用还没监听所选端口；远程浏览器打不开而 Gateway 正常时，通常是隧道或代理只暴露了主 Gateway 端口，没有暴露 Portal 的独立监听端口。

上游来源：[`docs/gateway/portals.md`](https://github.com/openclaw/openclaw/blob/main/docs/gateway/portals.md)。
