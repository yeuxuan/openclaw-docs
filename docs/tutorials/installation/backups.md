---
title: "备份与恢复"
sidebarTitle: "备份与恢复"
description: "安全备份 OpenClaw 的 SQLite 状态、配置、凭据、会话和工作区，并在全新目录中验证恢复。"
---

# 备份与恢复

OpenClaw 的权威状态保存在 `~/.openclaw` 下的一组 SQLite 数据库中：一份全局控制面数据库，以及每个 Agent 各自的数据库。

::: danger 不要直接复制正在运行的 SQLite 文件
不要把活动中的 `.sqlite`、`-wal`、`-shm` 或 `-journal` 当备份。Gateway 仍在写入时，普通文件复制可能得到撕裂或损坏的数据。请使用下面的 `openclaw backup` 命令。
:::

备份通常包含认证 Profile、通道和 Provider 凭据、会话记录等敏感数据。备份目录应加密、限制访问，并放到另一块磁盘或私有远端。

## 升级或迁移前：完整归档

```bash
openclaw backup create --output ~/Backups/openclaw --verify
```

命令会生成带时间戳的 `.tar.gz`，默认包含状态、配置、凭据、会话和工作区，并通过 SQLite 在线备份 API 安全捕获正在运行的数据库。`--verify` 会检查清单和内容。

完整归档适合升级、重置、卸载和换机前使用。数据量较大或需要高频备份时，改用数据库快照或 Git 版本化备份。

## 单个数据库快照

```bash
openclaw backup sqlite create --global --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite create --agent main --repository ~/Backups/openclaw-sqlite
```

每次会生成带 `manifest.json` 和 `database.sqlite` 的已验证快照。快照目录的上传、保留周期和异地同步由你负责。

## 备份到命名存储位置

长期运行的 Gateway 可以把归档直接写到已初始化的外接磁盘或对象存储：

```bash
openclaw storage init archive
openclaw storage test archive
openclaw backup create --to archive --namespace office-gateway --verify
openclaw backup enable --to archive --namespace office-gateway --every 24h
```

`archive` 来自 `storage.locations`。目标根目录和加密口令不会由备份命令自动创建；先按[命名存储位置](/tutorials/concepts/storage-locations)配置、初始化并做真实读写探针。

多台安装共用一个位置时，每台使用不同 namespace。第一次写入会创建所有权声明；换机后确实要接管旧 namespace 时才使用 `--claim-namespace`，不要让两套仍在运行的安装共享保留策略。

## 定时与 Git 版本化备份

先初始化专用私有仓库，再让 Gateway 建立固定备份任务：

```bash
openclaw backup git init \
  --repository ~/Backups/openclaw-git \
  --remote git@github.com:you/openclaw-backups.git

openclaw backup enable \
  --repository ~/Backups/openclaw-git \
  --every 24h \
  --push
```

远端推送默认会脱敏凭据表；如果明确需要完整凭据备份，才使用 `--include-secrets`，并确保远端仓库为私有。关闭计划：

```bash
openclaw backup disable
```

`openclaw status` 会显示最近备份；超过 14 天没有成功记录时，`openclaw doctor` 会给出提醒。

## 恢复完整归档

恢复不会覆盖线上目录，而是先解压到一个不存在或为空的暂存目录：

```bash
openclaw backup restore ./openclaw-backup.tar.gz \
  --target ./restored-openclaw
```

确认清单、SQLite 完整性和目录内容后，停止 Gateway 与相关 Node Host，再把暂存资产切换到正式位置。切换后先运行：

```bash
openclaw doctor
openclaw gateway status
```

::: warning 恢复旧状态相当于“时间倒流”
WhatsApp 等带棘轮状态的通道可能需要重新关联；审批、去重和投递状态也会回退。插件的 `node_modules` 不在归档中，恢复后按需重新安装或更新插件。
:::

## 数据库级恢复

始终恢复到新文件，再离线替换：

```bash
openclaw backup sqlite restore <snapshot-dir> --target ./restored.sqlite
openclaw database preflight
```

跨版本恢复时先做数据库预检，随后再启动 Gateway 并运行 `openclaw health` 与 `openclaw doctor`。

上游来源：[`docs/install/backups.md`](https://github.com/openclaw/openclaw/blob/fb4653dbea6650c0fae516151fa87fda5ee4aaf9/docs/install/backups.md)、[`docs/concepts/storage-locations.md`](https://github.com/openclaw/openclaw/blob/fb4653dbea6650c0fae516151fa87fda5ee4aaf9/docs/concepts/storage-locations.md)。
