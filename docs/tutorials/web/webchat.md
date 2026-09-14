---
title: "WebChat"
sidebarTitle: "WebChat"
---

# WebChat：直接在浏览器里和 Agent 聊天

WebChat 是 Control UI 里的聊天入口。你可以不用 Telegram 或 Discord，先在浏览器里发第一条消息。

推荐新手流程：

1. 安装 OpenClaw。
2. 运行 `openclaw onboard --install-daemon`。
3. 打开 `openclaw dashboard`。
4. 在 WebChat 里发一句“你好”。

WebChat 能回复，说明 Gateway、模型和基本会话链路已经通了。之后再接聊天通道会更稳。

## 发送前后的状态

修改模型等聊天设置后立即发送，会先显示 **Applying chat settings**，等待本次设置应用；不要把短暂等待当成发送失败。聊天历史中的长助手消息会自动补全，预览在加载期间仍可阅读。

消息入队后的发送标识保持不变，即使执行使用另一个 run ID，历史刷新也会按原始发送标识对账。断线后若显示 **Delivery unconfirmed**，先查历史，确认没有执行再重试。浏览器的 **Discard** 只丢弃待发副本，不会取消已受理的运行。

旧草稿需要选择恢复目标、附件丢失或浏览器存储不足时，按 [Control UI 恢复说明](/tutorials/web/control-ui)处理；仍有待恢复内容时不要直接清除站点数据。
