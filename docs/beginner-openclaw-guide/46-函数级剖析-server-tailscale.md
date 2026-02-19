# 46 函数级剖析：server-tailscale

核心文件：`src/gateway/server-tailscale.ts`

## 模块定位

网关启动时的 Tailscale 网络暴露管理器。
控制 serve（tailnet 内访问）或 funnel（互联网访问）的生命周期，含清理逻辑。

## 一、startGatewayTailscaleExposure（完整源码）

```ts
// src/gateway/server-tailscale.ts

export async function startGatewayTailscaleExposure(params: {
  tailscaleMode: "off" | "serve" | "funnel";
  resetOnExit?: boolean;
  port: number;
  controlUiBasePath?: string;
  logTailscale: { info: (msg: string) => void; warn: (msg: string) => void };
}): Promise<(() => Promise<void>) | null> {
  // 1. off 模式直接跳过
  if (params.tailscaleMode === "off") {
    return null;
  }

  // 2. 尝试启用 serve 或 funnel
  try {
    if (params.tailscaleMode === "serve") {
      await enableTailscaleServe(params.port);
    } else {
      await enableTailscaleFunnel(params.port);
    }
    // 3. 获取 tailnet 主机名，记录访问 URL
    const host = await getTailnetHostname().catch(() => null);
    if (host) {
      const uiPath = params.controlUiBasePath ? `${params.controlUiBasePath}/` : "/";
      params.logTailscale.info(
        `${params.tailscaleMode} enabled: https://${host}${uiPath} (WS via wss://${host})`,
      );
    } else {
      params.logTailscale.info(`${params.tailscaleMode} enabled`);
    }
  } catch (err) {
    // 4. 失败只 warn，不抛，不阻塞网关启动
    params.logTailscale.warn(
      `${params.tailscaleMode} failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 5. resetOnExit=false → 不注册清理，返回 null
  if (!params.resetOnExit) {
    return null;
  }

  // 6. resetOnExit=true → 返回清理函数
  return async () => {
    try {
      if (params.tailscaleMode === "serve") {
        await disableTailscaleServe();
      } else {
        await disableTailscaleFunnel();
      }
    } catch (err) {
      params.logTailscale.warn(
        `${params.tailscaleMode} cleanup failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };
}
```

## 二、返回值语义

| 条件 | 返回值 |
|------|--------|
| `tailscaleMode === "off"` | `null`（立即返回，不执行任何操作）|
| `tailscaleMode !== "off"` + `resetOnExit !== true` | `null`（启用但不注册清理）|
| `tailscaleMode !== "off"` + `resetOnExit === true` | `async () => void`（关闭时调用 disable）|

调用方（`server.impl.ts`）消费：

```ts
const tailscaleCleanup = await startGatewayTailscaleExposure({
  tailscaleMode,
  resetOnExit: tailscaleConfig.resetOnExit,
  port,
  controlUiBasePath,
  logTailscale,
});

// 网关关闭时
await tailscaleCleanup?.();  // null-safe，null 时不执行
```

## 三、底层调用（execWithSudoFallback，超时 15s）

```ts
// src/infra/tailscale.ts

export async function enableTailscaleServe(port: number, exec: typeof runExec = runExec) {
  const tailscaleBin = await getTailscaleBinary();
  await execWithSudoFallback(exec, tailscaleBin, ["serve", "--bg", "--yes", `${port}`], {
    maxBuffer: 200_000,
    timeoutMs: 15_000,   // ← 15 秒超时
  });
}

export async function disableTailscaleServe(exec: typeof runExec = runExec) {
  const tailscaleBin = await getTailscaleBinary();
  await execWithSudoFallback(exec, tailscaleBin, ["serve", "reset"], {
    maxBuffer: 200_000,
    timeoutMs: 15_000,
  });
}

export async function enableTailscaleFunnel(port: number, exec: typeof runExec = runExec) {
  const tailscaleBin = await getTailscaleBinary();
  await execWithSudoFallback(exec, tailscaleBin, ["funnel", "--bg", "--yes", `${port}`], {
    maxBuffer: 200_000,
    timeoutMs: 15_000,
  });
}

export async function disableTailscaleFunnel(exec: typeof runExec = runExec) {
  const tailscaleBin = await getTailscaleBinary();
  await execWithSudoFallback(exec, tailscaleBin, ["funnel", "reset"], {
    maxBuffer: 200_000,
    timeoutMs: 15_000,
  });
}
```

**execWithSudoFallback**：先尝试直接执行，失败后自动重试 `sudo tailscale ...`（适配某些 OS 需要 sudo）。

## 四、serve vs funnel 区别

| 维度 | `serve` | `funnel` |
|------|---------|---------|
| 访问范围 | tailnet 内（同一 tailnet 的设备）| 互联网（任意公网 IP）|
| 认证前提 | 无强制 auth 要求（Tailscale 身份认证）| **必须** `authMode=password` |
| 安全约束 | 较宽松 | 较严格（见 45 约束 2）|
| 适用场景 | 团队内部工具共享 | 公开 webhook、外部集成 |

## 五、失败不崩服务的设计意图

```
enableTailscaleServe() 抛错
        │
        ▼
logTailscale.warn(...)   ← 记录警告
        │
        ▼
继续执行（不 rethrow）
        │
        ▼
网关正常启动（无 tailscale 暴露，但本地依然可用）
```

**为什么这样设计？**
- tailscale 是"额外网络能力"，不是核心功能。
- 常见失败原因：tailscale 未安装、tailscale daemon 未运行、权限不足。
- 这些失败不影响网关本地提供 API 服务。
- 运维人员看启动日志就能发现（warn 级别），不需要宕机来暴露问题。

## 六、cleanup 的幂等性

```ts
// cleanup 函数本身也 catch，失败只 warn，不让关闭流程中断
return async () => {
  try {
    await disableTailscaleServe();
  } catch (err) {
    params.logTailscale.warn(`serve cleanup failed: ${...}`);
  }
};
```

`tailscale serve reset` / `funnel reset` 是幂等命令，多次执行不会报错。
即使网关崩溃重启，下次正常关闭时 disable 也不会失败。

## 七、自检清单

1. `tailscaleMode === "off"` 时函数立即返回 `null`，无任何 tailscale 调用。
2. 启用失败后网关继续正常启动（warn 不抛）。
3. `resetOnExit=true` 时返回 cleanup 函数，调用方在 graceful shutdown 时调用。
4. `resetOnExit=false`（默认）时返回 `null`，关闭时不 disable（保留暴露规则）。
5. 底层 `execWithSudoFallback` 超时是 15 秒，启动/关闭卡住时最多等 15s。
6. 访问 URL 格式：`https://${host}${uiPath}` 和 `wss://${host}`。
