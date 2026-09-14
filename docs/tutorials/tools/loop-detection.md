---
title: "循环检测"
sidebarTitle: "循环检测"
description: "OpenClaw 重复工具调用与压缩后循环保护的启用方式、结果归一化、恢复机会和日志判读。"
---

# 循环检测：避免重复调用却没有进展

OpenClaw 在 `tools.loopDetection` 下有两道相关保护：

- 滚动历史检测默认关闭，观察重复调用、无结果轮询和未知工具重试。
- 压缩后保护默认保留；上下文压缩重试后仍重复相同工具、参数和结果，会以 `compaction_loop_persisted` 中止运行。

`enabled` 未设置与显式 `false` 不一样：显式 false 会同时关闭两道保护。

## 配置

```json5
{
  tools: {
    loopDetection: { enabled: true },
  },
}
```

Control UI 的 Settings → Labs 也可打开滚动历史检测。单个 Agent 的覆盖放在 `agents.entries.<id>.tools.loopDetection`。

当前公开配置保留 `enabled` 开关；不要再复制旧教程里的 `warningThreshold`、`criticalThreshold`、`unknownToolThreshold`、`globalCircuitBreakerThreshold`、`historySize`、`detectors` 或 `postCompactionGuard.windowSize` 调参示例。

## 哪些变化不算进展

Exec 比较稳定结果：状态、退出码、是否超时和输出，忽略运行耗时、PID、session ID 等易变元数据。对于有类型的终态失败，还忽略诊断时间戳、明确标注的重试计数和进程号；真正的新错误原因仍会打断重复序列。

发送消息时，新 message ID 或时间戳并不使相同发送结果变成进展。具备 runId 时只在本轮比较，新运行或定时 heartbeat 不继承旧循环计数。

这些规则只比较结果，不认证内容，也不会改变原工具返回值或授权。

## 触发后怎么处理

系统先警告，再按严重程度阻断工具批次。第一次关键循环会在整批工具执行前阻断，并给模型一次带正常工具的恢复回复机会；它可以报告结果、提问或改用不同工具/参数。同一运行再次触发关键循环，会阻断批次并结束运行。

压缩后保护仅在压缩重试后启用。可在日志查 `post-compaction guard armed for N attempts`，并结合最终错误确认是否在同一工具、参数与结果上反复失败。

等待异步结果优先使用系统的完成通知，而不是不停轮询。不要为掩盖重复失败而一律关闭保护；先查命令、权限、依赖或上游状态。

继续阅读：[Exec](/tutorials/tools/exec)、[子智能体](/tutorials/tools/subagents)。

上游来源：[Tool-loop detection](https://github.com/openclaw/openclaw/blob/2e3bf941b7848fa9dfcbcfc8c9a89d99e2feeb30/docs/tools/loop-detection.md)。
