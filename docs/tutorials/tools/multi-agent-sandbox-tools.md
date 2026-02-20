---
title: "多 Agent 沙箱工具配置"
sidebarTitle: "多 Agent 沙箱工具配置"
---

# 多 Agent 沙箱工具配置（Multi-Agent Sandbox Tools）

在多 Agent 场景下，不同的 Agent 往往需要不同的工具权限和沙箱级别。OpenClaw 支持为每个 Agent 单独配置工具访问权限，同时维护全局默认策略。

---

## 配置概览

工具权限配置遵循三层结构，优先级从低到高：

```text
全局配置（Global）
  ↓ 可覆盖
Agent 级配置（Agent-level）
  ↓ 可覆盖
会话级配置（Session-level）
```

---

## 配置示例

以下是一个包含两个不同角色 Agent 的配置示例：

```json5
{
  // 全局默认：所有 Agent 的兜底配置
  tools: {
    allowed: ["web"],
    sandbox: "strict"
  },

  agents: {
    // 数据分析师 Agent：可以访问 Web 和执行代码
    "analyst": {
      tools: {
        allowed: ["web", "exec"],
        sandbox: "strict"
      }
    },

    // 助理 Agent：可以操作浏览器和使用技能包
    "assistant": {
      tools: {
        allowed: ["browser", "skills"],
        sandbox: "normal"
      }
    },

    // 管理员 Agent：拥有完整权限
    "admin": {
      tools: {
        allowed: ["web", "exec", "browser", "skills", "filesystem"],
        sandbox: "none"
      }
    }
  }
}
```

---

## 沙箱级别说明

| 级别 | 说明 | 适用场景 |
|------|------|----------|
| `strict` | 严格隔离，网络访问受限，文件系统只读 | 处理不可信输入 |
| `normal` | 标准限制，允许指定工具访问 | 日常任务 |
| `none` | 无沙箱限制 | 仅限受信任的内部 Agent |

---

## 可用工具列表

| 工具标识 | 功能 |
|---------|------|
| `web` | HTTP 请求、网页抓取 |
| `browser` | 浏览器自动化操作 |
| `exec` | 执行系统命令或代码 |
| `skills` | 使用已安装的技能包 |
| `filesystem` | 读写本地文件系统 |

---

## 不同场景的推荐配置

::: details 内容生成场景

```json5
{
  agents: {
    "writer": {
      tools: {
        allowed: ["web", "skills"],
        sandbox: "normal"
      }
    }
  }
}
```
:::

::: details 代码执行场景

```json5
{
  agents: {
    "coder": {
      tools: {
        allowed: ["exec", "filesystem"],
        sandbox: "strict",
        exec: {
          // 只允许在指定目录执行
          workdir: "/sandbox/projects",
          // 限制可执行的命令
          allowedCommands: ["python", "node", "npm"]
        }
      }
    }
  }
}
```
:::

::: details 数据采集场景

```json5
{
  agents: {
    "scraper": {
      tools: {
        allowed: ["web", "browser"],
        sandbox: "strict",
        web: {
          // 限制只能访问指定域名
          allowedDomains: ["example.com", "data.gov"]
        }
      }
    }
  }
}
```
:::

---

## 测试沙箱配置是否生效

配置完成后，可以通过以下方式验证：

```bash
# 以指定 Agent 身份运行测试任务
openclaw run --agent analyst "尝试访问 https://example.com"

# 查看 Agent 的权限报告
openclaw agent info analyst --show-tools

# 模拟运行（不实际执行，只显示权限检查结果）
openclaw run --agent analyst --dry-run "执行 ls /etc"
```

---

## 从旧版本迁移工具配置

::: details 迁移指南（v1.x → v2.x）

旧版本使用扁平化的 `allowedTools` 数组，新版本改为按 Agent 分组的结构：

**旧版配置：**
```json5
{
  allowedTools: ["web", "exec"]
}
```

**新版配置：**
```json5
{
  tools: {
    allowed: ["web", "exec"]
  }
}
```

运行迁移命令自动转换：
```bash
openclaw config migrate --from v1 --to v2
```
:::

---

## 故障排查

::: warning 常见配置问题

**Agent 使用了不在 allowed 列表中的工具**：检查会话级配置是否意外覆盖了 Agent 级配置。会话级配置优先级最高，会覆盖 Agent 级设置。

**sandbox: none 不生效**：部分部署环境会强制启用最低沙箱级别，检查 OpenClaw 的部署配置文件（`deploy.config.json`）中是否有 `forceSandbox` 选项。

**工具权限继承异常**：如果全局配置和 Agent 级配置都设置了 `allowed`，Agent 级配置会完全替换（而非合并）全局配置。如需合并，使用 `extend: true` 选项。
:::

---

_下一步：[工具系统总览](/tutorials/tools/)_
