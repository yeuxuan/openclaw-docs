---
title: "macOS dev setup"
---

# macOS 开发环境

::: tip 先看人话
这页是从 OpenClaw 官方最新文档同步来的专题参考。新手不要一口气背完，先看标题和第一段；真正要配置这个功能时，再按步骤慢慢做。
:::

这页说明如何从源码构建并运行 OpenClaw 的 macOS 应用。

## 前置条件

构建应用之前，先确认本机已经安装：

1. Xcode 26.2+：用于 Swift 开发。
2. Node.js 26 和 pnpm：用于 Gateway、CLI 和打包脚本。兼容版本为 Node 24.16+ 或 26.1+；Node 22、23、25 不受支持。

## 1. 安装依赖

安装项目依赖：

```bash
pnpm install
```

## 2. 构建并打包应用

运行下面的命令，会把 macOS 应用打包到 `dist/OpenClaw.app`：

```bash
./scripts/package-mac-app.sh
```

如果本机没有 Apple Developer ID 证书，脚本会自动使用 ad-hoc 签名（`-`）。

开发运行模式、签名参数和 Team ID 排查请看 macOS app README：
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> Note: ad-hoc 签名应用可能触发系统安全提示。如果应用启动后立刻报 "Abort trap 6"，看下面的 [Troubleshooting](#troubleshooting)。

## 3. 安装 CLI

macOS 应用需要全局 `openclaw` CLI 来管理后台任务。

推荐从应用里安装：

1. 打开 OpenClaw 应用。
2. 进入 General 设置页。
3. 点击 "Install CLI"。

也可以手动安装：

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` and `bun add -g openclaw@<version>` also work.
Gateway 运行时仍推荐使用 Node。

## Troubleshooting

### Build fails: toolchain or SDK mismatch

The macOS app build expects the latest macOS SDK and Swift 6.2 toolchain.

System dependencies (required):

- Latest macOS version available in Software Update (required by Xcode 26.2 SDKs)
- Xcode 26.2 (Swift 6.2 toolchain)

Checks:

```bash
xcodebuild -version
xcrun swift --version
```

If versions don’t match, update macOS/Xcode and re-run the build.

### App crashes on permission grant

If the app crashes when you try to allow Speech Recognition or Microphone access, it may be due to a corrupted TCC cache or signature mismatch.

Fix:

1. Reset the TCC permissions:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. If that fails, change the `BUNDLE_ID` temporarily in [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) to force a "clean slate" from macOS.

### Gateway "Starting..." indefinitely

If the gateway status stays on "Starting...", check if a zombie process is holding the port:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

If a manual run is holding the port, stop that process (Ctrl+C). As a last resort, kill the PID you found above.

## Related

- [macOS app](/tutorials/platforms/macos)
- [Install overview](/tutorials/installation/)
