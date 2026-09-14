---
title: "工具系统"
sidebarTitle: "工具系统"
---

# 工具系统

模型负责“想”，工具负责“做”。
如果没有工具，AI 只能在聊天框里回答；有了工具，它就可以查网页、打开浏览器、读写文件、运行命令、生成图片，甚至让手机或桌面节点帮它拍照、录屏、打开画布。

你可以把工具理解成给 AI 配的一套家用电器：浏览器像电视，命令行像工具箱，节点像远程遥控器。AI 不能随便乱碰，OpenClaw 会通过权限、审批和配置来约束它。

---

## 新手先知道这 4 点

1. 工具不是聊天内容，而是动作能力。
   AI 回答“我建议你运行测试”是一句话；AI 真的运行测试，就是用了工具。

2. 工具越强，越要审批。
   查网页风险低，运行命令、读写文件风险高。

3. 先用默认权限。
   不知道某个开关是什么意思时，不要急着放大权限。

4. 出问题先看日志和审批记录。
   很多“AI 没做事”，其实是工具没开、权限没给、或等待你批准。

---

## 常见工具

| 工具 | 能做什么 | 适合场景 |
|------|----------|----------|
| [Browser 浏览器](/tutorials/tools/browser) | 打开网页、点击按钮、读取页面 | 登录后台、网页自动化、检查页面 |
| [Browser Control API](/tutorials/tools/browser-control) | 本地脚本控制浏览器 | 高级调试、内部集成 |
| [Web 网络工具](/tutorials/tools/web) | 搜索网页、抓取内容 | 查资料、读文档、做调研 |
| [Web Fetch](/tutorials/tools/web-fetch) | 读取一个网页正文 | 已知 URL 的内容提取 |
| [Exec 命令工具](/tutorials/tools/exec) | 在允许范围内运行命令 | 构建项目、跑测试、查看日志 |
| [Secrets 工具](/tutorials/tools/secrets) | 通过遮罩输入安全保存凭据 | Agent 需要 API Key，但不能让密钥进入聊天 |
| [Code Execution](/tutorials/tools/code-execution) | 远程 Python 沙盒分析 | 计算、统计、表格分析 |
| [PDF 分析](/tutorials/tools/pdf) | 阅读 PDF 文件 | 合同、论文、说明书 |
| [Canvas 画布](/tutorials/tools/canvas) | 在节点上打开可视化界面 | 手机/桌面交互、远程画布 |
| [Image Generate 图像生成](/tutorials/tools/image-generate) | 生成图片 | 配图、草图、视觉素材 |
| [Loop Detection 循环检测](/tutorials/tools/loop-detection) | 发现无意义重复 | 防止 Agent 卡住反复调用 |
| [Goal 会话目标](/tutorials/tools/goal) | 固定当前会话目标 | 长任务、PR 收尾、文档更新 |
| [MCP](/tutorials/tools/mcp) | 接入第三方工具、资源和 Prompt | 公司系统、外部工具服务 |
| [Ask User](/tutorials/tools/ask-user) | 等待用户做结构化决定 | 纯偏好、不可替用户决定的选择 |
| [Show Widget](/tutorials/tools/show-widget) | 渲染隔离的 HTML/SVG 结果 | 交互卡片、仪表盘、可视化 |
| [权限模式](/tutorials/tools/permission-modes) | 控制命令和写入审批 | 调整 Agent 主机权限 |

---

## 扩展能力

这些能力不一定像“一个按钮”那样好理解，但很实用。
如果你是第一次使用，可以先跳过这一节，等常见工具用顺了再回来。

- [技能 Skills](/tutorials/tools/skills)：给 Agent 加一份专门说明书，比如“写周报时按这个格式”
- [创建技能](/tutorials/tools/creating-skills)：把经验沉淀成可复用能力
- [Skill Workshop](/tutorials/tools/skill-workshop)：用提案和审批流程创建或更新 workspace skill
- [子智能体 Subagents](/tutorials/tools/subagents)：把一个大任务拆给多个 Agent
- [Swarm](/tutorials/tools/swarm)：在 Code Mode 中并发编排 Collector 子智能体
- [Code Mode](/tutorials/reference/code-mode)：按模型开启代码编排，区分等待、输出截断和失败恢复
- [斜杠命令](/tutorials/tools/slash-commands)：用短命令触发固定动作
- [BTW 临时问题](/tutorials/tools/btw)：问旁支问题，不污染主会话
- [Steer 引导](/tutorials/tools/steer)：Agent 正忙时轻轻纠偏
- [ACP Agents](/tutorials/tools/acp-agents)：把外部编码 harness 接进 OpenClaw
- [ACP 设置](/tutorials/tools/acp-agents-setup)：配置 acpx、权限和外部 CLI
- [Agent Send CLI](/tutorials/tools/agent-send)：从命令行把消息发给 Agent
- [ClawHub](/tutorials/tools/clawhub)：搜索、安装、更新和发布 ClawHub 技能/插件
- [Parallel Search](/tutorials/tools/parallel-search)：免 Key 或付费的 LLM 友好网页搜索
- [插件专题](/tutorials/plugins/)：通过 `openclaw.plugin.json` 声明和注册新能力
- [Tokenjuice](/tutorials/tools/tokenjuice)：压短 noisy 命令输出
- [轨迹导出](/tutorials/tools/trajectory)：导出会话飞行记录
- [Diffs 差异视图](/tutorials/tools/diffs)：把修改内容渲染成对比视图
- [添加能力 Cookbook](/tutorials/tools/capability-cookbook)：核心贡献者添加新能力的路线图

