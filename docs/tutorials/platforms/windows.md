---
title: "Windows"
sidebarTitle: "Windows"
---

# Windows：推荐 WSL2，原生 CLI 也在改进

OpenClaw 支持 Windows，但完整体验更推荐 WSL2。WSL2 让 Gateway、CLI 和工具运行在 Linux 环境里，兼容性更稳。

## 推荐路线：WSL2

1. 安装 WSL2。
2. 在 WSL2 里安装 Node 26.1+（或 Node 24.16+ 兼容版本）。
3. 运行：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw onboard --install-daemon
```

## 原生 Windows

原生 PowerShell 安装也可用：

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

如果要长期运行 Gateway，原生命令会优先尝试 Scheduled Task，失败时可能回退到登录启动项。
