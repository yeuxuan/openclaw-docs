# OpenClaw 项目实现拆解（小白友好版）

<div class="oc-map">
<h1 class="oc-map-head">从 0 到 1 的完整实现学习地图</h1>
<p class="oc-map-sub">这套文档是“整项目复刻路线”。你按阶段阅读并动手实现，最终能做出一个同类系统，而不是只停留在概念理解。</p>
<div class="oc-map-grid">
<section class="oc-map-card">
<h3>阶段一：系统全景</h3>
<p>先建立 CLI、Gateway、Routing、Auto-reply 的整体认知。</p>
<div class="oc-chip-list">
<a href="/beginner-openclaw-guide/00-学习路线与阅读地图">00 学习路线图</a>
<a href="/beginner-openclaw-guide/01-CLI启动与命令框架">01 CLI 启动</a>
<a href="/beginner-openclaw-guide/03-Gateway运行时编排">03 Gateway 编排</a>
<a href="/beginner-openclaw-guide/04-通道适配器框架与账号生命周期">04 通道适配器框架（重点）</a>
</div>
</section>
<section class="oc-map-card">
<h3>阶段二：AI 执行主链</h3>
<p>重点吃透 run/attempt/subscribe、工具策略、回退与记忆。</p>
<div class="oc-chip-list">
<a href="/beginner-openclaw-guide/12-智能体框架总览">12 智能体框架总览</a>
<a href="/beginner-openclaw-guide/13-runEmbeddedPiAgent运行链路">13 runEmbeddedPiAgent</a>
<a href="/beginner-openclaw-guide/25-函数级剖析-agent-runner-execution">25 agent-runner-execution</a>
</div>
</section>
<section class="oc-map-card">
<h3>阶段三：控制平面与网关协议</h3>
<p>搞清连接、鉴权、方法分发、WS/HTTP 端点与生命周期管理。</p>
<div class="oc-chip-list">
<a href="/beginner-openclaw-guide/27-Gateway控制平面总览">27 控制平面总览</a>
<a href="/beginner-openclaw-guide/29-函数级剖析-方法鉴权与请求分发">29 方法鉴权</a>
<a href="/beginner-openclaw-guide/42-函数级剖析-协议帧与Schema验证">42 协议帧与 Schema</a>
</div>
</section>
<section class="oc-map-card">
<h3>阶段四：复刻落地</h3>
<p>把前面能力组合为可运行 MVP，并根据清单补齐稳定性能力。</p>
<div class="oc-chip-list">
<a href="/beginner-openclaw-guide/43-复刻项目实操清单-网关与智能体版">43 实操清单</a>
<a href="/beginner-openclaw-guide/44-核心重点功能标记与遗漏补齐">44 重点与遗漏补齐</a>
<a href="/beginner-openclaw-guide/52-函数级剖析-exec-approval-manager">52 exec 审批内核</a>
<a href="/beginner-openclaw-guide/53-函数级剖析-通道适配器框架实现">53 通道适配器函数级剖析</a>
</div>
</section>
</div>
<div class="oc-checklist">
<strong>建议执行方式：</strong>
<ul>
<li>每读完一个模块，立刻做一个最小实现并运行验证。</li>
<li>每完成一个阶段，回头写“我自己的实现版时序图”。</li>
<li>遇到不懂的点，优先对照函数级剖析章节定位源码入口。</li>
</ul>
</div>
</div>

## 全量章节索引

- 主入口：[项目完整拆解导航台](/beginner-openclaw-guide/)
- 全部章节：请直接使用左侧侧边栏按顺序阅读（已按序号自动排序）

## 重点并行阅读建议

- 配合专项框架版阅读：[/beginner-openclaw-framework-focus/](/beginner-openclaw-framework-focus/)
- 若你要优先攻克 AI 实现：建议先读 `12` 到 `26` 再回读控制平面章节
