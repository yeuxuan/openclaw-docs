---
title: "插件系统"
sidebarTitle: "插件系统"
---

# 插件系统（Plugin System）

插件系统让你能够在不修改 OpenClaw 核心代码的情况下，扩展其功能——添加新工具、接入新的模型提供商、创建新的聊天通道，甚至运行后台服务。

---

## 快速开始

```bash
# 查看已安装的插件
openclaw plugins list

# 安装插件
openclaw plugins install <插件名称>

# 启用/禁用插件
openclaw plugins enable <插件名称>
openclaw plugins disable <插件名称>

# 卸载插件
openclaw plugins uninstall <插件名称>
```

---

## 可用官方插件

| 插件名称 | 功能 |
|---------|------|
| `lobster` | 工作流运行时 |
| `firecrawl` | 高级网页抓取 |
| `clawhub` | 技能包市场客户端 |
| `reactions` | 消息表情回应 |
| `thinking` | 扩展思考模式 |

---

## 发现与优先级（Discovery & Priority）

OpenClaw 按以下顺序搜索插件：

1. 项目级插件目录：`.openclaw/plugins/`
2. 用户级插件目录：`~/.openclaw/plugins/`
3. 系统级插件目录：`/etc/openclaw/plugins/`
4. 官方插件注册表（ClawHub）

优先级从高到低，项目级插件会覆盖同名的系统级插件。

---

## 插件 ID 与命名

每个插件有唯一的标识符，格式为：

```text
<作者>/<插件名>[@版本]
```

例如：`openclaw/firecrawl@2.1.0`、`community/my-tool`

官方插件可以省略作者前缀，直接使用插件名。

---

## 插件配置（Config）

在全局配置文件中为插件提供配置：

```json5
{
  plugins: {
    "firecrawl": {
      apiKey: "${FIRECRAWL_API_KEY}",
      stealth: true
    },
    "lobster": {
      maxParallelSteps: 5,
      defaultTimeout: 60
    }
  }
}
```

---

## 插件槽（Plugin Slots）

插件可以在以下系统钩子点（Slots）注入自定义逻辑：

| 插件槽 | 触发时机 |
|--------|----------|
| `before-message` | Agent 接收消息前 |
| `after-message` | Agent 响应消息后 |
| `before-tool-call` | 工具调用前 |
| `after-tool-call` | 工具调用后 |
| `on-session-start` | 会话开始时 |
| `on-session-end` | 会话结束时 |

---

## 插件类型详解

::: details Provider 插件：扩展模型提供商

Provider 插件让你接入 OpenClaw 官方未支持的 LLM 服务：

```json5
// 插件配置示例
{
  type: "provider",
  name: "my-llm",
  endpoint: "https://api.my-llm.com/v1",
  models: ["my-model-7b", "my-model-13b"]
}
```
:::

::: details 通道插件（Channel Plugin）：添加新聊天通道

通道插件将 OpenClaw 接入新的消息平台：

- 实现 `onMessage(msg)` 接收消息
- 调用 `sendMessage(reply)` 发送响应
- 注册到 `channel` 插件槽

支持的通道类型：Webhook、WebSocket、轮询
:::

::: details Agent 工具插件：为 Agent 添加新工具

```javascript
// 工具插件示例结构
module.exports = {
  name: "my-tool",
  description: "我的自定义工具",
  parameters: {
    input: { type: "string", description: "输入内容" }
  },
  async execute({ input }) {
    // 工具逻辑
    return { result: `处理结果: ${input}` };
  }
};
```
:::

::: details 注册 Gateway RPC 方法

插件可以向 Gateway 注册新的 API 方法，供外部系统调用：

```javascript
gateway.register("myPlugin.doSomething", async (params) => {
  return { status: "ok", data: params };
});
```
:::

::: details 自动回复命令（斜杠命令）

插件可以注册斜杠命令，用户在聊天中输入 `/命令名` 即可触发：

```javascript
plugin.registerCommand("/analyze", async (args, context) => {
  return `分析结果：${args}`;
});
```
:::

::: details 后台服务

插件可以运行持久化的后台进程，如定时任务、消息监听等：

```javascript
plugin.startService(async () => {
  // 每分钟执行一次
  setInterval(() => checkForUpdates(), 60000);
});
```
:::

---

## Control UI（界面管理）

在 OpenClaw 的 Web 界面中，你可以通过"设置 → 插件"页面图形化管理插件：启用/禁用、查看日志、修改配置。

---

## Skills 集成

插件可以通过 Skills 接口将其功能暴露为 Agent 可调用的技能：

```json5
{
  skills: {
    "my-tool-skill": {
      provider: "my-tool-plugin",
      description: "使用我的工具处理数据"
    }
  }
}
```

---

## 分发（Distribution）

开发完成的插件可以通过以下方式分发：

1. **发布到 ClawHub**：通过 `openclaw clawhub publish` 提交审核
2. **私有 npm 包**：发布到私有 npm 仓库，团队内共享
3. **本地路径**：直接将插件目录放入 `.openclaw/plugins/`

---

## 安全

::: warning 插件安全审核
- 安装第三方插件前，请阅读其源码和权限申请列表
- 插件运行在与 OpenClaw 主进程相同的权限下，恶意插件可能访问系统资源
- 优先选择 ClawHub 上标注为 "Verified" 的官方审核插件
- 定期更新插件以获取安全补丁
:::

---

_下一步：[工具系统总览](/tutorials/tools/)_
