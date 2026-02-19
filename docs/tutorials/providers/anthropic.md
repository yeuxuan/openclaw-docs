---
title: "Anthropic (Claude) 配置"
sidebarTitle: "Anthropic"
---

# Anthropic (Claude) 配置

Anthropic 是 Claude 的开发公司，Claude 是一个非常聪明的 AI 助手，也是 OpenClaw 的官方推荐首选 AI。

---

## 新手快速配置（5 分钟搞定）

### 第一步：获取 API 密钥

1. 打开浏览器，访问 [console.anthropic.com](https://console.anthropic.com)
2. 点击右上角注册或登录
3. 进入左侧菜单 **"API Keys"**
4. 点击 **"Create Key"**，给密钥起个名字（比如 `openclaw`）
5. **立刻复制这个密钥！**（它以 `sk-ant-` 开头，只显示一次）

::: warning 请妥善保管你的密钥
密钥就像银行卡密码，不要分享给别人。把它保存在安全的地方。
:::

### 第二步：把密钥填入 OpenClaw

运行配置向导：

```bash
openclaw onboard
```

向导会问你：`Which AI provider do you want to use?`，选择 `Anthropic (Claude)`，然后粘贴你的密钥。

**或者直接用命令行一行搞定：**

```bash
openclaw onboard --anthropic-api-key "sk-ant-你的密钥"
```

### 第三步：验证是否成功

```bash
openclaw models status
```

如果看到 `anthropic: authenticated`，说明配置成功了！

---

## 我能用哪个 Claude 模型？

| 模型名称 | 特点 | 适合什么场景 |
|---------|------|------------|
| `claude-opus-4-6` | 最聪明，花费稍高 | 复杂任务、写作、分析 |
| `claude-sonnet-4-6` | 能力与费用平衡 ⭐ 推荐 | 日常使用 |
| `claude-haiku-4-5` | 最快，费用最低 | 简单问答、快速回复 |

**新手推荐用 `claude-sonnet-4-6`**，性价比最高。

---

## 高级选项（不用 API 密钥的方式）

如果你已经订阅了 Claude Pro/Max，也可以用订阅来驱动 OpenClaw，不需要单独的 API 密钥：

### 方式 A：Anthropic API 密钥（按量计费，上面已介绍）

**适用场景：** 标准 API 访问和按量计费。
在 Anthropic 控制台创建你的 API 密钥。

### CLI 设置

```bash
openclaw onboard
# 选择：Anthropic API key

# 或非交互式
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### 配置示例

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 提示缓存（Anthropic API）

OpenClaw 支持 Anthropic 的提示缓存功能。这是**仅限 API** 的功能；订阅认证不支持缓存设置。

### 配置

在模型配置中使用 `cacheRetention` 参数：

| 值      | 缓存时长   | 说明                           |
| ------- | ---------- | ------------------------------ |
| `none`  | 不缓存     | 禁用提示缓存                   |
| `short` | 5 分钟     | API 密钥认证的默认值           |
| `long`  | 1 小时     | 延长缓存（需要 beta 标志）     |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

### 默认值

使用 Anthropic API 密钥认证时，OpenClaw 会自动为所有 Anthropic 模型应用 `cacheRetention: "short"`（5 分钟缓存）。你可以在配置中显式设置 `cacheRetention` 来覆盖此默认值。

### 旧版参数

旧的 `cacheControlTtl` 参数仍然支持向后兼容：

- `"5m"` 映射到 `short`
- `"1h"` 映射到 `long`

我们建议迁移到新的 `cacheRetention` 参数。

OpenClaw 在 Anthropic API 请求中包含了 `extended-cache-ttl-2025-04-11` beta 标志；如果你覆盖了提供商头部信息，请保留它（参见 [/gateway/configuration](/gateway/configuration)）。

## 方式 B：Claude setup-token

**适用场景：** 使用你的 Claude 订阅。

### 获取 setup-token

setup-token 由 **Claude Code CLI** 创建，而非 Anthropic 控制台。你可以在**任何机器**上运行：

```bash
claude setup-token
```

将 Token 粘贴到 OpenClaw（向导中选择：**Anthropic token (paste setup-token)**），或在网关（Gateway）主机上运行：

```bash
openclaw models auth setup-token --provider anthropic
```

如果你在其他机器上生成了 Token，请粘贴它：

```bash
openclaw models auth paste-token --provider anthropic
```

### CLI 设置（setup-token）

```bash
# 在引导过程中粘贴 setup-token
openclaw onboard --auth-choice setup-token
```

### 配置示例（setup-token）

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 注意事项

- 使用 `claude setup-token` 生成 setup-token 并粘贴，或在网关（Gateway）主机上运行 `openclaw models auth setup-token`。
- 如果在 Claude 订阅中看到 "OAuth token refresh failed ..." 错误，请使用 setup-token 重新认证。参见 [/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription](/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription)。
- 认证详情和复用规则见 [/concepts/oauth](/concepts/oauth)。

## 故障排查

**401 错误 / Token 突然失效**

- Claude 订阅认证可能过期或被撤销。重新运行 `claude setup-token`
  并将其粘贴到**网关（Gateway）主机**上。
- 如果 Claude CLI 登录在其他机器上，请在网关（Gateway）主机上使用
  `openclaw models auth paste-token --provider anthropic`。

**No API key found for provider "anthropic"**

- 认证是**按智能体（Agent）**隔离的。新智能体不会继承主智能体的密钥。
- 为该智能体重新运行引导流程，或在网关（Gateway）主机上粘贴 setup-token / API 密钥，
  然后使用 `openclaw models status` 验证。

**No credentials found for profile `anthropic:default`**

- 运行 `openclaw models status` 查看当前激活的认证配置文件。
- 重新运行引导流程，或为该配置文件粘贴 setup-token / API 密钥。

**No available auth profile (all in cooldown/unavailable)**

- 检查 `openclaw models status --json` 中的 `auth.unusableProfiles`。
- 添加另一个 Anthropic 配置文件或等待冷却期结束。

更多信息：[/gateway/troubleshooting](/gateway/troubleshooting) 和 [/help/faq](/help/faq)。
