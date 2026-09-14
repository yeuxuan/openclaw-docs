---
title: "自动化模块概览"
sidebarTitle: "自动化"
---

# 自动化

自动化就是让 OpenClaw 在你没盯着它的时候，也能按规则做事。

比如：

- 每天早上发一份日报
- GitHub 有新 Issue 时提醒你
- 服务器报警时让 Agent 先看日志
- 每隔一段时间检查一次某个网页
- 让某个会话过一会儿继续推进

---

## 四种常见方式

### 1. Hooks：事情发生时触发

Hooks 像门铃。有人按门铃，屋里的人就知道要做事。

适合：

- 会话开始时准备上下文
- 消息到达时记录日志
- 工具调用前后做审计
- 任务结束后清理临时文件

[查看 Hooks 文档](/tutorials/automation/hooks)

---

### 2. Cron：按固定时间触发

Cron 像闹钟。每天几点、每周几、每小时一次，都可以安排。

适合：

- 每天 9 点生成日报
- 每周五整理周报
- 每小时检查系统状态
- 每晚汇总待办事项

[查看 Cron 定时任务](/tutorials/automation/cron-jobs)

---

### 3. Heartbeat：让当前会话稍后继续

Heartbeat 像“过 30 分钟提醒我回来接着做”。
它更适合当前这条对话里的短周期跟进，而不是长期后台任务。

适合：

- 20 分钟后继续检查构建结果
- 1 小时后回到当前线程总结进展
- 等某个服务启动后继续下一步

[查看 Cron vs Heartbeat](/tutorials/automation/cron-vs-heartbeat)

---

### 4. Webhook：外部系统来敲门

Webhook 像别人从外面打电话进来。
GitHub、监控系统、表单系统、内部平台都可以通过 HTTP 请求触发 OpenClaw。

适合：

- GitHub Actions 完成后通知 Agent
- 监控告警后自动排查
- 外部系统提交数据后生成摘要
- 用脚本主动触发某个工作流

[查看 Webhook 文档](/tutorials/automation/webhook)

---

## 怎么选

| 你想做的事 | 选哪个 |
|------------|--------|
| “每周一早上固定运行” | Cron |
| “这条对话半小时后继续” | Heartbeat |
| “收到外部系统通知再运行” | Webhook |
| “OpenClaw 内部发生事件后运行” | Hooks |
| “不支持推送，只能定期去看有没有新内容” | Poll |
| “收到可信发件人的新邮件后处理” | IMAP 邮件触发 |
| “后台任务跑了但不知道结果” | Tasks |
| “多步骤流程要跨重启跟踪” | Task Flow |

更多对比看 [Cron vs Heartbeat](/tutorials/automation/cron-vs-heartbeat)。

---

## 扩展功能

- [Poll 轮询](/tutorials/automation/poll)：主动去检查新消息或新数据
- [后台任务 Tasks](/tutorials/automation/tasks)：查看后台运行的状态、结果和失败原因
- [Task Flow 任务流](/tutorials/automation/taskflow)：跟踪多步骤后台流程
- [Standing Orders 长期指令](/tutorials/automation/standing-orders)：给 Agent 长期授权和边界
- [ClawFlow 已更名](/tutorials/automation/clawflow)：旧名称到 Task Flow 的说明
- [Gmail Pub/Sub](/tutorials/automation/gmail-pubsub)：接收 Gmail 推送
- [IMAP 邮件触发](/tutorials/automation/imap)：监控现有邮箱，把新邮件交给隔离低权限 Reader Agent
- [OAuth 认证监控](/tutorials/automation/auth-monitoring)：避免 Token 过期导致服务中断
- [自动化故障排查](/tutorials/automation/troubleshooting)：任务没有执行时从这里查

---

## 安全提醒

自动化任务最好写得清楚一点：什么时候运行、能访问什么、失败了怎么办。

特别是会运行命令、访问外部系统、处理敏感信息的任务，要注意：

- 不要把 API Key 写进公开文档或公开仓库
- Webhook 要有认证或签名校验
- Cron 任务要避免重复启动同一个重活
- 命令执行类任务要配合审批和沙箱
- 失败后要有日志，别让问题悄悄发生

---

## 第一次使用建议

先做一个很小的任务，比如“每天早上发一句测试消息”。
跑通以后，再加模型调用、工具调用和外部系统集成。

自动化最怕一开始就做太大：出了问题，不知道是时间规则错了、权限错了、模型错了，还是外部系统没回调。
