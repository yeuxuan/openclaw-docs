---
title: "子智能体"
sidebarTitle: "子智能体"
---

# 子智能体（Sub-Agents）

子智能体（Sub-Agents）让主 Agent 可以启动并协调其他 Agent 来并行完成复杂任务。就像一个项目经理把工作分配给团队成员一样，主 Agent 可以将大任务拆分成多个子任务，分发给专门的子 Agent 处理，最后汇总结果。

---

## 快速上手

**第一步：在配置中启用子智能体**

```json5
{
  agents: {
    subagents: {
      enabled: true,
      maxConcurrent: 3  // 最多同时运行 3 个子 Agent
    }
  }
}
```

**第二步：让主 Agent 协调子 Agent**

主 Agent 会根据任务复杂度自动决定是否启动子 Agent：

```text
帮我同时分析三个代码库的结构，并生成对比报告
```

主 Agent 会启动三个子 Agent，分别分析不同的代码库，然后汇总结果。

---

## 工作方式

```text
用户消息
    ↓
主 Agent 分析任务
    ↓
决定需要子 Agent
    ↓
启动子 Agent 1  启动子 Agent 2  启动子 Agent 3
    ↓                ↓               ↓
  完成任务A        完成任务B        完成任务C
    ↓                ↓               ↓
          主 Agent 收集结果
                ↓
          汇总并回复用户
```

子 Agent 完成任务后，其输出会以工具调用结果的形式返回给主 Agent，主 Agent 负责整合最终答案。

---

## 完整配置示例

```json5
{
  agents: {
    subagents: {
      enabled: true,
      maxConcurrent: 3,    // 最大并发子 Agent 数量
      timeout: 120000,     // 子 Agent 超时时间（毫秒）
      inherit: {
        tools: true,       // 子 Agent 继承主 Agent 的工具配置
        context: false     // 子 Agent 不继承主 Agent 的对话历史
      }
    }
  }
}
```

---

## 会话管理命令

```bash
# 查看当前运行的子 Agent 会话
openclaw sessions list --type subagent

# 停止指定的子 Agent 会话
openclaw sessions stop <session-id>

# 停止所有子 Agent
openclaw sessions stop --all-subagents
```

---

## 宣布流程（Announce）

子 Agent 启动时会向主 Agent 发出声明（Announce），告知自己的能力和任务范围。这个机制确保主 Agent 了解每个子 Agent 的状态：

::: details 宣布机制详情
1. 主 Agent 创建子 Agent 请求
2. 子 Agent 初始化，加载分配的工具和技能
3. 子 Agent 向主 Agent 宣布就绪，附带能力描述
4. 主 Agent 确认接收，开始分配任务
5. 任务完成后，子 Agent 返回结果并关闭
:::

---

## 工具策略（Tool Policy）

你可以限制子 Agent 可以使用的工具，避免子 Agent 拥有过多权限：

```json5
{
  agents: {
    subagents: {
      enabled: true,
      toolPolicy: {
        // 子 Agent 只能使用这些工具
        allowed: ["web", "browser"],
        // 子 Agent 不能使用执行命令工具
        disabled: ["exec"]
      }
    }
  }
}
```

::: tip 最小权限原则
为子 Agent 设置比主 Agent 更严格的工具限制是最佳实践。子 Agent 通常只需要完成特定任务，不需要完整权限。
:::

---

## 认证继承

子 Agent 默认继承主 Agent 的认证信息（API Key、OAuth Token 等），无需单独配置：

::: details 认证继承说明
- 子 Agent 使用与主 Agent 相同的 AI 模型 API Key
- 子 Agent 访问外部服务时使用主 Agent 的凭证
- 如果需要子 Agent 使用不同凭证，可以在子 Agent 配置中单独指定
:::

---

## 上下文传递

主 Agent 向子 Agent 传递的上下文内容可以精确控制：

```json5
{
  agents: {
    subagents: {
      contextPassing: {
        includeSystemPrompt: true,    // 传递系统提示词
        includeConversation: false,   // 不传递完整对话历史
        includeSkills: true           // 传递技能配置
      }
    }
  }
}
```

::: warning
传递过多上下文会增加子 Agent 的 Token 消耗。默认配置已针对效率和功能做了平衡，建议只在有明确需求时修改。
:::

---

## 停止子 Agent

有时你需要手动停止运行中的子 Agent：

```bash
# 在聊天界面中
/stop-subagents

# 停止特定子 Agent
/stop-subagent <agent-id>
```

或者通过斜杠命令紧急停止所有子 Agent：

```text
/kill-all
```

---

## 使用限制

| 限制项 | 默认值 | 说明 |
|--------|--------|------|
| 最大并发数 | 3 | 同时运行的子 Agent 上限 |
| 单个超时 | 120 秒 | 子 Agent 单次任务超时时间 |
| 嵌套深度 | 2 层 | 子 Agent 可以再启动子 Agent，但最多 2 层 |

::: details 修改限制配置
```json5
{
  agents: {
    subagents: {
      maxConcurrent: 5,       // 提高并发上限
      timeout: 300000,        // 延长超时至 5 分钟
      maxNestingDepth: 1      // 禁止子 Agent 再启动子 Agent
    }
  }
}
```
:::

---

_下一步：[斜杠命令（Slash Commands）](/tutorials/tools/slash-commands) | [工具系统总览](/tutorials/tools/)_
