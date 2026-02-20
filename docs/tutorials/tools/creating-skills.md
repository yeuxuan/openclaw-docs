---
title: "创建自定义技能"
sidebarTitle: "创建技能"
---

# 创建自定义技能（Creating Skills）

你可以创建自己的技能（Skills），让 Agent 掌握特定领域的专业知识、固定流程或行为规范。技能以 Markdown 文件形式存在，简单易写，无需编程基础。

---

## 快速上手

**第一步：创建技能目录**

全局技能放在用户主目录下：

```bash
mkdir -p ~/.openclaw/skills/my-skill
```

如果只想在某个项目中使用，放在工作区目录下：

```bash
mkdir -p /your-project/.openclaw/skills/my-skill
```

**第二步：创建技能定义文件**

在技能目录中创建 `SKILL.md` 文件：

```markdown
# 我的技能名称

## 描述
这个技能能做什么，适合什么场景。

## 使用方法
当用户说...时使用此技能。

## 指令
<具体指令内容，告诉 Agent 该怎么做>
```

**第三步：重启 OpenClaw 加载技能**

```bash
openclaw restart
```

或者通过斜杠命令热加载：

```text
/reload-skills
```

---

## 目录结构

```text
~/.openclaw/skills/
  ├── code-review/
  │   ├── SKILL.md        ← 技能定义文件（必须）
  │   ├── README.md       ← 可选：人类可读的说明
  │   └── scripts/        ← 可选：技能附带的脚本
  │       └── lint.sh
  └── git-workflow/
      └── SKILL.md
```

::: info
每个技能必须是独立目录，目录名即为技能的唯一标识符。`SKILL.md` 是唯一必需的文件。
:::

---

## SKILL.md 文件格式

完整的 `SKILL.md` 文件结构如下：

```markdown
# 技能名称

## 描述
简洁描述这个技能的用途（1-3 句话）。

## 使用方法
在以下场景中启用此技能：
- 用户请求代码审查时
- 用户提到 "review"、"检查代码" 等关键词时

## 指令

（以下是注入给 Agent 的实际指令内容）

你是一个专业的代码审查专家。在进行代码审查时，请遵循以下原则：

1. **安全性优先**：首先检查是否存在注入漏洞、认证绕过等安全问题
2. **错误处理**：确保所有错误都被妥善处理，不会导致崩溃
3. **可读性**：评估命名是否清晰，注释是否充分
4. **性能**：指出明显的性能瓶颈

审查格式：
- 使用 ✅ 标记做得好的地方
- 使用 ⚠️ 标记需要改进的地方
- 使用 ❌ 标记必须修复的问题

每个问题都要给出具体的改进建议。
```

---

## 实际示例

### 示例一：Git 提交规范技能

```markdown
# Git Commit Helper

## 描述
帮助生成符合 Conventional Commits 规范的提交信息。

## 使用方法
当用户需要编写 git commit 消息时使用。

## 指令
生成 git commit 消息时，严格遵循 Conventional Commits 规范：

格式：<type>(<scope>): <subject>

类型（type）：
- feat: 新功能
- fix: 修复 Bug
- docs: 文档更新
- style: 格式调整（不影响功能）
- refactor: 重构
- test: 测试相关
- chore: 构建工具、依赖更新

示例：
- feat(auth): add OAuth2 login support
- fix(api): handle null response from search endpoint

Subject 要求：
- 使用祈使句（"add" 而不是 "added"）
- 不超过 72 个字符
- 不加句号
```

### 示例二：中文写作风格技能

```markdown
# 中文技术写作

## 描述
确保技术文档使用统一、专业的中文写作风格。

## 指令
在撰写中文技术文档时，遵循以下规范：

1. 中英文之间加空格：「React 组件」而不是「React组件」
2. 数字与单位之间加空格：「16 GB」而不是「16GB」
3. 专有名词首次出现时附英文：「智能体（Agent）」
4. 使用"你"而非"您"（更友好）
5. 避免过度使用"的"，保持行文简洁
```

---

## 最佳实践

### 保持技能功能单一

每个技能只做一件事。不要把"代码审查"和"Git 工作流"混在一个技能里。

```text
好的设计：
  code-review/SKILL.md      ← 只管代码审查
  git-workflow/SKILL.md     ← 只管 Git 流程

避免的设计：
  everything/SKILL.md       ← 把所有规范塞在一起
```

### 提供清晰的使用说明

在 `## 使用方法` 中明确写出触发条件，帮助 Agent 判断什么时候应该应用此技能。

### 在不同场景下测试

创建技能后，用几个典型的用户请求测试 Agent 的行为是否符合预期：

```text
测试用例 1：用户请求 "帮我看看这段代码有没有问题"
期望行为：Agent 触发代码审查技能，给出结构化的审查报告

测试用例 2：用户问 "今天天气怎么样"
期望行为：Agent 不触发代码审查技能，正常回答
```

### 避免与其他技能冲突

如果你有多个技能，确保它们的指令不会相互矛盾。例如，不要在一个技能中指定"使用英文回复"，同时在另一个技能中指定"使用中文回复"。

::: warning
技能中的指令会与系统提示词合并注入。过于冗长的技能会消耗大量 Token，影响性能和成本。建议每个技能的指令部分控制在 500 字以内。
:::

---

## 调试技能

如果技能没有按预期工作，可以使用以下方法排查：

```bash
# 查看已加载的技能列表
openclaw skills list

# 查看特定技能的内容
openclaw skills show code-review

# 验证技能文件格式
openclaw skills validate ~/.openclaw/skills/my-skill/
```

---

_下一步：[技能配置参考](/tutorials/tools/skills-config) | [技能系统说明](/tutorials/tools/skills)_
