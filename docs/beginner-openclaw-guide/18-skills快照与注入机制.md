# 18 skills 快照与注入机制

## 模块目标

理解 skills 如何从“文件夹里的技能”变成“每次运行可复用上下文”。

## 步骤一：实现拆解（执行链路）

1. skills API 聚合:
- `src/agents/skills.ts`

2. 快照与提示生成:
- `src/agents/skills/workspace.ts`

3. 环境变量注入:
- `src/agents/skills/env-overrides.ts`

4. 变更监听:
- `src/agents/skills/refresh.ts`

5. 运行期使用点:
- `src/commands/agent.ts`
- `src/agents/pi-embedded-runner/run/attempt.ts`

## 步骤二：细粒度讲解（小白版）

1. 为什么要“快照”
- 运行中不能每次全量扫目录
- 快照让 session 可复用同一技能上下文，稳定且快

2. 快照包含什么
- 可用 skill 列表
- 过滤结果（allowlist / install 状态）
- 生成给模型看的 skills prompt

3. 注入分两种
- 从 snapshot 注入（优先）
- 无 snapshot 时临时加载技能再注入

4. watcher 的作用
- 监听 `SKILL.md` 变更
- bump snapshot version
- 驱动后续运行使用新技能快照

5. 这层与 agent/session 的关系
- `agentCommand` 会把快照写入 session entry
- 后续 turn 直接沿用，避免频繁重建


