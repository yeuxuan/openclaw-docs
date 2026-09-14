---
title: "测试更新和插件"
sidebarTitle: "测试更新插件"
---

# 测试更新和插件

升级 OpenClaw 或插件前，建议先做一个小检查：

```bash
openclaw doctor
openclaw plugins list
openclaw channels status --probe
openclaw backup create
```

升级后再跑同样的检查。
如果通道、工具或模型行为变化，先看插件是否启用、配置是否迁移、密钥是否还能读取。

继续阅读：[插件专题](/tutorials/plugins/)、[更新 OpenClaw](/tutorials/installation/updating)。

## 新手安全做法

升级前不要只记“版本号”。也要记当前插件列表和通道状态：

```bash
openclaw plugins list --verbose
openclaw channels status --probe
```

升级后对比一次。差异越早发现，越容易回滚或修复。

## 开发者：升级保留测试的边界

在上游 checkout 中，`pnpm test:docker:published-upgrade-survivor` 可验证已发布基线到候选包的迁移。常规发布验证默认取最新稳定版，在并行执行前固定为一个精确 npm 版本，再覆盖 `reported-issues` 场景；不是默认轮遍所有历史版本。`Update Migration` 同样默认最新稳定版，需要历史回放时才显式选择 `last-stable-4`、`all-since-2026.4.23` 或精确版本。需要较重的状态保留场景时：

```bash
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=sqlite-volume \
  pnpm test:docker:published-upgrade-survivor
```

此场景在升级后、独立 Doctor 修复前检查共享插件状态、会话/cron 迁移、账号级配对隔离和工作区内容，再通过 Gateway RPC 抽样读取，运行幂等 Doctor 并重启复查。旧基线缺少 plugin-state SDK 时，会明确跳过那一部分，不能把“不适用”算作保留验证通过。

这是 Docker 内的**包更新**验证，不证明容器镜像替换或后台批量更新流程。插件能力新增仍须明确授权，恢复步骤会写入 survivor summary。历史 JSON auth fixture 也不能替代“已发布 SQLite 中凭据能否保留”的测试。
