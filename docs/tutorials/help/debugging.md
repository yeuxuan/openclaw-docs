---
title: "调试指南"
sidebarTitle: "调试"
---

# 调试指南（Debugging Guide）

当 Agent 行为异常或请求没有按预期执行时，开启调试模式能让你看到 OpenClaw 与 AI 模型之间的完整通信细节，快速定位问题所在。

---

## 开启调试模式（Debug Mode）

在配置文件中添加 `debug` 块，即可启用详细日志：

```json5
{
  debug: {
    enabled: true,      // 启用调试模式
    rawStream: true,    // 记录原始流日志
    rawChunks: true,    // 记录原始块日志
    verbose: true       // 输出详细信息
  }
}
```

::: tip 配置文件位置
默认配置文件路径为 `~/.openclaw/config.json5`。运行 `openclaw config edit` 可以直接打开编辑。
:::

修改配置后，重启 Gateway 使配置生效：

```bash
openclaw gateway restart
```

---

## Gateway 监视模式（Watch Mode）

不需要重启，实时查看 Gateway 事件流：

```bash
openclaw gateway --watch
```

这会在终端中持续打印 Gateway 接收和发送的事件，适合快速排查消息路由问题。

---

## 原始流日志（Raw Stream Logging）

启用 `rawStream: true` 后，OpenClaw 会记录与 AI 模型之间的完整 HTTP 流式响应。适合排查：

- AI 模型返回了意外内容
- 流式输出中断
- Token 截断问题

::: details 查看原始流日志示例
```json5
[stream] --> POST https://api.anthropic.com/v1/messages
[stream] <-- 200 OK
[stream] data: {"type":"content_block_start","index":0,...}
[stream] data: {"type":"content_block_delta","delta":{"text":"你好"},...}
[stream] data: [DONE]
```
:::

---

## 原始块日志（Raw Chunk Logging）

启用 `rawChunks: true` 后，OpenClaw 会记录消息在内部传递时的分块详情。适合排查：

- 消息格式问题
- 工具调用参数丢失
- 消息组装异常

::: details 查看原始块日志示例
```json5
[chunk] type=text content="你好，我是" index=0
[chunk] type=tool_use name="search" input={"query":"..."} index=1
[chunk] type=text content="根据搜索结果..." index=2
```
:::

---

## 日志命令参考

```bash
# 查看所有日志
openclaw logs

# 只看 Gateway 相关日志
openclaw logs --filter gateway

# 查看最近 100 条日志
openclaw logs --tail 100

# 持续监听新日志（类似 tail -f）
openclaw logs --follow
```

---

## 常见调试场景

::: details API 调用失败
1. 开启 `rawStream: true`，查看完整的 HTTP 请求和响应
2. 确认 API Key 是否正确：`openclaw config show`
3. 检查 API 端点是否可访问：`curl https://api.anthropic.com/v1/models`
4. 查看错误码含义（401 = 未授权，429 = 超速限制，500 = 服务端错误）
:::

::: details 消息未送达
1. 开启 `verbose: true`，查看消息路由日志
2. 确认通道连接状态：`openclaw channels status`
3. 查看 Gateway 事件：`openclaw gateway --watch`
4. 检查通道 Token 是否过期
:::

::: details 工具执行错误
1. 开启 `rawChunks: true`，查看工具调用参数
2. 检查工具定义是否与模型期望格式匹配
3. 手动测试工具脚本是否正常运行
4. 查看工具执行日志：`openclaw logs --filter tools`
:::

---

::: warning 安全注意事项
调试日志（尤其是 `rawStream` 和 `rawChunks`）可能包含：

- API Key 片段
- 用户输入内容
- 模型返回的敏感信息

**生产环境请勿开启调试模式。** 调试完成后，务必将 `debug.enabled` 改回 `false` 并重启 Gateway。
:::

---

_下一步：[故障排查](./troubleshooting)_
