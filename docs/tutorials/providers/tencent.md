---
title: "Tencent"
sidebarTitle: "Tencent"
---

# Tencent

Tencent 相关 provider 适合已经在腾讯云或腾讯模型服务里管理账号、密钥和模型的用户。

最新版官方文档覆盖 Tencent Cloud TokenHub 与 TokenPlan 两条路线，Provider ID 分别是
`tencent-tokenhub`、`tencent-tokenplan`，官方插件包为 `@openclaw/tencent-provider`。
两条路线的新配置都默认选择 `hy4-preview`。

使用前确认：

- 云账号权限。
- API Key 或 SecretId/SecretKey。
- 区域和模型名。
- 网络能访问对应 endpoint。

国内团队如果已有腾讯云基础设施，用统一 provider 管理会更方便。

## 新手验证

```bash
openclaw configure --section model
openclaw models list --provider tencent-tokenhub
openclaw models list --provider tencent-tokenplan
openclaw models status
```

当前常用模型：

| 路线 | 模型 ref | 上下文 / 最大输出 |
|------|----------|-------------------|
| TokenHub | `tencent-tokenhub/hy4-preview` | 1,024,000 / 64,000 |
| TokenPlan | `tencent-tokenplan/hy4-preview` | 1,024,000 / 64,000 |
| 旧 GA | `tencent-tokenhub/hy3` / `tencent-tokenplan/hy3` | 256,000 / 128,000 |

`tencent-tokenhub/hy3-preview` 已废弃；Doctor 只会把它迁移到 `hy3`，不会擅自跨到
Hy4。不要把这些 chat 模型和腾讯 3D 生成类 API 混在一起，它们不是同一个能力面。
