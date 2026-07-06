---
title: "插件专题"
sidebarTitle: "插件专题"
---

# 插件专题：OpenClaw 怎么长出新能力

OpenClaw 最新架构里，插件是扩展边界。通道、工具、模型 provider、媒体能力、hooks、SDK runtime，都可以通过插件方式接进 Gateway。

新手先记一句：

```text
插件像安装包，manifest 说明它是谁，runtime 才真正干活。
```

## 先讲人话

OpenClaw 不可能把世界上所有聊天软件、模型服务、公司内部工具都写进核心代码。
所以它用插件来加能力。

你可以这样理解：

| 名词 | 人话解释 |
|------|----------|
| 插件 | 一个扩展包 |
| manifest | 插件的说明书，写着名字、版本、需要什么权限 |
| runtime | 插件真正运行的代码 |
| hook | 某件事发生时顺手做一件事，比如收到消息后记录日志 |
| SDK | 给开发者用的工具包 |

普通使用者先会做 3 件事就够了：

```bash
openclaw plugins list
openclaw plugins enable <plugin>
openclaw plugins disable <plugin>
```

如果你只是配置 Telegram、OpenAI 或浏览器工具，大多数时候不需要自己写插件。

## 什么时候需要读这一章

- 你想知道某个通道为什么是插件提供的。
- 你要安装第三方插件。
- 你是开发者，想给 OpenClaw 增加新通道、新工具或新模型 Provider。
- 你在排查插件加载、权限或 manifest 报错。

先读：

- [插件架构](/tutorials/plugins/architecture)
- [插件 Manifest](/tutorials/plugins/manifest)
- [管理插件](/tutorials/plugins/manage-plugins)
- [构建插件](/tutorials/plugins/building-plugins)
- [llama.cpp Provider](/tutorials/plugins/llama-cpp)
- [Logbook 插件](/tutorials/plugins/logbook)

## 常见插件入口

- [Workboard 插件](/tutorials/plugins/workboard)：在控制 UI 中启用本地 Kanban 工作板，管理 Agent 工作卡片。
- [Copilot SDK Harness](/tutorials/plugins/copilot)：通过 `@openclaw/copilot` 使用 GitHub Copilot SDK Harness 运行 Agent 回合。
- [llama.cpp Provider](/tutorials/plugins/llama-cpp)：给本地 GGUF 记忆嵌入提供原生运行时。
- [Logbook 插件](/tutorials/plugins/logbook)：把屏幕活动整理成时间线、日报和工作回顾。
