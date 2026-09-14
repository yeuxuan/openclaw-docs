---
title: "团队共享 Gateway 设置"
sidebarTitle: "团队设置"
description: "让可信团队共用 OpenClaw：接入群聊、配置身份认证、协作会话与角色，并验证访问边界。"
---

# 团队共享 Gateway 设置

团队使用不需要另一个 OpenClaw 版本：在同一个 Gateway 上接入工作群，让成员在 Control UI 中接续会话，再用身份和角色限定操作范围。个人使用先看[个人助手设置](/tutorials/getting-started/openclaw)。

## 先确认信任边界

一个 Gateway 是一个信任域。能向启用工具的 Agent 发消息的人，共享该 Agent 获得的工具权限；会话归属、在线状态和角色是可信成员之间的协作规则，不是恶意租户隔离。

互不信任的客户或组织应使用不同 Gateway，最好配合不同系统用户或主机。不同项目只是不希望混用记忆和文件时，可以在一个 Gateway 中使用[多 Agent](/tutorials/concepts/multi-agent)。完整边界见[多租户部署](/tutorials/gateway/multi-tenant-hosting)。

## 1. 准备可认证的访问入口

先在常开主机完成[安装与引导](/tutorials/getting-started/getting-started)。保留默认回环监听，通过有鉴权的入口开放访问，不要把裸 Gateway 端口直接放到公网。

- Tailnet：使用 [Tailscale Serve](/tutorials/gateway/tailscale)，正确配置 `gateway.auth.allowTailscale` 后可使用成员的 Tailscale 身份。
- 身份代理：如 [Cloudflare Access](/tutorials/gateway/cloudflare-access)，按[可信代理鉴权](/tutorials/gateway/trusted-proxy-auth)配置可信来源。
- 共享 token/密码：适合小范围使用，但共享凭据不能提供可靠的逐人身份；见[鉴权](/tutorials/gateway/authentication)。

需要追踪“谁参与了会话”时，应优先使用逐人身份，而不是给所有人同一把 token。

## 2. 接入一个受限团队群

例如 Slack Socket Mode，只允许指定频道，并要求提及机器人：

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

将示例频道 ID 换成真实值，并在 Gateway 环境配置 token。私信仍保留默认配对，新成员取得配对码后由维护者执行 `openclaw pairing approve slack <code>`。公共或成员复杂的房间还应设置发送者 allowlist 与 `contextVisibility`，见[群组](/tutorials/channels/groups)。跨通道共用成员名单可使用[访问组](/tutorials/channels/access-groups)。

## 3. 使用共享会话

让每位成员通过各自身份打开 [Control UI](/tutorials/web/control-ui)。共享会话区分不可变创建者、可分配 owner 和实际发过提示的参与者，并显示查看/输入状态；输入草稿不会进入模型或转录。见[多用户模式](/tutorials/concepts/multi-user)。

需要 Git 贡献归属时，成员应验证 GitHub 身份并启用 **Git co-author credit**。符合条件的参与者可以获得 `Co-authored-by`；Gateway 发布代理会在其生成的提交/PR 中执行归属规则，普通 Git 提交仍依赖 Agent 指令和提交后校验。只有存在外部 HTTPS 会话 URL 时，代理创建的 PR 才能附回会话链接，不能仅因“共享会话”就假定每个 PR 都带链接。

## 4. 给成员分配有限角色

下面是角色策略示意，不是可以绕过沙箱或权限审批的开关。先把 `roboclaw` 替换为实际 Agent ID：

```json5
{
  gateway: {
    roles: {
      default: "guest",
      definitions: {
        maintainer: {
          sessions: { others: "write" },
          agents: ["roboclaw"],
          scopes: ["operator.read", "operator.write", "operator.approvals"],
        },
        guest: {
          sessions: { others: "view" },
          agents: ["roboclaw"],
          scopes: ["operator.read", "operator.write"],
          sandbox: "required",
        },
      },
    },
  },
}
```

通过 Gateway 的 `users.setRole` 方法为用户分配角色。完整字段与作用范围见[操作员权限](/tutorials/gateway/operator-scopes)，会话工具姿态见[权限模式](/tutorials/tools/permission-modes)。角色不能把一个信任域变成敌对租户的隔离环境。

## 5. 用两个真实账号验收

1. 在允许的群中提及机器人，确认它只在预期位置回复。
2. 两位成员分别登录，确认能看到预期会话、owner 和彼此的在线状态。
3. 用受限角色验证不能操作未授权会话或 Agent；不要只测试管理员账号。
4. 在 Gateway 主机运行 `openclaw security audit`，处理访问和暴露提示。

继续阅读：[安全指南](/tutorials/gateway/security/)、[Slack](/tutorials/channels/slack)。
