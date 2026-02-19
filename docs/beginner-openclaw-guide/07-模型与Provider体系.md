# 07 模型与 Provider 体系

## 模块目标

理解系统如何管理多提供商模型、别名、白名单、回退与动态发现。

## 步骤一：实现拆解（执行链路）

1. 默认值与基础规则: `src/agents/defaults.ts`
2. 模型配置落地: `src/agents/models-config.ts`
3. 模型目录加载: `src/agents/model-catalog.ts`
4. 模型选择与别名: `src/agents/model-selection.ts`
5. 失败回退策略: `src/agents/model-fallback.ts`
6. embedded runner 解析模型: `src/agents/pi-embedded-runner/model.ts`

## 步骤二：细粒度讲解（小白版）

1. `models-config.ts` 负责把配置变成可执行数据
- 合并显式 provider 与隐式 provider
- 生成/更新 agent 目录下 `models.json`
- 支持 merge/replace 模式

2. `model-catalog.ts` 负责运行时发现
- 从 Pi SDK registry 读取可用模型
- 缓存结果，失败时避免污染缓存
- 补充一些兼容性 fallback（例如 codex spark）

3. `model-selection.ts` 负责“选谁”
- 处理 provider 规范化（别名归一）
- 支持模型别名（alias -> provider/model）
- 计算 allowlist
- 解析 `provider/model` 文本到结构化 ModelRef

4. `model-fallback.ts` 负责“选不到/失败怎么办”
- 按候选列表依次尝试
- 支持按失败原因切换（超时、限流等）
- 记录每次尝试信息，最终抛出汇总错误

5. `pi-embedded-runner/model.ts` 做最终落地
- 先从模型注册表查
- 查不到再看 inline provider
- 再走 forward-compat / provider fallback


