---
title: "GitHub Copilot"
sidebarTitle: "GitHub Copilot"
description: "OpenClaw 模型接入：GitHub Copilot。GitHub Copilot 是 GitHub 的 AI 编程助手。它根据你的 GitHub 账户和计划提供对 Copilot 模型的访问。…"
---

# GitHub Copilot

---

## 什么是 GitHub Copilot？

GitHub Copilot 是 GitHub 的 AI 编程助手。它根据你的 GitHub 账户和计划提供对 Copilot 模型的访问。OpenClaw 可以通过两种不同方式使用 Copilot 作为模型提供商。

---

## 在 OpenClaw 中使用 Copilot 的两种方式

### 1) 内置 GitHub Copilot 提供商 (`github-copilot`)

使用原生设备登录流程获取 GitHub Token，然后在 OpenClaw 运行时将其交换为 Copilot API Token。这是默认且最简单的方式，因为不需要 VS Code。

### 2) Copilot 代理插件 (`copilot-proxy`)

使用 Copilot Proxy VS Code 扩展作为本地桥接。OpenClaw 与代理的 `/v1` 端点通信，并使用你在那里配置的模型列表。当你已经在 VS Code 中运行 Copilot Proxy 或需要通过它路由时，选择此方式。你必须启用插件并保持 VS Code 扩展运行。

使用 GitHub Copilot 作为模型提供商（`github-copilot`）。登录命令会运行 GitHub 设备流程，保存认证配置文件，并更新你的配置以使用该配置文件。

---

## CLI 设置

```bash
openclaw models auth login-github-copilot
```

你将被提示访问一个 URL 并输入一次性代码。在完成之前请保持终端打开。

### 可选参数

```bash
openclaw models auth login-github-copilot --profile-id github-copilot:work
openclaw models auth login-github-copilot --yes
```

---

## 设置默认模型

```bash
openclaw models set github-copilot/gpt-4o
```

### 配置示例

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

---

## 注意事项

- 需要交互式 TTY；请直接在终端中运行。
- Copilot 模型可用性取决于你的计划；如果某个模型被拒绝，请尝试
  其他 ID（例如 `github-copilot/gpt-4.1`）。
- 默认设备登录把 GitHub Token 写入 OpenClaw 的本地受保护密钥存储，认证档案 `github-copilot:github` 只保存 `tokenRef`；不需要额外配置外部 Secret Provider。
- 存储写入失败会在替换认证档案前停止。先修复状态目录/数据库权限，不要靠反复登录绕过。
- 交互式 onboarding 显式选择 `--secret-input-mode plaintext` 时仍可内联保存，`openclaw secrets audit --check` 会检查到这种情况。

这里的“受保护”不表示磁盘加密：底层 SQLite 依赖状态目录权限。用户可见密钥 API 是只写接口，但备份、目录访问权限仍须妥善保护。运行时解析引用后，再验证 Copilot 访问权和账号专属 API 端点。
