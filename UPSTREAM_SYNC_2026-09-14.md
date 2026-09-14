# OpenClaw upstream 文档同步报告（2026-09-14）

## 基线与范围

- 当前 worktree 起点：detached HEAD `b20b814db24b4aac18a8ba4526d0d5bba2ab66c8`，初始工作树干净。
- 先恢复 2026-08-31 已完成并验证、但未进入该 worktree 的中文选择性同步基线：208 个工作区路径（不含当时的报告文件）。
- 上次自动化时间点前的官方提交：`6f10a208ec7bdb720eba4528d07caa4054bf7d8f`。
- 交付前官方 `openclaw/openclaw` `main`：`d72c1be4067b61488c4d58f4bfd840ab99de081c`（2026-09-14 01:37:13 -0700）。
- 此区间 `docs/` 共 1059 个变化路径。上游进行了大规模页面拆分和信息架构调整；本站没有机械覆盖中文重写页，只融合影响安装、初始化、模型选择、技能和插件运维的当前契约。

## 本轮融合内容

1. **Node 支持线**：统一改为 Node `24.16+` 或 `26.1+`（推荐 26.1+），明确 Node 22、23、25 不再支持；补 CLI 私有 Node 发现/安装边界、SQLite 能力检查和 Alpine/musl 限制。
2. **首次启动**：主要新手入口改为 `openclaw onboard` 的 Quick start。它先发现并真实验证 AI 访问，以前台 Gateway 打开 Dashboard；验证后再用 `openclaw gateway install` 安装后台服务。保留服务器、Bun 和明确 classic 场景中的 `--install-daemon` 用法。
3. **模型与媒体**：新增 GPT-6 Astra 的认证/运行时边界，升级 Meta 默认模型到 Muse Spark 1.3，更新 Tencent Hy4 preview、xAI Grok 4.6 默认值，以及 OpenAI/fal GPT Image 2.5 Flare/Sunburst。
4. **Skills**：重写技能总览，修正技能目录与优先级，补 ClawHub 搜索/安装/验证、Agent 作用域、共享库、Workshop 与供应链边界；移除已不存在的 `skills validate/show` 口径。
5. **插件热重载**：移除“插件变化后一律重启 Gateway”的旧说法，改为受支持流程自动刷新、源码/manifest 变更使用 `plugins reload`，仅在 restart policy 或明确诊断要求时完整重启。
6. **目录清理**：Provider 索引移除上游已删除的 Inferrs 入口，更新 Meta / Tencent 说明。

## 本轮直接修改的 43 篇页面

- `docs/tutorials/cli/{common-commands,index,onboard,plugins,setup,skills}.md`
- `docs/tutorials/concepts/model-providers.md`
- `docs/tutorials/diagnostics/node-issue.md`
- `docs/tutorials/gateway/{doctor,security/index}.md`
- `docs/tutorials/getting-started/{getting-started,grandma-guide,hubs,onboarding-overview,onboarding,quickstart,setup,wizard-cli-reference,wizard}.md`
- `docs/tutorials/help/{index,troubleshooting}.md`
- `docs/tutorials/installation/{index,installer,node}.md`
- `docs/tutorials/platforms/{chromeos,digitalocean,index,windows}.md`
- `docs/tutorials/platforms/mac/{bundled-gateway,dev-setup,signing}.md`
- `docs/tutorials/plugins/manage-plugins.md`
- `docs/tutorials/providers/{custom,index,meta,openai,tencent,xai}.md`
- `docs/tutorials/tools/{ask-user,creating-skills,image-generation,skills,skills-config}.md`

## 上游来源

- `docs/install/{index,node,installer}.md`
- `docs/start/{getting-started,wizard}.md`、`docs/cli/onboard.md`
- `docs/providers/{openai,meta,tencent,xai}.md` 及 `docs/providers/openai/*`
- `docs/tools/{skills,creating-skills,skill-workshop,ask-user,image-generation,plugin}.md`
- `docs/cli/{skills,plugins}.md`
- `docs/releases/2026.9.{1,2,3,4}.md`

## 验证结果

- `npm ci`：成功，按 lockfile 安装 257 个包；未改依赖版本。
- `npm run docs:build`：成功，VitePress 1.6.4，首次完整构建 20.06 秒。
- `npm run docs:audit-seo`：通过，832 个 HTML 页面与 832 个 sitemap URL。
- 代码块、行内代码与 HTML 注释感知的本地链接/资源扫描：检查 2180 项，0 断裂。
- 关键产物抽查：Node、Quick start、OpenAI、Skills 四个 HTML 均生成，并含本轮关键口径。
- `git diff --check`：通过。

## 剩余风险

- 上游 1059 个 docs 路径中包含大量拆页后的通道细节、Plugin SDK、CI、原生 App、Cloud Worker 和内部架构页面，本轮没有机械同步；后续继续按用户影响做增量融合。
- 未实际安装/运行 OpenClaw，也未用真实 Provider、Gateway、ClawHub 或 Skill Workshop 做端到端验证；当前验证覆盖文档一致性与站点构建。
- 构建仍有既有 `gitignore` 高亮 fallback 和大 chunk warning，不影响本轮页面生成。
- 当前累计工作树为 220 个路径（含本报告），其中绝大多数是恢复的 2026-08-31 已验证基线；未提交、未推送、未部署。
