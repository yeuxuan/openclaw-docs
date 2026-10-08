---
title: "轻量浏览器：Lightpanda"
sidebarTitle: "轻量浏览器"
description: "把 Lightpanda 作为 OpenClaw browser 的可选 CDP Profile，用于文本和 DOM 自动化，并保留 Chromium 处理截图、PDF 与兼容性任务。"
---

# 轻量浏览器：用 Lightpanda 处理文本和 DOM 任务

Lightpanda 是 `browser` 工具的可选执行引擎，适合导航、DOM、表单和文本抽取。它不是 Chromium 的完整替代品：截图、PDF、复杂 Web 应用和依赖未支持浏览器特性的任务，仍应保留 Chromium Profile。

当前官方示例固定 Lightpanda 0.4.1。OpenClaw 只提供适配器，不会自动下载、启动或托管引擎，也不会迁移现有登录态。

## 先决定引擎放在哪里

| OpenClaw | Lightpanda | `cdpUrl` |
|----------|------------|----------|
| 宿主机 | Docker 容器 | `ws://127.0.0.1:9222` |
| Docker Compose | 同一 Compose 项目的 sidecar | `ws://lightpanda:9222` |
| 宿主机 | 本机二进制 | `ws://127.0.0.1:9222` |

CDP 等同于浏览器控制权限。不要把 9222 暴露到公网；跨主机使用私网、认证代理或隧道。

### OpenClaw 在宿主机，Lightpanda 用 Docker

在 OpenClaw upstream 源码根目录运行：

```bash
docker compose \
  -f deploy/lightpanda/compose.yaml \
  -f deploy/lightpanda/compose.host.yaml \
  up -d

docker compose \
  -f deploy/lightpanda/compose.yaml \
  -f deploy/lightpanda/compose.host.yaml \
  exec lightpanda /bin/lightpanda version
```

不用时用相同两个 Compose 文件执行 `down`。Windows 需要 Docker Desktop 的 Linux container 模式。

### OpenClaw 与引擎都在 Compose

```bash
docker compose -f docker-compose.yml -f deploy/lightpanda/compose.yaml up -d lightpanda
```

同一 Compose 网络内使用 `ws://lightpanda:9222`，不需要把浏览器端口发布到宿主机。网络不能声明为 `internal: true`，否则引擎无法访问公网网页。

## 加一个可选 Profile

把下面配置合并到现有顶层 `browser`：

```json5
{
  browser: {
    profiles: {
      lightpanda: {
        engine: "lightpanda",
        cdpUrl: "ws://127.0.0.1:9222",
      },
    },
  },
}
```

调用时显式选择 `profile: "lightpanda"`。验证真实任务后，才考虑把 `browser.defaultProfile` 改成 `"lightpanda"`；同时保留 Chromium Profile，在需要视觉输出或兼容性时显式切回。

## 能力边界

- Lightpanda 适合文本、DOM、导航、等待、表单提交和抽取，不是通用多标签 Chromium 会话。
- 不能因为合成 benchmark 更快或更省内存，就推断真实业务一定更好；至少验证任务完成率、等待行为和目标失效后的错误处理。
- 外部引擎的进程启动时间和内存可能无法由 OpenClaw 观察，报告为 `null` 不代表资源为零。
- 不要为跑通 benchmark 把现有个人 Chrome 登录 Profile 导入轻量引擎。
- 页面可访问不代表所有浏览器能力都可用；真实任务失败时切回 Chromium 复核。

浏览器 Profile、远程路由和诊断见[浏览器工具](/tutorials/tools/browser)。

上游来源：[`docs/tools/browser/lightweight.md`](https://github.com/openclaw/openclaw/blob/fb4653dbea6650c0fae516151fa87fda5ee4aaf9/docs/tools/browser/lightweight.md)。
