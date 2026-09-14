---
title: "模型 CLI"
sidebarTitle: "模型 CLI"
description: "OpenClaw 核心概念：模型 CLI。涵盖模型选择、会话固定模型、allowlist、fallback 和 /model default。"
---

# 模型 CLI

先记住一句：

```text
provider/model 选择的是模型来源，不一定等于底层运行时。
```

特别是 `openai/gpt-*` 这类模型，在当前 OpenClaw 里经常会和 Codex 运行时一起出现，所以“模型名”和“实际运行时”要分开看。

## 模型选择如何工作

OpenClaw 按以下顺序选择模型：

1. 主模型（`agents.defaults.model.primary` 或旧式 `agents.defaults.model`）。
2. `agents.defaults.model.fallbacks` 中的回退模型，按顺序尝试。
3. 在换到下一个 fallback 前，先在当前 provider 内部做认证故障转移。

另外还有几个容易混淆的配置：

- `agents.defaults.models` 保存模型目录、别名与逐模型参数；显式限制使用 `modelPolicy.allow`。
- `agents.defaults.imageModel` 只在主模型无法接受图像时使用。
- 每个智能体可以通过 `agents.entries.*.model` 和绑定覆盖 `agents.defaults.model`，见[多智能体](/tutorials/concepts/multi-agent)。

## 会话固定模型

现在要把“配置默认模型”和“会话手动固定模型”分开理解。

### 配置默认模型

这是你在 `agents.defaults.model.primary` 里设置的值，影响：

- 新会话
- 没被手动固定模型的会话

### 会话固定模型

这些动作会把当前会话固定到某个模型：

- `/model ...`
- 某些 session patch / picker 操作

一旦固定后，这个会话不会自动跟随你后面改的默认配置。

### 想恢复继承默认配置怎么办

```text
/model default
```

这条命令会清除当前会话的固定模型，让它重新继承配置默认值。

## allowlist 现在更值得注意

`agents.defaults.modelPolicy.allow` 非空时才是显式模型 allowlist。Agent 自己的 `agents.entries.<id>.modelPolicy.allow` 替代全局列表，显式 `[]` 表示允许任意模型。`sessions.create`、`sessions.patch` 使用目标会话所属 Agent 的别名和策略。

策略省略或为空时，可显式选择 picker 目录之外的 `provider/model`；目录不是隐式白名单。但旧配置若尚未迁移且未设置策略，仍可能保留旧 model-map 限制。即使策略允许，也仍需有效 provider、凭据和兼容 runtime，不能把“允许”当成“保证可用”。

## 在聊天中切换模型

```text
/model
/model list
/model openai/gpt-5.4
/model default
/model status
```

常用记法：

- `/model`：文本聊天中显示当前选择。
- `/model list` 或 `/models`：浏览 provider；`/models <provider>` 列出模型引用。
- `/model <alias>`：选择已配置别名；数字编号选择（如 `/model 3`）不再支持。
- Discord 原生命令无参数时打开 provider/模型 picker，选完按 Submit；Telegram 使用 Browse providers 菜单，回调选择始终仅影响当前会话。
- `/model <provider/model>`：把当前会话固定到某个模型。
- `/model status`：查看当前会话到底在用什么模型，并显示认证候选项、provider 端点 `baseUrl` 和 `api` 模式。
- `/model default`：清除当前会话固定模型，恢复继承默认配置。

模型引用会在第一个 `/` 处分割。OpenRouter 风格的模型 ID 本身可能包含 `/`，这时必须带上 provider 前缀，例如：

```text
/model openrouter/moonshotai/kimi-k2
```

如果省略 provider，OpenClaw 会把输入视为别名，或默认 provider 下的模型；这只适用于模型 ID 本身不含 `/` 的情况。

## 什么时候会走 fallback，什么时候不会

- 配置默认模型：出问题时还能走 `fallbacks`。
- 用户手动 `/model` 固定的模型：这是严格选择，挂了就直接报错，不会静默切到别的模型。
- cron 单任务指定模型：默认仍可使用配置回退链，除非任务自己显式清空 `fallbacks`。

## 配置键（概览）

- `agents.defaults.model.primary` 和 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 和 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.models`（目录 + 别名 + 提供商参数）和 `agents.defaults.modelPolicy.allow`（显式限制）
- `models.providers`（写入 `models.json` 的自定义提供商）

模型引用会规范化为小写。提供商别名如 `z.ai/*` 会规范化为 `zai/*`。

提供商配置示例（包括 OpenCode Zen）位于[网关配置](/tutorials/gateway/configuration)。

## 常用 CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear
```

### `models list`

常用参数：

- `--all`：完整目录
- `--local`：仅本地提供商
- `--provider <name>`：按提供商过滤
- `--plain`：每行一个模型
- `--json`：机器可读输出

### `models status`

`models status` 会显示解析后的主模型、回退、图像模型，以及已配置 provider 的认证概览。它还会显示认证存储中找到的 OAuth 配置文件到期状态，默认在 24 小时内提醒。

`--plain` 仅打印解析后的主模型。OAuth 状态始终显示，并包含在 `--json` 输出中。如果已配置的 provider 没有凭证，`models status` 会打印 Missing auth 部分。

使用 `--check` 适合自动化：缺失或过期时退出 `1`，即将过期时退出 `2`。

推荐的 Anthropic 认证是 Claude Code CLI setup-token（在任意机器运行；如需则在网关主机上粘贴）：

```bash
claude setup-token
openclaw models status
```

## OpenRouter 免费模型扫描

`openclaw models scan` 会检查 OpenRouter 的免费模型目录，也可以探测模型的工具和图像支持。

常用参数：

- `--no-probe`：跳过实时探测，仅读取元数据
- `--min-params <b>`：最小参数量（十亿）
- `--max-age-days <days>`：跳过较旧的模型
- `--provider <name>`：provider 前缀过滤
- `--max-candidates <n>`：回退列表大小
- `--set-default`：将 `agents.defaults.model.primary` 设置为第一个选择
- `--set-image`：将 `agents.defaults.imageModel.primary` 设置为第一个图像选择

探测需要 OpenRouter API 密钥，来源可以是认证配置文件或 `OPENROUTER_API_KEY`。没有密钥时，用 `--no-probe` 只列出候选。

扫描结果按以下顺序排序：

1. 图像支持
2. 工具延迟
3. 上下文大小
4. 参数量

输入来源和控制项：

- OpenRouter `/models` 列表（过滤 `:free`）
- 认证配置文件或 `OPENROUTER_API_KEY`，见[环境变量](/tutorials/help/environment)
- 可选过滤器：`--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- 探测控制：`--timeout`、`--concurrency`

在 TTY 中运行时，你可以交互式选择回退。在非交互模式下，传递 `--yes` 接受默认值。

## 模型注册表（`models.json`）

`models.providers` 中的自定义 provider 会写入智能体目录下的 `models.json`，默认位置是：

```text
~/.openclaw/agents/<agentId>/models.json
```

除非 `models.mode` 设置为 `replace`，否则此文件默认被合并。

## 什么时候优先看这页

- 改了默认模型，但旧会话还在用老模型
- `/model` 后回复直接失败
- 想判断是模型不可用，还是 allowlist 拦住了
- 想搞清楚当前 provider/model 和 runtime 的关系

## 相关页面

- [模型提供商](/tutorials/concepts/model-providers)
- [模型回退](/tutorials/concepts/model-failover)
- [多智能体](/tutorials/concepts/multi-agent)
- [OpenRouter](/tutorials/providers/openrouter)
- [环境变量](/tutorials/help/environment)
