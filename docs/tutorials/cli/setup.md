---
title: "openclaw setup"
sidebarTitle: "setup"
---

# `openclaw setup`

`setup` 是模型已经可用之后的设置与修复入口。它先验证默认模型，再用受控操作检查或配置工作区、Gateway、频道和插件；如果推理尚未配置或真实测试失败，应回到 `openclaw onboard`。

## 新手怎么选

- 第一次安装、模型凭据还没验证：`openclaw onboard`
- 模型已能用，继续设置或修复其他部分：`openclaw setup`
- 只改某一类现有设置：`openclaw configure`
- 配置文件已经无效：先运行 `openclaw doctor`

## 常用用法

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --json
openclaw setup --message "gateway status"
```

`--baseline` 只创建基础配置、工作区和会话目录，不进入完整 onboarding。写配置、安装插件、重启 Gateway 等操作会先生成明确计划；单次消息模式只有显式加 `--yes` 才会批准持久写入。

## 连接远程 Gateway

远程模式可以使用 Token 或密码，二选一：

```bash
openclaw setup --non-interactive --accept-risk \
  --mode remote \
  --remote-url wss://gateway.example.com \
  --remote-token '<token>'

openclaw setup --non-interactive --accept-risk \
  --mode remote \
  --remote-url wss://gateway.example.com \
  --remote-password '<password>'
```

`--gateway-token`、`--gateway-token-ref-env` 和 `--gateway-password` 配置的是本地 Gateway，不能拿来代替远程凭据。使用 `--secret-input-mode ref` 时，远程 Token 对应 `OPENCLAW_GATEWAY_TOKEN`，远程密码对应 `OPENCLAW_GATEWAY_PASSWORD`；变量缺失或值不匹配时，setup 会在写入前失败。

## 排障

如果 setup 启动前的模型验证失败，先运行 `openclaw onboard` 修复推理路线。配置无效或 Gateway 起不来时，不要反复跑 setup：

```bash
openclaw doctor
openclaw status
openclaw logs --follow
```

继续阅读：[onboard](/tutorials/cli/onboard)、[Doctor](/tutorials/cli/doctor)、[Gateway 运维](/tutorials/gateway/)。
