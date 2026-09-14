---
title: "Fireworks"
sidebarTitle: "Fireworks"
---

# Fireworks

Fireworks 提供托管推理服务，常用于开源模型、低延迟推理和团队统一接入。

provider id 是 `fireworks`，认证环境变量是 `FIREWORKS_API_KEY`。OpenClaw 内置 Fireworks catalog，但 Fireworks 发布新模型时，你也可以直接使用平台上的完整模型 id。

配置：

```bash
export FIREWORKS_API_KEY="..."
openclaw configure --section model
openclaw models list --provider fireworks
```

如果你的团队已经在 Fireworks 管理模型，把 OpenClaw 接过去可以统一计费和限流。

## 新手提醒

Fireworks 的模型 ref 常常很长，例如带 `accounts/.../models/...` 或 `routers/...`。不要手动缩短。
如果你看到 404 或 model not found，优先检查模型 id 是否完整。

`fireworks/accounts/fireworks/routers/glm-5p2-fast`（GLM 5.2 Fast）当前目录声明为**纯文本输入**，不要按图片模型配置。动态 GLM ID 同样默认为纯文本；其他动态 ID 采用 Fire Pass 模板的文本+图片能力，Kimi 模式会自动关闭 thinking。具体模型能力不同时，应显式配置支持的输入类型。
