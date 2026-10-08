---
title: "团队 Gateway 生产部署"
sidebarTitle: "团队服务器"
description: "用 Cloudflare Access、逐人身份、角色、GitHub 账号和可恢复运维部署可信团队共享的 OpenClaw Gateway。"
---

# 团队 Gateway 生产部署

这是一条比[团队快速设置](/tutorials/getting-started/teams)更完整的生产路线：持久 Gateway、Cloudflare Tunnel + Access、逐人登录、角色与 GitHub 身份，以及可选的跨 Gateway 只读会话共享。

::: danger 一个 Gateway 仍是一个信任域
角色和会话 owner 适合可信团队协作，不能把敌对用户隔离成多租户。互不信任的团队应使用不同 Gateway、系统用户或主机；不可信代码继续放到沙箱或远程 Worker。
:::

## 部署前准备

- Linux 常开主机、持久磁盘和专用服务账号。
- 受支持的 Node 与 OpenClaw 安装。
- Cloudflare 托管域名、Zero Trust、`cloudflared` 和明确的身份策略。
- 模型凭据、必要的团队聊天机器人账号。
- 管理 SSH、独立密钥存储和位于服务器故障域之外的备份目标。

安装、配置、备份和更新都用同一个服务账号完成，避免 root 和普通用户各自创建一套状态：

```bash
openclaw onboard --install-daemon
openclaw gateway status --deep
```

Gateway 继续监听 loopback。Cloudflare Tunnel 发起出站连接，不要把 18789 直接开放到公网。

## 1. 先建 Access，再暴露 Tunnel

先给 `team.example.com` 创建 Access 应用，只允许管理员完成初始设置。Tunnel ingress 只把该主机名转到 loopback Gateway。

Gateway 示例：

```json5
{
  gateway: {
    publicOrigin: "https://team.example.com",
    auth: {
      mode: "trusted-proxy",
      password: {
        source: "env",
        provider: "default",
        id: "OPENCLAW_GATEWAY_PASSWORD",
      },
      identityScopes: {
        "admin@example.com": ["operator.admin"],
      },
      trustedProxy: {
        userHeader: "cf-access-authenticated-user-email",
        requiredHeaders: ["cf-access-jwt-assertion"],
        allowLoopback: true,
        deviceAutoApprove: {
          enabled: true,
          scopes: [
            "operator.read",
            "operator.write",
            "operator.approvals",
            "operator.questions",
          ],
        },
      },
    },
    roles: {
      default: "observer",
      definitions: {
        observer: {
          sessions: { others: "view" },
          agents: [],
          scopes: ["operator.read"],
        },
        member: {
          sessions: { others: "write" },
          agents: ["assistant"],
          scopes: [
            "operator.read",
            "operator.write",
            "operator.approvals",
            "operator.questions",
          ],
        },
        administrator: {
          sessions: { others: "write" },
          agents: "*",
          scopes: ["operator.admin"],
        },
      },
    },
  },
}
```

切到 trusted-proxy 后移除旧 `gateway.auth.token` 和 `OPENCLAW_GATEWAY_TOKEN`；共享 token 与这种逐人身份模式不兼容。`allowLoopback` 也信任本机进程，所以不要让敌对 workload 接触该监听器。

```bash
openclaw config validate --json
openclaw gateway restart
openclaw gateway status --deep
```

`gateway.publicOrigin` 同时用于生成外部会话链接，并在未显式配置时作为 Control UI origin allowlist。它应是无路径、查询和凭据的 HTTPS origin。只有前端确实来自其他 origin 时才单独设置 `gateway.controlUi.allowedOrigins`；显式空列表不会继承 `publicOrigin`。

## 2. 用真实 Profile 分配角色

让管理员先通过 Access 登录一次，再在本机维护 shell 找到持久 Profile：

```bash
openclaw users list --json
openclaw gateway call users.setRole \
  --params '{"profileId":"<administrator-profile-id>","role":"administrator"}' \
  --json
```

角色变更会关闭该用户的活动 Gateway 连接，重新连接后才生效。管理员既需要 `identityScopes` 的 admin grant，也需要实际 Profile 的管理员角色；不要把默认角色临时改成管理员来“方便引导”。

