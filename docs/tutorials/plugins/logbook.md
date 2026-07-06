---
title: "Logbook 插件"
sidebarTitle: "Logbook"
description: "OpenClaw 插件专题：Logbook。把屏幕快照整理成时间线、日报和工作回顾，但需要明确理解隐私与模型流向。"
---

# Logbook 插件

Logbook 可以把你的屏幕活动自动整理成“工作流水账”。

它不是简单截图工具，而是大致做这几步：

1. 定时抓取屏幕快照
2. 过滤掉连续没变化的画面
3. 用视觉模型提炼出“你刚才在做什么”
4. 再把这些观察整理成时间线卡片、日报和回顾问答

如果你一直想要：

- 今天到底做了什么的自动回顾
- Standup 草稿
- 一天内某个时段在干什么的时间线

这页值得看。

---

## 先说最重要的风险

Logbook 会碰到你的屏幕内容。

这意味着它可能看到：

- 聊天窗口
- 代码和终端
- 浏览器里的后台系统
- API Key、密码输入框、内部文档

所以在启用前，先明确三件事：

1. 你是否真的接受定时截屏
2. 截图会发给哪个视觉模型
3. 你是否需要把这两段处理都留在本地

如果你对隐私非常敏感，不要把它当默认必开功能。

---

## 它解决什么问题

手工写工作日志很烦，尤其是：

- 一天里在很多应用之间来回切
- 临时处理了很多小事，晚上已经记不清
- 需要 standup、日报或回顾材料

Logbook 的目标不是监控你，而是帮你把碎片活动重新整理成较可读的工作轨迹。

---

## 使用前提

至少要具备这些条件：

- 有一个已连接节点，能提供 `screen.snapshot` 或 `logbook.snapshot`
- 如果是 macOS 节点，需要授予屏幕录制权限
- 已启用并登录 [Codex Harness](/tutorials/plugins/codex-harness) 相关能力，因为当前结构化图像提取依赖这条路线
- 有一个可用的默认 Agent 模型，用来把观察结果整理成时间线和日报

如果这些前提缺一块，Logbook 往往不是“打开就能用”的功能。

---

## 快速开始

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw dashboard
```

如果你想让启动更可控，建议明确写上视觉模型：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          visionModel: "codex/gpt-5.5",
        },
      },
    },
  },
}
```

---

## 它在后台怎么工作

可以用人话理解成 4 步：

### 1. Capture

定时截图，默认每 30 秒一次。

### 2. Observe

攒够一个分析窗口后，挑出有代表性的若干帧，发给视觉模型，提炼成“活动观察”。

例如：

```text
14:08 在 VS Code 修改 gateway 配置
14:12 在 Chrome 查看 dashboard
14:18 在终端跑测试
```

### 3. Synthesize

再把这些观察整合成更高层的时间线卡片、摘要和日报。

### 4. Prune

按保留期清理旧截图。

所以它并不是“无限保存所有屏幕录像”，而是“截图 -> 观察 -> 摘要”这条链路。

---

## 数据会流向哪里

这是最应该看懂的一段。

| 阶段 | 发出去的数据 | 典型去向 |
|------|------|------|
| 观察屏幕 | 采样后的 JPEG 截图 | `visionModel` 指向的视觉模型 |
| 生成时间线/日报 | 文字化观察结果 + 近期卡片 | 默认 Agent 模型 |

关键点：

- 原始截图主要用于“观察”阶段
- 后续日报、时间线和问答，更多是基于整理后的文字
- 如果你必须本地闭环，就要同时考虑视觉模型和默认 Agent 模型都走本地路线

---

## 常用配置项

```json5
{
  plugins: {
    entries: {
      logbook: {
        enabled: true,
        config: {
          captureEnabled: true,
          captureIntervalSeconds: 30,
          analysisIntervalMinutes: 15,
          nodeId: "my-mac",
          screenIndex: 0,
          maxWidth: 1440,
          visionModel: "codex/gpt-5.5",
          retentionDays: 14,
        },
      },
    },
  },
}
```

你最需要关心的通常是：

- `captureEnabled`：总开关
- `nodeId`：固定使用哪个节点截图
- `visionModel`：截图交给谁看
- `retentionDays`：旧截图保留多久

---

## Dashboard 里能看到什么

启用并跑起来以后，Dashboard 里通常会出现 Logbook 相关标签，能看这些内容：

- 时间线卡片
- 当日概览
- 每日 standup 草稿
- “今天我什么时候在做 X” 这类问答
- 立即分析当前窗口的按钮

如果你只想要“日报草稿”，其实也没必要一上来就研究全部 RPC 细节，先看 Dashboard 里的时间线是否稳定生成即可。

---

## 最常见的坑

### 没有截图能力

先确认节点真的暴露了：

```text
screen.snapshot
```

或：

```text
logbook.snapshot
```

### 插件开了但没有时间线

先分层检查：

1. 截图有没有发生
2. 视觉模型是否可用
3. 默认 Agent 模型是否可用

很多问题不是 Logbook 本身，而是模型链路不完整。

### Headless 节点看起来正常但抓不到图

这类场景常常和节点能力、系统权限或 `nodeId` 选错有关。优先核对当前连接节点和插件运行时信息。

---

## 适合谁，不适合谁

更适合：

- 想自动做日报/standup 的个人或维护者
- 一天里频繁切应用、晚上很难回忆做过什么的人
- 想用“真实屏幕活动”辅助回顾，而不是纯靠记忆的人

不太适合：

- 对截屏极度敏感的环境
- 没有稳定节点与模型链路的轻量安装
- 只想聊天，不需要工作流水账的人

---

## 相关页面

- [插件专题](/tutorials/plugins/)
- [Codex Harness](/tutorials/plugins/codex-harness)
- [节点 Nodes](/tutorials/nodes/)
- [控制 UI](/tutorials/web/control-ui)
