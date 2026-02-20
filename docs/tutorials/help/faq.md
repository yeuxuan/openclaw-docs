---
title: "常见问题 FAQ"
sidebarTitle: "FAQ"
---

# 常见问题（Frequently Asked Questions）

收集了使用 OpenClaw 时最频繁被问到的问题。如果你刚开始上手，建议先把这页快速过一遍。

---

::: details OpenClaw 和 Claude 有什么区别？
**OpenClaw** 是一个 Agent 运行框架，负责管理 Agent 的生命周期、工具调用、通道连接和 Gateway 路由等基础设施。

**Claude** 是 Anthropic 开发的 AI 语言模型，是 OpenClaw 支持的众多 AI 后端之一。

简单来说：OpenClaw 是"壳"，Claude（或其他模型）是"大脑"。你可以在 OpenClaw 里切换使用不同的 AI 模型，而不需要改动其他配置。
:::

::: details 如何更新 OpenClaw？
运行以下命令即可更新到最新版本：

```bash
openclaw update
```

更新完成后，Gateway 会自动重启（如果正在运行）。建议定期更新以获取最新功能和安全修复。
:::

::: details 支持哪些操作系统？
OpenClaw 官方支持：

- **macOS**（Apple Silicon 和 Intel 均支持）
- **Linux**（Ubuntu 20.04+、Debian 11+ 等主流发行版）
- **Windows WSL**（Windows Subsystem for Linux）

原生 Windows（非 WSL）目前不在官方支持范围内。如果你在 Windows 上使用，推荐通过 WSL 2 安装。
:::

::: details 如何重置配置？
如果配置出错或想从头开始，运行：

```bash
openclaw reset
```

::: warning 注意
`openclaw reset` 会清除所有本地配置，包括已配对的 Gateway 信息和通道凭证。执行前请确认你有备份或记录了重要配置。
:::
:::

---

::: details 为什么 Agent 不回复？
Agent 不回复通常有以下几个原因，按顺序逐一检查：

1. **API Key 无效或过期**
   ```bash
   openclaw config show
   ```
   确认对应模型提供商的 API Key 已正确设置。

2. **网络连接问题**
   确认你能正常访问 AI 模型的 API 端点（如 `api.anthropic.com`）。

3. **Gateway 未运行**
   ```bash
   openclaw gateway status
   ```
   如果 Gateway 未运行，执行 `openclaw gateway start` 启动它。

4. **查看日志定位具体错误**
   ```bash
   openclaw logs
   ```
:::

::: details 如何查看日志？
```bash
# 查看所有日志
openclaw logs

# 只看 Gateway 相关日志
openclaw logs --filter gateway

# 查看最近 100 条
openclaw logs --tail 100
```

更多调试选项请参考 [调试指南](./debugging)。
:::

::: details 如何卸载 OpenClaw？
```bash
openclaw uninstall
```

这会移除 OpenClaw 的可执行文件和相关系统服务。如果你想同时清除所有数据和配置，加上 `--purge` 参数：

```bash
openclaw uninstall --purge
```

::: warning 不可逆操作
`--purge` 会删除 `~/.openclaw/` 目录下的所有内容，包括日志、配置和缓存，且无法恢复。
:::
:::

---

::: details 数据存储在哪里？
OpenClaw 的所有数据默认存储在：

```text
~/.openclaw/
```

目录结构如下：

```text
~/.openclaw/
├── config.json5      # 主配置文件
├── logs/             # 日志文件
├── scripts/          # 自定义脚本
└── workspaces/       # Agent 工作区
```

你可以通过环境变量 `OPENCLAW_HOME` 修改默认路径，详见 [环境变量](./environment)。
:::

::: details 支持哪些 AI 模型？
OpenClaw 支持多种 AI 模型后端：

| 提供商 | 代表模型 |
|--------|----------|
| Anthropic | Claude 3.5 Sonnet、Claude 3 Opus 等 |
| OpenAI | GPT-4o、GPT-4 Turbo 等 |
| Ollama | Llama 3、Mistral 等本地模型 |
| 其他 | 兼容 OpenAI API 格式的任意模型 |

切换模型只需在配置中更改 `model` 字段，无需修改其他设置。
:::

::: details 如何在多台设备间同步？
通过 **Gateway 远程连接**实现多设备访问：

1. 在主机上启动 Gateway 并对外暴露
2. 在其他设备上通过配对（Pairing）连接到主机 Gateway
3. 所有设备共享同一个 Gateway 实例，配置和会话状态保持一致

```bash
# 在其他设备上配对到远程 Gateway
openclaw pairing --gateway https://your-gateway-host:3000
```

更多内容请参考 [Gateway 配置指南](../gateway/index)。
:::

---

_下一步：[调试指南](./debugging)_
