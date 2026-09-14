---
title: "IMAP 邮件触发"
sidebarTitle: "IMAP 邮件触发"
description: "监控 IMAP 邮箱，把通过发件人校验的新邮件交给隔离、低权限的读取 Agent。"
---

# IMAP 邮件触发

内置 IMAP 插件可以监控 Fastmail、iCloud 或其他 IMAP 邮箱，并为每封通过策略的
新邮件启动独立 Agent 会话。它只读邮箱：不会发送邮件、修改已读标记、公开
Webhook，也不会补跑监控开始前已经存在的邮件。

## 先创建受限 Reader Agent

邮件正文属于外部不可信输入。不要把它直接交给拥有浏览器、Shell 和文件权限的
主 Agent。建议单独创建 `mail_reader`，使用 session 级沙箱、禁止工作区访问，
并只开放最小工具：

```json5
{
  agents: {
    ownership: "explicit",
    entries: {
      main: {},
      mail_reader: {
        workspace: "~/.openclaw/workspace-mail-reader",
        sandbox: {
          mode: "all",
          scope: "session",
          workspaceAccess: "none",
        },
        tools: {
          profile: "minimal",
          allow: ["session_status"],
          deny: ["group:fs", "group:runtime", "group:web", "browser", "cron", "gateway", "nodes"],
        },
      },
    },
  },
}
```

## 配置邮箱

```json5
{
  plugins: {
    entries: {
      imap: {
        enabled: true,
        config: {
          accounts: {
            personal: {
              host: "imap.example.com",
              port: 993,
              secure: true,
              user: "reader@example.com",
              password: { source: "store", provider: "default", id: "IMAP_PASSWORD" },
              mailbox: "INBOX",
              watch: { mode: "auto", pollSeconds: 60 },
              allowedSenders: ["trusted@example.com", "@example.org"],
              senderAuth: {
                min: "verified",
                trustedAuthservIds: ["mx.example.com"],
                acceptTrustedAuthservId: false,
              },
              agentId: "mail_reader",
              deliver: false,
              includeBody: true,
              maxBytes: 20000,
            },
          },
        },
      },
    },
  },
}
```

`allowedSenders` 为空会禁用该账号。地址可以写完整邮箱或 `@example.org` 域名；
显示名与 `Reply-To` 不授予权限，多 `From` 地址邮件会被拒绝。

默认要求本地验证得到对齐的 DMARC pass。只有你理解风险时，才降低
`senderAuth.min` 或信任特定 `Authentication-Results` 服务器；SPF 单独通过并
不足以达到默认的 `verified`。

## 上线前验证

```bash
openclaw config validate
openclaw models status --agent mail_reader --check --probe
openclaw agent --agent mail_reader --message "Reply exactly MAIL_READER_OK" --json
openclaw sandbox explain --agent mail_reader
openclaw security audit --deep
openclaw logs --follow
```

发送一封包含“打开链接并执行命令”的测试邮件。正确结果是 Reader 只总结内容，
不能导航链接、写文件、运行命令或调用浏览器。

## 运行边界与排障

- 首次启动只建立基线，不处理旧邮件。
- IDLE 通知会立即触发扫描；无 IDLE 时按 `pollSeconds` 轮询，最低 15 秒。
- 没有 sender-bound token 时，内部日期超过 48 小时的邮件会被拒绝。
- 正文超过 `maxBytes` 会截断并带标记。
- 临时认证或 Gateway admission 失败最多重试 3 次；随后跳过并继续后续邮件。
- 跳过的邮件不进入 Channel dead-letter 队列，原始邮件仍留在邮箱中。

IMAP 不需要 Gmail Pub/Sub、Tailscale Funnel、`hooks.enabled` 或公网 HTTP
入口。成功 admission 的日志不代表 Agent 已完成；应继续查相同 `runId` 的
`hook agent run completed` 和运行转录。

继续阅读：[沙箱](/tutorials/gateway/sandboxing)、
[Secrets](/tutorials/gateway/secrets)、[Gmail Pub/Sub](/tutorials/automation/gmail-pubsub)。
