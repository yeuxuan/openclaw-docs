---
title: "多用户模式"
sidebarTitle: "多用户模式"
description: "多个可信操作者共用一个 Agent 时的会话归属、在线状态与安全边界。"
---

# 多用户模式

多用户模式为共享 Agent 增加会话创建者、在线状态和按创建者筛选，让团队知道“谁发起了任务、谁正在查看”。

::: danger 它不是租户隔离
能操作同一个 Agent 的人，原则上都能让它使用该 Agent 拥有的工具、凭据和文件。头像、草稿和筛选只是协作体验，不是权限边界。需要互相隔离时，请使用不同 Agent，必要时再分离 Gateway 或宿主机。
:::

新会话在能够可靠识别创建者时会写入不可变的 `createdActor`。控制 UI 中：

- 实心头像表示当前负责人（owner），可重新分配；创建者（creator）保持不可变。
- 环形或半透明头像表示当前正在观看的人。
- 当列表里只有一个创建者时，界面会隐藏这些多人元素，不影响个人使用。

草稿可以暂时不出现在其他普通成员的侧边栏，但管理员仍能看到；它同样不是安全隔离。操作者 Scope 仍负责限制动作，而共享 Gateway 始终是同一个会话、工具、凭据与文件信任域。

## 创建者身份与升级

人类创建者必须区分已验证的 Gateway profile、通道发送者和来源未知的历史身份。只有 profile 创建者能获得隐式创建者访问权；原始 ID 相同、被设为负责人、参与过对话，都不能补出这项权限。头像和参与者记录同样不能作为授权依据。

升级会保留无法证明来源的历史内容，但不会猜测对应 profile。管理员仍可管理共享权限；需要恢复旧沙箱文件时应显式选择文件，而不是自动把来源不明的整套环境挂到可信 profile 下。迁移前先阅读[数据库版本与升级恢复](/tutorials/reference/database-schemas)。

通过 Cloudflare Access 或 Tailscale Serve 验证 GitHub 身份后，当前 **Git co-author credit** 对已验证账号默认开启，会影响公开提交署名；不希望后续产生公开 `Co-authored-by` 信息时，在 **Settings → Profile → Identity** 关闭该选项。

上游来源：[`docs/concepts/multi-user.md`](https://github.com/openclaw/openclaw/blob/main/docs/concepts/multi-user.md)。
