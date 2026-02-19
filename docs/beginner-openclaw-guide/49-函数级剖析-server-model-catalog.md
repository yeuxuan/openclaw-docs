# 49 函数级剖析：server-model-catalog

核心文件：`src/gateway/server-model-catalog.ts`

## 模块定位

网关侧模型目录的读取入口。不是"模型选择器"，是"网关上下文统一依赖注入点"。

## 一、调用链路

```
gateway 方法（如 models.list / sessions.patch 推断 thinking）
    │
    ▼
context.loadGatewayModelCatalog()
    │
    ▼
loadGatewayModelCatalog()      ← src/gateway/server-model-catalog.ts
    │
    ▼
loadModelCatalog({ config: loadConfig() })   ← src/agents/model-catalog.ts
    │
    ▼
返回 ModelDefinition[]（含 provider/id/contextWindow/capabilities 等）
```

## 二、为什么单独封一层（而不是直接调 loadModelCatalog）

1. **依赖注入**：网关的 `context` 对象统一提供 `loadGatewayModelCatalog`，
   各方法通过 context 调用而不是直接 import，便于测试 mock。

2. **测试隔离**：提供 `__resetModelCatalogCacheForTest()` 函数，
   允许测试之间清空缓存，避免测试用例串扰（前一个测试的 catalog 影响后一个）。

3. **关注点分离**："目录加载"和"回合选模"是两件不同的事，分开维护，各自可独立演进。

## 三、loadModelCatalog 的缓存行为

`loadModelCatalog` 内部有运行时缓存（module-level 变量），
相同配置多次调用不会重复解析 `models.json`。

热重载时需要 `__resetModelCatalogCacheForTest()`（或对应的生产版 reset 函数）来失效缓存，
否则改完配置后仍读取旧目录。

## 四、模型上下文窗口的另一个缓存

`src/agents/context.ts` 维护了一个独立的 `MODEL_CACHE: Map<string, number>`，
专门缓存 `modelId → contextWindow（tokens）`，用于估算 context overflow 阈值。

```ts
// 惰性加载：模块初始化时异步加载，不阻塞 import
const loadPromise = (async () => {
  await ensureOpenClawModelsJson(cfg);
  const modelRegistry = discoverModels(authStorage, agentDir);
  for (const m of modelRegistry.getAll()) {
    if (typeof m.contextWindow === "number") MODEL_CACHE.set(m.id, m.contextWindow);
  }
})();

export function lookupContextTokens(modelId?: string): number | undefined {
  void loadPromise;  // 触发加载但不等
  return MODEL_CACHE.get(modelId);  // 可能返回 undefined（加载未完成）
}
```

这个缓存与 `loadGatewayModelCatalog` 是两个独立缓存，不要混淆。

## 五、自检清单

1. `loadGatewayModelCatalog` 通过 `context` 注入，不直接 import（便于 mock）。
2. 测试用 `__resetModelCatalogCacheForTest()` 在每个 test case 前清空缓存。
3. 热重载后缓存失效，确保新配置立即生效。
4. `lookupContextTokens` 可能返回 `undefined`（加载未完成时），调用方必须处理这种情况。
