---
title: "OpenClaw agent runtime workflow"
---

# OpenClaw agent runtime workflow

::: tip 先看人话
这页用于补齐 OpenClaw 官方最新文档里的新增内容。先按命令和字段原样理解；如果你只是普通用户，优先看本页的标题、小节和示例命令，不需要一口气读完所有维护者细节。
:::

A sane workflow for working on the OpenClaw agent runtime in OpenClaw.

## Type checking and linting

- Default local gate: `pnpm check`
- Build gate: `pnpm build` when the change can affect build output, packaging, or lazy-loading/module boundaries
- Full landing gate for agent-runtime changes: `pnpm check && pnpm test`

## Running Agent Runtime Tests

Run the agent-runtime test set directly with Vitest:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

To include the live provider exercise:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

This covers the main agent runtime unit suites:

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## Manual testing

Recommended flow:

- Run the gateway in dev mode:
  - `pnpm gateway:dev`
- Trigger the agent directly:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Use the TUI for interactive debugging:
  - `pnpm tui`

For tool call behavior, prompt for a `read` or `exec` action so you can see tool streaming and payload handling.

## Clean slate reset

State lives under the OpenClaw state directory. Default is `~/.openclaw`. If `OPENCLAW_STATE_DIR` is set, use that directory instead.

To reset everything:

- `openclaw.json` for config
- `agents/<agentId>/agent/openclaw-agent.sqlite` for current session rows/transcripts, model auth profiles, and other Agent runtime state
- `credentials/` for provider/channel state that still lives outside the auth profile store
- `agents/<agentId>/sessions/` for archived transcripts and legacy migration sources
- `agents/<agentId>/sessions/sessions.json` only when a legacy migration source still exists
- `sessions/` if legacy paths exist
- `workspace/` if you want a blank workspace

不要通过删除旧 `agents/<agentId>/sessions/` 目录来重置当前会话库；当前会话、
转录和认证资料共存于 `openclaw-agent.sqlite`。使用 `/new`、`/reset` 或
`openclaw sessions cleanup` 做会话维护。要保留认证，必须保留该 SQLite 数据库
以及仍在 `credentials/` 下的通道/提供商状态。

## References

- [Testing](/tutorials/help/testing)
- [Getting Started](/tutorials/getting-started/getting-started)

## Related

- [OpenClaw agent runtime architecture](/tutorials/reference/agent-runtime-architecture)
