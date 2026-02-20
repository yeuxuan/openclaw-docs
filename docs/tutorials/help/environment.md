---
title: "环境变量"
sidebarTitle: "环境变量"
---

# 环境变量（Environment Variables）

OpenClaw 通过多层机制加载环境变量，理解加载顺序能帮助你避免变量覆盖导致的配置困惑。

---

## 加载顺序

OpenClaw 按以下优先级从低到高加载环境变量，**后者会覆盖前者**：

```text
系统环境变量
    ↓
.env 文件
    ↓
配置文件中的 env 块
    ↓
会话级覆盖（Session Override）
```

优先级最高的是会话级覆盖，优先级最低的是系统环境变量。

---

## 在配置中设置环境变量

在 `config.json5` 的 `env` 块中定义变量，这些变量会在 Gateway 启动时注入：

```json5
{
  env: {
    MY_API_KEY: "your-secret-key",
    ANOTHER_VAR: "value2",
    BASE_URL: "https://api.example.com"
  }
}
```

::: tip
`env` 块中的变量对所有 Agent 和工具脚本均可见，无需在每个脚本中单独设置。
:::

---

## Shell 环境变量导入

系统的 Shell 环境变量（如 `$HOME`、`$PATH`）在 OpenClaw 启动时会自动继承，可以直接在配置和脚本中使用，无需重复声明。

---

## 变量替代（Variable Substitution）

在配置文件的值中，使用 `${VAR_NAME}` 语法引用已定义的变量：

```json5
{
  env: {
    API_KEY: "sk-abc123",
    BASE_URL: "https://api.example.com"
  },
  providers: {
    custom: {
      apiKey: "${API_KEY}",         // 引用 env 中的变量
      endpoint: "${BASE_URL}/v1"    // 拼接变量与字符串
    }
  }
}
```

变量替代支持：
- `env` 块中定义的变量
- 系统环境变量
- OpenClaw 内置路径变量（见下方）

---

## OpenClaw 内置路径变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `OPENCLAW_HOME` | OpenClaw 主目录 | `~/.openclaw` |
| `OPENCLAW_CONFIG` | 配置文件路径 | `~/.openclaw/config.json5` |
| `OPENCLAW_WORKSPACE` | Agent 工作区根目录 | `~/.openclaw/workspaces` |

你可以在启动 Gateway 之前，通过 Shell 导出这些变量来修改默认路径：

```bash
export OPENCLAW_HOME=/data/openclaw
openclaw gateway start
```

---

## 使用 .env 文件

在项目根目录或 `OPENCLAW_HOME` 目录下创建 `.env` 文件，OpenClaw 启动时会自动加载：

```bash
# ~/.openclaw/.env
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
MY_CUSTOM_VAR=hello
```

---

::: warning 安全建议
- **不要** 在配置文件中硬编码 API Key、密码等敏感值
- **应该** 将敏感值放在 `.env` 文件或系统环境变量中，通过 `${VAR_NAME}` 引用
- `.env` 文件应加入 `.gitignore`，避免提交到代码仓库

```bash
# .gitignore
.env
.env.local
```
:::

---

_下一步：[脚本约定](./scripts)_
