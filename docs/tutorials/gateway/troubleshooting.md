---
title: "故障排除"
sidebarTitle: "故障排除"
---

# 网关（Gateway）故障排除

本页是深度排查手册。如果你想先进行快速分诊流程，请从 [/help/troubleshooting](/help/troubleshooting) 开始。

---

## 命令阶梯

首先按此顺序运行这些命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

预期的健康信号：

- `openclaw gateway status` 显示 `Runtime: running` 和 `RPC probe: ok`。
- `openclaw doctor` 报告无阻塞性配置/服务问题。
- `openclaw channels status --probe` 显示已连接/就绪的通道（Channel）。

---

## 无回复

如果通道（Channel）已启动但没有任何响应，在重新连接任何内容之前先检查路由和策略。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list <channel>
openclaw config get channels
openclaw logs --follow
```

查找：

- DM 发送者的配对待处理状态。
- 群组提及门控（`requireMention`、`mentionPatterns`）。
- 通道（Channel）/群组白名单不匹配。

常见特征：

- `drop guild message (mention required` → 群组消息被忽略直到被提及。
- `pairing request` → 发送者需要审批。
- `blocked` / `allowlist` → 发送者/通道（Channel）被策略过滤。

相关：

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/pairing](/channels/pairing)
- [/channels/groups](/channels/groups)

---

## 仪表盘 Control UI 连接性

当仪表盘/Control UI 无法连接时，验证 URL、认证模式和安全上下文假设。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

查找：

- 正确的探测 URL 和仪表盘 URL。
- 客户端和网关（Gateway）之间的认证模式/Token 不匹配。
- 在需要设备身份的地方使用了 HTTP。

常见特征：

- `device identity required` → 非安全上下文或缺少设备认证。
- `unauthorized` / 重连循环 → Token/密码不匹配。
- `gateway connect failed:` → 错误的 host/port/url 目标。

相关：

- [/web/control-ui](/web/control-ui)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/remote](/gateway/remote)

---

## 网关（Gateway）服务未运行

当服务已安装但进程无法持续运行时使用。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep
```

查找：

- `Runtime: stopped` 带退出提示。
- 服务配置不匹配（`Config (cli)` vs `Config (service)`）。
- 端口/监听器冲突。

常见特征：

- `Gateway start blocked: set gateway.mode=local` → 本地网关（Gateway）模式未启用。修复：在配置中设置 `gateway.mode="local"`（或运行 `openclaw configure`）。如果你通过 Podman 使用专用 `openclaw` 用户运行 OpenClaw，配置位于 `~openclaw/.openclaw/openclaw.json`。
- `refusing to bind gateway ... without auth` → 非 loopback 绑定但没有 Token/密码。
- `another gateway instance is already listening` / `EADDRINUSE` → 端口冲突。

相关：

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

---

## 通道（Channel）已连接但消息不流通

如果通道（Channel）状态已连接但消息流已停止，重点关注策略、权限和通道（Channel）特定的投递规则。

```bash
openclaw channels status --probe
openclaw pairing list <channel>
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

查找：

- DM 策略（`pairing`、`allowlist`、`open`、`disabled`）。
- 群组白名单和提及要求。
- 缺少的通道（Channel）API 权限/作用域。

常见特征：

- `mention required` → 消息被群组提及策略忽略。
- `pairing` / 待处理审批跟踪 → 发送者未被批准。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → 通道（Channel）认证/权限问题。

相关：

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/whatsapp](/channels/whatsapp)
- [/channels/telegram](/channels/telegram)
- [/channels/discord](/channels/discord)

---

## Cron 和心跳投递

如果 cron 或心跳没有运行或没有投递，先验证调度器状态，然后检查投递目标。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

查找：

- Cron 已启用且下次唤醒时间存在。
- 作业运行历史状态（`ok`、`skipped`、`error`）。
- 心跳跳过原因（`quiet-hours`、`requests-in-flight`、`alerts-disabled`）。

常见特征：

- `cron: scheduler disabled; jobs will not run automatically` → cron 已禁用。
- `cron: timer tick failed` → 调度器 tick 失败；检查文件/日志/运行时错误。
- `heartbeat skipped` 带 `reason=quiet-hours` → 在活动时间窗口之外。
- `heartbeat: unknown accountId` → 心跳投递目标的无效账户 id。

相关：

- [/automation/troubleshooting](/automation/troubleshooting)
- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

---

## 节点已配对但工具失败

如果节点已配对但工具失败，隔离前台、权限和审批状态。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

查找：

- 节点在线且具有预期的能力。
- 摄像头/麦克风/位置/屏幕的 OS 权限授予。
- Exec 审批和白名单状态。

常见特征：

- `NODE_BACKGROUND_UNAVAILABLE` → 节点应用必须在前台。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少 OS 权限。
- `SYSTEM_RUN_DENIED: approval required` → exec 审批待处理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被白名单阻止。

相关：

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

---

## 浏览器工具失败

当浏览器工具操作失败但网关（Gateway）本身健康时使用。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

查找：

- 有效的浏览器可执行文件路径。
- CDP profile 可达性。
- `profile="chrome"` 的扩展中继标签页附加状态。

常见特征：

- `Failed to start Chrome CDP on port` → 浏览器进程启动失败。
- `browser.executablePath not found` → 配置的路径无效。
- `Chrome extension relay is running, but no tab is connected` → 扩展中继未附加。
- `Browser attachOnly is enabled ... not reachable` → 仅附加模式的 profile 没有可达的目标。

相关：

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/chrome-extension](/tools/chrome-extension)
- [/tools/browser](/tools/browser)

---

## 如果你升级后某些东西突然出问题

大多数升级后的故障是配置偏移或现在被强制执行的更严格默认值。

### 1) 认证和 URL 覆盖行为已更改

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

检查：

- 如果 `gateway.mode=remote`，CLI 调用可能正在目标远程而你的本地服务是正常的。
- 显式 `--url` 调用不回退到存储的凭证。

常见特征：

- `gateway connect failed:` → 错误的 URL 目标。
- `unauthorized` → 端点可达但认证错误。

### 2) 绑定和认证防护更严格

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

检查：

- 非 loopback 绑定（`lan`、`tailnet`、`custom`）需要配置认证。
- 旧键如 `gateway.token` 不替代 `gateway.auth.token`。

常见特征：

- `refusing to bind gateway ... without auth` → 绑定+认证不匹配。
- `RPC probe: failed` 而运行时正在运行 → 网关（Gateway）存活但当前认证/url 无法访问。

### 3) 配对和设备身份状态已更改

```bash
openclaw devices list
openclaw pairing list <channel>
openclaw logs --follow
openclaw doctor
```

检查：

- 仪表盘/节点的待处理设备审批。
- 策略或身份更改后待处理的 DM 配对审批。

常见特征：

- `device identity required` → 设备认证未满足。
- `pairing required` → 发送者/设备必须被批准。

如果检查后服务配置和运行时仍然不一致，从相同的 profile/状态目录重新安装服务元数据：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相关：

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
