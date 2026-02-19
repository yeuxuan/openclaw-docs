---
title: "多网关（Gateway）"
sidebarTitle: "多网关"
---

# 多网关（Gateway）（同一主机）

大多数场景应使用一个网关（Gateway），因为单个网关（Gateway）可以处理多个消息连接和智能体（Agent）。如果你需要更强的隔离或冗余（例如救援机器人），请使用隔离的 profile/端口运行独立的网关（Gateway）。

---

## 隔离检查清单（必需）

- `OPENCLAW_CONFIG_PATH` — 每实例配置文件
- `OPENCLAW_STATE_DIR` — 每实例会话（Session）、凭证、缓存
- `agents.defaults.workspace` — 每实例工作区（Workspace）根目录
- `gateway.port`（或 `--port`）— 每实例唯一
- 派生端口（browser/canvas）不得重叠

如果这些被共享，你会遇到配置竞争和端口冲突。

---

## 推荐：profile（`--profile`）

Profile 自动限定 `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` 的作用域并为服务名添加后缀。

```bash
# 主实例
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# 救援实例
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

按 profile 创建服务：

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

---

## 救援机器人指南

在同一主机上运行第二个网关（Gateway），拥有自己的：

- profile/配置
- 状态目录
- 工作区（Workspace）
- 基础端口（加上派生端口）

这使救援机器人与主机器人隔离，以便在主机器人宕机时进行调试或应用配置更改。

端口间距：基础端口之间至少留 20 个端口，以确保派生的 browser/canvas/CDP 端口永远不会冲突。

### 如何安装（救援机器人）

```bash
# 主机器人（已有或全新，无 --profile 参数）
# 运行在端口 18789 + Chrome CDC/Canvas/... 端口
openclaw onboard
openclaw gateway install

# 救援机器人（隔离的 profile + 端口）
openclaw --profile rescue onboard
# 注意：
# - 工作区名称默认会添加 -rescue 后缀
# - 端口应至少为 18789 + 20 个端口，
#   最好选择完全不同的基础端口，如 19789
# - 其余引导流程与正常相同

# 安装服务（如果在引导期间未自动完成）
openclaw --profile rescue gateway install
```

---

## 端口映射（派生）

基础端口 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT` / `--port`）。

- 浏览器控制服务端口 = 基础 + 2（仅 loopback）
- canvas host 在网关（Gateway）HTTP 服务器上提供（与 `gateway.port` 相同端口）
- 浏览器 profile CDP 端口从 `browser.controlPort + 9 .. + 108` 自动分配

如果你在配置或环境变量中覆盖了其中任何一个，你必须确保每个实例的值唯一。

---

## 浏览器/CDP 注意事项（常见陷阱）

- **不要**在多个实例上将 `browser.cdpUrl` 固定为相同的值。
- 每个实例需要自己的浏览器控制端口和 CDP 范围（从其网关（Gateway）端口派生）。
- 如果你需要显式 CDP 端口，每实例设置 `browser.profiles.<name>.cdpPort`。
- 远程 Chrome：每实例每 profile 使用 `browser.profiles.<name>.cdpUrl`。

---

## 手动环境变量示例

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

---

## 快速检查

```bash
openclaw --profile main status
openclaw --profile rescue status
openclaw --profile rescue browser status
```
