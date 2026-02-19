# 32 函数级剖析 sessions 方法组

核心文件：`src/gateway/server-methods/sessions.ts`

## 步骤一：执行链路拆解（按能力分组）

1. 查询类
- `sessions.list`
- `sessions.preview`
- `sessions.resolve`

2. 修改类
- `sessions.patch`

3. 生命周期类
- `sessions.reset`
- `sessions.delete`
- `sessions.compact`

## 步骤二：细粒度拆解（关键函数）

### A. `migrateAndPruneSessionStoreKey(...)`

它解决“同一会话有多个历史 key”的问题：
- 找 canonical key
- 把旧 key 数据迁移到 canonical key
- 删除遗留 key

作用：避免同一会话被不同 key 改出分叉状态。

### B. `ensureSessionRuntimeCleanup(...)`

`reset/delete` 前先做运行态清理：
1. 清 session 队列 `clearSessionQueues(...)`
2. 停子代理 `stopSubagentsForRequester(...)`
3. 中止 embedded run `abortEmbeddedPiRun(...)`
4. 等待 run 真正结束（最多 15 秒）

如果 run 没停干净，方法会报错拒绝后续操作。  
这一步是“防并发破坏”的关键。

### C. `sessions.patch`

流程：
1. 校验 patch
2. 定位 store（含 agent 维度）
3. 在 `updateSessionStore(...)` 锁内应用 patch
4. 返回解析后的模型指向（provider/model）

这让前端 patch 后立刻知道“实际生效模型”。

### D. `sessions.reset`

行为不是“删 session”，而是“换一个新 sessionId 继续同 key”：
- 保留一些设置（thinking/model/sendPolicy/skillsSnapshot 等）
- token 计数清零
- 旧 transcript 归档（`reason: reset`）

### E. `sessions.delete`

关键约束：
- 主会话（main session）禁止删除
- 默认会归档 transcript（可配置不归档）

删除前同样会走运行态清理，避免删到一半有 run 在写文件。

### F. `sessions.compact`

它是“行数截断式压缩”：
- transcript 行数超过阈值才处理
- 先备份 `*.bak`
- 只保留最后 `maxLines`
- 清除旧 token 统计，更新时间戳

适合快速控盘占用，不是语义总结压缩。


