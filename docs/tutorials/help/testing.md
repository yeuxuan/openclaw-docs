---
title: "测试指南"
sidebarTitle: "测试指南"
---

# 测试指南（Testing Guide）

OpenClaw 提供了完整的测试套件，帮助你验证改动是否正确、功能是否如预期工作。无论是开发自定义技能还是贡献代码，本页都能帮你快速上手测试流程。

---

## 测试类型总览

OpenClaw 的测试套件分为三类：

| 类型 | 说明 | 是否需要 API Key |
|------|------|-----------------|
| **Unit 测试** | 组件级别的单元测试，验证单个函数/模块的逻辑 | 否 |
| **E2E 测试** | 端对端集成测试，模拟完整的 Agent 交互流程 | 部分需要 |
| **Live 测试** | 与真实 AI 模型 API 交互的实时测试 | 是 |

---

## 快速开始（开发者）

如果你刚克隆仓库，想快速跑通基础测试：

```bash
# 安装所有依赖
bun install

# 运行单元测试
bun run test

# 运行单元测试（监听模式，文件变更自动重跑）
bun run test --watch
```

对应 npm 命令：

```bash
npm install
npm run test:unit
npm run test:e2e
```

---

## Unit 测试（单元测试）

单元测试不需要网络连接或 API Key，是最快的验证方式。

```bash
# 运行所有单元测试
bun run test

# 运行指定文件的测试
bun run test src/gateway/router.test.ts

# 运行名称包含关键字的测试
bun run test --grep "message routing"
```

---

## E2E 测试（端对端测试）

E2E 测试会启动一个完整的 Gateway 实例，模拟真实的消息流转，验证各组件协作是否正常。

```bash
npm run test:e2e
```

::: info
部分 E2E 测试场景使用 Mock 替代真实 API，无需 API Key 即可运行。需要真实 API 的测试场景会在运行前检查并提示。
:::

---

## Live 测试（实时模型测试）

Live 测试会调用真实的 AI 模型 API，验证端到端的模型响应是否符合预期。

运行前需要配置对应模型的 API Key：

```bash
# 设置 Anthropic API Key
export ANTHROPIC_API_KEY=sk-ant-xxxxx

# 运行 Live 测试
npm run test:live
```

::: warning
Live 测试会消耗真实的 API 额度，请注意控制运行频率，避免不必要的费用。
:::

---

## Deepgram 语音测试

如果你需要测试语音相关功能，还需要配置 Deepgram API Key：

```bash
export DEEPGRAM_API_KEY=your-deepgram-key
npm run test:voice
```

---

## Docker 运行器（隔离环境）

使用 Docker 运行 E2E 测试，确保测试环境与本地环境完全隔离，适合 CI/CD 场景：

```bash
# 构建测试镜像
docker build -f Dockerfile.test -t openclaw-test .

# 在 Docker 中运行 E2E 测试
docker run --rm \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  openclaw-test npm run test:e2e
```

---

## 文档链接检查

验证文档中所有内部和外部链接是否有效：

```bash
npm run test:docs
```

这个命令会扫描所有 `.md` 文件，检查：
- 内部链接是否指向存在的文件
- 外部链接是否可访问（需要网络）

---

## 离线回归测试

不需要 API Key 的回归测试套件，适合在无网络环境下验证核心逻辑：

```bash
npm run test:regression
```

---

## 技能评估（Skill Evaluation）

测试自定义技能的行为是否符合预期：

```bash
# 评估指定技能
npm run test:skill -- --skill my-custom-skill

# 评估所有技能
npm run test:skill:all
```

::: details 技能测试配置示例
```json5
{
  skill: "my-custom-skill",
  testCases: [
    {
      input: "帮我查询天气",
      expectedTool: "weather-fetch",
      expectedOutput: { contains: "温度" }
    }
  ]
}
```
:::

---

## 回归指南（编写新测试用例）

当你修复了一个 Bug 或添加了新功能，建议同步添加对应的回归测试：

1. 在 `tests/regression/` 目录下创建测试文件
2. 命名格式：`<功能描述>.regression.test.ts`
3. 测试结构参考以下模板：

::: details 回归测试模板
```typescript
import { describe, it, expect } from "bun:test";

describe("功能名称 - 回归测试", () => {
  it("应该正确处理 <场景描述>", async () => {
    // 准备
    const input = "测试输入";

    // 执行
    const result = await yourFunction(input);

    // 验证
    expect(result).toBeDefined();
    expect(result.status).toBe("success");
  });
});
```
:::

---

_下一步：[Node.js 问题排查](./node-issue)_
