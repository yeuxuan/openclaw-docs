# 项目完整拆解导航台

<div class="oc-portal">
<h1 class="oc-portal-title">先拿全局，再进细节</h1>
<p class="oc-portal-desc">这条主线帮助你建立 OpenClaw 的整体工程脑图：从入口、执行链路、控制面到关键函数级实现。建议按从上到下顺序阅读，每完成一阶段就动手做最小实现。</p>

<div class="oc-portal-grid">

<section class="oc-track">
<h2 class="oc-track-title">阶段一 · 建立全局认知</h2>
<p>先搞清模块边界、系统结构和主流程，建立可靠的工程心智模型。</p>
<div class="oc-links">
<a href="/beginner-openclaw-guide/README">阅读总览</a>
<a href="/beginner-openclaw-guide/00-学习路线与阅读地图">学习路线与阅读地图</a>
<a href="/beginner-openclaw-guide/03-Gateway运行时编排">Gateway 运行时编排</a>
<a href="/beginner-openclaw-guide/04-通道适配器框架与账号生命周期">通道适配器框架（重点）</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">阶段二 · 吃透 AI 执行主链</h2>
<p>围绕 run / attempt / subscribe 形成可复刻的智能体执行链路。</p>
<div class="oc-links">
<a href="/beginner-openclaw-guide/12-智能体框架总览">智能体框架总览</a>
<a href="/beginner-openclaw-guide/13-runEmbeddedPiAgent运行链路">runEmbeddedPiAgent 运行链路</a>
<a href="/beginner-openclaw-guide/22-函数级剖析-runEmbeddedAttempt">函数级剖析 runEmbeddedAttempt</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">阶段三 · 掌握控制面</h2>
<p>理解网关 RPC、方法分发、审批机制与运行时配置。</p>
<div class="oc-links">
<a href="/beginner-openclaw-guide/27-Gateway控制平面总览">Gateway 控制平面总览</a>
<a href="/beginner-openclaw-guide/29-函数级剖析-方法鉴权与请求分发">方法鉴权与请求分发</a>
<a href="/beginner-openclaw-guide/52-函数级剖析-exec-approval-manager">exec 审批管理器剖析</a>
</div>
</section>

<section class="oc-track">
<h2 class="oc-track-title">阶段四 · 按清单复刻项目</h2>
<p>从文档走向代码，把核心能力按模块粒度逐步实现。</p>
<div class="oc-links">
<a href="/beginner-openclaw-guide/43-复刻项目实操清单-网关与智能体版">复刻项目实操清单</a>
<a href="/beginner-openclaw-guide/44-核心重点功能标记与遗漏补齐">核心重点功能标记</a>
<a href="/beginner-openclaw-guide/53-函数级剖析-通道适配器框架实现">函数级剖析：通道适配器框架</a>
</div>
</section>

</div>

<div class="oc-focus"><strong>建议节奏：</strong>每看完一个阶段，立刻做最小实现并自测一次，再进入下一阶段。这样能确保每一步理解都扎实落地。</div>
</div>
