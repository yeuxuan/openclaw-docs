---
title: "Zalo Personal"
sidebarTitle: "Zalo Personal"
---

# Zalo Personal（非官方）

状态：实验性。此集成通过 `zca-cli` 自动化 **个人 Zalo 账户**。

> **警告：** 这是一个非官方集成，可能导致账户被暂停/封禁。使用风险自负。

---

## 需要插件

Zalo Personal 作为插件提供，不包含在核心安装中。

- 通过 CLI 安装：`openclaw plugins install @openclaw/zalouser`
- 或从源码检出：`openclaw plugins install ./extensions/zalouser`
- 详情：[插件](/tools/plugin)

---

## 前置要求：zca-cli

网关机器必须在 `PATH` 中有 `zca` 二进制文件。

- 验证：`zca --version`
- 如果缺失，安装 zca-cli（参见 `extensions/zalouser/README.md` 或上游 zca-cli 文档）。

---

## 快速设置（新手）

1. 安装插件（见上文）。
2. 登录（QR 码，在网关机器上）：
   - `openclaw channels login --channel zalouser`
   - 用 Zalo 手机应用扫描终端中的 QR 码。
3. 启用通道：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. 重启网关（或完成引导向导）。
5. 私信默认为配对模式；首次联系时批准配对码。

---

## 它是什么

- 使用 `zca listen` 接收入站消息。
- 使用 `zca msg ...` 发送回复（文本/媒体/链接）。
- 设计用于 Zalo Bot API 不可用的"个人账户"使用场景。

---

## 命名

通道 ID 为 `zalouser`，以明确表示这是自动化 **个人 Zalo 用户账户**（非官方）。我们保留 `zalo` 用于潜在的未来官方 Zalo API 集成。

---

## 查找 ID（目录）

使用目录 CLI 来发现联系人/群组及其 ID：

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

---

## 限制

- 出站文本分块至约 2000 字符（Zalo 客户端限制）。
- 默认阻止流式传输。

---

## 访问控制（私信）

`channels.zalouser.dmPolicy` 支持：`pairing | allowlist | open | disabled`（默认：`pairing`）。
`channels.zalouser.allowFrom` 接受用户 ID 或名称。向导在可用时通过 `zca friend find` 将名称解析为 ID。

批准方式：

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

---

## 群组访问（可选）

- 默认：`channels.zalouser.groupPolicy = "open"`（允许群组）。使用 `channels.defaults.groupPolicy` 在未设置时覆盖默认值。
- 通过以下方式限制为白名单：
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（键为群组 ID 或名称）
- 阻止所有群组：`channels.zalouser.groupPolicy = "disabled"`。
- 配置向导可以提示群组白名单。
- 启动时，OpenClaw 将白名单中的群组/用户名称解析为 ID 并记录映射；未解析的条目保持原样。

示例：

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

---

## 多账户

账户映射到 zca 配置文件。示例：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

---

## 故障排查

**`zca` 未找到：**

- 安装 zca-cli 并确保它在网关进程的 `PATH` 中。

**登录不持久：**

- `openclaw channels status --probe`
- 重新登录：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`
