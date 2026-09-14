---
title: "安全"
---

# 安全

::: tip 先看人话
这页是 OpenClaw 的安全总清单。新手不要一口气背完，先记住三件事：Gateway 不要裸露公网、Token 不要泄露、工具权限不要随便放开。
:::

::: warning 注意
一个 Gateway 对应一个可信边界，可以是个人，也可以是彼此信任的团队。OpenClaw 支持该边界内的群聊和多用户协作，但不是多个互不信任用户共享同一 Agent 或 Gateway 的强多租户安全边界。混合信任或对抗性用户应拆分 Gateway、凭证，最好也拆分 OS 用户或主机。
:::

如果你准备把 Gateway 从 loopback 开放到 LAN、tailnet、Tailscale Serve、反向代理或公网，先按 [Gateway 对外暴露检查清单](/tutorials/gateway/security/exposure-runbook) 做预检和回滚准备。

## 先明确范围：每个 Gateway 一个信任边界

一个可信操作者或相互信任的团队可以共用 Gateway，并使用多个 Agent；具名 operator 角色是协作权限限制，不是租户隔离。

- 支持的姿态：一个用户或信任边界对应一个 Gateway。最好每个边界都有独立 OS 用户、主机或 VPS。
- 不支持的姿态：多个互不信任或对抗性用户共享同一个 Gateway 或 Agent。
- 如果需要隔离对抗性用户，请按信任边界拆分 Gateway 和凭证，最好也拆分 OS 用户或主机。
- 如果多个不可信用户都能给同一个带工具权限的 Agent 发消息，应视为他们共享该 Agent 的委托工具权限。

本页只说明这个模型内的加固方法，不声称一个共享 Gateway 能提供对抗性多租户隔离。

## 快速检查：`openclaw security audit`

另见：[形式化验证（安全模型）](/tutorials/gateway/formal-verification)

