---
title: "帮助与故障排查"
sidebarTitle: "帮助中心"
---

# 帮助与故障排查（Help & Troubleshooting）

这里是 OpenClaw 的帮助中心。无论你遇到配置疑惑、运行异常还是测试需求，都能在这里找到对应的指南。

---

## 本模块包含的内容

| 页面 | 说明 |
|------|------|
| [常见问题 FAQ](./faq) | 新手最常问的 10 个问题，快速解答 |
| [调试指南](./debugging) | 如何开启调试模式、查看原始日志、定位问题根源 |
| [故障排查](./troubleshooting) | Agent 不回复、Gateway 无法启动、通道断连等常见故障的处理步骤 |
| [环境变量](./environment) | 配置环境变量的加载顺序、变量替代语法与安全使用建议 |
| [脚本约定](./scripts) | 如何编写与 OpenClaw 配合使用的自动化脚本 |
| [测试指南](./testing) | 单元测试、E2E 测试、Live 测试的运行方式 |
| [Node.js 问题排查](./node-issue) | 解决 Node + tsx 运行时出现的 `__name is not a function` 崩溃 |

---

## 快速定位问题

如果你不确定从哪里开始，按下面的路径判断：

- **刚安装完，什么都不工作** → 先看 [故障排查](./troubleshooting)
- **不知道某个功能怎么用** → 先看 [常见问题 FAQ](./faq)
- **想看详细日志排查问题** → 看 [调试指南](./debugging)
- **配置文件里的变量不生效** → 看 [环境变量](./environment)
- **要跑测试或验证改动** → 看 [测试指南](./testing)
- **Node.js 报错 `__name is not a function`** → 看 [Node.js 问题排查](./node-issue)

::: tip 还是解决不了？
可以前往 [GitHub Issues](https://github.com/openclaw/openclaw/issues) 提交问题，或者加入社区讨论。
:::

---

_下一步：[常见问题 FAQ](./faq)_
