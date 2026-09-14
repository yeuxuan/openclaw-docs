---
title: "Visitor Access 访客访问插件"
sidebarTitle: "Visitor Access"
description: "了解 OpenClaw Visitor Access 插件的临时访客授权用途、源码分发方式和配置边界。"
---

# Visitor Access：有期限的访客访问

Visitor Access 通过一条 Cloudflare Access 邮箱策略管理会到期的访客授权。适合已经用 Cloudflare Access 保护入口、需要临时允许指定邮箱访问的场景；它不是把整个站点改成公开访问。

## 当前分发方式

- 插件包：`@openclaw/visitor-access`。
- 官方安装路线：**仅源码 checkout**，不是已确认发布到 npm 的常规安装包。
- 暴露能力：Agent 工具（`tools` contract）。

不要仅根据包名直接照抄 `npm` 安装命令。先在所用 OpenClaw 源码版本中核对该插件的 manifest、配置 schema 和实际工具，再决定是否启用；源码工作区准备见[插件依赖解析](/tutorials/plugins/dependency-resolution#源码安装和本地依赖)。

## 配置前要确认什么

官方当前参考页只给出了用途、分发方式和工具能力，没有公布完整配置示例、工具参数或授权时长默认值。不能据此假定插件会自动创建 Cloudflare 应用、自动清理所有历史授权或放开其他策略。

准备接入时，先确认受保护的 Cloudflare Access 应用、唯一目标邮箱策略、允许使用该工具的身份，以及所需凭据的最小权限。给真实邮箱增加访问权限前核对有效期和撤销方式；这些都应以当前源码和实际配置为准。

相关入口：[Cloudflare Access](/tutorials/gateway/cloudflare-access)、[插件 Manifest](/tutorials/plugins/manifest)、[管理插件](/tutorials/plugins/manage-plugins)。

上游来源：[`docs/plugins/reference/visitor-access.md`](https://github.com/openclaw/openclaw/blob/2e3bf941b7848fa9dfcbcfc8c9a89d99e2feeb30/docs/plugins/reference/visitor-access.md)。