---

## 媒体工具

- [媒体能力总览](/tutorials/tools/media-overview)
- [图像生成](/tutorials/tools/image-generation)
- [视频生成](/tutorials/tools/video-generation)
- [音乐生成](/tutorials/tools/music-generation)
- [TTS 文字转语音](/tutorials/tools/tts)

---

## 搜索提供商

`web_search` 可以接多个搜索提供商：

- [Brave Search](/tutorials/tools/brave-search)
- [Exa Search](/tutorials/tools/exa-search)
- [Perplexity Search](/tutorials/tools/perplexity-search)
- [Gemini Search](/tutorials/tools/gemini-search)
- [MiniMax Search](/tutorials/tools/minimax-search)
- [Grok Search](/tutorials/tools/grok-search)
- [Kimi Search](/tutorials/tools/kimi-search)
- [Tavily](/tutorials/tools/tavily)
- [DuckDuckGo Search](/tutorials/tools/duckduckgo-search)
- [Ollama Web Search](/tutorials/tools/ollama-search)
- [SearXNG Search](/tutorials/tools/searxng-search)
- [Firecrawl](/tutorials/tools/firecrawl)
- [Parallel Search](/tutorials/tools/parallel-search)

---

## 节点带来的工具

新版 OpenClaw 里，节点承担外部设备能力接入。
节点可以是手机、桌面应用，也可以是远程机器。它们会连到网关，然后把自己的能力交给网关调度。

也就是说：手机不是另一个 OpenClaw 总服务台，它只是把相机、Canvas、语音这些能力借给 Gateway 使用。

节点可能提供这些能力：

- 摄像头：拍照或读取画面
- 录屏：记录屏幕片段
- 位置：读取设备位置
- Canvas：打开交互式界面
- 音频：语音输入或播放

先看 [节点总览](/tutorials/nodes/)，再看 [Canvas 工具](/tutorials/tools/canvas) 会更容易理解。

---

## 安全原则

工具越强，越要管好。

尤其是 `exec` 这类命令工具，能读文件、跑脚本、启动程序。它很有用，但不应该无条件放开。

建议：

- 新手先使用默认策略
- 不熟悉的工具先不要开启太大权限
- 需要运行命令时，优先看 [执行审批](/tutorials/tools/exec-approvals)
- 远程网关不要暴露在公网裸奔
- 团队环境要记录谁触发了什么工具

::: tip 一句话记住
工具不是越多越好，而是“够用、可控、能追踪”最好。
:::

---

## 插件和工具是什么关系

插件像“安装包”，工具像“安装包提供出来的功能”。

比如一个插件安装后，可能提供一个“查公司订单”的工具。
插件负责把能力接进来，工具负责真正执行那件事。

一个插件可以提供：

- 新频道，比如某个聊天平台
- 新工具，比如一个公司内部查询工具
- 新命令，比如 `/deploy`
- 新的配置页面或元数据

新版 OpenClaw 使用 manifest-first 的插件方式：先读 `openclaw.plugin.json`，知道插件叫什么、提供什么能力、需要什么权限，再决定是否加载运行时代码。

详细解释看 [插件专题](/tutorials/plugins/)。

---

## 从哪里继续

- 想让 Agent 操作网页：看 [浏览器工具](/tutorials/tools/browser)
- 想让 Agent 跑命令：看 [Exec 命令工具](/tutorials/tools/exec)
- 想控制命令权限：看 [执行审批](/tutorials/tools/exec-approvals)
- 想做图片、视频、语音：看 [媒体能力总览](/tutorials/tools/media-overview)
- 想扩展 OpenClaw：看 [插件专题](/tutorials/plugins/)
- 想接入第三方 MCP Server：看 [MCP 连接指南](/tutorials/tools/mcp)
- 想让手机或桌面设备参与：看 [节点](/tutorials/nodes/)