建议定期运行，尤其是在改过配置或暴露网络入口之后：

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` 的范围故意很窄：它会把常见的 open 群组策略改成 allowlist，恢复 `logging.redactSensitive: "tools"`，收紧 state/config/include 文件权限，并在 Windows 上使用 ACL reset，而不是 POSIX `chmod`。

它会标出常见误配置，例如 Gateway 认证暴露、浏览器控制面暴露、elevated allowlist、文件权限、过宽的 exec approval，以及开放通道里的工具暴露。

OpenClaw 会把模型接到真实消息入口和真实工具上，不存在“绝对安全”的配置。安全配置要先回答三个问题：

- 谁能和 bot 说话
- bot 能在哪些地方行动
- bot 能碰哪些工具和文件

先给能跑通任务的最小权限，再按实际需要逐步放开。

### 部署和主机信任

OpenClaw 假设主机和配置边界是可信的：

- 如果有人能修改 Gateway 主机状态或配置（`~/.openclaw`，包括 `openclaw.json`），就应把他视为可信操作者。
- 不建议让多个互不信任或对抗性操作者共用一个 Gateway。
- 混合信任团队应拆分 Gateway；最低限度也要拆分 OS 用户或主机。
- 推荐默认做法：一台机器、主机或 VPS 对应一个用户和一个 Gateway；这个 Gateway 内可以有一个或多个 Agent。
- 在同一个 Gateway 内，已认证操作者是可信控制面角色，不是按用户隔离的租户角色。
- `sessionKey`、session ID 和 label 是路由选择器，不是授权 Token。
- 如果多人都能给同一个带工具权限的 Agent 发消息，他们都能驱动同一组权限。按用户隔离 session 或 memory 有助于隐私，但不会把共享 Agent 变成按用户授权的主机隔离。

### 安全文件操作

OpenClaw 使用 `@openclaw/fs-safe` 处理安全敏感的本地文件访问，例如限制根目录、原子写入、压缩包解压、临时工作区和密钥文件。

但要记住：`fs-safe` 是文件操作护栏，不是沙箱。它能减少路径越界和写坏文件的风险，不能替代 OS 用户、容器、虚拟机或 Gateway 工具权限策略。

OpenClaw 默认关闭 fs-safe 的可选 POSIX Python helper。只有当你明确需要额外的文件描述符相对操作加固，并且能保证 Python 运行时存在时，才设置：

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=auto
# 或者要求必须启用，否则失败：
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

详情看：[安全文件操作](/tutorials/gateway/security/secure-file-operations)。

### 共享 Slack 工作区的真实风险

如果“Slack 里所有人都能给 bot 发消息”，核心风险是委托工具权限：

- 任何被允许的发送者都可能在 Agent 策略范围内触发工具调用，例如 `exec`、浏览器、网络或文件工具。
- 一个发送者发来的 prompt 或内容注入，可能影响共享状态、设备或输出。
- 如果共享 Agent 拥有敏感凭证或文件，任何被允许的发送者都可能通过工具使用推动数据外泄。

团队流程应使用独立 Agent 或 Gateway，并给最小工具权限；涉及个人数据的 Agent 应保持私有。

### 公司共享 Agent 的可接受模式

当使用者都在同一个信任边界内（例如同一个公司团队），并且 Agent 严格限定在业务范围内时，共享 Agent 是可以接受的。

- 使用专用机器、VM 或容器。
- 为运行环境准备专用 OS 用户、浏览器 profile 和账号。
- 不要在这个运行环境中登录个人 Apple/Google 账号，也不要使用个人密码管理器或浏览器 profile。

如果在同一个运行环境里混用个人身份和公司身份，就等于放弃隔离，并增加个人数据暴露风险。

## Gateway 和 Node 的信任关系

把 Gateway 和 Node 看成同一个操作者信任域里的不同角色：

- Gateway 是控制面和策略面，负责 `gateway.auth`、工具策略和路由。
- Node 是与 Gateway 配对的远程执行面，负责命令、设备动作和本机能力。
- 调用方通过 Gateway 认证后，在 Gateway 范围内被视为可信。Node 配对后，Node 动作被视为该节点上的可信操作者动作。
- Operator scope levels and approval-time checks are summarized in
  [Operator scopes](/tutorials/gateway/operator-scopes).
- Direct loopback backend clients authenticated with the shared gateway
  token/password can make internal control-plane RPCs without presenting a user
  device identity. This is not a remote or browser pairing bypass: network
  clients, node clients, device-token clients, and explicit device identities
  still go through pairing and scope-upgrade enforcement.
- `sessionKey` is routing/context selection, not per-user auth.
- Exec approvals (allowlist + ask) are guardrails for operator intent, not hostile multi-tenant isolation.
- OpenClaw's product default for trusted single-operator setups is that host exec on `gateway`/`node` is allowed without approval prompts (`security="full"`, `ask="off"` unless you tighten it). That default is intentional UX, not a vulnerability by itself.
- Exec approvals bind exact request context and best-effort direct local file operands; they do not semantically model every runtime/interpreter loader path. Use sandboxing and host isolation for strong boundaries.

If you need hostile-user isolation, split trust boundaries by OS user/host and run separate gateways.

## Trust boundary matrix

Use this as the quick model when triaging risk:

| Boundary or control                                       | What it means                                     | Common misread                                                                |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | Authenticates callers to gateway APIs             | "Needs per-message signatures on every frame to be secure"                    |
| `sessionKey`                                              | Routing key for context/session selection         | "Session key is a user auth boundary"                                         |
| Prompt/content guardrails                                 | Reduce model abuse risk                           | "Prompt injection alone proves auth bypass"                                   |
| `canvas.eval` / browser evaluate                          | Intentional operator capability when enabled      | "Any JS eval primitive is automatically a vuln in this trust model"           |
| Local TUI `!` shell                                       | Explicit operator-triggered local execution       | "Local shell convenience command is remote injection"                         |
| Node pairing and node commands                            | Operator-level remote execution on paired devices | "Remote device control should be treated as untrusted user access by default" |
| `gateway.nodes.pairing.autoApproveCidrs`                  | Opt-in trusted-network node enrollment policy     | "A disabled-by-default allowlist is an automatic pairing vulnerability"       |

## Not vulnerabilities by design

<details>
<summary>Common findings that are out of scope</summary>


These patterns get reported often and are usually closed as no-action unless
a real boundary bypass is demonstrated:

- Prompt-injection-only chains without a policy, auth, or sandbox bypass.
- Claims that assume hostile multi-tenant operation on one shared host or
  config.
- Claims that classify normal operator read-path access (for example
  `sessions.list` / `sessions.preview` / `chat.history`) as IDOR in a
  shared-gateway setup.
- Localhost-only deployment findings (for example HSTS on a loopback-only
  gateway).
- Discord inbound webhook signature findings for inbound paths that do not
  exist in this repo.
- Reports that treat node pairing metadata as a hidden second per-command
  approval layer for `system.run`, when the real execution boundary is still
  the gateway's global node command policy plus the node's own exec
  approvals.
- Reports that treat configured `gateway.nodes.pairing.autoApproveCidrs` as a
  vulnerability by itself. This setting is disabled by default, requires
  explicit CIDR/IP entries, only applies to first-time `role: node` pairing with
  no requested scopes, and does not auto-approve operator/browser/Control UI,
  WebChat, role upgrades, scope upgrades, metadata changes, public-key changes,
  or same-host loopback trusted-proxy header paths unless loopback trusted-proxy auth was explicitly enabled.
- "Missing per-user authorization" findings that treat `sessionKey` as an
  auth token.

</details>


## Hardened baseline in 60 seconds

Use this baseline first, then selectively re-enable tools per trusted agent:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { mode: "deny" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

This keeps the Gateway local-only, isolates DMs, and disables control-plane/runtime tools by default.

## Shared inbox quick rule

If more than one person can DM your bot:

- Set `session.dmScope: "per-channel-peer"` (or `"per-account-channel-peer"` for multi-account channels).
- Keep `dmPolicy: "pairing"` or strict allowlists.
- Never combine shared DMs with broad tool access.
- This hardens cooperative/shared inboxes, but is not designed as hostile co-tenant isolation when users share host/config write access.

## Context visibility model

OpenClaw separates two concepts:

- Trigger authorization: who can trigger the agent (`dmPolicy`, `groupPolicy`, allowlists, mention gates).
- Context visibility: what supplemental context is injected into model input (reply body, quoted text, thread history, forwarded metadata).

Allowlists gate triggers and command authorization. The `contextVisibility` setting controls how supplemental context (quoted replies, thread roots, fetched history) is filtered:

- `contextVisibility: "all"` (default) keeps supplemental context as received.
- `contextVisibility: "allowlist"` filters supplemental context to senders allowed by the active allowlist checks.
- `contextVisibility: "allowlist_quote"` behaves like `allowlist`, but still keeps one explicit quoted reply.

Set `contextVisibility` per channel or per room/conversation. See [Group Chats](/tutorials/channels/groups) for setup details.

Advisory triage guidance:

- Claims that only show "model can see quoted or historical text from non-allowlisted senders" are hardening findings addressable with `contextVisibility`, not auth or sandbox boundary bypasses by themselves.
- To be security-impacting, reports still need a demonstrated trust-boundary bypass (auth, policy, sandbox, approval, or another documented boundary).

## What the audit checks (high level)

- Inbound access (DM policies, group policies, allowlists): can strangers trigger the bot?
- Tool blast radius (elevated tools + open rooms): could prompt injection turn into shell/file/network actions?
- Exec approval drift (`security=full`, `autoAllowSkills`, interpreter allowlists without `strictInlineEval`): are host-exec guardrails still doing what you think they are?
  - `security="full"` is a broad posture warning, not proof of a bug. It is the chosen default for trusted personal-assistant setups; tighten it only when your threat model needs approval or allowlist guardrails.
- Network exposure (Gateway bind/auth, Tailscale Serve/Funnel, weak/short auth tokens).
- Browser control exposure (remote nodes, relay ports, remote CDP endpoints).
- Local disk hygiene (permissions, symlinks, config includes, “synced folder” paths).
- Plugins (plugins load without an explicit allowlist).
- Policy drift/misconfig (sandbox docker settings configured but sandbox mode off; ineffective `gateway.nodes.denyCommands` patterns because matching is exact command-name only (for example `system.run`) and does not inspect shell text; dangerous `gateway.nodes.allowCommands` entries; global `tools.profile="minimal"` overridden by per-agent profiles; plugin-owned tools reachable under permissive tool policy).
- Runtime expectation drift (for example assuming implicit exec still means `sandbox` when `tools.exec.host` now defaults to `auto`, or explicitly setting `tools.exec.host="sandbox"` while sandbox mode is off).
- Model hygiene (warn when configured models look legacy; not a hard block).

If you run `--deep`, OpenClaw also attempts a best-effort live Gateway probe.

## Credential storage map

Use this when auditing access or deciding what to back up:

- WhatsApp: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- Telegram bot token: config/env or `channels.telegram.tokenFile` (regular file only; symlinks rejected)
- Discord bot token: config/env or SecretRef (env/file/exec providers)
- Slack tokens: config/env (`channels.slack.*`)
- Pairing allowlists:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (default account)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (non-default accounts)
- Model auth profiles: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  (`auth_profile_store`)
- Codex runtime state: `~/.openclaw/agents/<agentId>/agent/codex-home/`
- File-backed secrets payload (optional): `~/.openclaw/secrets.json`
- Legacy OAuth import: `~/.openclaw/credentials/oauth.json`（仅供 Doctor 迁移）

## Security audit checklist

When the audit prints findings, treat this as a priority order:

1. Anything “open” + tools enabled: lock down DMs/groups first (pairing/allowlists), then tighten tool policy/sandboxing.
2. Public network exposure (LAN bind, Funnel, missing auth): fix immediately.
3. Browser control remote exposure: treat it like operator access (tailnet-only, pair nodes deliberately, avoid public exposure).
4. Permissions: make sure state/config/credentials/auth are not group/world-readable.
5. Plugins: only load what you explicitly trust.
6. Model choice: prefer modern, instruction-hardened models for any bot with tools.

## Security audit glossary

Each audit finding is keyed by a structured `checkId` (for example
`gateway.bind_no_auth` or `tools.exec.security_full_configured`). Common
critical severity classes:

- `fs.*` : filesystem permissions on state, config, credentials, auth profiles.
- `gateway.*` : bind mode, auth, Tailscale, Control UI, trusted-proxy setup.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` : per-surface hardening.
- `plugins.*`, `skills.*` : plugin/skill supply chain and scan findings.
- `security.exposure.*` : cross-cutting checks where access policy meets tool blast radius.

