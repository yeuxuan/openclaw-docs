# 教程中心

欢迎来到 OpenClaw 教程中心！这里的所有教程都尽量用最简单的语言写作，不管你是不是技术人员，都能跟着做。

## OpenClaw 是什么？

**OpenClaw 是一个运行在你自己电脑上的 AI 助手平台。**

> 想象这样的场景：你在 Telegram 里给你的 AI 助手发消息说"帮我查一下明天的天气"，然后它马上回复你。或者你在 WhatsApp 里说"帮我写一封邮件"，它就帮你写好了。

OpenClaw 把这些变成可能——它在你的电脑上持续运行，连接你的聊天软件，让 AI 助手随时待命。

---

## 新手从哪里开始？

**请按下面的顺序阅读，不要跳过：**

### 第一步：安装 OpenClaw

> 根据你的情况选择合适的安装方式，大约 10 分钟完成

- [**快速开始（从这里开始！）**](/tutorials/getting-started/getting-started) ← **先选安装方式**
- [macOS App 首次启动指南](/tutorials/getting-started/onboarding)（图形界面，仅 macOS）
- [命令行向导安装指南](/tutorials/getting-started/wizard)（跨平台，支持 Windows/Linux/macOS）

### 第二步：连接你的聊天软件

> 让 AI 能在 Telegram、WhatsApp 等 App 里接收和回复你的消息

- [接入 Telegram（推荐新手，最简单）](/tutorials/channels/telegram)
- [所有通道一览](/tutorials/channels/)

### 第三步：了解"网关"（让 AI 一直在线）

> 网关是 OpenClaw 的"心脏"，必须保持运行

- [网关使用指南](/tutorials/gateway/)

### 第四步：选择 AI 大脑

> 决定你的助手用 Claude、ChatGPT 还是其他 AI

- [选择 AI 模型（提供商）](/tutorials/providers/)

---

## 所有教程分类

<div class="oc-portal">
<div class="oc-portal-grid">

<section class="oc-track">
<h2 class="oc-track-title">快速入门</h2>
<p>从零开始，10 分钟内完成第一次对话。</p>
<div class="oc-links">
<a href="/tutorials/getting-started/getting-started">快速开始（选安装方式）</a>
<a href="/tutorials/getting-started/onboarding">macOS App 首次启动</a>
<a href="/tutorials/getting-started/wizard">命令行向导安装</a>
<a href="/tutorials/getting-started/setup">安装后配置与常见问题</a>
<a href="/tutorials/getting-started/onboarding-overview">Onboarding 流程总览</a>
<a href="/tutorials/getting-started/wizard-cli-reference">向导 CLI 命令参考</a>
<a href="/tutorials/getting-started/wizard-cli-automation">向导自动化配置</a>
<a href="/tutorials/getting-started/hubs">Hubs 多节点管理</a>
<a href="/tutorials/getting-started/openclaw">关于 OpenClaw</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">安装部署</h2>
<p>一键脚本、Docker、云服务器等多种安装方式。</p>
<div class="oc-links">
<a href="/tutorials/installation/">安装总览</a>
<a href="/tutorials/installation/node">安装 Node.js</a>
<a href="/tutorials/installation/docker">Docker 部署</a>
<a href="/tutorials/installation/updating">如何更新</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">网关（AI 指挥部）</h2>
<p>启动、管理、让 AI 助手一直在线。</p>
<div class="oc-links">
<a href="/tutorials/gateway/">网关使用指南</a>
<a href="/tutorials/gateway/background-process">后台运行</a>
<a href="/tutorials/gateway/health">健康检查</a>
<a href="/tutorials/gateway/doctor">自动诊断</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">连接聊天软件</h2>
<p>Telegram（推荐）、WhatsApp、Discord、Slack 等。</p>
<div class="oc-links">
<a href="/tutorials/channels/">通道总览</a>
<a href="/tutorials/channels/telegram">Telegram（推荐）</a>
<a href="/tutorials/channels/discord">Discord</a>
<a href="/tutorials/channels/feishu">飞书</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">AI 模型选择</h2>
<p>Claude、ChatGPT、本地模型等 20+ 选择。</p>
<div class="oc-links">
<a href="/tutorials/providers/">模型提供商总览</a>
<a href="/tutorials/providers/anthropic">Anthropic (Claude)</a>
<a href="/tutorials/providers/openai">OpenAI (ChatGPT)</a>
<a href="/tutorials/providers/ollama">Ollama（本地免费）</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">核心概念（扩展阅读）</h2>
<p>了解 OpenClaw 的工作原理。</p>
<div class="oc-links">
<a href="/tutorials/concepts/architecture">OpenClaw 是怎么工作的</a>
<a href="/tutorials/concepts/features">功能特性</a>
</div>
</section>

</div>
</div>

---

> **遇到看不懂的词？** 去[系统架构说明](/tutorials/concepts/architecture)页面，里面有通俗的解释。
>
> **遇到问题解决不了？** 先跑 `openclaw doctor` 自动诊断，或在 [GitHub Issues](https://github.com/openclaw/openclaw/issues) 提问，附上诊断输出内容。
