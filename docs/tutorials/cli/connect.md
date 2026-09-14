---
title: "openclaw connect"
sidebarTitle: "连接机器"
description: "用一次性加入链接，把当前机器安全连接为 OpenClaw Headless Node。"
---

# `openclaw connect`

`connect` 把当前机器注册为 Headless Node。短期引导凭据只用于首次配对，后续启动使用持久设备 Token。

## 在 Gateway 主机生成加入命令

```bash
openclaw devices join-code
```

命令会输出一次性 URL 和可复制命令：

```bash
npx openclaw connect https://gateway.example/j/<shortcode>
```

短码约 10 分钟过期且只能读取一次。过期或用过后，重新生成，不要尝试复用。

## 前台运行或安装服务

```bash
npx openclaw connect https://gateway.example/j/<shortcode> \
  --display-name "Build Node"

npx openclaw connect https://gateway.example/j/<shortcode> --service
```

`--service` 会先完成第一次认证，再安装用户级 Node Host 服务。检查状态：

```bash
openclaw node status
```

加入 URL 必须使用 HTTPS；只有 `127.0.0.1` 等回环地址允许 HTTP。要撤销已经配对的机器，删除设备，而不是只让加入码过期：

```bash
openclaw devices remove <deviceId>
```

上游来源：[`docs/cli/connect.md`](https://github.com/openclaw/openclaw/blob/main/docs/cli/connect.md)。
