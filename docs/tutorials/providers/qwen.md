---
title: "Qwen"
sidebarTitle: "Qwen"
description: "通过官方外部 Qwen Provider 插件接入 Coding Plan、标准按量付费或 Token Plan。"
---

# Qwen

Qwen 已迁移为官方外部 Provider 插件，规范 ID 是 `qwen`。它覆盖 Qwen Cloud / Alibaba DashScope 的 Coding Plan 与标准按量付费端点；团队 Token Plan 使用 `qwen-token-plan`。

::: warning 旧 Portal/OAuth 路线已退出主路径
不要再启用 `qwen-portal-auth` 或使用 `qwen-portal/...`、`qwen-oauth/...` 模型引用。新配置安装 `@openclaw/qwen-provider`，使用 `qwen/...` 或 `qwen-token-plan/...`。
:::

## 安装插件

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## 选择套餐并完成 onboarding

| 套餐 | 中国区 | 国际区 |
|------|--------|--------|
| Coding Plan | `qwen-api-key-cn` | `qwen-api-key` |
| 标准按量付费 | `qwen-standard-api-key-cn` | `qwen-standard-api-key` |
| Token Plan | `qwen-token-plan-cn` | `qwen-token-plan` |

例如国际区标准按量付费：

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models list --provider qwen
openclaw models set qwen/qwen3.5-plus
```

推荐环境变量是 `QWEN_API_KEY`；兼容 `MODELSTUDIO_API_KEY` 和 `DASHSCOPE_API_KEY`。Token Plan 使用独立的 `QWEN_TOKEN_PLAN_API_KEY`，与 Coding Plan、标准按量付费 Key 不可混用。

## 端点和模型注意事项

- `qwen3.7-plus`、`qwen3.6-plus` 可用于 Coding Plan 和标准端点。
- `qwen3.7-max`、`qwen3.6-flash` 只适用于标准按量付费端点。
- `modelstudio/...` 仍是兼容别名，但新配置应使用 `qwen/...`。
- 图像理解和 Wan 视频生成只在标准 DashScope 端点提供，不适用于 Coding Plan。
- Alibaba 规定 Token Plan 只用于交互式 OpenClaw 会话，不要用于 Cron、无人值守脚本或应用后端。

如果提示模型不支持，先确认套餐、区域、API Key 类型和模型是否属于同一个端点，不要只改模型名反复重试。

上游来源：[`docs/providers/qwen.md`](https://github.com/openclaw/openclaw/blob/main/docs/providers/qwen.md)。
