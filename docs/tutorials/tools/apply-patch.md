---
title: "应用补丁工具"
sidebarTitle: "Apply Patch"
---

# 应用补丁工具（Apply Patch Tool）

`apply_patch` 工具让 Agent 能够以安全、精确的方式修改代码文件——不是直接覆盖整个文件，而是只应用指定的差异变更。

---

## 为什么需要 apply_patch？

直接覆盖文件的方式容易导致意外丢失内容，尤其是在多处小改动的场景下。`apply_patch` 使用标准 unified diff 格式，让每次变更都清晰可追溯。

::: info 适用场景
- Agent 自动修复 Bug
- 代码重构时局部调整
- 多文件批量补丁应用
:::

---

## 参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| `patch` | string | unified diff 格式的补丁内容 |
| `path` | string | 目标文件的路径（必须在工作区内） |

---

## 使用示例

下面是一个典型的 Agent 调用场景：Agent 发现代码中的 Bug 后，使用 `apply_patch` 精确修复，而不是重写整个文件。

```bash
# Agent 生成补丁并应用
openclaw run "修复 src/utils.js 第 42 行的空指针问题"
```

::: details apply_patch 内部调用示例（unified diff 格式）

```diff
--- a/src/utils.js
+++ b/src/utils.js
@@ -40,7 +40,7 @@
 function processData(input) {
-  return input.value.trim();
+  return input?.value?.trim() ?? '';
 }
```

Agent 会自动构建上述格式的 patch，并通过 `apply_patch` 工具提交变更。
:::

---

## 注意事项

::: warning 使用前请确认
- **格式要求**：patch 必须是标准 unified diff 格式（`diff -u` 输出的格式），不支持其他 diff 格式
- **路径限制**：目标文件路径必须在当前工作区（workspace）范围内，不能修改工作区外的文件
- **超大补丁**：单次 patch 内容过大时，建议拆分为多个小补丁分批处理，避免应用失败
:::

::: tip 调试建议
如果补丁应用失败，可以先用 `diff -u 原文件 新文件` 手动生成并验证 patch 内容格式是否正确。
:::

---

## 常见错误处理

| 错误信息 | 可能原因 | 解决方法 |
|----------|----------|----------|
| `patch does not apply` | 目标文件内容与 patch 上下文不匹配 | 检查目标文件是否已被修改 |
| `file not found` | 路径错误或文件不存在 | 确认文件路径相对于工作区根目录 |
| `permission denied` | 文件权限不足 | 检查文件是否为只读 |

---

_下一步：[工具系统总览](/tutorials/tools/)_
