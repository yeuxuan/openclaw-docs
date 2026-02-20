---
title: "认证"
sidebarTitle: "认证"
---

# 认证

OpenClaw 支持 OAuth 和 API 密钥用于模型提供商（Provider）认证。对于 Anthropic
账户，我们推荐使用 **API 密钥**。对于 Claude 订阅访问，
请使用 `claude setup-token` 创建的长期 Token。

完整的 OAuth 流程和存储布局请参阅 [/concepts/oauth](/concepts/oauth)。

---

## 推荐的 Anthropic 设置（API 密钥）

如果你直接使用 Anthropic，请使用 API 密钥。

1. 在 Anthropic Console 中创建 API 密钥。
2. 将密钥放在**网关（Gateway）主机**（运行 `openclaw gateway` 的机器）上。

```bash
export ANTHROPIC_API_KEY="..."
openclaw models status
```

3. 如果网关（Gateway）在 systemd/launchd 下运行，建议将密钥放在
   `~/.openclaw/.env` 中以便守护进程能够读取：

```bash
cat >> ~/.openclaw/.env <<'EOF'
ANTHROPIC_API_KEY=...
EOF
```

然后重启守护进程（或重启网关（Gateway）进程）并重新检查：

```bash
openclaw models status
openclaw doctor
```

如果你不想自己管理环境变量，引导向导可以为守护进程使用存储
API 密钥：`openclaw onboard`。

环境变量继承详情（`env.shellEnv`、`~/.openclaw/.env`、systemd/launchd）请参阅[帮助](/help)。

---

## Anthropic：setup-token（订阅认证）

对于 Anthropic，推荐路径是 **API 密钥**。如果你使用的是 Claude
订阅，也支持 setup-token 流程。在**网关（Gateway）主机**上运行：

```bash
claude setup-token
```

然后将其粘贴到 OpenClaw 中：

```bash
openclaw models auth setup-token --provider anthropic
```

如果 Token 是在另一台机器上创建的，请手动粘贴：

```bash
openclaw models auth paste-token --provider anthropic
```

如果你看到类似以下的 Anthropic 错误：

```text
This credential is only authorized for use with Claude Code and cannot be used for other API requests.
```

...请改用 Anthropic API 密钥。

手动 Token 输入（任意提供商（Provider）；写入 `auth-profiles.json` 并更新配置）：

```bash
openclaw models auth paste-token --provider anthropic
openclaw models auth paste-token --provider openrouter
```

自动化友好的检查（过期/缺失时退出码为 `1`，即将过期时为 `2`）：

```bash
openclaw models status --check
```

可选的运维脚本（systemd/Termux）文档：
[/automation/auth-monitoring](/automation/auth-monitoring)

> `claude setup-token` 需要交互式 TTY。

---

## 检查模型认证状态

```bash
openclaw models status
openclaw doctor
```

---

## 控制使用哪个凭证

### 按会话（Session）（聊天命令）

使用 `/model <alias-or-id>@<profileId>` 为当前会话（Session）指定特定的提供商（Provider）凭证（示例 profile id：`anthropic:default`、`anthropic:work`）。

使用 `/model`（或 `/model list`）获得紧凑选择器；使用 `/model status` 获得完整视图（候选项 + 下一个认证 profile，以及配置的提供商（Provider）端点详情）。

### 按智能体（Agent）（CLI 覆盖）

为智能体（Agent）设置显式的认证 profile 顺序覆盖（存储在该智能体（Agent）的 `auth-profiles.json` 中）：

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

使用 `--agent <id>` 指定特定智能体（Agent）；省略则使用已配置的默认智能体（Agent）。

---

## 故障排查

### "No credentials found"

如果 Anthropic Token profile 缺失，在**网关（Gateway）主机**上运行 `claude setup-token`，
然后重新检查：

```bash
openclaw models status
```

### Token 即将过期/已过期

运行 `openclaw models status` 确认哪个 profile 即将过期。如果 profile
缺失，重新运行 `claude setup-token` 并再次粘贴 Token。

---

## 要求

- Claude Max 或 Pro 订阅（用于 `claude setup-token`）
- 已安装 Claude Code CLI（`claude` 命令可用）
