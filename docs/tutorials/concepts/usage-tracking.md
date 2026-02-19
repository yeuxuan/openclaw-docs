---
title: "用量跟踪"
sidebarTitle: "用量跟踪"
---

# 用量跟踪（Usage Tracking）

---

## 这是什么

- 直接从提供商的用量端点拉取用量/配额。
- 没有估算成本；仅有提供商报告的窗口。

---

## 显示位置

- 聊天中的 `/status`：带表情符号的丰富状态卡，包含会话 Token + 估算成本（仅 API 密钥）。提供商用量为 **当前模型提供商** 显示（如果可用）。
- 聊天中的 `/usage off|tokens|full`：每响应用量页脚（OAuth 仅显示 Token）。
- 聊天中的 `/usage cost`：从 OpenClaw 会话日志聚合的本地成本摘要。
- CLI：`openclaw status --usage` 打印完整的每提供商分解。
- CLI：`openclaw channels list` 在提供商配置旁打印相同的用量快照（使用 `--no-usage` 跳过）。
- macOS 菜单栏：Context 下的"Usage"部分（仅在可用时）。

---

## 提供商 + 凭证

- **Anthropic (Claude)**：认证配置文件中的 OAuth Token。
- **GitHub Copilot**：认证配置文件中的 OAuth Token。
- **Gemini CLI**：认证配置文件中的 OAuth Token。
- **Antigravity**：认证配置文件中的 OAuth Token。
- **OpenAI Codex**：认证配置文件中的 OAuth Token（存在时使用 accountId）。
- **MiniMax**：API 密钥（编程计划密钥；`MINIMAX_CODE_PLAN_KEY` 或 `MINIMAX_API_KEY`）；使用 5 小时编程计划窗口。
- **z.ai**：通过环境/配置/认证存储的 API 密钥。

如果没有匹配的 OAuth/API 凭证，用量会被隐藏。
