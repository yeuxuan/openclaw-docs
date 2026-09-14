---
title: "从 BlueBubbles 迁移"
---

# 从 BlueBubbles 迁移

::: tip 先看人话
这页说明如何把旧的 `channels.bluebubbles` 配置迁到 `channels.imessage`。迁移前先在 Mac 上跑通 `imsg`，再改 OpenClaw 配置。
:::

内置 `imessage` 插件现在通过 JSON-RPC 驱动 [`steipete/imsg`](https://github.com/steipete/imsg)，覆盖 BlueBubbles 过去提供的私有 API 能力，包括 `react`、`edit`、`unsend`、`reply`、`sendWithEffect`、群组管理和附件。如果你的 Mac 已经安装并跑通 `imsg`，就可以移除 BlueBubbles server，让插件直接和 Messages.app 通信。

BlueBubbles 支持已移除。OpenClaw 现在只通过 `imsg` 支持 iMessage。本页只覆盖从 `channels.bluebubbles` 迁移到 `channels.imessage` 的路径。

::: info 说明
简短公告和运维摘要见：[BlueBubbles removal and the imsg iMessage path](/tutorials/reference/announcements-bluebubbles-imessage)。
:::


## 迁移清单

如果你已经了解旧 BlueBubbles 配置，可以按下面顺序迁移：

1. Verify `imsg` directly on the Mac that runs Messages.app (`imsg chats`, `imsg history`, `imsg send`, and `imsg rpc --help`).
2. Copy behavior keys from `channels.bluebubbles` to `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms`, and `actions`.
3. Drop transport keys that no longer exist: `serverUrl`, `password`, webhook URLs, and BlueBubbles server setup.
4. If the Gateway is not running on the Messages Mac, set `channels.imessage.cliPath` to an SSH wrapper and set `remoteHost` for remote attachment fetches.
5. With the Gateway stopped, enable `channels.imessage`, then run `openclaw channels status --probe --channel imessage`.
6. Test one DM, one allowed group, attachments if enabled, and every private API action you expect the agent to use.
7. Delete the BlueBubbles server and old `channels.bluebubbles` config after the iMessage path is verified.

## 适合迁移的情况

- You already run `imsg` on the same Mac (or one reachable over SSH) where Messages.app is signed in.
- 你想减少运行组件：不再维护 BlueBubbles server、REST 认证端点和 webhook，只保留一个 CLI。
- You are on a [supported macOS / `imsg` build](/tutorials/channels/imessage#requirements-and-permissions-macos) where the private API probe reports `available: true`.

## `imsg` 负责什么

`imsg` 是操作 Messages.app 的本地 macOS CLI。OpenClaw 会把 `imsg rpc` 作为子进程启动，并通过 stdin/stdout 走 JSON-RPC。这里没有 HTTP server、webhook URL、后台 daemon、launch agent 或需要暴露的端口。

- Reads come from `~/Library/Messages/chat.db` using a read-only SQLite handle.
- Live inbound messages come from `imsg watch` / `watch.subscribe`, which follows `chat.db` filesystem events with a polling fallback.
- Sends use Messages.app automation for normal text and file sends.
- Advanced actions use `imsg launch` to inject the `imsg` helper into Messages.app. That is what unlocks read receipts, typing indicators, rich sends, edit, unsend, threaded reply, tapbacks, and group management.
- Linux builds can inspect a copied `chat.db`, but cannot send, watch the live Mac database, or drive Messages.app. For OpenClaw iMessage, run `imsg` on the signed-in Mac or through an SSH wrapper to that Mac.

## Before you start

1. Install `imsg` on the Mac that runs Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   If `imsg chats` fails with `unable to open database file`, empty output, or `authorization denied`, grant Full Disk Access to the terminal, editor, Node process, Gateway service, or SSH parent process that launches `imsg`, then reopen that parent process.

2. Verify the read, watch, send, and RPC surfaces before changing OpenClaw config:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Replace `42` with a real chat id from `imsg chats`. Sending requires Automation permission for Messages.app. If OpenClaw will run through SSH, run these commands through the same SSH wrapper or user context that OpenClaw will use.

3. Enable the private API bridge when you need advanced actions:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` requires SIP to be disabled. Basic send, history, and watch work without `imsg launch`; advanced actions do not.

4. After you add an enabled `channels.imessage` config, verify the bridge through OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   You want `imessage.privateApi.available: true`. If it reports `false`, fix that first : see [Capability detection](/tutorials/channels/imessage#private-api-actions). `channels status --probe` only probes configured, enabled accounts.

5. Snapshot your config:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## 配置对应关系

iMessage and BlueBubbles share a lot of channel-level config. The keys that change are mostly transport (REST server vs local CLI). Behavior keys (`dmPolicy`, `groupPolicy`, `allowFrom`, etc.) keep the same meaning.

| BlueBubbles                                                | bundled iMessage                          | Notes                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Same semantics.                                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.serverUrl`                           | _(removed)_                               | 不再需要 REST server；插件会通过 stdio 启动 `imsg rpc`。                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.password`                            | _(removed)_                               | No webhook authentication needed.                                                                                                                                                                                                                                                                                                            |
| _(implicit)_                                               | `channels.imessage.cliPath`               | Path to `imsg` (default `imsg`); use a wrapper script for SSH.                                                                                                                                                                                                                                                                               |
| _(implicit)_                                               | `channels.imessage.dbPath`                | Optional Messages.app `chat.db` override; auto-detected when omitted.                                                                                                                                                                                                                                                                        |
| _(implicit)_                                               | `channels.imessage.remoteHost`            | `host` or `user@host` : only needed when `cliPath` is an SSH wrapper and you want SCP attachment fetches.                                                                                                                                                                                                                                    |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Same values (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Pairing approvals carry over by handle, not by token.                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Same values (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Same.                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Copy this verbatim, including any `groups: { "*": { ... } }` wildcard entry.** Per-group `requireMention`, `tools`, `toolsBySender` carry over. With `groupPolicy: "allowlist"`, an empty or missing `groups` block silently drops every group message : see "Group registry footgun" below.                                               |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Default `true`. With the bundled plugin this only fires when the private API probe is up.                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Same shape, same off-by-default. If you had attachments flowing on BlueBubbles you must re-set this explicitly on the iMessage block : it does not carry over implicitly, and inbound photos/media will be silently dropped with no `Inbound message` log line until you do.                                                             |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Local roots; same wildcard rules.                                                                                                                                                                                                                                                                                                            |
| _(N/A)_                                                    | `channels.imessage.remoteAttachmentRoots` | Only used when `remoteHost` is set for SCP fetches.                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Default 16 MB on iMessage (BlueBubbles default was 8 MB). Set explicitly if you want to keep the lower cap.                                                                                                                                                                                                                                  |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Default 4000 on both.                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Same opt-in. DM-only : group chats keep instant per-message dispatch on both channels. Widens the default inbound debounce to 2500 ms when enabled without an explicit `messages.inbound.byChannel.imessage`. See [iMessage docs § Coalescing split-send DMs](/tutorials/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/A)_                                   | iMessage already reads sender display names from `chat.db`.                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Per-action toggles: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                          |

Multi-account configs (`channels.bluebubbles.accounts.*`) translate one-to-one to `channels.imessage.accounts.*`.

## 群组注册表常见坑

内置 iMessage 插件会连续检查两道群组 allowlist。群组消息要进入 Agent，两道都必须通过：

1. Sender / chat-target allowlist (`channels.imessage.groupAllowFrom`) : checked by `isAllowedIMessageSender`. Matches inbound messages by sender handle, `chat_guid`, `chat_identifier`, or `chat_id`. Same shape as BlueBubbles.
2. Group registry (`channels.imessage.groups`) : checked by `resolveChannelGroupPolicy` from `inbound-processing.ts:199`. With `groupPolicy: "allowlist"`, this gate requires either:
   - a `groups: { "*": { ... } }` wildcard entry (sets `allowAll = true`), or
   - an explicit per-`chat_id` entry under `groups`.

If gate 1 passes but gate 2 fails, the message is dropped. The plugin emits two `warn`-level signals so this is no longer silent at default log level:

- A one-time startup `warn` per account when `groupPolicy: "allowlist"` is set but `channels.imessage.groups` is empty (no `"*"` wildcard, no per-`chat_id` entries) : fired before any messages land.
- A one-time per-`chat_id` `warn` the first time a specific group is dropped at runtime, naming the chat_id and the exact key to add to `groups` to allow it.

DMs continue to work because they take a different code path.

这是从 BlueBubbles 迁移到内置 iMessage 时最常见的问题：只复制了 `groupAllowFrom` 和 `groupPolicy`，却漏掉 `groups`。BlueBubbles 里的 `groups: { "*": { "requireMention": true } }` 看起来只是提及设置，但在新插件里它也是群组注册表门控的一部分。

The minimum config to keep group messages flowing after `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`requireMention: true` under `*` is harmless when no mention patterns are configured: the runtime sets `canDetectMention = false` and short-circuits the mention drop at `inbound-processing.ts:512`. With mention patterns configured (`agents.entries.*.groupChat.mentionPatterns`), it works as expected.

If the gateway logs `imessage: dropping group message from chat_id=<id>` or the startup line `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, gate 2 is dropping : add the `groups` block.

## Step-by-step

1. Add an iMessage block alongside the existing BlueBubbles block. Keep it disabled while the Gateway is still routing BlueBubbles traffic:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups : silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. Probe before traffic matters : stop the Gateway, temporarily enable the iMessage block, and confirm iMessage reports healthy from the CLI:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` only probes configured, enabled accounts. Do not restart the Gateway with both BlueBubbles and iMessage enabled unless you intentionally want both channel monitors running. If you are not cutting over immediately, set `channels.imessage.enabled` back to `false` before restarting the Gateway. Use the direct `imsg` commands in [Before you start](#before-you-start) to validate the Mac before enabling OpenClaw traffic.

3. Cut over. Once the enabled iMessage account reports healthy, remove the BlueBubbles config and keep iMessage enabled:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Restart the gateway. Inbound iMessage traffic now flows through the bundled plugin.

4. Verify DMs. Send the agent a direct message; confirm the reply lands.

5. Verify groups separately. DMs and groups take different code paths : DM success does not prove groups are routing. Send the agent a message in a paired group chat and confirm the reply lands. If the group goes silent (no agent reply, no error), check the gateway log for `imessage: dropping group message from chat_id=<id>` or the startup `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` line : both fire at the default log level. If either appears, your `groups` block is missing or empty : see "Group registry footgun" above.

6. Verify the action surface : from a paired DM, ask the agent to react, edit, unsend, reply, send a photo, and (in a group) rename the group / add or remove a participant. Each action should land natively in Messages.app. If any throws "iMessage `<action>` requires the imsg private API bridge", run `imsg launch` again and refresh `channels status --probe`.

7. Remove the BlueBubbles server and config once iMessage DMs, groups, and actions are verified. OpenClaw will not use `channels.bluebubbles`.

## Action parity at a glance

| Action                                                     | legacy BlueBubbles                  | bundled iMessage                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Send text / SMS fallback                                   | 是                                  | 是                                                                                                                      |
| Send media (photo, video, file, voice)                     | 是                                  | 是                                                                                                                      |
| Threaded reply (`reply_to_guid`)                           | 是                                  | 是 (closes [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                 |
| Tapback (`react`)                                          | 是                                  | 是                                                                                                                      |
| Edit / unsend (macOS 13+ recipients)                       | 是                                  | 是                                                                                                                      |
| Send with screen effect                                    | 是                                  | 是 (closes part of [#9394](https://github.com/openclaw/openclaw/issues/9394))                                           |
| Rich text bold / italic / underline / strikethrough        | 是                                  | 是 (typed-run formatting via attributedBody)                                                                            |
| Rename group / set group icon                              | 是                                  | 是                                                                                                                      |
| Add / remove participant, leave group                      | 是                                  | 是                                                                                                                      |
| Read receipts and typing indicator                         | 是                                  | 是 (gated on private API probe)                                                                                         |
| Same-sender DM coalescing                                  | 是                                  | 是 (DM-only; opt-in via `channels.imessage.coalesceSameSenderDms`)                                                      |
| Catchup of inbound messages received while gateway is down | 是 (webhook replay + history fetch) | 是 (opt-in via `channels.imessage.catchup.enabled`; closes [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

iMessage catchup is now available as an opt-in feature on the bundled plugin. On gateway startup, if `channels.imessage.catchup.enabled` is `true`, the gateway runs one `chats.list` + per-chat `messages.history` pass against the same JSON-RPC client used by `imsg watch`, replays each missed inbound row through the live dispatch path (allowlists, group policy, debouncer, echo cache), and persists a per-account cursor so subsequent startups pick up where they left off. See [Catching up after gateway downtime](/tutorials/channels/imessage#catching-up-after-gateway-downtime) for tuning.

## Pairing, sessions, and ACP bindings

- Pairing approvals carry over by handle. You do not need to re-approve known senders : `channels.imessage.allowFrom` recognizes the same `+15555550123` / `user@example.com` strings BlueBubbles used.
- Sessions stay scoped per agent + chat. DMs collapse into the agent main session under default `session.dmScope=main`; group sessions stay isolated per `chat_id`. The session keys differ (`agent:<id>:imessage:group:<chat_id>` vs the BlueBubbles equivalent) : old conversation history under BlueBubbles session keys does not carry into iMessage sessions.
- ACP bindings referencing `match.channel: "bluebubbles"` need to be updated to `"imessage"`. The `match.peer.id` shapes (`chat_id:`, `chat_guid:`, `chat_identifier:`, bare handle) are identical.

## No rollback channel

There is no supported BlueBubbles runtime to switch back to. If iMessage verification fails, set `channels.imessage.enabled: false`, restart the Gateway, fix the `imsg` blocker, and retry the cutover.

The reply cache lives at `~/.openclaw/state/imessage/reply-cache.jsonl` (mode `0600`, parent dir `0700`). It is safe to delete if you want a clean slate.

## Related

- [BlueBubbles removal and the imsg iMessage path](/tutorials/reference/announcements-bluebubbles-imessage) : short announcement and operator summary.
- [iMessage](/tutorials/channels/imessage) : full iMessage channel reference, including `imsg launch` setup and capability detection.
- `/channels/bluebubbles` : legacy URL that redirects to this migration guide.
- [Pairing](/tutorials/channels/pairing) : DM authentication and pairing flow.
- [Channel Routing](/tutorials/channels/channel-routing) : how the gateway picks a channel for outbound replies.
