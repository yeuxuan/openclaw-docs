---
title: "openclaw backup"
sidebarTitle: "backup"
---

# `openclaw backup`

`backup` 用来备份本机 OpenClaw 状态、配置、凭据、会话和可选工作区。做升级、迁移、重置前，先备份是最稳的。

常用：

```bash
openclaw backup create
openclaw backup create --dry-run
openclaw backup create --verify
openclaw backup verify <archive>
openclaw backup create --to <storage-location> --namespace <name> --verify
```

## 什么时候用

- 升级 OpenClaw 前。
- 执行 `openclaw reset` 前。
- 从一台机器迁移到另一台机器前。
- 配置已经坏了，但你想先保留现场。

## 新手路线

先预览：

```bash
openclaw backup create --dry-run
```

确认范围后创建并验证：

```bash
openclaw backup create --verify
```

如果配置坏了导致工作区发现失败，可以先只备份配置：

```bash
openclaw backup create --only-config
```

## 备份放哪里

不要把备份文件放进正在备份的状态目录或工作区里，否则可能出现自我包含。
推荐放到单独目录，比如 `~/Backups` 或服务器的专用备份盘。

已经配置[命名存储位置](/tutorials/concepts/storage-locations)时，可以直接写入外接磁盘或对象存储：

```bash
openclaw storage test archive
openclaw backup create --to archive --namespace office-gateway --verify
```

多台 Gateway 共用目标时必须分开 namespace。读取、校验和恢复不改变 namespace 所有权；迁移到新硬件且原安装已退役时，才按输出使用 `--claim-namespace` 接管。
