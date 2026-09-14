---
title: "企业微信 WeCom"
sidebarTitle: "企业微信"
description: "安装腾讯企业微信团队维护的 OpenClaw 外部通道插件。"
---

# 企业微信 WeCom

企业微信通过腾讯企业微信团队维护的外部包 `@wecom/wecom-openclaw-plugin` 接入。它已进入 OpenClaw 官方通道目录，但不会随核心安装自动捆绑。

## 安装并检查

```bash
openclaw channels add --channel wecom
openclaw gateway restart
openclaw channels status --channel wecom
```

目录会安装一个精确版本。企业凭据、连接模式、回调路由和访问控制可能独立于 OpenClaw 更新，因此配置时应查看当前已安装版本对应的 [npm 包文档](https://www.npmjs.com/package/@wecom/wecom-openclaw-plugin)。

不要照抄其他版本的字段；升级插件后也要重新核对该版本说明。若通道没有上线，依次检查插件是否已安装、Gateway 是否重启，以及 `channels status` 的具体错误。

上游来源：[`docs/channels/wecom.md`](https://github.com/openclaw/openclaw/blob/main/docs/channels/wecom.md)。
