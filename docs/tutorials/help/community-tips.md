---
title: "社区实践技巧（Skills、MCP、钉钉、多人格）"
sidebarTitle: "社区实践技巧"
description: "OpenClaw 帮助：社区实践技巧。本文汇整了社区用户在实际使用 OpenClaw 过程中总结的常见配置技巧，涵盖 Skills 安装、MCP 集成、钉钉接入与多人格配置四个主题。每个部分侧重实操…"
---

# 社区实践技巧

本文整理了社区用户常用的几类配置：Skills 安装、MCP 集成、钉钉接入和多智能体配置。每一节都以可复用步骤为主，不展开底层原理。

技能系统和智能体运行时的完整原理分别见 [技能系统](../tools/skills) 和 [智能体运行时](../concepts/agent)，本文不再重复，只关注"怎么用起来"。

---

## Skills 快速获取与安装

### 通过 CLI 一键安装

```bash
# 搜索可用技能
openclaw skills search "code review"

# 安装技能
openclaw skills install clawhub/code-review

# 查看已安装技能
openclaw skills list
```

### 手动下载安装

从 GitHub 或社区获取的技能压缩包，解压到 `~/.openclaw/skills/` 即可：

```bash
mkdir -p ~/.openclaw/skills
unzip my-skill.zip -d ~/.openclaw/skills/my-skill

# 确认目录下有 SKILL.md 文件
ls ~/.openclaw/skills/my-skill/SKILL.md

# 重启网关使技能生效
openclaw gateway restart
```

::: tip 放哪个目录？
- 所有项目都要用的技能，放在 `~/.openclaw/skills/`（全局）
- 只给某个项目用的技能，放在 `<workspace>/skills/`（工作区级，优先级更高）
:::

::: warning 安全提醒
从第三方来源安装技能前，务必阅读 `SKILL.md` 内容。技能会注入到 Agent 提示词中，恶意技能可能改变 Agent 行为。
:::

---

## 通过 Skill 集成 MCP 能力

部分模型（如 MiniMax）默认不具备视觉识别、网页搜索等扩展能力。可以通过安装对应的 MCP Skill，让 Agent 获得这些能力。

### 典型场景

以 MiniMax 为例，默认缺少搜索和视觉能力。通过安装 Coding Plan 的 MCP Skill，即可为其补充这些工具：

```bash
# 搜索 MCP 相关技能
openclaw skills search "mcp"

# 安装（以 coding-plan-mcp 为例）
openclaw skills install clawhub/coding-plan-mcp
```

手动获取的 MCP Skill 同样解压到技能目录：

```bash
unzip coding-plan-mcp.zip -d ~/.openclaw/skills/coding-plan-mcp
```

安装后重启网关，Agent 就能像使用内置工具一样调用 MCP 提供的搜索、图像识别等能力。

其他 Coding Plan（如 Cursor、Windsurf 等）也有类似的 MCP Skill 可供集成，安装方法相同。

---

## 接入钉钉

OpenClaw 通过社区插件支持钉钉（DingTalk）通道。

### 选择插件

目前有两个社区维护的钉钉 Channel 插件：

