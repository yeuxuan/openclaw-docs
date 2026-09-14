---
title: "常用命令"
sidebarTitle: "常用命令"
---

# 常用命令：先会这几条就够了

## 安装和初始化

```bash
openclaw onboard
openclaw gateway install
```

先用 Quick start 在前台验证模型与 Dashboard；确认可用后再安装 Gateway 后台服务。

## 打开控制台

```bash
openclaw dashboard
```

打开浏览器 Control UI。

## 自动体检

```bash
openclaw doctor
```

检查配置、服务、权限、迁移和常见风险。

## 看日志

```bash
openclaw logs --follow
```

实时看 Gateway 日志。排查问题时很常用。

## 看状态

```bash
openclaw status --all
openclaw channels status --probe
openclaw plugins doctor
```

`status` 看整体，`channels` 看通道，`plugins doctor` 看插件。
新手遇到问题时，不要一上来改配置，先把这几条输出看完。
