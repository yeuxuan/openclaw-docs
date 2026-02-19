# 47 函数级剖析：server-discovery-runtime

核心文件：`src/gateway/server-discovery-runtime.ts`

## 模块定位

网关启动时的服务发现广播管理器。
负责两路发现机制：**mDNS/Bonjour**（局域网自动发现）和**广域 DNS-SD**（跨网络发现，依赖 Tailscale）。

## 一、startGatewayDiscovery（完整签名）

```ts
export async function startGatewayDiscovery(params: {
  machineDisplayName: string;
  port: number;
  gatewayTls?: { enabled: boolean; fingerprintSha256?: string };
  canvasPort?: number;
  wideAreaDiscoveryEnabled: boolean;
  wideAreaDiscoveryDomain?: string | null;
  tailscaleMode: "off" | "serve" | "funnel";
  /** mDNS/Bonjour discovery mode (default: minimal). */
  mdnsMode?: "off" | "minimal" | "full";
  logDiscovery: { info: (msg: string) => void; warn: (msg: string) => void };
})
```

## 二、MdnsDiscoveryMode 类型

```ts
// src/config/types.gateway.ts

export type MdnsDiscoveryMode = "off" | "minimal" | "full";

export type MdnsDiscoveryConfig = {
  /**
   * mDNS/Bonjour discovery broadcast mode (default: minimal).
   * - off:     disable mDNS entirely
   * - minimal: omit cliPath/sshPort from TXT records
   * - full:    include cliPath/sshPort in TXT records
   */
  mode?: MdnsDiscoveryMode;
};
```

**三种模式的区别：**

| 模式 | cliPath | sshPort | 适用场景 |
|------|---------|---------|---------|
| `off` | 不广播 | 不广播 | 完全禁用发现 |
| `minimal`（默认）| 不包含 | 不包含 | 标准局域网发现，隐私优先 |
| `full` | 包含 | 包含 | 需要 CLI/SSH 自动发现的高级场景 |

## 三、Bonjour 启用条件（四重判断）

```ts
// src/gateway/server-discovery-runtime.ts

const mdnsMode = params.mdnsMode ?? "minimal";

const bonjourEnabled =
  mdnsMode !== "off" &&                              // 1. 配置未禁用
  process.env.OPENCLAW_DISABLE_BONJOUR !== "1" &&   // 2. 环境变量未禁用
  process.env.NODE_ENV !== "test" &&                 // 3. 非测试环境
  !process.env.VITEST;                               // 4. 非 Vitest 测试
```

同样的逻辑在 `src/infra/bonjour.ts` 中也有 `isDisabledByEnv()` 作为兜底：

```ts
function isDisabledByEnv() {
  if (isTruthyEnvValue(process.env.OPENCLAW_DISABLE_BONJOUR)) return true;
  if (process.env.NODE_ENV === "test") return true;
  if (process.env.VITEST) return true;
  return false;
}
```

## 四、minimal vs full 的 TXT 记录差异

```ts
const mdnsMinimal = mdnsMode !== "full";   // "off" 和 "minimal" 都是 minimal

// minimal 模式省略 cliPath 和 sshPort
const sshPortEnv = mdnsMinimal ? undefined : process.env.OPENCLAW_SSH_PORT?.trim();
const sshPortParsed = sshPortEnv ? Number.parseInt(sshPortEnv, 10) : NaN;
const sshPort = Number.isFinite(sshPortParsed) && sshPortParsed > 0 ? sshPortParsed : undefined;
const cliPath = mdnsMinimal ? undefined : resolveBonjourCliPath();

// 传给广播器
const bonjour = await startGatewayBonjourAdvertiser({
  instanceName: formatBonjourInstanceName(params.machineDisplayName),
  gatewayPort: params.port,
  gatewayTlsEnabled: params.gatewayTls?.enabled ?? false,
  gatewayTlsFingerprintSha256: params.gatewayTls?.fingerprintSha256,
  canvasPort: params.canvasPort,
  sshPort,      // minimal 时为 undefined
  cliPath,      // minimal 时为 undefined
  tailnetDns,
  minimal: mdnsMinimal,
});
```

## 五、Bonjour 失败不阻断启动

```ts
if (bonjourEnabled) {
  try {
    const bonjour = await startGatewayBonjourAdvertiser({...});
    bonjourStop = bonjour.stop;
  } catch (err) {
    params.logDiscovery.warn(`bonjour advertising failed: ${String(err)}`);
    // 继续执行，不 rethrow
  }
}
```

与 tailscale 模块同样的设计哲学：发现机制是辅助能力，失败不导致网关退出。

## 六、广域发现（wide-area DNS-SD）

广域发现需要两个前提：
1. `wideAreaDiscoveryEnabled === true`
2. 有可用的 Tailscale IPv4 地址

```ts
const needsTailnetDns = bonjourEnabled || params.wideAreaDiscoveryEnabled;
const tailnetDns = needsTailnetDns
  ? await resolveTailnetDnsHint({ enabled: tailscaleEnabled })
  : undefined;
```

广域 DNS-SD 写入对应 zone 记录，使得 `wideAreaDiscoveryDomain` 下的 SRV/TXT 记录指向网关。
依赖 Tailscale IP 是因为广域发现需要一个稳定的跨网络可达地址。

## 七、返回结构

```ts
return {
  bonjourStop,         // (() => Promise<void>) | null — 关闭时停止广播
  // （广域发现无需显式 stop，写入的 DNS 记录 TTL 自然过期）
};
```

网关关闭时：
```ts
await bonjourStop?.();   // null-safe
```

## 八、配置示例

```json5
{
  discovery: {
    mdns: {
      mode: "minimal",   // "minimal" | "full" | "off"
    },
    wideArea: {
      enabled: false,    // 广域发现，需要 Tailscale
    },
  },
}
```

或通过环境变量完全禁用 mDNS：
```bash
OPENCLAW_DISABLE_BONJOUR=1 openclaw gateway
```

## 九、自检清单

1. 默认 `mdnsMode = "minimal"`，只广播基础信息，不暴露 SSH 端口和 CLI 路径。
2. `OPENCLAW_DISABLE_BONJOUR=1` 环境变量可在生产环境关闭 Bonjour，无需修改配置文件。
3. 测试环境（`NODE_ENV=test` 或 `VITEST`）自动禁用 Bonjour，不会污染局域网。
4. Bonjour 失败只 warn，网关继续启动（发现机制非核心功能）。
5. 广域发现 = mDNS 之外的第二路，需要 tailscale + wideAreaDiscoveryDomain 同时配置。
6. `bonjourStop` 在网关关闭时调用，注销 Bonjour 服务记录（不 null-safe 调用会报错）。