为每位成员登录后分配 `member`。Owner Profile 仍用于本机维护，不能当成普通个人角色。

更换 OIDC 邮箱前先关联新地址：

```bash
openclaw users link-email new-address@example.com \
  --to <existing-profile-id> --json
```

随后再补新邮箱的 `identityScopes` / Access allowlist，实际登录验证 Profile、角色和权限，最后才移除旧 grant。不要按显示名合并用户；命令细节见 [`openclaw users`](/tutorials/cli/users)。

## 3. GitHub 身份与发布账号分开管理

这四件事不要混在一起：

| 问题 | 负责方 |
|------|--------|
| 谁能访问网站 | Cloudflare Access / 身份提供商 |
| 当前是谁 | 已验证登录与 Gateway Profile |
| 能做什么 | 连接 scope 与 named role |
| 用哪个账号发布代码 | 系统、Agent 或个人 GitHub connection |

GitHub IdP 可以把不可变数字账号 ID 同步到 Profile，但这不是后台导入整个组织，也不会授予仓库写权限。组织成员资格应在 Access / IdP 侧执行，并明确撤销既有会话的时点。

在 Gateway 服务账号安装 `gh`，再在 Settings → Profile → GitHub connections 为系统连接共享发布账号。Agent 覆盖、个人 My GitHub 和 Git co-author credit 都是独立选择；发布前仍要验证最终账号和目标仓库写权限。

## 4. 聊天、CLI、节点不是同一种登录

- Access 网站登录不会自动配置 Slack/Telegram 等通道 allowlist。
- 浏览器 cookie 不会认证 CLI、TUI 或 node；远程 CLI 需要 `gateway.remote.edgeAuth`。
- 节点和 Cloud Worker 的 join、WebSocket、传输请求都要携带机器身份。收到 HTTP 302 只说明请求到了 Access，不代表配对成功。

## 5. Widget 使用独立 sandbox origin

Canvas widget 和 MCP Apps 使用独立 sandbox listener。HTTPS 部署建议使用第二个主机名：

```json5
{
  mcp: {
    apps: {
      sandboxOrigin: "https://team-sandbox.example.com",
    },
  },
}
```

将它单独路由到 `localhost:18790`（或实际 sandbox 端口），不要复用主 Gateway 路由，也不要给这个 iframe origin 加交互式 Access challenge。聊天页面健康不代表 widget iframe 一定能加载，必须跑一个真实 widget 验证。

## 6. 完整验收

至少使用两个真实用户账号检查：

1. 服务账号运行 `openclaw config validate --json`、`openclaw gateway status --deep` 和 `openclaw security audit`。
2. 未登录访问应先遇到 Access；登录后 Control UI 必须真正连接 Gateway，不能只看到跳转成功。
3. 两位用户应生成不同 Profile；分别验证 administrator、member 和 observer 限制。
4. 让 Agent 返回当前会话与另一个可见会话的链接，核对域名和目标。
5. 完成一次真实模型回合、一个通道回复；启用 widget/node 时也分别做端到端检查。
6. 发布代码前确认最终 GitHub 账号和仓库权限，而不是只看连接状态。

## 可恢复运维

每套安装只保留一个服务生命周期 owner。受管安装使用 `openclaw update` 与原生 Gateway 服务命令；外部部署系统接管时，不要同时让第二个 updater、直接 restart 或源码构建争抢控制权。

重大更新前创建并验证备份，最好同步到[命名存储位置](/tutorials/concepts/storage-locations)：

```bash
openclaw backup create --verify
openclaw backup restore <archive.tar.gz> --target <fresh-restore-directory>
```

恢复只先落到暂存目录；离线切换是另一项操作。监控也要放在 Gateway 故障域之外，并同时覆盖进程重启、readiness、通道、存储和真实模型回合。HTTP 根路径绿色、Access 登录成功或机器人没有报错，都不能说明服务已经可以完成工作。

上游来源：[`docs/gateway/team-server.md`](https://github.com/openclaw/openclaw/blob/fb4653dbea6650c0fae516151fa87fda5ee4aaf9/docs/gateway/team-server.md)。
