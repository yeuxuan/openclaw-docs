---
title: "DigitalOcean"
sidebarTitle: "DigitalOcean"
---

# DigitalOcean：简单付费 VPS 路线

DigitalOcean 适合想要简单、稳定、界面友好的 VPS 用户。基础 Droplet 就能跑个人 OpenClaw Gateway。

推荐步骤：

1. 创建 Ubuntu 24.04 LTS Droplet。
2. SSH 登录。
3. 安装 Node 26.1+（或 Node 24.16+ 兼容版本）。
4. 安装 OpenClaw。
5. 运行 `openclaw onboard --install-daemon`。
6. 用 SSH 隧道访问控制 UI。

如果你已经看过 [DigitalOcean 安装](/tutorials/installation/digitalocean)，这页可以当作平台选择补充。
