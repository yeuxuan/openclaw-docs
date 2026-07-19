---
title: "Fleet 多租户命令"
sidebarTitle: "Fleet"
description: "用 openclaw fleet 管理多租户隔离单元，适合托管多个互不信任的 OpenClaw 实例。"
---

# Fleet 多租户命令

`openclaw fleet` 用来管理多个相互隔离的 OpenClaw 实例。

如果你只是自己个人使用，一般用不到它。
但如果你要给多个客户、多个团队、多个组织托管 OpenClaw，它就很关键。

Fleet 把每个隔离实例叫做一个 **cell**。
你可以把它理解成“每个租户一套单独的小型 OpenClaw 环境”。

---

## 它解决什么问题

很多人一开始会想：

```text
能不能一个 Gateway 里服务多个完全不互信的租户？
```

Fleet 给出的答案是：

```text
别硬塞进一个共享 Gateway，而是每个租户单独起一套隔离单元。
```

每个 cell 都有自己的：

- Gateway
- 状态目录
- 凭证
- 通道账号
- 容器
- loopback 端口

这比“大家共用一个大 Gateway”更符合安全边界。

---

## 先记住 3 个事实

1. Fleet 目前还是实验特性。
2. 它依赖本机 Docker 或 Podman。
3. 更适合“多租户托管”而不是普通单用户部署。

---

## 最小上手

```bash
openclaw fleet create acme
openclaw fleet status acme
openclaw fleet list
```

创建完成后，命令会给出 cell URL 和对应 Gateway token。
这个 token 只会重点暴露一次，别等会儿再想“我忘了复制”。

---

## 常见命令

### 创建一个 cell

```bash
openclaw fleet create acme
```

### 用固定端口创建，但先不启动

```bash
openclaw fleet create acme \
  --runtime podman \
  --port 19125 \
  --no-start
```

### 查看列表

```bash
openclaw fleet list
openclaw fleet list --json
```

### 查看单个实例状态

```bash
openclaw fleet status acme
openclaw fleet status acme --json
```

### 看日志

```bash
openclaw fleet logs acme
openclaw fleet logs acme --follow
```

### 启停和重启

```bash
openclaw fleet start acme
openclaw fleet stop acme
openclaw fleet restart acme
```

### 升级镜像

```bash
openclaw fleet upgrade acme
openclaw fleet upgrade acme --image ghcr.io/openclaw/openclaw:<version>
```

---

## 什么时候应该用 Fleet

适合：

- 你是托管方，要给多个客户独立部署
- 不同租户之间不能共享状态和凭证
- 你需要容器级隔离，而不是会话级隔离

不适合：

- 你只是自己单机使用
- 你只是同一团队内部共享一个可信 Gateway
- 你还没搞明白 Docker / Podman 和数据持久化

---

## 多租户时最容易犯的错

### 错误 1：把 session 隔离当成租户隔离

Session 只是在“同一个系统里区分不同对话”。
它不是互不信任租户之间的强安全边界。

### 错误 2：把 18789 暴露到公网

Fleet 默认只把 cell Gateway 发布到本机 loopback。
这是对的，不要为了“图省事”直接裸暴露。

### 错误 3：把 token 管理当成次要问题

每个 cell 的 Gateway token 都是租户边界的一部分。
别把它随手扔进共享群聊、工单截图或公开脚本。

---

## 排障时先看什么

如果某个租户 cell 起不来，先按这个顺序查：

1. `openclaw fleet status <tenant>`
2. `openclaw fleet logs <tenant> --tail 200`
3. 本机 Docker / Podman 是否真的健康
4. 端口是否冲突
5. 绑定的数据目录权限是否正确

如果是升级后失败，再看是否是新镜像没通过健康检查。

---

## 相关页面

- [多租户托管说明](/tutorials/gateway/multi-tenant-hosting)
- [Gateway 运维](/tutorials/gateway/)
- [Secrets 管理](/tutorials/gateway/secrets)

