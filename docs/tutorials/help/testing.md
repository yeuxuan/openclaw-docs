---
title: "测试指南"
sidebarTitle: "测试指南"
description: "OpenClaw 源码测试：使用固定 pnpm 工具链运行定向检查、Vitest 单元/E2E/Live 测试，并区分测试证据与真实运行验证。"
---

# 测试指南

这页针对 OpenClaw 上游源码仓库，不是本站 VitePress 项目。上游使用 pnpm workspace 和 Vitest；不要用 `bun install` 或 `npm install` 替换其依赖安装方式。

## 先准备固定工具链

在 OpenClaw checkout 中：

```bash
corepack enable
pnpm install --frozen-lockfile
```

以目标 `package.json` 的 pnpm pin 为准；没有 Corepack 时按[源码安装说明](/tutorials/installation/#从源码手工构建)准备精确版本。

## 按改动选择验证范围

| 目的 | 命令 |
|------|------|
| 查看本次 diff 影响的模块 | `pnpm changed:lanes` |
| 窄范围修改的智能检查 | `pnpm check:changed` |
| 与改动匹配的测试 | `pnpm test:changed` |
| 单个文件 | `pnpm test <path/to/test.ts>` |
| 监听测试 | `pnpm test:watch` |
| 单元/集成默认套件 | `pnpm test` |
| E2E 套件 | `pnpm test:e2e` |
| 覆盖率报告 | `pnpm test:coverage` |

`check:changed` 会按核心代码、测试、插件、应用、文档等变化分类。部分路径现在也会通过 `pnpm test:serial` 调度定向 owner 测试，但这不等于所有相关测试都跑过；需要补充的契约仍用 `test:changed` 或明确文件验证。

提交钩子主要格式化并重新暂存文件；配置私有规则时也扫描暂存内容。它不代替 lint、类型检查或测试。提交前的完整门禁：

```bash
pnpm build && pnpm check && pnpm check:test-types && pnpm test
```

大机器可以使用 `pnpm test:max` 加速全套运行；日常修单个失败先跑定向测试。

## Live 与隔离运行器

Live 测试会真实使用提供商凭据、消耗 API 额度，某些通道测试还可能发出真实消息。只在有授权的测试账号和隔离环境运行：

```bash
pnpm test:live
pnpm test:live -- src/agents/models.profiles.live.test.ts
```

需要 Docker 时使用上游已有脚本，不假定存在 `Dockerfile.test`：

- `pnpm test:docker:live-models`：真实模型的文本、工具文件读取及适用时的图像探针。
- `pnpm test:docker:release-user-journey`：干净环境中的打包安装、引导、Agent、插件和通道流程。
- `pnpm test:docker:release-upgrade-user-journey`：默认从早于候选包的最新已发布稳定版安装、准备插件，再换候选包并执行 Doctor 迁移，验证升级后流程。找不到更早的稳定版时，只有候选版本本身已发布且为稳定版才能复用，否则测试失败，需用 `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC` 明确指定基线。

升级烟测会验证原插件仍可用，再设置候选版本兼容的 mock provider/通道配置；不能据此推断所有旧配置都已原样迁移成功。需要复现时记录实际 baseline、候选版本和日志。

更多入口：[Live 测试](/tutorials/help/testing-live)、[更新与插件测试](/tutorials/help/testing-updates-plugins)。

## 写回归测试时

把测试放在对应模块已有的测试结构中，优先复用相邻测试和上游 Vitest 辅助工具，不强制新建统一 `tests/regression/` 目录。

```ts
import { describe, expect, it } from "vitest";

describe("待修复的契约", () => {
  it("覆盖此次失败的输入与预期输出", () => {
    const actual = normalizeInput("example");
    expect(actual).toBe("example");
  });
});
```

上例是结构示意，`normalizeInput` 要换成真实函数并补 import。涉及文件系统时，使用 `test/helpers/temp-dir.ts` 的 `useAutoCleanupTempDirTracker(afterEach)`，让测试生命周期负责清理，不对真实用户目录做删除实验。

## 不要把不同证据混为一谈

- Gateway 接受请求并返回 run ID，只验证 admission；不代表完整工具调用或模型回答成功。
- mock-provider 测试不证明真实 API、登录或网络可用。
- 构建和测试通过后，用户可见改动仍需验证对应界面、通道或真实请求。
- 本站文档修改的验证命令是 `npm run docs:build`，本地链接另行检查；不是上游源码的 `pnpm test`。

上游详细范围与最新命令见 [Testing 文档](https://github.com/openclaw/openclaw/blob/2e3bf941b7848fa9dfcbcfc8c9a89d99e2feeb30/docs/help/testing.md)。
