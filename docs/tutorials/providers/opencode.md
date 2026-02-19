---
title: "OpenCode Zen"
sidebarTitle: "OpenCode Zen"
---

# OpenCode Zen

OpenCode Zen 是由 OpenCode 团队为编程智能体（Agent）推荐的**精选模型列表**。
它是一个可选的托管模型访问路径，使用 API 密钥和 `opencode` 提供商。
Zen 目前处于 Beta 阶段。

---

## CLI 设置

```bash
openclaw onboard --auth-choice opencode-zen
# 或非交互式
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

---

## 配置示例

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

---

## 注意事项

- 也支持 `OPENCODE_ZEN_API_KEY`。
- 登录 Zen，添加计费信息，然后复制你的 API 密钥。
- OpenCode Zen 按请求计费；详情请查看 OpenCode 仪表板。