See the full catalog with severity levels, fix keys, and auto-fix support at
[Security audit checks](/tutorials/gateway/security/audit-checks).

## Control UI over HTTP

The Control UI needs a secure context (HTTPS or localhost) to generate device
identity. `gateway.controlUi.allowInsecureAuth` is a local compatibility toggle:

- On localhost, it allows Control UI auth without device identity when the page
  is loaded over non-secure HTTP.
- It does not bypass pairing checks.
- It does not relax remote (non-localhost) device identity requirements.

Prefer HTTPS (Tailscale Serve) or open the UI on `127.0.0.1`.

For break-glass scenarios only, `gateway.controlUi.dangerouslyDisableDeviceAuth`
disables device identity checks entirely. This is a severe security downgrade;
keep it off unless you are actively debugging and can revert quickly.

Separate from those dangerous flags, successful `gateway.auth.mode: "trusted-proxy"`
can admit operator Control UI sessions without device identity. That is an
intentional auth-mode behavior, not an `allowInsecureAuth` shortcut, and it still
does not extend to node-role Control UI sessions.

`openclaw security audit` warns when this setting is enabled.

## Insecure or dangerous flags summary

`openclaw security audit` raises `config.insecure_or_dangerous_flags` when
known insecure/dangerous debug switches are enabled. Keep these unset in
production.


  <details>
<summary>Flags tracked by the audit today</summary>

    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </details>


  <details>
<summary>All `dangerous*` / `dangerously*` keys in the config schema</summary>

    Control UI and browser:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    Channel name-matching (bundled and plugin channels; also available per
    `accounts.<accountId>` where applicable):

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching` (plugin channel)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (plugin channel)
    - `channels.zalouser.dangerouslyAllowNameMatching` (plugin channel)
    - `channels.irc.dangerouslyAllowNameMatching` (plugin channel)
    - `channels.mattermost.dangerouslyAllowNameMatching` (plugin channel)

    Network exposure:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (also per account)

    Sandbox Docker (defaults + per-agent):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </details>


## Reverse proxy configuration

If you run the Gateway behind a reverse proxy (nginx, Caddy, Traefik, etc.), configure
`gateway.trustedProxies` for proper forwarded-client IP handling.

When the Gateway detects proxy headers from an address that is not in `trustedProxies`, it will not treat connections as local clients. If gateway auth is disabled, those connections are rejected. This prevents authentication bypass where proxied connections would otherwise appear to come from localhost and receive automatic trust.

`gateway.trustedProxies` also feeds `gateway.auth.mode: "trusted-proxy"`, but that auth mode is stricter:

- trusted-proxy auth fails closed on loopback-source proxies by default
- same-host loopback reverse proxies can use `gateway.trustedProxies` for local-client detection and forwarded IP handling
- same-host loopback reverse proxies can satisfy `gateway.auth.mode: "trusted-proxy"` only when `gateway.auth.trustedProxy.allowLoopback = true`; otherwise use token/password auth

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # Optional. Default false.
  # Only enable if your proxy cannot provide X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

When `trustedProxies` is configured, the Gateway uses `X-Forwarded-For` to determine the client IP. `X-Real-IP` is ignored by default unless `gateway.allowRealIpFallback: true` is explicitly set.

Trusted proxy headers do not make node device pairing automatically trusted.
`gateway.nodes.pairing.autoApproveCidrs` is a separate, disabled-by-default
operator policy. Even when enabled, loopback-source trusted-proxy header paths
are excluded from node auto-approval because local callers can forge those
headers, including when loopback trusted-proxy auth is explicitly enabled.

Good reverse proxy behavior (overwrite incoming forwarding headers):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Bad reverse proxy behavior (append/preserve untrusted forwarding headers):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS and origin notes

- OpenClaw gateway is local/loopback first. If you terminate TLS at a reverse proxy, set HSTS on the proxy-facing HTTPS domain there.
- If the gateway itself terminates HTTPS, you can set `gateway.http.securityHeaders.strictTransportSecurity` to emit the HSTS header from OpenClaw responses.
- Detailed deployment guidance is in [Trusted Proxy Auth](/tutorials/gateway/trusted-proxy-auth).
- For non-loopback Control UI deployments, `gateway.controlUi.allowedOrigins` is required by default.
- `gateway.controlUi.allowedOrigins: ["*"]` is an explicit allow-all browser-origin policy, not a hardened default. Avoid it outside tightly controlled local testing.
- Browser-origin auth failures on loopback are still rate-limited even when the
  general loopback exemption is enabled, but the lockout key is scoped per
  normalized `Origin` value instead of one shared localhost bucket.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` enables Host-header origin fallback mode; treat it as a dangerous operator-selected policy.
- Treat DNS rebinding and proxy-host header behavior as deployment hardening concerns; keep `trustedProxies` tight and avoid exposing the gateway directly to the public internet.

## Local session logs live on disk

OpenClaw stores session transcripts on disk under `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
This is required for session continuity and (optionally) session memory indexing, but it also means
any process/user with filesystem access can read those logs. Treat disk access as the trust
boundary and lock down permissions on `~/.openclaw` (see the audit section below). If you need
stronger isolation between agents, run them under separate OS users or separate hosts.

## Node execution (system.run)

If a macOS node is paired, the Gateway can invoke `system.run` on that node. This is remote code execution on the Mac:

- Requires node pairing (approval + token).
- Gateway node pairing is not a per-command approval surface. It establishes node identity/trust and token issuance.
- The Gateway applies a coarse global node command policy via `gateway.nodes.allowCommands` / `denyCommands`.
- Controlled on the Mac via Settings : Exec approvals (security + ask + allowlist).
- The per-node `system.run` policy is the node's own exec approvals file (`exec.approvals.node.*`), which can be stricter or looser than the gateway's global command-ID policy.
- A node running with `security="full"` and `ask="off"` is following the default trusted-operator model. Treat that as expected behavior unless your deployment explicitly requires a tighter approval or allowlist stance.
- Approval mode binds exact request context and, when possible, one concrete local script/file operand. If OpenClaw cannot identify exactly one direct local file for an interpreter/runtime command, approval-backed execution is denied rather than promising full semantic coverage.
- For `host=node`, approval-backed runs also store a canonical prepared
  `systemRunPlan`; later approved forwards reuse that stored plan, and gateway
  validation rejects caller edits to command/cwd/session context after the
  approval request was created.
- If you don’t want remote execution, set security to deny and remove node pairing for that Mac.

This distinction matters for triage:

- A reconnecting paired node advertising a different command list is not, by itself, a vulnerability if the Gateway global policy and the node's local exec approvals still enforce the actual execution boundary.
- Reports that treat node pairing metadata as a second hidden per-command approval layer are usually policy/UX confusion, not a security boundary bypass.

## Dynamic skills (watcher / remote nodes)

OpenClaw can refresh the skills list mid-session:

- Skills watcher: changes to `SKILL.md` can update the skills snapshot on the next agent turn.
- Remote nodes: connecting a macOS node can make macOS-only skills eligible (based on bin probing).

Treat skill folders as trusted code and restrict who can modify them.

## The threat model

Your AI assistant can:

- Execute arbitrary shell commands
- Read/write files
- Access network services
- Send messages to anyone (if you give it WhatsApp access)

People who message you can:

- Try to trick your AI into doing bad things
- Social engineer access to your data
- Probe for infrastructure details

## Core concept: access control before intelligence

Most failures here are not fancy exploits : they’re “someone messaged the bot and the bot did what they asked.”

OpenClaw’s stance:

- Identity first: decide who can talk to the bot (DM pairing / allowlists / explicit “open”).
- Scope next: decide where the bot is allowed to act (group allowlists + mention gating, tools, sandboxing, device permissions).
- Model last: assume the model can be manipulated; design so manipulation has limited blast radius.

## Command authorization model

Slash commands and directives are only honored for authorized senders. Authorization is derived from
channel allowlists/pairing plus `commands.useAccessGroups` (see [Configuration](/tutorials/gateway/configuration)
and [Slash commands](/tutorials/tools/slash-commands)). If a channel allowlist is empty or includes `"*"`,
commands are effectively open for that channel.

`/exec` is a session-only convenience for authorized operators. It does not write config or
change other sessions.

## Control plane tools risk

Two built-in tools can make persistent control-plane changes:

- `gateway` can inspect config with `config.schema.lookup` / `config.get`, and can make persistent changes with `config.apply`, `config.patch`, and `update.run`.
- `cron` can create scheduled jobs that keep running after the original chat/task ends.

The owner-only `gateway` runtime tool still refuses to rewrite
`tools.exec.ask` or `tools.exec.security`; legacy `tools.bash.*` aliases are
normalized to the same protected exec paths before the write.
Agent-driven `gateway config.apply` and `gateway config.patch` edits are
fail-closed by default: only a narrow set of prompt, model, and mention-gating
paths are agent-tunable. New sensitive config trees are therefore protected
unless they are deliberately added to the allowlist.

For any agent/surface that handles untrusted content, deny these by default:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` only blocks restart actions. It does not disable `gateway` config/update actions.

