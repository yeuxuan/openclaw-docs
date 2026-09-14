---
title: "llama.cpp Provider"
sidebarTitle: "llama.cpp Provider"
description: "用 OpenClaw 管理本地 llama-server，或连接现有 llama.cpp 服务；支持 GGUF 对话和托管本地记忆嵌入。"
---

# llama.cpp Provider

`llama-cpp` 插件现在既能运行 GGUF 对话模型，也能提供本地记忆嵌入。OpenClaw 可以自己安装和管理 `llama-server`，也可以连接由终端、容器、systemd 或另一台机器维护的现有服务；两种方式都使用 `llama-cpp/<model>` 引用和 OpenAI-compatible 传输。

```bash
openclaw plugins install @openclaw/llama-cpp-provider
openclaw onboard
```

## 先选服务由谁管理

| 方式 | 进程所有者 | 本地记忆嵌入 |
|------|------------|--------------|
| Managed local server | OpenClaw | 支持 |
| Existing llama-server | 你或外部 supervisor | 不支持 |

配置中存在 `models.providers.llama-cpp.localService` 就表示 OpenClaw 管理进程；没有它时，`baseUrl` 指向现有 endpoint。切换方式会在同一个 `llama-cpp` Provider 下重写所有权相关状态，不会创建第二个 Provider 命名空间。

## OpenClaw 托管本地服务

在 onboarding 中选择 `Managed local server`。经你确认后，OpenClaw 会：

1. 验证固定版本的 llama.cpp 构建。
2. 下载并校验对话与 embedding 模型。
3. 写入 loopback endpoint 和 `localService`。
4. 探测服务成功后才保存配置。

默认对话模型约 5 GB、上下文上限 65,536 token，只会在至少 16 GiB 内存的机器上提供；托管的 EmbeddingGemma 约 0.3 GB。仅执行 setup discovery 不会安装或下载任何文件。

要使用自己的托管 GGUF，在 `models.providers.llama-cpp.models` 中添加模型，并再次运行 managed setup：

```json5
{
  id: "my-local-model",
  name: "My local GGUF",
  reasoning: false,
  input: ["text"],
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  contextWindow: 65536,
  maxTokens: 2048,
  params: {
    modelPath: "~/Models/my-model.Q4_K_M.gguf",
    contextSize: 65536,
  },
  compat: { supportsTools: true },
}
```

`modelPath` 可使用本地路径、缓存相对文件名、完整 `hf:` 文件 URI，或提供 SHA-256 响应摘要的 HTTPS GGUF URL。默认缓存目录是 `~/.openclaw/models/llama.cpp`。

## 连接现有 llama-server

先给模型设置稳定 alias：

```bash
llama-server \
  --model /path/to/model.gguf \
  --alias my-model \
  --host 127.0.0.1 \
  --port 8080
```

然后运行 `openclaw onboard`，选择 `Existing llama-server`，填写 endpoint，最后选模型：

```bash
openclaw models list --provider llama-cpp
openclaw models set llama-cpp/my-model
```

OpenClaw 会只读探测 `/health`、`/models`（必要时回退 `/v1/models`）和 `/props`。探测不会加载、唤醒、卸载或下载模型；配置中显式声明的同 ID 模型始终优先。

### 认证与替换 endpoint

现有服务支持无认证、API Key、SecretRef、auth profile 和显式 Authorization header。URL 中包含用户名或密码会被拒绝。初次配置或 endpoint 不变时可使用：

```bash
export LLAMA_SERVER_API_KEY="<API_KEY>"
openclaw onboard
```

更换 endpoint 时，OpenClaw 不会把旧服务的环境变量、profile、内联 key 或 header 凭据发送给新地址。选择“无 API Key”会移除默认 llama.cpp auth profile 和陈旧的内联 key，但保留你显式配置的 Authorization header 与无关 header。

非交互配置示例：

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice llama-cpp-existing-server \
  --custom-base-url http://127.0.0.1:8080/v1 \
  --custom-model-id my-model
```

替换 endpoint 需要新凭据时再加 `--llama-server-api-key <API_KEY>`。

### 最小手工配置

向导会验证发现结果，优先使用向导。确需手写时：

```json5
{
  models: {
    mode: "merge",
    providers: {
      "llama-cpp": {
        baseUrl: "http://127.0.0.1:8080/v1",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        models: [],
      },
    },
  },
}
```

如果使用自定义 Provider ID 指向 llama-server，它不会自动继承 canonical `llama-cpp` 兼容配置；对会把工具参数编译为 GBNF 的模型，显式设置 `compat.toolSchemaProfile: "llamacpp"`。

## 本地记忆嵌入

本地 embedding 只支持 managed 模式：

```json5
{
  memory: {
    search: {
      provider: "local",
      local: {
        modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
      },
    },
  },
}
```

插件会保留历史 `local` embedding Provider 与索引 identity。主动更换 embedding 模型后运行：

```bash
openclaw memory status --index
```

## 故障排查

- Managed 模式：运行 `openclaw doctor` 和 `openclaw memory status --deep`。
- Existing server：检查 `/health`、`/models`、`/props`；HTTP 503 通常表示模型仍在加载。
- 工具调用缺失：确认 `/props` 中的工具能力，并使用支持工具的 Jinja chat template。
- 托管 Linux 构建要求 x64 glibc 2.34+ 或 arm64 glibc 2.38+；Windows 需要 Microsoft Visual C++ 2015–2022 Redistributable。
- 没有已验证托管构建的平台，应改用 existing server。

OpenClaw 不会自动选择 CUDA、ROCm、SYCL、OpenVINO 或 Vulkan 构建，这些路线需自行维护驱动与运行时。

## 相关页面

- [本地模型服务](/tutorials/gateway/local-model-services)
- [模型 Provider](/tutorials/concepts/model-providers)
- [LM Studio](/tutorials/providers/lmstudio)
- [记忆系统](/tutorials/concepts/memory)
