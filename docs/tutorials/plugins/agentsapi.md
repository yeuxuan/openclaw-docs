---
title: "Agents API 运行时"
sidebarTitle: "Agents API"
description: "用 bundled agentsapi 插件把 OpenClaw 通道、记忆与工具接到 OpenAI Agents API，区分托管环境和自托管执行器。"
---

# Agents API：把 Agent 循环放到 OpenAI 云端

bundled `agentsapi` 插件会用 Agents API harness 替换 OpenClaw 内置 harness，底层使用 Codex。Agent 的对话与工具循环运行在 OpenAI 云端；OpenClaw 继续连接你的聊天通道、个人说明、记忆和已配置工具。

托管模式还提供 Linux 执行环境，适合代码、数据处理、网页研究和文件生成。它面向个人、单用户 Gateway；需要命令在自有基础设施上执行时，再看后面的自托管路线。

## 最小可用配置

先准备 OpenAI API Key。当前 Agents API 集成不使用 SIWC 或 Codex 订阅登录：

```bash
openclaw models auth login --provider openai --method api-key
```

密钥需要 Agents / Responses 读写和 Models 读取权限。然后把 `YOUR_MODEL_ID` 换成该项目真实可用的模型：

```json5
{
  plugins: {
    entries: {
      agentsapi: { enabled: true },
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/YOUR_MODEL_ID" },
      models: {
        "openai/YOUR_MODEL_ID": {
          agentRuntime: { id: "agentsapi" },
        },
      },
    },
  },
}
```

如果使用 `plugins.allow`，同时加入 `agentsapi` 和 `openai`。启用插件只是让 runtime 可用；真正选择它的是模型行里的 `agentRuntime.id`。

新开会话后可以用一个可验证任务检查链路：

> 用 Python 计算 1 到 100 的平方和，并给出结果。

正确结果应为 `338350`。再让它计算 1 到 200，确认 follow-up 仍使用同一 Agents API session。

## 文件和 MCP

- 输入附件进入 `/workspace/inputs`。
- 要返回的文件写到 `/workspace/outputs` 并在回复中返回。
- 单文件上限 5 MiB、每回合总计 10 MiB，输入与输出各最多 50 个文件。
- 托管 workspace 与 Gateway workspace 是两套文件系统；会话保存不代表托管文件永久保留，重要输出要及时下载。

远程 MCP 使用 `streamable-http`，托管环境必须能访问服务器 URL；其中的 `localhost` 指托管环境自己。修改 MCP 配置或凭据后用 `/new` 或 `/reset` 新建会话。

## 自托管执行：不要把“会话隔离”误当成主机隔离

自托管仍把 harness 放在 OpenAI 云端，但命令/文件操作通过 executor controller 连接你主机上的 `codex exec-server`。每个 Agents API session 都有独立 environment ID、连接 URL 和 executor 进程；多个 executor 可以共享同一持久主机与 workspace。

共享 workspace 时，会话历史分开，但文件与凭据并不隔离。并发会话可能同时修改同一文件；需要隔离时使用不同 workspace、系统用户或主机。

示例配置：

```json5
{
  plugins: {
    entries: {
      agentsapi: {
        enabled: true,
        config: {
          environment: "self_hosted",
          executorController: "my-executor",
        },
      },
      "my-executor": { enabled: true },
    },
  },
}
```

`my-executor` 只是示例，不是 bundled SSH launcher。OpenClaw 提供 controller 契约，但主机访问、凭据投递、进程监管、绝对 workspace 路径和文件持久化由具体 controller 插件负责。

执行主机使用受限的 environment key 作为 `CODEX_API_KEY`；不要把 Gateway 的应用 API Key 直接塞进 executor 环境。更改 environment、workspace 或 controller 后必须 reset，会话不会自动搬运文件。

## 当前限制

- 只支持 API Key 路线；托管技能安装、自定义启动命令/包/环境变量/模板还没有通用入口。
- Gateway 的脚本、仓库和 Skill 目录不会自动复制到托管环境。
- Code Mode、Tool Search、deferred tool search 等 OpenClaw runtime 控制不适用于这个 runtime。
- MCP 不支持 stdio、旧 SSE、请求者级连接和自定义 TLS；Gateway OAuth Profile 不会转发。
- OpenClaw 对 native shell/file 的部分策略和 hook 不会约束托管原生环境；依赖这些边界时应选其他 runtime。
- 模型认证探针只检查模型凭据；不会检查 executor、文件传输、MCP 或回调路径是否连通。

验收自托管时，让会话写入并读回一个小文件，再开第二个会话检查 executor 是否独立、共享文件是否符合设计；reset 其中一个后，另一个仍应工作。

上游来源：[`docs/plugins/agentsapi.md`](https://github.com/openclaw/openclaw/blob/fb4653dbea6650c0fae516151fa87fda5ee4aaf9/docs/plugins/agentsapi.md)。