## Plugins

Plugins run in-process with the Gateway. Treat them as trusted code:

- Only install plugins from sources you trust.
- Prefer explicit `plugins.allow` allowlists.
- Review plugin config before enabling.
- 安装、更新、启用或禁用插件时，优先让受支持的插件管理流程完成热重载；手工修改
  manifest 或源码后运行 `openclaw plugins reload <id>`。只有插件声明的 restart
  policy、启动期加载路径或明确诊断要求时，才重启整个 Gateway。
- If you install or update plugins (`openclaw plugins install <package>`, `openclaw plugins update <id>`), treat it like running untrusted code:
  - The install path is the per-plugin directory under the active plugin install root.
  - OpenClaw runs a built-in dangerous-code scan before install/update. `critical` findings block by default.
  - npm and git plugin installs run package-manager dependency convergence only during the explicit install/update flow. Local paths and archives are treated as self-contained plugin packages; OpenClaw copies/references them without running `npm install`.
  - Prefer pinned, exact versions (`@scope/pkg@1.2.3`), and inspect the unpacked code on disk before enabling.
  - `--dangerously-force-unsafe-install` is break-glass only for built-in scan false positives on plugin install/update flows. It does not bypass plugin `before_install` hook policy blocks and does not bypass scan failures.
  - Gateway-backed skill dependency installs follow the same dangerous/suspicious split: built-in `critical` findings block unless the caller explicitly sets `dangerouslyForceUnsafeInstall`, while suspicious findings still warn only. `openclaw skills install` remains the separate ClawHub skill download/install flow.

Details: [Plugins](/tutorials/tools/plugin)

## DM access model: pairing, allowlist, open, disabled

All current DM-capable channels support a DM policy (`dmPolicy` or `*.dm.policy`) that gates inbound DMs before the message is processed:

- `pairing` (default): unknown senders receive a short pairing code and the bot ignores their message until approved. Codes expire after 1 hour; repeated DMs won’t resend a code until a new request is created. Pending requests are capped at 3 per channel by default.
- `allowlist`: unknown senders are blocked (no pairing handshake).
- `open`: allow anyone to DM (public). Requires the channel allowlist to include `"*"` (explicit opt-in).
- `disabled`: ignore inbound DMs entirely.

Approve via CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Details + files on disk: [Pairing](/tutorials/channels/pairing)

## DM session isolation (multi-user mode)

By default, OpenClaw routes all DMs into the main session so your assistant has continuity across devices and channels. If multiple people can DM the bot (open DMs or a multi-person allowlist), consider isolating DM sessions:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

This prevents cross-user context leakage while keeping group chats isolated.

This is a messaging-context boundary, not a host-admin boundary. If users are mutually adversarial and share the same Gateway host/config, run separate gateways per trust boundary instead.

### Secure DM mode (recommended)

Treat the snippet above as secure DM mode:

- Default: `session.dmScope: "main"` (all DMs share one session for continuity).
- Local CLI onboarding default: writes `session.dmScope: "per-channel-peer"` when unset (keeps existing explicit values).
- Secure DM mode: `session.dmScope: "per-channel-peer"` (each channel+sender pair gets an isolated DM context).
- Cross-channel peer isolation: `session.dmScope: "per-peer"` (each sender gets one session across all channels of the same type).

If you run multiple accounts on the same channel, use `per-account-channel-peer` instead. If the same person contacts you on multiple channels, use `session.identityLinks` to collapse those DM sessions into one canonical identity. See [Session Management](/tutorials/concepts/session) and [Configuration](/tutorials/gateway/configuration).

## Allowlists for DMs and groups

OpenClaw has two separate “who can trigger me?” layers:

- DM allowlist (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; legacy: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): who is allowed to talk to the bot in direct messages.
  - When `dmPolicy="pairing"`, approvals are written to the account-scoped pairing allowlist store under `~/.openclaw/credentials/` (`<channel>-allowFrom.json` for default account, `<channel>-<accountId>-allowFrom.json` for non-default accounts), merged with config allowlists.