| 插件仓库 | 状态 | 说明 |
| -------- | ---- | ---- |
| [adongguo/openclaw-dingtalk](https://github.com/adongguo/openclaw-dingtalk) | 稳定可用 | 接入流程较完整，可先尝试 |
| [soimy/openclaw-channel-dingtalk](https://github.com/soimy/openclaw-channel-dingtalk) | 可能存在兼容问题 | 备选方案 |

### 创建钉钉企业与机器人

::: tip 不需要企业管理员
自行在钉钉创建一个企业即可，无需现有企业管理员审批。对话框支持跨企业通信，不影响日常使用。
:::

### 创建钉钉企业内部应用

1. 打开[钉钉开放平台](https://open-dev.dingtalk.com/)，使用钉钉扫码登录
2. 进入应用开发 > 企业内部应用 > 创建应用
3. 填写应用名称和描述，完成创建

### 获取凭证

在应用的凭证与基础信息页面，记录以下参数：

- AppKey（也称 Client ID）
- AppSecret（也称 Client Secret）

### 配置机器人能力

1. 在应用功能 > 消息推送中，启用机器人能力
2. 配置消息接收地址（根据所选插件的文档填写回调 URL）

### 配置权限

在权限管理中，至少添加以下权限：

- 企业内机器人发送消息
- 读取通讯录基础信息

### 安装插件并配置

以 `adongguo/openclaw-dingtalk` 为例：

```bash
# 克隆插件
git clone https://github.com/adongguo/openclaw-dingtalk.git

# 安装插件
openclaw plugins install ./openclaw-dingtalk
```

在 `~/.openclaw/openclaw.json` 中配置钉钉通道参数：

```json5
{
  channels: {
    dingtalk: {
      enabled: true,
      accounts: {
        main: {
          appKey: "你的 AppKey",
          appSecret: "你的 AppSecret",
        },
      },
    },
  },
}
```

### 启动并测试

```bash
# 重启网关，让配置生效
openclaw gateway restart

# 查看日志确认连接状态
openclaw logs --follow
```

在钉钉中找到你的机器人，发送一条消息测试是否正常回复。

---

## 多智能体（Multi-Agent）配置

OpenClaw 默认包含一个 `main` 智能体。如果你希望日常聊天、代码助手、论坛发帖分别使用不同配置，可以创建多个智能体并分别绑定。

### 新增智能体并设置身份

```bash
# 创建名为 "code" 的智能体
openclaw agents add code

# 设置显示名称
openclaw agents set-identity --agent code --name "小赖"
```

每个智能体拥有独立的引导文件目录，通过编辑这些文件来定义不同的人设：

```text
~/.openclaw/agents/code/agent/
├── SOUL.md       ← 人设、语调、行为边界
├── IDENTITY.md   ← 名称、风格、表情符号偏好
├── AGENTS.md     ← 操作指令和记忆
├── USER.md       ← 用户资料和称呼偏好
└── TOOLS.md      ← 工具使用备注
```

### 为每个智能体绑定独立账户

多智能体场景下，建议每个智能体绑定独立的通道账户，避免消息混乱。操作流程：

1. 先调通一个智能体（如 `main`），确认配置无误
2. 在通道的 `accounts` 下新建一个账户条目（如 `code`），填入新机器人的凭证
3. 通过 `bindings` 将账户路由到对应智能体

配置示例（`~/.openclaw/openclaw.json`）：

```json5
{
  // 智能体定义：每个可指定独立的工作目录和模型
  agents: {
    ownership: "explicit",
    entries: {
      main: {},
      code: {
        workspace: "/home/user/.openclaw/workspace-code",
        agentDir: "/home/user/.openclaw/agents/code/agent",
        model: "openai/gpt-4o",
      },
    },
  },

  // 通道中配置多个账户
  channels: {
    dingtalk: {
      enabled: true,
      accounts: {
        main: {
          appKey: "主账户 AppKey",
          appSecret: "主账户 AppSecret",
        },
        code: {
          appKey: "代码助手 AppKey",
          appSecret: "代码助手 AppSecret",
        },
      },
    },
  },

  // 绑定：将特定用户/群组路由到对应智能体
  bindings: [
    {
      agentId: "main",
      match: {
        channel: "dingtalk",
        peer: { kind: "direct", id: "用户 ID" },
      },
    },
    {
      agentId: "code",
      match: {
        channel: "dingtalk",
        peer: { kind: "group", id: "群组 ID" },
      },
    },
  ],
}
```

::: tip 关于 bindings
`bindings` 通过 `match` 规则将消息路由到不同智能体。`peer.kind` 可以是 `"direct"`（私聊）或 `"group"`（群组），`peer.id` 填对应的用户/群组 ID。查看日志（`openclaw logs --follow`）可以找到实际的 ID 值。更多路由规则见 [通道路由](../channels/channel-routing)。
:::

### 智能体独立配置项

每个智能体可以拥有完全独立的运行环境：

| 配置项 | 说明 | 示例 |
| ------ | ---- | ---- |
| `workspace` | 独立工作目录 | `/home/user/.openclaw/workspace-code` |
| `model` | 使用的模型 | `openai/gpt-4o`、`anthropic/claude-sonnet-4-20250514` |
| `agentDir` | 智能体数据目录 | `/home/user/.openclaw/agents/code/agent` |

### 实际效果

配置完成后，不同的智能体各自独立运行：

- `main`：日常聊天
- `code`：代码问题和技术讨论
- `writer`：论坛发帖和文案输出

每个智能体拥有独立的会话记录、记忆（`AGENTS.md`）和身份设定（`SOUL.md`），互不干扰。

---

_下一步：[常见问题 FAQ](./faq) | [故障排查](./troubleshooting)_
