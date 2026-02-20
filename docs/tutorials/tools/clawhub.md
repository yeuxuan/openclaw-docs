---
title: "ClawHub 工具中心"
sidebarTitle: "ClawHub"
---

# ClawHub 工具中心（ClawHub）

ClawHub 是 OpenClaw 的官方技能和工具市场，汇聚了社区贡献的技能包（Skills）。你可以在这里搜索、安装、管理各种扩展能力，无需从零开发。

---

## 快速开始

```bash
# 搜索技能包
openclaw clawhub search "代码审查"

# 安装技能包
openclaw clawhub install code-review

# 查看已安装的技能包
openclaw clawhub list

# 更新技能包
openclaw clawhub update code-review

# 删除技能包
openclaw clawhub remove code-review
```

---

## ClawHub 是什么？

ClawHub 是一个社区驱动的技能生态系统，类似于 npm 之于 Node.js 生态。任何人都可以将自己编写的技能包发布到 ClawHub，供其他用户使用。

::: info 技能包包含什么？
- **工具定义**：扩展 Agent 可以调用的工具
- **提示模板**：针对特定任务优化的 System Prompt
- **工作流模板**：多步骤任务的执行流程
- **配置预设**：常见场景的推荐配置
:::

---

## 常见工作流

**第一步：搜索你需要的技能**

```bash
openclaw clawhub search "数据分析"
```

输出示例：
```text
找到 3 个匹配的技能包：
- data-analyst    ★4.8  数据分析与可视化技能包
- sql-helper      ★4.5  SQL 查询辅助工具
- chart-maker     ★4.2  图表自动生成
```

**第二步：预览技能包详情**

```bash
openclaw clawhub info data-analyst
```

**第三步：安装并配置**

```bash
openclaw clawhub install data-analyst
```

安装后，在配置文件中启用该技能：

```json5
{
  skills: {
    enabled: ["data-analyst"]
  }
}
```

---

## 安全与审核（Moderation）

::: warning 安装前请确认
- ClawHub 对所有提交的技能包进行自动安全扫描
- 社区认证（Verified）的技能包经过人工审核，安全性更高
- 安装来源不明的技能包前，请先查看其源码和权限申请
:::

技能包的信任级别：

| 标识 | 说明 |
|------|------|
| Verified | 官方或社区人工审核通过 |
| Community | 社区贡献，自动扫描通过 |
| Unverified | 未经审核，谨慎安装 |

---

## 高级功能

::: details 依赖管理与版本锁定

技能包之间可以有依赖关系，安装时会自动解析：

```bash
# 安装指定版本
openclaw clawhub install code-review@2.1.0

# 查看依赖树
openclaw clawhub deps code-review
```

版本锁定文件位于：`~/.openclaw/clawhub.lock`，建议将其加入版本控制，确保团队使用相同版本。
:::

::: details 影响 ClawHub 行为的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `CLAWHUB_REGISTRY` | 自定义 ClawHub 镜像地址 | 官方源 |
| `CLAWHUB_CACHE_DIR` | 技能包缓存目录 | `~/.openclaw/cache` |
| `CLAWHUB_TIMEOUT` | 下载超时时间（秒） | `30` |
| `CLAWHUB_PROXY` | 代理服务器地址 | 无 |
:::

---

_下一步：[工具系统总览](/tutorials/tools/)_
