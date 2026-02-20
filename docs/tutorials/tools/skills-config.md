---
title: "技能配置参考"
sidebarTitle: "技能配置参考"
---

# 技能配置参考（Skills Config Reference）

这里是技能（Skills）系统完整的配置字段说明。如果你想了解如何创建技能文件，请先阅读[创建自定义技能](/tutorials/tools/creating-skills)。

---

## 配置位置

技能配置在 OpenClaw 的主配置文件中，位于 `skills` 字段下：

```json5
// ~/.openclaw/config.json5 或项目级配置
{
  skills: {
    "skill-name": {
      // 技能配置...
    }
  }
}
```

---

## 完整配置示例

```json5
{
  skills: {
    "my-skill": {
      enabled: true,             // 是否启用此技能
      path: "./skills/my-skill", // 技能文件路径（可选，默认按名称查找）
      priority: 10,              // 优先级（数字，越小越优先）
      agents: ["default"],       // 应用的 Agent 列表（空数组 = 全部）
      env: {
        SKILL_API_KEY: "${MY_API_KEY}",  // 技能专属环境变量
        DEFAULT_LANG: "zh-CN"
      }
    }
  }
}
```

---

## 字段说明

### `enabled`

**类型**：`boolean`
**默认值**：`true`

控制技能是否生效。设为 `false` 可以临时禁用技能而不删除配置：

```json5
{
  skills: {
    "debug-helper": {
      enabled: false   // 暂时禁用，保留配置
    }
  }
}
```

---

### `path`

**类型**：`string`
**默认值**：自动从标准目录查找

指定技能文件的自定义路径。默认情况下，OpenClaw 按以下顺序查找：

1. `{工作区}/.openclaw/skills/{skill-name}/`
2. `~/.openclaw/skills/{skill-name}/`

如果技能文件放在非标准位置，使用 `path` 显式指定：

```json5
{
  skills: {
    "company-guidelines": {
      path: "/shared/team/skills/guidelines"  // 团队共享技能的绝对路径
    }
  }
}
```

---

### `priority`

**类型**：`number`
**默认值**：`100`

当多个技能的指令存在顺序要求时，`priority` 决定它们注入提示词的顺序。数字越小，越早注入（优先级越高）：

```json5
{
  skills: {
    "base-personality": {
      priority: 1      // 最先注入，建立基础行为
    },
    "code-review": {
      priority: 50     // 中等优先级
    },
    "project-specific": {
      priority: 100    // 最后注入，覆盖前面的设置
    }
  }
}
```

---

### `agents`

**类型**：`string[]`
**默认值**：`[]`（空数组表示应用到所有 Agent）

指定此技能应用于哪些 Agent。如果留空，所有 Agent 都会加载此技能：

```json5
{
  skills: {
    "code-review": {
      agents: ["dev-assistant", "code-bot"]  // 只对这两个 Agent 生效
    },
    "general-helper": {
      agents: []   // 或直接省略，所有 Agent 都加载
    }
  }
}
```

---

### `env`

**类型**：`Record<string, string>`
**默认值**：`{}`

技能专属的环境变量，注入到技能运行的上下文中。支持从系统环境变量中引用值：

```json5
{
  skills: {
    "github-assistant": {
      env: {
        GITHUB_TOKEN: "${GITHUB_TOKEN}",     // 从系统环境变量读取
        DEFAULT_REPO: "my-org/my-repo",      // 固定值
        API_BASE_URL: "https://api.github.com"
      }
    }
  }
}
```

::: warning 安全注意
不要在配置文件中硬编码 API Key 等敏感信息。使用 `"${ENV_VAR_NAME}"` 语法从环境变量中引用，避免密钥泄露到代码仓库。
:::

---

## 沙箱化技能与环境变量隔离

不同技能的环境变量相互隔离，技能 A 无法访问技能 B 配置的环境变量：

::: details 隔离机制说明
```json5
{
  skills: {
    "skill-a": {
      env: {
        SECRET: "value-a"   // 只有 skill-a 的指令可以引用此变量
      }
    },
    "skill-b": {
      env: {
        SECRET: "value-b"   // skill-b 有自己独立的 SECRET 值
      }
    }
  }
}
```

每个技能在注入提示词时，只能看到自己 `env` 中配置的变量，保证技能间的隔离性。
:::

---

## 多技能配置示例

以下是一个实际项目的完整技能配置，展示各字段的综合使用：

```json5
{
  skills: {
    // 所有 Agent 共享的基础行为规范
    "base-guidelines": {
      enabled: true,
      priority: 1,
      agents: []   // 空 = 全部 Agent
    },

    // 代码审查专用技能，只对开发相关 Agent 生效
    "code-review": {
      enabled: true,
      priority: 50,
      agents: ["dev-bot", "pr-reviewer"],
      env: {
        LINT_RULES: "strict",
        LANGUAGE: "typescript"
      }
    },

    // 使用自定义路径的共享团队技能
    "team-standards": {
      enabled: true,
      priority: 30,
      path: "/shared/company/skills/standards",
      agents: []
    },

    // 暂时禁用的实验性技能
    "experimental-feature": {
      enabled: false,
      priority: 100
    }
  }
}
```

---

## 配置验证

使用 CLI 命令验证技能配置是否正确：

```bash
# 列出所有已配置的技能及其状态
openclaw skills list

# 检查某个技能的配置详情
openclaw skills show my-skill

# 验证配置文件格式
openclaw config validate
```

---

_下一步：[创建自定义技能](/tutorials/tools/creating-skills) | [技能系统说明](/tutorials/tools/skills)_
