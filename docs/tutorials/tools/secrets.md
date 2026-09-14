---
title: "Secrets 工具"
sidebarTitle: "Secrets 工具"
description: "让 Agent 请求凭据，但不让凭据进入聊天记录、工具结果或模型上下文。"
---

# Secrets 工具：把密钥交给 Gateway，不交给模型

当 Agent 需要 API Key 时，不要把密钥直接发到聊天里。`secrets` 工具会弹出
可信的遮罩输入框，把值直接写入共享 Secret Store；Agent 只拿到条目元数据和完整 SecretRef，看不到真实值。

真实凭据不会进入：

- 聊天消息
- 会话转录
- 工具返回值
- 模型上下文

该工具可用于主 Agent 的各个会话，不限于名为 `main` 的主对话；子 Agent 和 ACP worker 会话不会拿到它。默认启用，并遵守普通工具策略。若要禁用：

```json5
{
  tools: {
    deny: ["secrets"],
  },
}
```

## 三个动作

- `request`：请求人类填写凭据，写入受保护的 `secret` 条目。
- `list`：列出名称、类型、允许主机和更新时间，不返回 secret 值。
- `delete`：软删除条目；删除数据 30 天后清理。

Agent 不能把自己提供的字符串写入 Secret Store。真实值只能来自遮罩输入框、
Control UI 的 `/settings/secrets` 页面，或 `openclaw secrets store` CLI。

Agent 应先列出元数据，只为当前任务确实缺少的凭据发起请求，并说明名称、用途及准确的出口主机。`env` 是操作者设置的可读条目，不属于遮罩凭据请求；`list` 可以显示其值，不能把它当成受保护的 secret。

## 回答凭据请求

Control UI 会在输入框上方显示卡片，包括：

- 哪个 Agent、哪个会话在请求
- Secret 条目名
- 请求原因
- 可编辑的允许访问主机列表

请求默认等待 15 分钟，`timeoutSeconds` 限制在 30–3600 秒；它不会延长本轮总超时。请求绑定活跃运行权限，运行结束或取消后，卡片会取消，迟到提交不能写入。跳过或超时返回 `no_answer`，应说明缺少凭据的阻碍，不要改为要求用户在聊天中发送 Key。

::: warning 允许主机只控制出口替换
`allowedHosts: []` 会阻止出口代理替换，但不会禁止受支持配置字段通过 SecretRef 读取凭据。只保留确实需要接收凭据的主机；不要为了绕过出口限制，把明文放进命令、参数、URL、日志或聊天。
:::

Telegram、Discord 等聊天通道只会收到前往 Control UI 的链接，不会把聊天回复
当作凭据。这种链接要求启用 Control UI 并配置 `gateway.publicOrigin`；没有可用链接时会报告阻碍并取消请求。可信 Control UI 和原生 App 卡片走现有 Gateway 连接，不要求 public origin。看到密钥请求时，不要直接在群聊或私聊里粘贴 Key。

已有同名条目时，提交会覆盖值。未提议主机列表的替换请求沿用原列表，新条目默认空列表；显式空列表保持为空。提交以卡片中最终显示或编辑的列表为准。值会原样保留前后空白；多行凭据使用 CLI 的 `--value-file` 输入。

## 已保存，但刷新报错怎么办

收到 `status: "stored"` 就表示存储写入已提交，后续运行时刷新失败不会撤销它。修复报出的 Provider 问题后运行 `openclaw secrets reload`，不要重复提交卡片。

工具结果中的 `currentPolicy` 是保存后再次读取到的当前主机策略，不是不可变的审批回执：`available` 含完整列表，空列表表示禁止出口替换；列表序列化超过 512 字符时，`omitted` 只给数量。`missing`、`kind_changed`、`unavailable` 表示当前条目或策略不可完整取得，不能据此宣称原提议的主机已获许可，也不应猜测是谁更改了它。

## 保存后怎么使用

在支持 SecretRef 的配置字段中引用：

```json5
{
  source: "store",
  provider: "default",
  id: "STRIPE_API_KEY",
}
```

优先使用工具返回的完整 `ref`；上例采用默认 store alias，`secrets.defaults.store` 可指定其他 alias。写入会刷新受影响配置和认证引用；某个未被选用的 Provider 缺凭据，不妨碍用健康的模型请求补齐，但选用缺凭据的 Provider 仍会失败，不会悄悄回退到别的认证来源。

- `env` 类型是可读值，由操作者管理。
- 只有开启 `secrets.egressProxy.enabled`，受保护的 `secret` 才会以同名不透明环境占位符注入 Gateway-host Exec；目标主机符合 `allowedHosts` 时才在出口替换。命令应继承变量，不要打印、覆盖或手写 secret 模板。关闭代理时不注入此类变量，可改用受支持的配置 SecretRef。
- 原生 harness shell、sandbox 和 Node 执行不接收这些受保护值。

Gateway-host Exec 在本轮第一次执行时固定 Secret Store 快照。之后新增、替换、删除凭据或修改主机列表，都不会刷新同一轮快照，需要新开一轮。运行关闭后，出口授权和已有代理连接（包括后台进程隧道）会撤销，但已交给上游传输的数据无法收回。

继续阅读：[SecretRef 与密钥管理](/tutorials/gateway/secrets)、
[Ask User](/tutorials/tools/ask-user)。普通选择题用 Ask User，凭据必须用 Secrets。
