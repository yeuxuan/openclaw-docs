---
title: "技能系统"
sidebarTitle: "技能系统"
---

# 技能系统（Skills）

技能（Skills）是预定义的指令集，以文件形式存在，在 Agent 启动时自动注入到提示词中。通过技能，你可以让 Agent 掌握特定领域的专业知识、固定工作流程或特殊行为模式——无需每次都重复描述。

---

## 快速上手

**第一步：创建技能目录**

```bash
mkdir -p ~/.openclaw/skills/my-first-skill
```

**第二步：创建技能定义文件**

在技能目录下创建 `SKILL.md`：

```markdown
# 代码审查技能

## 描述
帮助审查代码，关注安全性和可维护性。

## 使用方法
当用户请求代码审查时使用此技能。

## 指令
审查代码时，请重点关注：
1. 潜在的安全漏洞（SQL 注入、XSS 等）
2. 错误处理是否完善
3. 代码可读性和命名规范
4. 性能影响

给出具体、可操作的改进建议。
```

**第三步：重启 OpenClaw**

技能文件会在 Agent 启动时自动加载，重启后即可生效。

---

## 技能文件位置与优先级

OpenClaw 按以下顺序查找技能，后加载的技能可以覆盖先加载的：

```text
~/.openclaw/skills/          ← 全局技能（优先级低）
    ├── code-review/
    │   └── SKILL.md
    └── git-workflow/
        └── SKILL.md

{工作区}/.openclaw/skills/   ← 工作区技能（优先级高，覆盖全局）
    └── project-specific/
        └── SKILL.md
```

::: tip 工作区技能优先
工作区级别的技能（放在项目目录下）优先级高于全局技能。这让你可以为不同项目定义不同的工作规范。
:::

---

## 每个 Agent vs 共享技能

### 共享技能（默认）

不指定 `agents` 字段时，技能对所有 Agent 生效：

```json5
{
  skills: {
    "code-review": {
      enabled: true
      // 不指定 agents，所有 Agent 都加载此技能
    }
  }
}
```

### 为特定 Agent 配置技能

```json5
{
  skills: {
    "code-review": {
      enabled: true,
      agents: ["dev-assistant", "code-bot"]  // 只有这两个 Agent 加载
    }
  }
}
```

---

## 插件（Plugins）与技能

插件可以打包并提供额外的技能集。安装插件后，其附带的技能会自动可用：

```json5
{
  plugins: {
    "openclaw-devtools": {
      enabled: true
      // 此插件内置了 git、npm、docker 等技能
    }
  }
}
```

---

## ClawHub 技能库

你可以从 ClawHub 社区获取他人分享的技能：

```bash
# 浏览可用技能
openclaw skills search "code review"

# 安装技能
openclaw skills install clawhub/code-review

# 查看已安装技能
openclaw skills list
```

::: warning 安全注意
从 ClawHub 或其他第三方来源安装技能前，务必阅读技能定义文件内容。技能会注入到 Agent 提示词中，恶意技能可能改变 Agent 行为。
:::

---

## Gate 规则（Gate Rules）

Gate 规则让技能只在满足特定条件时触发，避免不必要的 Token 消耗：

```json5
{
  skills: {
    "sql-expert": {
      enabled: true,
      gate: {
        // 只有消息中包含 SQL 关键词时才激活此技能
        keywords: ["SELECT", "INSERT", "database", "查询"],
        // 或者只在特定渠道激活
        channels: ["#db-help"]
      }
    }
  }
}
```

---

## 配置覆盖（Config Override）

技能可以携带自己的配置，在激活时自动覆盖部分全局配置：

::: details 查看配置覆盖示例
```yaml
# SKILL.md 中的配置部分
---
config:
  model: "claude-opus-4-5"  # 此技能激活时使用更强的模型
  maxTokens: 8192
---

# 技能正文内容...
```
:::

---

## 环境注入（Env Injection）

技能可以声明需要访问的环境变量，OpenClaw 会在技能激活时注入：

```json5
{
  skills: {
    "github-helper": {
      env: {
        GITHUB_TOKEN: "${GITHUB_TOKEN}",
        DEFAULT_REPO: "my-org/my-repo"
      }
    }
  }
}
```

---

## Token 影响

每个技能都会增加系统提示词的长度，从而增加每次请求的 Token 消耗。

::: details 控制 Token 消耗的建议
- 只启用当前任务需要的技能
- 使用 Gate 规则让技能按需激活
- 保持技能内容简洁，避免冗长的指令
- 定期审查已启用的技能列表，移除不再需要的技能
:::

---

## 技能生命周期（Lifecycle）

```text
启动 OpenClaw
    ↓
扫描技能目录
    ↓
加载 SKILL.md 文件
    ↓
检查 Gate 规则
    ↓
满足条件 → 注入提示词 → Agent 开始工作
不满足条件 → 技能待机，等待下次检查
```

---

_下一步：[创建自定义技能](/tutorials/tools/creating-skills) | [技能配置参考](/tutorials/tools/skills-config)_
