# OpenClaw 中文文档 | 保姆级教程 · 源码剖析 · AI 智能体框架

> **OpenClaw** 是自托管的多通道 AI 助手平台，通过 Gateway 统一连接 Web 控制 UI、聊天通道、节点、工具和模型。本仓库是面向中文读者的教程站，目标是把官方最新架构讲到足够清楚：先让新手能跑起来，再带开发者看懂源码。

[![在线文档](https://img.shields.io/badge/在线阅读-openclaw--docs.dx3n.cn-4fc08d?logo=readthedocs&logoColor=white)](https://openclaw-docs.dx3n.cn)
[![VitePress](https://img.shields.io/badge/Built%20with-VitePress-646cff?logo=vite&logoColor=white)](https://vitepress.dev)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Azure](https://img.shields.io/badge/Deployed%20on-Azure%20Static%20Web%20Apps-0078d4?logo=microsoftazure)](https://openclaw-docs.dx3n.cn)

**[📖 立即在线阅读 → openclaw-docs.dx3n.cn](https://openclaw-docs.dx3n.cn)**

---

## 📚 文档覆盖范围

本文档站包含 **767 篇**中文教程，分为 4 条学习主线：

| 主线 | 内容覆盖 | 篇数 | 链接 |
|---|---|---|---|
| **Track 0** 安装教程 | 零基础照着做、快速安装、onboard、Web 控制 UI、节点、AI 服务商接入、通道接入、Gateway 运维、常见问题排查 | 680 篇 | [→ 教程中心](https://openclaw-docs.dx3n.cn/tutorials/) |
| **Track A** 完整工程主线 | CLI 启动框架、Gateway 控制平面、插件与通道适配器、节点、路由与会话键、Agent 执行链路、函数级源码剖析 | 62 篇 | [→ 工程主线](https://openclaw-docs.dx3n.cn/beginner-openclaw-guide/) |
| **Track B** AI 核心框架 | 上下文工程、Agent 状态机、工具策略与审批、模型回退、记忆系统、Hook 插件注入机制 | 24 篇 | [→ AI 框架](https://openclaw-docs.dx3n.cn/beginner-openclaw-framework-focus/) |
| **Track C** 通道适配器 | 接口合同、注册链路、账号生命周期、入站路由、出站发送解耦 | 含于 Track A | [→ 适配器索引](https://openclaw-docs.dx3n.cn/beginner-openclaw-guide/59-%E9%80%9A%E9%81%93%E9%80%82%E9%85%8D%E5%99%A8%E5%AE%9E%E7%8E%B0%E7%B4%A2%E5%BC%95) |

---

## 🤖 OpenClaw 是什么？

**OpenClaw** 是一款开源的个人 AI 助手平台，让你的 AI 助手运行在你自己的电脑或服务器上，并通过浏览器、聊天软件和移动节点为你工作。

### 支持的聊天平台

WhatsApp · Telegram · Discord · Slack · Signal · iMessage / BlueBubbles · 飞书（Feishu） · Mattermost · Google Chat · Microsoft Teams · Matrix · LINE · Zalo · QQ · WeChat · IRC · Nostr · Twitch · WebChat

### 支持的 AI 模型

Anthropic Claude · OpenAI GPT · DeepSeek · 通义千问（Qwen） · Kimi（月之暗面） · 智谱 GLM · MiniMax · Ollama（本地大模型） · OpenRouter · LiteLLM · Cloudflare AI Gateway · Vercel AI Gateway · NVIDIA · Together AI · HuggingFace · vLLM · SGLang

---

## 🚀 快速开始（本地运行文档站）

```bash
git clone https://github.com/yeuxuan/openclaw-docs.git
cd openclaw-docs
npm install
npm run docs:dev
```

打开终端输出的本地地址即可预览完整文档站。

```bash
npm run docs:build    # 构建静态产物到 docs/.vitepress/dist/
npm run docs:preview  # 本地预览构建结果
```

---

## 📁 仓库结构

```
openclaw-docs/
├── docs/
│   ├── index.md                            # 首页
│   ├── tutorials/                          # Track 0：安装教程（680 篇）
│   │   ├── getting-started/                #   快速入门与向导安装
│   │   ├── installation/                   #   Docker / Node / 云服务器部署
│   │   ├── gateway/                        #   Gateway 配置与运维
│   │   ├── channels/                       #   通道接入（Telegram/WhatsApp/Discord 等）
│   │   ├── providers/                      #   AI 模型 Provider 配置
│   │   ├── concepts/                       #   核心概念（上下文/记忆/状态机等）
│   │   ├── tools/                          #   工具系统（浏览器/执行/技能/子智能体）
│   │   ├── plugins/                        #   插件专题（Manifest/SDK/Hooks/扩展）
│   │   ├── cli/                            #   CLI 命令专题
│   │   ├── reference/                      #   参考资料专题
│   │   ├── platforms/                      #   平台支持（macOS/Windows/Linux/移动端/VPS）
│   │   ├── diagnostics/                    #   诊断专题
│   │   ├── plan/                           #   架构计划与维护者设计草案
│   │   ├── web/                            #   Web 控制 UI
│   │   ├── nodes/                          #   移动节点与远程节点
│   │   ├── automation/                     #   自动化（Webhook/Cron/Poll）
│   │   └── help/                           #   故障排查与常见问题
│   ├── beginner-openclaw-guide/            # Track A：完整工程主线（62 篇）
│   └── beginner-openclaw-framework-focus/  # Track B：AI 核心框架（24 篇）
├── docs/.vitepress/
│   ├── config.mts                          # 站点配置（SEO / 导航 / 侧边栏）
│   └── theme/                             # 自定义主题与样式
└── scripts/
    ├── convert-mdx.mjs                     # MDX → VitePress Markdown 批量转换
    └── ping-indexnow.mjs                   # 构建后自动推送 URL 到 Bing IndexNow
```

---

## ✨ 文档特点

- **函数级精度**：关键模块精确到具体函数的源码入口与调用链路
- **保姆级讲解**：先讲人话，再讲术语，零基础也能跟着跑起来
- **可直接复刻**：每个核心能力都给出落地步骤，可直接用于自己的项目
- **持续更新**：跟随 OpenClaw 版本迭代，覆盖最新 API 与配置方式
- **SEO 完备**：767 页独立 description、sitemap、IndexNow 自动推送

---

## 🔗 相关链接

- **OpenClaw 官方**：[github.com/openclaw](https://github.com/openclaw)
- **官方英文文档**：[docs.openclaw.ai](https://docs.openclaw.ai)
- **本站中文文档**：[openclaw-docs.dx3n.cn](https://openclaw-docs.dx3n.cn)
- **部署平台**：Azure Static Web Apps

---

## ⭐ Star History

[![Star History Chart](https://star-history.dera.page/svg?repos=yeuxuan/openclaw-docs&type=Date)](https://star-history.dera.page/#yeuxuan/openclaw-docs&Date)
