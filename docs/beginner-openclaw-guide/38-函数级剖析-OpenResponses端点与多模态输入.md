# 38 函数级剖析 OpenResponses 端点与多模态输入

核心文件：
- `src/gateway/openresponses-http.ts`
- `src/gateway/open-responses.schema.ts`

## 步骤一：执行链路拆解

1. 仅处理 `POST /v1/responses`。
2. 鉴权通过后，按配置解析输入限制（body/url/file/image）。
3. 用 Zod schema 校验请求结构。
4. 解析 `input`：
- 文本消息
- `input_image`
- `input_file`（可含 PDF 提取）
5. 解析 tools + `tool_choice` 策略。
6. 组装最终 prompt（instructions + 对话 + 文件上下文 + tool-choice 提示）。
7. 调 `agentCommand(...)`。
8. 输出 OpenResponses 结构：
- 非流式：一次性 response object
- 流式：SSE 事件序列（created/in_progress/delta/done/completed）

## 步骤二：细粒度拆解

### A. 输入限制是“动态配置 + 默认值”

`resolveResponsesLimits(...)` 会给每类输入设保护：
- 最大 body
- URL 数量上限
- 文件/图片 mime 白名单
- bytes/timeout/redirect 上限

这套限制是防止“超大输入拖垮 gateway”的第一道防线。

### B. file/image 处理不是只做下载

`input_file` 除下载外还做内容提取：
- 文本直接注入 `<file ...>` 上下文
- PDF 可转图片参与多模态输入

也就是说，这个端点内建了“输入预处理管线”。

### C. `tool_choice` 的行为差异

1. `none`：禁用工具
2. `required`：必须先调工具
3. `function`：必须调用指定函数工具

实现会把这类约束转成额外 system prompt，强制模型按策略执行。

### D. 流式事件为什么这么多

OpenResponses 协议不是只发文本 delta。  
它需要表达“响应对象生命周期”，所以会有：
- `response.created`
- `response.in_progress`
- `response.output_text.delta`
- `response.output_item.done`
- `response.completed`

客户端靠这些事件重建完整对象状态，而不是只拼字符串。

### E. 工具调用返回路径

如果模型触发 client tool，返回会带 `function_call` output item（可能状态为 incomplete），由调用方继续回填 `function_call_output` 再发下一轮。


