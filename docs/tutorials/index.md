# 教程中心

欢迎来到 OpenClaw 教程中心！这里的所有教程都尽量用最简单的语言写作，不管你是不是技术人员，都能跟着做。

::: tip 读本站时只记住这个方法
每一页都先看“人话解释”和“照着做”的部分。
看见 Gateway、Provider、Plugin、Node 这些英文词，不用背，先把它们当成“总服务台、AI 大脑、扩展包、外接设备”就够了。
:::

## OpenClaw 是什么？

OpenClaw 是一个运行在你自己电脑上的 AI 助手平台。

> 想象这样的场景：你在 Telegram 里给你的 AI 助手发消息说"帮我查一下明天的天气"，然后它马上回复你。或者你在 WhatsApp 里说"帮我写一封邮件"，它就帮你写好了。

OpenClaw 把这些变成可能::它在你的电脑或服务器上继续运行一个 Gateway 网关，连接聊天软件、浏览器控制 UI、移动节点和 AI 模型，让助手随时待命。

---

## 新手从哪里开始？

请按下面的顺序阅读。先跑通，再慢慢学名词。

### 第一步：安装 OpenClaw

> 根据你的情况选择合适的安装方式，大约 10 分钟完成

- [零基础照着做（从这里开始！）](/tutorials/getting-started/grandma-guide) ← 最慢、最稳、最少术语
- [快速开始（先跑通控制 UI）](/tutorials/getting-started/getting-started)
- [安装 OpenClaw](/tutorials/installation/)（一键脚本、npm、Docker 等）
- [命令行向导安装指南](/tutorials/getting-started/wizard)（跨平台，支持 Windows/Linux/macOS）

### 第二步：打开控制 UI

> 控制 UI 就是浏览器里的控制面板。先在这里确认 AI 能回复，再接聊天软件。

- [Web 控制 UI](/tutorials/web/)
- [网关使用指南](/tutorials/gateway/)
- [团队部署：身份、角色与共享边界](/tutorials/getting-started/teams)

### 第三步：连接你的聊天软件

> 通道就是聊天入口。让 AI 能在 Telegram、WhatsApp 等 App 里接收和回复消息。

- [接入 Telegram（推荐新手，最简单）](/tutorials/channels/telegram)
- [所有通道一览](/tutorials/channels/)

### 第四步：选择 AI 大脑

> Provider 就是 AI 大脑从哪来。先选一个能稳定使用的，不要第一天就配置一堆。

- [选择 AI 模型（提供商）](/tutorials/providers/)

---

## 所有教程分类

<div class="oc-portal">
<div class="oc-portal-grid">

