---
title: "openclaw storage"
sidebarTitle: "storage"
description: "列出、初始化并测试 OpenClaw 命名存储位置，排查磁盘挂载、加密口令和对象存储连接。"
---

# `openclaw storage`

`storage` 管理 `storage.locations` 中的命名目标。它适合在接入外接磁盘或对象存储后，确认目标身份、加密配置和真实读写能力。

```bash
openclaw storage list
openclaw storage init archive
openclaw storage test archive
```

三个命令都支持 `--json`，既可以放在子命令后，也可以放在它前面：

```bash
openclaw storage list --json
openclaw storage --json init archive
openclaw storage test archive --json
```

## `list`：只读检查

`storage list` 显示名称、Provider、可读目标和健康状态。它会读取位置标记、检查访问权限和加密口令，但不会初始化目标，也不会写测试对象。

## `init`：确认这是一个新目标

```bash
openclaw storage init archive
```

初始化使用“仅创建”操作写入位置身份与加密标记。文件系统路径必须已经存在且是目录；OpenClaw 不会创建根目录。

如果运行时报告缺少标记，先确认外接盘确实挂载、对象桶和前缀没有写错。只有确认这是新位置后才运行 `init`，否则可能把错误挂载点认成新的备份目标。

## `test`：真实写入、读回和删除

```bash
openclaw storage test archive
```

命令写入一个小型唯一探针，经配置的加密层读回并逐字节校验，最后删除。它要求位置已初始化，且不会代替 `init`。

成功的 JSON 结果包含 `state: "ok"` 和 `sizeBytes`。写入、读回校验或清理失败都会令命令失败；后端在清理时不可用，需要恢复连接后检查残留探针对象。

配置、加密和 namespace 说明见[命名存储位置](/tutorials/concepts/storage-locations)。

上游来源：[`docs/cli/storage.md`](https://github.com/openclaw/openclaw/blob/fb4653dbea6650c0fae516151fa87fda5ee4aaf9/docs/cli/storage.md)。
