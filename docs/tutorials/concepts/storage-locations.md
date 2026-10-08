---
title: "命名存储位置"
sidebarTitle: "命名存储"
description: "配置 OpenClaw 命名存储位置，安全初始化外接磁盘或对象存储，并用加密、探针和 namespace 保护异地备份。"
---

# 命名存储位置：把备份放到另一块盘或对象存储

`storage.locations` 给外接磁盘、网络挂载或插件提供的对象存储起一个稳定名称。它只定义“数据放在哪里、如何加密和检查”，不会自动移动现有数据，也不会因为写了配置就开始备份。

内置 `filesystem` Provider 连接已经存在的绝对路径。Cloudflare R2 等其他后端由插件提供。

## 先配置，再显式初始化

先挂载磁盘并创建目标目录。OpenClaw 不会替你创建存储根目录，这样可以避免磁盘未挂载时把备份误写到系统盘的空挂载点。

```bash
mkdir -p /mnt/archive/openclaw
export OPENCLAW_STORAGE_PASSPHRASE='请从你的密码管理器读取'
```

在 `openclaw.json` 中加入：

```json5
{
  storage: {
    locations: {
      archive: {
        provider: "filesystem",
        settings: { path: "/mnt/archive/openclaw" },
        encryption: {
          passphrase: {
            source: "env",
            provider: "default",
            id: "OPENCLAW_STORAGE_PASSPHRASE",
          },
        },
      },
    },
  },
}
```

然后显式初始化并做一次写入、读回、删除探针：

```bash
openclaw storage init archive
openclaw storage test archive
openclaw storage list --json
```

`init` 会在根目录写入 `openclaw-storage.json` 标记。相同加密配置下重复执行只会验证标记，不会覆盖它；口令不一致会直接失败。

## 配置约束

- 名称使用小写字母、数字和连字符，长度 1–63，例如 `archive`、`r2-backup`。
- `provider` 必填；内置值是 `filesystem`。
- `settings` 由 Provider 定义；文件系统使用 `{ path: "/绝对/已存在/目录" }`。
- `encryption` 必须是口令 SecretRef，或明确写成字符串 `"none"`。
- 账号密钥等敏感 Provider 设置必须用 [SecretRef](/tutorials/gateway/secrets)，不要把真实密钥直接写进配置文件。

::: danger 不要把 `encryption: "none"` 当成默认值
备份可能含凭据和私密会话。只有目标介质本身已经可靠加密、且你明确接受对象内容明文可读时，才关闭存储层加密。
:::

口令加密保护对象内容，但对象名和初始化标记仍对存储 Provider 可见。丢失原口令或标记都可能让已有对象无法恢复；修改配置口令不会自动重加密旧数据。

## 用于异地备份

备份在存储位置内使用 `backups/<namespace>/`。默认 namespace 来自主机名；多台安装共用同一位置时，应显式分开：

```bash
openclaw backup create --to archive --namespace office-gateway --verify
openclaw backup enable --to archive --namespace office-gateway --every 24h
```

第一次上传会创建 `owner.json`，记录这套安装的 Gateway 设备身份。另一套设备不能悄悄占用同一 namespace；换机后确实要接管时才使用 `--claim-namespace`。只读的 `backup list`、`verify` 和 `restore` 不会修改所有权声明。

克隆出的两套安装即使设备身份相同，也不要并发使用同一 namespace。给它们分配不同名称，避免共享保留策略误删对方的恢复点。

## 看懂健康状态

```bash
openclaw storage list
openclaw storage test archive --json
```

| 状态 | 处理方式 |
|------|----------|
| `ok` | 标记、加密身份和后端访问均正常。 |
| `unavailable` | 检查磁盘是否挂载、路径/桶/前缀是否正确，以及 CLI 与 Gateway 是否看到同一环境。 |
| `uninitialized` | 先确认这是全新目标，再执行 `storage init`；不要对意外出现的空挂载点初始化。 |
| `wrong-key` | 恢复原口令或修正 SecretRef，不要删除标记来掩盖不匹配。 |
| `error` | 按返回信息检查权限、Provider 设置或后端故障。 |

`storage test` 会写入唯一的 `.openclaw-probe-<uuid>` 对象，逐字节验证后删除。若清理阶段后端断开，重新连接后检查是否残留探针对象。

相关命令见 [`openclaw storage`](/tutorials/cli/storage)，完整备份流程见[备份与恢复](/tutorials/installation/backups)。

上游来源：[`docs/concepts/storage-locations.md`](https://github.com/openclaw/openclaw/blob/fb4653dbea6650c0fae516151fa87fda5ee4aaf9/docs/concepts/storage-locations.md)。
