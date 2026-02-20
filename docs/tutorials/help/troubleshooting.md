---
title: "故障排查"
sidebarTitle: "故障排查"
---

# 故障排查（Troubleshooting）

大多数问题都能在 60 秒内定位。按照下面各场景的步骤逐一排查，通常能快速找到原因。

---

## 快速决策表

| 现象 | 优先检查 |
|------|----------|
| Agent 不回复 | API Key、Gateway 状态、网络 |
| 仪表板无法连接 | Gateway 是否运行、端口占用 |
| Gateway 启动失败 | 配置文件语法、端口冲突 |
| 通道断连 | Token 是否过期、重新登录 |
| Cron 不触发 | 时区设置、cron 表达式 |
| Node 工具报错 | Node.js 版本（需 v18+） |
| Browser 工具报错 | Chrome/Chromium 是否安装 |

---

## 场景 1：Agent 不回复

**步骤：**

1. 检查 API Key 是否有效：
   ```bash
   openclaw config show
   ```

2. 确认 Gateway 正在运行：
   ```bash
   openclaw gateway status
   ```

3. 查看最新日志，找出具体错误：
   ```bash
   openclaw logs --tail 50
   ```

4. 如果 Gateway 在运行但仍无响应，尝试重启：
   ```bash
   openclaw gateway restart
   ```

::: tip
如果日志里出现 `401 Unauthorized`，说明 API Key 无效或已过期，需要重新配置。
:::

---

## 场景 2：仪表板无法连接

**步骤：**

1. 确认 Gateway 正在运行：
   ```bash
   openclaw gateway status
   ```

2. 检查 Gateway 默认端口（3000）是否被其他进程占用：
   ```bash
   lsof -i :3000
   ```

3. 如果端口被占用，可在配置中修改端口后重启 Gateway。

4. 尝试重新配对：
   ```bash
   openclaw pairing
   ```

::: details 配置自定义端口
```json5
{
  gateway: {
    port: 3001  // 改为未被占用的端口
  }
}
```
修改后重启 Gateway 生效。
:::

---

## 场景 3：Gateway 启动失败

**步骤：**

1. 验证配置文件语法是否正确：
   ```bash
   openclaw config validate
   ```

2. 查看详细错误日志：
   ```bash
   openclaw logs --filter gateway
   ```

3. 检查是否有端口冲突（默认端口 3000）：
   ```bash
   lsof -i :3000
   ```

4. 如果配置文件损坏，可以重置后重新配置：
   ```bash
   openclaw reset
   ```

::: warning
`openclaw reset` 会清除所有配置，请确保已备份重要设置后再执行。
:::

---

## 场景 4：通道连接问题

**步骤：**

1. 查看通道当前状态：
   ```bash
   openclaw channels status
   ```

2. 重新登录对应通道：
   ```bash
   openclaw channels login --channel <通道名称>
   ```

3. 检查该通道的 Token 或 API Key 是否已过期（各通道平台均有 Token 有效期）。

4. 查看通道专属文档，确认鉴权配置是否正确：
   [通道配置指南](../channels/index)

---

## 场景 5：Cron / Heartbeat 不触发

**步骤：**

1. 检查系统时区设置是否与预期一致：
   ```bash
   date
   timedatectl status  # Linux
   ```

2. 验证 cron 表达式语法（推荐使用 [crontab.guru](https://crontab.guru) 在线验证）。

3. 手动触发一次，确认 Job 本身是否能正常执行：
   ```bash
   openclaw cron run <job名称>
   ```

4. 查看 cron 执行日志：
   ```bash
   openclaw logs --filter cron
   ```

---

## 场景 6：Node 工具问题

**步骤：**

1. 检查 Node.js 版本，OpenClaw 要求 **v18 或更高**：
   ```bash
   node --version
   ```

2. 如果版本过低，通过 nvm 升级：
   ```bash
   nvm install 20
   nvm use 20
   ```

3. 重新安装 OpenClaw 以同步依赖：
   ```bash
   openclaw update
   ```

::: tip tsx 运行时崩溃？
如果遇到 `__name is not a function` 错误，请参考 [Node.js 问题排查](./node-issue)。
:::

---

## 场景 7：Browser 工具问题

**步骤：**

1. 确认系统中已安装 Chrome 或 Chromium：
   ```bash
   which google-chrome || which chromium || which chromium-browser
   ```

2. 如果未安装，在 Ubuntu/Debian 上安装：
   ```bash
   sudo apt install chromium-browser
   ```

3. Linux 环境下如果遇到权限问题，需要启用沙箱豁免模式。在配置中添加：

::: details Linux Browser 权限配置
```json5
{
  tools: {
    browser: {
      launchOptions: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      }
    }
  }
}
```
:::

::: warning
`--no-sandbox` 会降低浏览器隔离级别，仅在受信任的环境（如私有服务器）中使用。
:::

---

_下一步：[环境变量](./environment)_
