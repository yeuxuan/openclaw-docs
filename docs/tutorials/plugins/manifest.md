---
title: "插件 Manifest"
sidebarTitle: "Manifest"
---

# 插件 Manifest：插件的身份证

`openclaw.plugin.json` 是插件的身份证。它告诉 OpenClaw：

- 插件叫什么。
- 版本是多少。
- 提供哪些能力。
- 声明哪些静态能力归属。
- 有哪些配置项。
- 是否有 hooks、tools、channels 或 providers。

OpenClaw 在执行插件代码前读取 manifest，验证配置和发现能力。原生插件缺失或使用无效 manifest 会报错，但有 manifest 不等于插件可信。代码入口和 npm 安装元数据属于 `package.json`，运行时 hooks 在插件代码中注册，不要放进 manifest。

这里说的是原生插件。兼容的 Agent Plugins、Codex、Claude、Cursor bundle 使用各自的布局，不套用同一份 schema，详见[插件 Bundles](/tutorials/plugins/bundles)。

## 新手先看哪些字段

- `id`：必填，插件的规范 ID。
- `configSchema`：必填，内联 JSON Schema，规定用户可以配置什么。
- `version`：可选，插件版本元数据。
- `channels` / `providers`：声明所属通道或模型提供商。
- `contracts`：静态能力归属，包括工具、嵌入、语音、Worker 等。
- `uiHints`：配置界面的标签、占位和敏感字段提示。

不需要配置的原生插件也应提供最小 schema：

```json
{
  "id": "example-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

manifest 写清楚，Control UI、doctor、插件列表和安全检查才有东西可读。

## 同名插件到底加载哪一份

发现顺序不等于实际优先级。同一个插件 ID 出现在多个路径时，只加载优先级最高的那一份：

1. `plugins.load.paths` 显式选择的路径。
2. `OPENCLAW_DEV_SOURCE_ROOT` 指向源码 checkout 内的 bundled 插件。
3. 路径匹配安装记录的全局已安装插件。
4. 其他随 OpenClaw 分发的 bundled 插件。
5. 工作区自动发现的插件。
6. 没有安装记录的全局插件。

`plugins.allow` 和 `plugins.entries.<id>.enabled` 只决定是否允许加载，不决定选哪份源码。想刻意覆盖 bundled 版本，应使用 `plugins.load.paths`；不要把启用开关误当路径固定配置。启动诊断会说明被丢弃的副本和最终来源。

## 密钥失败的隔离边界

manifest 的 `configContracts.secretInputs.paths[].ownerKind` 可为 `capability` 或 `route`。能力级凭据来源不可用时关闭该能力，不保留陈旧凭据；路由级来源只有在完整插件配置和 Provider 定义都没变化时，才可能继续用最后一次有效值。不能把所有 SecretRef 失败都理解成同一种回退行为。

## Worker 插件的清理预算

Worker provider 在 `contracts.workerProviders` 声明 ID，生命周期实现属于插件代码。除创建预算 `resolveProvisionTimeoutMs(profile)` 外，还可提供 `resolveDestroyTimeoutMs(profile)`，覆盖主动销毁和引导失败清理，包括确认释放前的快照捕获。两者都须返回平台计时器上限内的正安全整数；显式服务超时配置优先。声明超时预算不等于可以在尚未确认释放时报告销毁成功。

完整字段和开发契约以[本轮上游 Manifest 参考](https://github.com/openclaw/openclaw/blob/b0fe1062862a0eba2e332f7f88691581dbf6d096/docs/plugins/manifest.md)为准。