- Group allowlist (channel-specific): which groups/channels/guilds the bot will accept messages from at all.
  - Common patterns:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: per-group defaults like `requireMention`; when set, it also acts as a group allowlist (include `"*"` to keep allow-all behavior).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: restrict who can trigger the bot _inside_ a group session (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: per-surface allowlists + mention defaults.
  - Group checks run in this order: `groupPolicy`/group allowlists first, mention/reply activation second.
  - Replying to a bot message (implicit mention) does not bypass sender allowlists like `groupAllowFrom`.
  - Security note: treat `dmPolicy="open"` and `groupPolicy="open"` as last-resort settings. They should be barely used; prefer pairing + allowlists unless you fully trust every member of the room.

Details: [Configuration](/tutorials/gateway/configuration) and [Groups](/tutorials/channels/groups)

## Prompt injection (what it is, why it matters)

Prompt injection is when an attacker crafts a message that manipulates the model into doing something unsafe (“ignore your instructions”, “dump your filesystem”, “follow this link and run commands”, etc.).

Even with strong system prompts, prompt injection is not solved. System prompt guardrails are soft guidance only; hard enforcement comes from tool policy, exec approvals, sandboxing, and channel allowlists (and operators can disable these by design). What helps in practice:

- Keep inbound DMs locked down (pairing/allowlists).
- Prefer mention gating in groups; avoid “always-on” bots in public rooms.
- Treat links, attachments, and pasted instructions as hostile by default.
- Run sensitive tool execution in a sandbox; keep secrets out of the agent’s reachable filesystem.
- Note: sandboxing is opt-in. If sandbox mode is off, implicit `host=auto` resolves to the gateway host. Explicit `host=sandbox` still fails closed because no sandbox runtime is available. Set `host=gateway` if you want that behavior to be explicit in config.
- Limit high-risk tools (`exec`, `browser`, `web_fetch`, `web_search`) to trusted agents or explicit allowlists.
- If you allowlist interpreters (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), enable `tools.exec.strictInlineEval` so inline eval forms still need explicit approval.
- Shell approval analysis also rejects POSIX parameter-expansion forms (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) inside unquoted heredocs, so an allowlisted heredoc body cannot sneak shell expansion past allowlist review as plain text. Quote the heredoc terminator (for example `<<'EOF'`) to opt into literal body semantics; unquoted heredocs that would have expanded variables are rejected.
- Model choice matters: older/smaller/legacy models are significantly less robust against prompt injection and tool misuse. For tool-enabled agents, use the strongest latest-generation, instruction-hardened model available.

Red flags to treat as untrusted:

- “Read this file/URL and do exactly what it says.”
- “Ignore your system prompt or safety rules.”
- “Reveal your hidden instructions or tool outputs.”
- “Paste the full contents of ~/.openclaw or your logs.”

## External content special-token sanitization

OpenClaw strips common self-hosted LLM chat-template special-token literals from wrapped external content and metadata before they reach the model. Covered marker families include Qwen/ChatML, Llama, Gemma, Mistral, Phi, and GPT-OSS role/turn tokens.

Why:

- OpenAI-compatible backends that front self-hosted models sometimes preserve special tokens that appear in user text, instead of masking them. An attacker who can write into inbound external content (a fetched page, an email body, a file contents tool output) could otherwise inject a synthetic `assistant` or `system` role boundary and escape the wrapped-content guardrails.
- Sanitization happens at the external-content wrapping layer, so it applies uniformly across fetch/read tools and inbound channel content rather than being per-provider.
- Outbound model responses already have a separate sanitizer that strips leaked `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>`, and similar internal runtime scaffolding from user-visible replies at the final channel delivery boundary. The external-content sanitizer is the inbound counterpart.

This does not replace the other hardening on this page : `dmPolicy`, allowlists, exec approvals, sandboxing, and `contextVisibility` still do the primary work. It closes one specific tokenizer-layer bypass against self-hosted stacks that forward user text with special tokens intact.

## Unsafe external content bypass flags

OpenClaw includes explicit bypass flags that disable external-content safety wrapping:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron payload field `allowUnsafeExternalContent`

Guidance:

- Keep these unset/false in production.
- Only enable temporarily for tightly scoped debugging.
- If enabled, isolate that agent (sandbox + minimal tools + dedicated session namespace).

Hooks risk note:

- Hook payloads are untrusted content, even when delivery comes from systems you control (mail/docs/web content can carry prompt injection).
- Weak model tiers increase this risk. For hook-driven automation, prefer strong modern model tiers and keep tool policy tight (`tools.profile: "messaging"` or stricter), plus sandboxing where possible.

### Prompt injection does not require public DMs

Even if only you can message the bot, prompt injection can still happen via
any untrusted content the bot reads (web search/fetch results, browser pages,
emails, docs, attachments, pasted logs/code). In other words: the sender is not
the only threat surface; the content itself can carry adversarial instructions.

When tools are enabled, the typical risk is exfiltrating context or triggering
tool calls. Reduce the blast radius by:

- Using a read-only or tool-disabled reader agent to summarize untrusted content,
  then pass the summary to your main agent.
- Keeping `web_search` / `web_fetch` / `browser` off for tool-enabled agents unless needed.
- For OpenResponses URL inputs (`input_file` / `input_image`), set tight
  `gateway.http.endpoints.responses.files.urlAllowlist` and
  `gateway.http.endpoints.responses.images.urlAllowlist`, and keep `maxUrlParts` low.
  Empty allowlists are treated as unset; use `files.allowUrl: false` / `images.allowUrl: false`
  if you want to disable URL fetching entirely.
- For OpenResponses file inputs, decoded `input_file` text is still injected as
  untrusted external content. Do not rely on file text being trusted just because
  the Gateway decoded it locally. The injected block still carries explicit
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` boundary markers plus `Source: External`
  metadata, even though this path omits the longer `SECURITY NOTICE:` banner.
- The same marker-based wrapping is applied when media-understanding extracts text
  from attached documents before appending that text to the media prompt.
- Enabling sandboxing and strict tool allowlists for any agent that touches untrusted input.
- Keeping secrets out of prompts; pass them via env/config on the gateway host instead.

### Self-hosted LLM backends

OpenAI-compatible self-hosted backends such as vLLM, SGLang, TGI, LM Studio,
or custom Hugging Face tokenizer stacks can differ from hosted providers in how
chat-template special tokens are handled. If a backend tokenizes literal strings
such as `<|im_start|>`, `<|start_header_id|>`, or `<start_of_turn>` as
structural chat-template tokens inside user content, untrusted text can try to
forge role boundaries at the tokenizer layer.

OpenClaw strips common model-family special-token literals from wrapped
external content before dispatching it to the model. Keep external-content
wrapping enabled, and prefer backend settings that split or escape special
tokens in user-provided content when available. Hosted providers such as OpenAI
and Anthropic already apply their own request-side sanitization.

### Model strength (security note)

Prompt injection resistance is not uniform across model tiers. Smaller/cheaper models are generally more susceptible to tool misuse and instruction hijacking, especially under adversarial prompts.

::: warning 注意
For tool-enabled agents or agents that read untrusted content, prompt-injection risk with older/smaller models is often too high. Do not run those workloads on weak model tiers.
:::


Recommendations:

- Use the latest generation, best-tier model for any bot that can run tools or touch files/networks.
- Do not use older/weaker/smaller tiers for tool-enabled agents or untrusted inboxes; the prompt-injection risk is too high.
- If you must use a smaller model, reduce blast radius (read-only tools, strong sandboxing, minimal filesystem access, strict allowlists).
- When running small models, enable sandboxing for all sessions and disable web_search/web_fetch/browser unless inputs are tightly controlled.
- For chat-only personal assistants with trusted input and no tools, smaller models are usually fine.

## Reasoning and verbose output in groups

`/reasoning`, `/verbose`, and `/trace` can expose internal reasoning, tool
output, or plugin diagnostics that
was not meant for a public channel. In group settings, treat them as **debug
only** and keep them off unless you explicitly need them.

Guidance:

- Keep `/reasoning`, `/verbose`, and `/trace` disabled in public rooms.
- If you enable them, do so only in trusted DMs or tightly controlled rooms.
- Remember: verbose and trace output can include tool args, URLs, plugin diagnostics, and data the model saw.

## Configuration hardening examples

### File permissions

Keep config + state private on the gateway host:

- `~/.openclaw/openclaw.json`: `600` (user read/write only)
- `~/.openclaw`: `700` (user only)

`openclaw doctor` can warn and offer to tighten these permissions.

### Network exposure (bind, port, firewall)

The Gateway multiplexes WebSocket + HTTP on a single port:

- Default: `18789`
- Config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

This HTTP surface includes the Control UI and the canvas host:

- Control UI (SPA assets) (default base path `/`)
- Canvas host: `/__openclaw__/canvas/` and `/__openclaw__/a2ui/` (arbitrary HTML/JS; treat as untrusted content)

If you load canvas content in a normal browser, treat it like any other untrusted web page:

- Don't expose the canvas host to untrusted networks/users.
- Don't make canvas content share the same origin as privileged web surfaces unless you fully understand the implications.

Bind mode controls where the Gateway listens:

- `gateway.bind: "loopback"` (default): only local clients can connect.
- Non-loopback binds (`"lan"`, `"tailnet"`, `"custom"`) expand the attack surface. Only use them with gateway auth (shared token/password or a correctly configured trusted proxy) and a real firewall.

Rules of thumb:

- Prefer Tailscale Serve over LAN binds (Serve keeps the Gateway on loopback, and Tailscale handles access).
- If you must bind to LAN, firewall the port to a tight allowlist of source IPs; do not port-forward it broadly.
- Never expose the Gateway unauthenticated on `0.0.0.0`.

### Docker port publishing with UFW

If you run OpenClaw with Docker on a VPS, remember that published container ports
(`-p HOST:CONTAINER` or Compose `ports:`) are routed through Docker's forwarding
chains, not only host `INPUT` rules.

To keep Docker traffic aligned with your firewall policy, enforce rules in
`DOCKER-USER` (this chain is evaluated before Docker's own accept rules).
On many modern distros, `iptables`/`ip6tables` use the `iptables-nft` frontend
and still apply these rules to the nftables backend.

Minimal allowlist example (IPv4):

```bash
# /etc/ufw/after.rules (append as its own *filter section)

*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

IPv6 has separate tables. Add a matching policy in `/etc/ufw/after6.rules` if
Docker IPv6 is enabled.

Avoid hardcoding interface names like `eth0` in docs snippets. Interface names
vary across VPS images (`ens3`, `enp*`, etc.) and mismatches can accidentally
skip your deny rule.

Quick validation after reload:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Expected external ports should be only what you intentionally expose (for most
setups: SSH + your reverse proxy ports).

### mDNS/Bonjour discovery

When the bundled `bonjour` plugin is enabled, the Gateway broadcasts its presence via mDNS (`_openclaw-gw._tcp` on port 5353) for local device discovery. In full mode, this includes TXT records that may expose operational details:

- `cliPath`: full filesystem path to the CLI binary (reveals username and install location)
- `sshPort`: advertises SSH availability on the host
- `displayName`, `lanHost`: hostname information

Operational security consideration: Broadcasting infrastructure details makes reconnaissance easier for anyone on the local network. Even "harmless" info like filesystem paths and SSH availability helps attackers map your environment.

Recommendations:

1. Keep Bonjour disabled unless LAN discovery is needed. Bonjour auto-starts on macOS hosts and is opt-in elsewhere; direct Gateway URLs, Tailnet, SSH, or wide-area DNS-SD avoid local multicast.

2. Minimal mode (default when Bonjour is enabled, recommended for exposed gateways): omit sensitive fields from mDNS broadcasts:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

3. Disable mDNS mode if you want to keep the plugin enabled but suppress local device discovery:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

4. Full mode (opt-in): include `cliPath` + `sshPort` in TXT records:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

5. Environment variable (alternative): set `OPENCLAW_DISABLE_BONJOUR=1` to disable mDNS without config changes.

When Bonjour is enabled in minimal mode, the Gateway broadcasts enough for device discovery (`role`, `gatewayPort`, `transport`) but omits `cliPath` and `sshPort`. Apps that need CLI path information can fetch it via the authenticated WebSocket connection instead.

### Lock down the Gateway WebSocket (local auth)

Gateway auth is required by default. If no valid gateway auth path is configured,
the Gateway refuses WebSocket connections (fail‑closed).

Onboarding generates a token by default (even for loopback) so
local clients must authenticate.

Set a token so all WS clients must authenticate:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor can generate one for you: `openclaw doctor --generate-gateway-token`.

::: info 说明
`gateway.remote.token` and `gateway.remote.password` are client credential sources. They do not protect local WS access by themselves. Local call paths can use `gateway.remote.*` as fallback only when `gateway.auth.*` is unset. If `gateway.auth.token` or `gateway.auth.password` is explicitly configured via SecretRef and unresolved, resolution fails closed (no remote fallback masking).
:::

Optional: pin remote TLS with `gateway.remote.tlsFingerprint` when using `wss://`.
Plaintext `ws://` setup codes are accepted only for loopback, private LAN
addresses, `.local` Bonjour hosts, and the Android emulator host. Tailnet CGNAT
addresses, `.ts.net` names, and public hosts still fail closed before QR/setup
code issuance; use Tailscale Serve/Funnel or another `wss://` Gateway URL for
those routes.

Local device pairing:

- Device pairing is auto-approved for direct local loopback connects to keep
  same-host clients smooth.
- OpenClaw also has a narrow backend/container-local self-connect path for
  trusted shared-secret helper flows.
- Tailnet and LAN connects, including same-host tailnet binds, are treated as
  remote for pairing and still need approval.
- Forwarded-header evidence on a loopback request disqualifies loopback
  locality. Metadata-upgrade auto-approval is scoped narrowly. See
  [Gateway pairing](/tutorials/gateway/pairing) for both rules.

Auth modes:

- `gateway.auth.mode: "token"`: shared bearer token (recommended for most setups).
- `gateway.auth.mode: "password"`: password auth (prefer setting via env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: trust an identity-aware reverse proxy to authenticate users and pass identity via headers (see [Trusted Proxy Auth](/tutorials/gateway/trusted-proxy-auth)).

Rotation checklist (token/password):

1. Generate/set a new secret (`gateway.auth.token` or `OPENCLAW_GATEWAY_PASSWORD`).
2. Restart the Gateway (or restart the macOS app if it supervises the Gateway).
3. Update any remote clients (`gateway.remote.token` / `.password` on machines that call into the Gateway).
4. Verify you can no longer connect with the old credentials.

### Tailscale Serve identity headers

When `gateway.auth.allowTailscale` is `true` (default for Serve), OpenClaw
accepts Tailscale Serve identity headers (`tailscale-user-login`) for Control
UI/WebSocket authentication. OpenClaw verifies the identity by resolving the
`x-forwarded-for` address through the local Tailscale daemon (`tailscale whois`)
and matching it to the header. This only triggers for requests that hit loopback
and include `x-forwarded-for`, `x-forwarded-proto`, and `x-forwarded-host` as
injected by Tailscale.
For this async identity check path, failed attempts for the same `{scope, ip}`
are serialized before the limiter records the failure. Concurrent bad retries
from one Serve client can therefore lock out the second attempt immediately
instead of racing through as two plain mismatches.
HTTP API endpoints (for example `/v1/*`, `/tools/invoke`, and `/api/channels/*`)
do not use Tailscale identity-header auth. They still follow the gateway's
configured HTTP auth mode.

Important boundary note:

- Gateway HTTP bearer auth is effectively all-or-nothing operator access.
- Treat credentials that can call `/v1/chat/completions`, `/v1/responses`, or `/api/channels/*` as full-access operator secrets for that gateway.
- On the OpenAI-compatible HTTP surface, shared-secret bearer auth restores the full default operator scopes (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) and owner semantics for agent turns; narrower `x-openclaw-scopes` values do not reduce that shared-secret path.
- Per-request scope semantics on HTTP only apply when the request comes from an identity-bearing mode such as trusted proxy auth or `gateway.auth.mode="none"` on a private ingress.
- In those identity-bearing modes, omitting `x-openclaw-scopes` falls back to the normal operator default scope set; send the header explicitly when you want a narrower scope set.
- `/tools/invoke` follows the same shared-secret rule: token/password bearer auth is treated as full operator access there too, while identity-bearing modes still honor declared scopes.
- Do not share these credentials with untrusted callers; prefer separate gateways per trust boundary.

Trust assumption: tokenless Serve auth assumes the gateway host is trusted.
Do not treat this as protection against hostile same-host processes. If untrusted
local code may run on the gateway host, disable `gateway.auth.allowTailscale`
and require explicit shared-secret auth with `gateway.auth.mode: "token"` or
`"password"`.

Security rule: do not forward these headers from your own reverse proxy. If
you terminate TLS or proxy in front of the gateway, disable
`gateway.auth.allowTailscale` and use shared-secret auth (`gateway.auth.mode:
"token"` or `"password"`) or [Trusted Proxy Auth](/tutorials/gateway/trusted-proxy-auth)
instead.

Trusted proxies:

- If you terminate TLS in front of the Gateway, set `gateway.trustedProxies` to your proxy IPs.
- OpenClaw will trust `x-forwarded-for` (or `x-real-ip`) from those IPs to determine the client IP for local pairing checks and HTTP auth/local checks.
- Ensure your proxy overwrites `x-forwarded-for` and blocks direct access to the Gateway port.

See [Tailscale](/tutorials/gateway/tailscale) and [Web overview](/tutorials/web/).

### Browser control via node host (recommended)

If your Gateway is remote but the browser runs on another machine, run a node host
on the browser machine and let the Gateway proxy browser actions (see [Browser tool](/tutorials/tools/browser)).
Treat node pairing like admin access.

Recommended pattern:

- Keep the Gateway and node host on the same tailnet (Tailscale).
- Pair the node intentionally; disable browser proxy routing if you don’t need it.

Avoid:

- Exposing relay/control ports over LAN or public Internet.
- Tailscale Funnel for browser control endpoints (public exposure).

### Secrets on disk

Assume anything under `~/.openclaw/` (or `$OPENCLAW_STATE_DIR/`) may contain secrets or private data:

- `openclaw.json`: config may include tokens (gateway, remote gateway), provider settings, and allowlists.
- `credentials/**`: channel credentials (example: WhatsApp creds), pairing allowlists, legacy OAuth imports.
- `state/openclaw.sqlite`: shared auth profiles and Gateway runtime state.
- `agents/<agentId>/agent/openclaw-agent.sqlite`: Agent-local API keys, token profiles, OAuth tokens, sessions, transcripts, and runtime state.
- `agents/<agentId>/agent/codex-home/**`: per-agent Codex app-server account, config, skills, plugins, native thread state, and diagnostics.
- `secrets.json` (optional): file-backed secret payload used by `file` SecretRef providers (`secrets.providers`).
- `agents/<agentId>/agent/auth-profiles.json` and `auth.json`: legacy migration sources; Doctor imports and archives them, and runtime no longer reads them.
- `agents/<agentId>/sessions/**`: legacy session migration sources and archives that can contain private messages and tool output.
- bundled plugin packages: installed plugins (plus their `node_modules/`).
- `sandboxes/**`: tool sandbox workspaces; can accumulate copies of files you read/write inside the sandbox.

Hardening tips:

- Keep permissions tight (`700` on dirs, `600` on files).
- Use full-disk encryption on the gateway host.
- Prefer a dedicated OS user account for the Gateway if the host is shared.

### Workspace `.env` files

OpenClaw loads workspace-local `.env` files for agents and tools, but never lets those files silently override gateway runtime controls.

- Any key that starts with `OPENCLAW_*` is blocked from untrusted workspace `.env` files.
- Channel endpoint settings for Matrix, Mattermost, IRC, and Synology Chat are also blocked from workspace `.env` overrides, so cloned workspaces cannot redirect bundled connector traffic through local endpoint config. Endpoint env keys (such as `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) must come from the gateway process environment or `env.shellEnv`, not from a workspace-loaded `.env`.
- The block is fail-closed: a new runtime-control variable added in a future release cannot be inherited from a checked-in or attacker-supplied `.env`; the key is ignored and the gateway keeps its own value.
- Trusted process/OS environment variables (the gateway's own shell, launchd/systemd unit, app bundle) still apply : this only constrains `.env` file loading.

Why: workspace `.env` files frequently live next to agent code, get committed by accident, or get written by tools. Blocking the whole `OPENCLAW_*` prefix means adding a new `OPENCLAW_*` flag later can never regress into silent inheritance from workspace state.

### Logs and transcripts (redaction and retention)

Logs and transcripts can leak sensitive info even when access controls are correct:

- Gateway logs may include tool summaries, errors, and URLs.
- Session transcripts can include pasted secrets, file contents, command output, and links.

Recommendations:

- Keep log and transcript redaction on (`logging.redactSensitive: "tools"`; default).
- Add custom patterns for your environment via `logging.redactPatterns` (tokens, hostnames, internal URLs).
- When sharing diagnostics, prefer `openclaw status --all` (pasteable, secrets redacted) over raw logs.
- Prune old session transcripts and log files if you don’t need long retention.

Details: [Logging](/tutorials/gateway/logging)

### DMs: pairing by default

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### Groups: require mention everywhere

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

In group chats, only respond when explicitly mentioned.

### Separate numbers (WhatsApp, Signal, Telegram)

For phone-number-based channels, consider running your AI on a separate phone number from your personal one:

- Personal number: Your conversations stay private
- Bot number: AI handles these, with appropriate boundaries

### Read-only mode (via sandbox and tools)

You can build a read-only profile by combining:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (or `"none"` for no workspace access)
- tool allow/deny lists that block `write`, `edit`, `apply_patch`, `exec`, `process`, etc.

Additional hardening options:

- `tools.exec.applyPatch.workspaceOnly: true` (default): ensures `apply_patch` cannot write/delete outside the workspace directory even when sandboxing is off. Set to `false` only if you intentionally want `apply_patch` to touch files outside the workspace.
- `tools.fs.workspaceOnly: true` (optional): restricts `read`/`write`/`edit`/`apply_patch` paths and native prompt image auto-load paths to the workspace directory (useful if you allow absolute paths today and want a single guardrail).
- Keep filesystem roots narrow: avoid broad roots like your home directory for agent workspaces/sandbox workspaces. Broad roots can expose sensitive local files (for example state/config under `~/.openclaw`) to filesystem tools.

### Secure baseline (copy/paste)

One “safe default” config that keeps the Gateway private, requires DM pairing, and avoids always-on group bots:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

If you want “safer by default” tool execution too, add a sandbox + deny dangerous tools for any non-owner agent (example below under “Per-agent access profiles”).

Built-in baseline for chat-driven agent turns: non-owner senders cannot use the `cron` or `gateway` tools.

## Sandboxing (recommended)

Dedicated doc: [Sandboxing](/tutorials/gateway/sandboxing)

Two complementary approaches:

- Run the full Gateway in Docker (container boundary): [Docker](/tutorials/installation/docker)
- Tool sandbox (`agents.defaults.sandbox`, host gateway + sandbox-isolated tools; Docker is the default backend): [Sandboxing](/tutorials/gateway/sandboxing)

::: info 说明
To prevent cross-agent access, keep `agents.defaults.sandbox.scope` at `"agent"` (default) or `"session"` for stricter per-session isolation. `scope: "shared"` uses a single container or workspace.
:::


Also consider agent workspace access inside the sandbox:

- `agents.defaults.sandbox.workspaceAccess: "none"` (default) keeps the agent workspace off-limits; tools run against a sandbox workspace under `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` mounts the agent workspace read-only at `/agent` (disables `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` mounts the agent workspace read/write at `/workspace`
- Extra `sandbox.docker.binds` are validated against normalized and canonicalized source paths. Parent-symlink tricks and canonical home aliases still fail closed if they resolve into blocked roots such as `/etc`, `/var/run`, or credential directories under the OS home.

::: warning 注意
`tools.elevated` is the global baseline escape hatch that runs exec outside the sandbox. The effective host is `gateway` by default, or `node` when the exec target is configured to `node`. Keep `tools.elevated.allowFrom` tight and do not enable it for strangers. You can further restrict elevated per agent via `agents.entries.*.tools.elevated`. See [Elevated mode](/tutorials/tools/elevated).
:::


### Sub-agent delegation guardrail

If you allow session tools, treat delegated sub-agent runs as another boundary decision:

- Deny `sessions_spawn` unless the agent truly needs delegation.
- Keep `agents.defaults.subagents.allowAgents` and any per-agent `agents.entries.*.subagents.allowAgents` overrides restricted to known-safe target agents.
- For any workflow that must remain sandboxed, call `sessions_spawn` with `sandbox: "require"` (default is `inherit`).
- `sandbox: "require"` fails fast when the target child runtime is not sandboxed.

## Browser control risks

Enabling browser control gives the model the ability to drive a real browser.
If that browser profile already contains logged-in sessions, the model can
access those accounts and data. Treat browser profiles as sensitive state:

- Prefer a dedicated profile for the agent (the default `openclaw` profile).
- Avoid pointing the agent at your personal daily-driver profile.
- Keep host browser control disabled for sandboxed agents unless you trust them.
- The standalone loopback browser control API only honors shared-secret auth
  (gateway token bearer auth or gateway password). It does not consume
  trusted-proxy or Tailscale Serve identity headers.
- Treat browser downloads as untrusted input; prefer an isolated downloads directory.
- Disable browser sync/password managers in the agent profile if possible (reduces blast radius).
- For remote gateways, assume “browser control” is equivalent to “operator access” to whatever that profile can reach.
- Keep the Gateway and node hosts tailnet-only; avoid exposing browser control ports to LAN or public Internet.
- Disable browser proxy routing when you don’t need it (`gateway.nodes.browser.mode="off"`).
- Chrome MCP existing-session mode is not “safer”; it can act as you in whatever that host Chrome profile can reach.

### Browser SSRF policy (strict by default)

OpenClaw’s browser navigation policy is strict by default: private/internal destinations stay blocked unless you explicitly opt in.

- Default: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` is unset, so browser navigation keeps private/internal/special-use destinations blocked.
- Legacy alias: `browser.ssrfPolicy.allowPrivateNetwork` is still accepted for compatibility.
- Opt-in mode: set `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` to allow private/internal/special-use destinations.
- In strict mode, use `hostnameAllowlist` (patterns like `*.example.com`) and `allowedHostnames` (exact host exceptions, including blocked names like `localhost`) for explicit exceptions.
- Navigation is checked before request and best-effort re-checked on the final `http(s)` URL after navigation to reduce redirect-based pivots.

Example strict policy:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## Per-agent access profiles (multi-agent)

With multi-agent routing, each agent can have its own sandbox + tool policy:
use this to give full access, read-only, or no access per agent.
See [Multi-Agent Sandbox & Tools](/tutorials/tools/multi-agent-sandbox-tools) for full details
and precedence rules.

Common use cases:

- Personal agent: full access, no sandbox
- Family/work agent: sandboxed + read-only tools
- Public agent: sandboxed + no filesystem/shell tools

### Example: full access (no sandbox)

```json5
{
  agents: {
    entries: {
      personal: {
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    },
  },
}
```

### Example: read-only tools + read-only workspace

```json5
{
  agents: {
    entries: {
      family: {
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    },
  },
}
```

### Example: no filesystem/shell access (provider messaging allowed)

```json5
{
  agents: {
    entries: {
      public: {
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // 默认 agent 范围能读取同 Agent 的其他用户会话。
        // 显式 tree 收紧普通会话，规范主会话仍有 Agent 范围例外。
        // 严格限制为当前会话应使用 self；沙箱另有 spawned-only 收紧。
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    },
  },
}
```

## Incident response

If your AI does something bad:

### Contain

1. Stop it: stop the macOS app (if it supervises the Gateway) or terminate your `openclaw gateway` process.
2. Close exposure: set `gateway.bind: "loopback"` (or disable Tailscale Funnel/Serve) until you understand what happened.
3. Freeze access: switch risky DMs/groups to `dmPolicy: "disabled"` / require mentions, and remove `"*"` allow-all entries if you had them.

### Rotate (assume compromise if secrets leaked)

1. Rotate Gateway auth (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) and restart.
2. Rotate remote client secrets (`gateway.remote.token` / `.password`) on any machine that can call the Gateway.
3. Rotate provider/API credentials (WhatsApp creds, Slack/Discord tokens, model/API keys in the Agent `openclaw-agent.sqlite` auth store, and encrypted secrets payload values when used).

### Audit

1. Check Gateway logs: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (or `logging.file`).
2. Review the relevant transcript(s): `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Review recent config changes (anything that could have widened access: `gateway.bind`, `gateway.auth`, dm/group policies, `tools.elevated`, plugin changes).
4. Re-run `openclaw security audit --deep` and confirm critical findings are resolved.

### Collect for a report

- Timestamp, gateway host OS + OpenClaw version
- The session transcript(s) + a short log tail (after redacting)
- What the attacker sent + what the agent did
- Whether the Gateway was exposed beyond loopback (LAN/Tailscale Funnel/Serve)

## Secret scanning

CI runs the pre-commit `detect-private-key` hook over the repository. If it
fails, remove or rotate the committed key material, then reproduce locally:

```bash
pre-commit run --all-files detect-private-key
```

## Reporting security issues

Found a vulnerability in OpenClaw? Please report responsibly:

1. Email: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Don't post publicly until fixed
3. We'll credit you (unless you prefer anonymity)