<section class="oc-track">
<h2 class="oc-track-title">快速入门</h2>
<p>从零开始，先打开控制 UI，完成第一次对话；完全不懂术语也能照着做。</p>
<div class="oc-links">
<a href="/tutorials/getting-started/grandma-guide">零基础照着做</a>
<a href="/tutorials/getting-started/getting-started">快速开始（先跑通控制 UI）</a>
<a href="/tutorials/installation/">安装 OpenClaw</a>
<a href="/tutorials/getting-started/wizard">命令行向导安装</a>
<a href="/tutorials/getting-started/setup">安装后配置与常见问题</a>
<a href="/tutorials/getting-started/onboarding-overview">Onboarding 流程总览</a>
<a href="/tutorials/getting-started/wizard-cli-reference">向导 CLI 命令参考</a>
<a href="/tutorials/getting-started/wizard-cli-automation">向导自动化配置</a>
<a href="/tutorials/getting-started/hubs">Hubs 多节点管理</a>
<a href="/tutorials/getting-started/openclaw">关于 OpenClaw</a>
<a href="/tutorials/getting-started/teams">团队部署与用户权限</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">安装部署</h2>
<p>先用一键脚本装好；Docker、云服务器这些等你跑通以后再看。</p>
<div class="oc-links">
<a href="/tutorials/installation/">安装总览</a>
<a href="/tutorials/installation/node">安装 Node.js</a>
<a href="/tutorials/installation/docker">Docker 部署</a>
<a href="/tutorials/installation/updating">如何更新</a>
<a href="/tutorials/installation/backups">备份与恢复</a>
<a href="/tutorials/installation/daytona">Daytona 云沙箱</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">网关（AI 指挥部）</h2>
<p>Gateway 是总服务台。它开着，聊天入口和控制面板才找得到 AI。</p>
<div class="oc-links">
<a href="/tutorials/gateway/">网关使用指南</a>
<a href="/tutorials/gateway/background-process">后台运行</a>
<a href="/tutorials/gateway/health">健康检查</a>
<a href="/tutorials/gateway/doctor">自动诊断</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">Web 控制 UI</h2>
<p>浏览器里的聊天和管理面板，新手最推荐先从这里验证。</p>
<div class="oc-links">
<a href="/tutorials/web/">Web 控制 UI 入门</a>
<a href="/tutorials/gateway/">Gateway 与控制 UI</a>
<a href="/tutorials/gateway/tailscale">Tailscale 远程访问</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">连接聊天软件</h2>
<p>Telegram（推荐）、WhatsApp、Discord、Slack、飞书、WeChat、QQ 等。</p>
<div class="oc-links">
<a href="/tutorials/channels/">通道总览</a>
<a href="/tutorials/channels/telegram">Telegram（推荐）</a>
<a href="/tutorials/channels/discord">Discord</a>
<a href="/tutorials/channels/feishu">飞书</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">节点（手机/远程设备）</h2>
<p>节点就是外接设备，比如手机、Mac、远程机器。先会用 Gateway，再接节点。</p>
<div class="oc-links">
<a href="/tutorials/nodes/">节点入门</a>
<a href="/tutorials/tools/canvas">Canvas 工具</a>
<a href="/tutorials/channels/pairing">配对与安全</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">AI 模型选择</h2>
<p>Provider 是 AI 大脑来源。第一次只选一个能用的，后面随时能换。</p>
<div class="oc-links">
<a href="/tutorials/providers/">模型提供商总览</a>
<a href="/tutorials/providers/anthropic">Anthropic (Claude)</a>
<a href="/tutorials/providers/openai">OpenAI (ChatGPT)</a>
<a href="/tutorials/providers/ollama">Ollama（本地免费）</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">核心概念（扩展阅读）</h2>
<p>想知道“消息从哪里进、答案从哪里出”，再读这里。</p>
<div class="oc-links">
<a href="/tutorials/concepts/architecture">OpenClaw 是怎么工作的</a>
<a href="/tutorials/concepts/features">功能特性</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">工具系统</h2>
<p>工具就是 AI 的手。能查网页、跑命令、看文件，但权限要管好。</p>
<div class="oc-links">
<a href="/tutorials/tools/">工具系统总览</a>
<a href="/tutorials/tools/browser">浏览器工具</a>
<a href="/tutorials/tools/exec">执行命令</a>
<a href="/tutorials/tools/skills">技能系统</a>
<a href="/tutorials/tools/subagents">子智能体</a>
<a href="/tutorials/tools/web">网络搜索</a>
<a href="/tutorials/tools/mcp">连接 MCP Server</a>
<a href="/tutorials/tools/show-widget">Show Widget</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">插件专题</h2>
<p>插件像安装包。普通使用者先知道怎么查看、启用和关闭；开发者再看 Manifest 和 SDK。</p>
<div class="oc-links">
<a href="/tutorials/plugins/">插件专题总览</a>
<a href="/tutorials/plugins/architecture">插件架构</a>
<a href="/tutorials/plugins/manifest">插件 Manifest</a>
<a href="/tutorials/plugins/building-plugins">构建插件</a>
<a href="/tutorials/plugins/reference/visitor-access">访客访问插件</a>
<a href="/tutorials/plugins/sdk-overview">SDK 总览</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">CLI 命令</h2>
<p>不会背命令也能排查：安装、网关、通道、备份、任务、安全。</p>
<div class="oc-links">
<a href="/tutorials/cli/">CLI 命令专题</a>
<a href="/tutorials/cli/common-commands">常用命令</a>
<a href="/tutorials/cli/gateway-service">Gateway 命令</a>
<a href="/tutorials/cli/security-secrets">安全和密钥命令</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">参考资料</h2>
<p>放一些查字典用的进阶资料。新手不用从这里开始。</p>
<div class="oc-links">
<a href="/tutorials/reference/">参考资料专题</a>
<a href="/tutorials/reference/costs-usage">费用和用量</a>
<a href="/tutorials/reference/secretref-credential-surface">SecretRef 凭据面</a>
<a href="/tutorials/reference/prompt-caching">提示词缓存</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">平台支持</h2>
<p>macOS、Windows、Linux、iOS、Android、VPS 和 Raspberry Pi 怎么选。</p>
<div class="oc-links">
<a href="/tutorials/platforms/">平台支持总览</a>
<a href="/tutorials/platforms/macos">macOS</a>
<a href="/tutorials/platforms/windows">Windows</a>
<a href="/tutorials/platforms/linux">Linux</a>
<a href="/tutorials/platforms/chromeos">ChromeOS</a>
<a href="/tutorials/platforms/raspberry-pi">Raspberry Pi</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">诊断与计划</h2>
<p>出问题时看诊断；想跟官方架构演进时看计划。</p>
<div class="oc-links">
<a href="/tutorials/diagnostics/">诊断专题</a>
<a href="/tutorials/diagnostics/flags">诊断 Flags</a>
<a href="/tutorials/plan/">架构计划</a>
<a href="/tutorials/plan/ui-channels">Channel UI 计划</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">自动化</h2>
<p>Hooks 事件钩子、Cron 定时任务、Webhook 外部触发。</p>
<div class="oc-links">
<a href="/tutorials/automation/">自动化总览</a>
<a href="/tutorials/automation/hooks">Hooks 事件钩子</a>
<a href="/tutorials/automation/cron-jobs">Cron 定时任务</a>
<a href="/tutorials/automation/webhook">Webhook 外部触发</a>
<a href="/tutorials/automation/cron-vs-heartbeat">Cron vs Heartbeat</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">帮助与故障排查</h2>
<p>FAQ、调试指南、常见问题排查、环境变量说明。</p>
<div class="oc-links">
<a href="/tutorials/help/">帮助中心</a>
<a href="/tutorials/help/faq">常见问题 FAQ</a>
<a href="/tutorials/help/troubleshooting">故障排查</a>
<a href="/tutorials/help/debugging">调试指南</a>
<a href="/tutorials/help/environment">环境变量</a>
</div>
</section>

</div>
</div>

---

> 遇到看不懂的词？ 去[系统架构说明](/tutorials/concepts/architecture)页面，里面有通俗的解释。
>
> 遇到问题解决不了？ 先跑 `openclaw doctor` 自动诊断，或查看[故障排查指南](/tutorials/help/troubleshooting)，也可以在 [GitHub Issues](https://github.com/openclaw/openclaw/issues) 提问，附上诊断输出内容。
