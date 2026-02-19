import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function sortByPrefix(a: string, b: string): number {
  const pa = a.match(/^(\d+)/)
  const pb = b.match(/^(\d+)/)
  if (pa && pb) return Number(pa[1]) - Number(pb[1])
  if (pa) return -1
  if (pb) return 1
  return a.localeCompare(b, 'zh-Hans-CN')
}

/** 从 markdown 文件提取 H1 标题，失败时回退到文件名 */
function extractTitle(filePath: string, fallback: string): string {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const match = content.match(/^#\s+(.+)/m)
    if (match) {
      // 去掉开头的编号前缀如 "00 " "01 " "12 "
      return match[1].replace(/^\d+\s+/, '').trim()
    }
  } catch {}
  // 去掉文件名中的编号前缀
  return fallback.replace(/^\d+-/, '').trim()
}

interface SidebarItem {
  text: string
  link: string
}

function listMdItems(dir: string): SidebarItem[] {
  const abs = resolve(__dirname, '..', dir)
  const files = readdirSync(abs)
    .filter((f) => f.endsWith('.md') && f !== 'README.md' && f !== 'index.md')
    .sort(sortByPrefix)

  return files.map((f) => {
    const name = f.replace(/\.md$/, '')
    const title = extractTitle(resolve(abs, f), name)
    return {
      text: title,
      link: `/${dir}/${name}`,
    }
  })
}

/** 按编号范围过滤侧边栏项 */
function filterByRange(items: SidebarItem[], min: number, max: number): SidebarItem[] {
  return items.filter((item) => {
    const match = item.link.match(/\/(\d+)-/)
    if (!match) return false
    const num = Number(match[1])
    return num >= min && num <= max
  })
}

// 预加载所有项
const guideItems = listMdItems('beginner-openclaw-guide')
const frameworkItems = listMdItems('beginner-openclaw-framework-focus')

// 教程项
const tutGettingStarted = listMdItems('tutorials/getting-started')
// 快速入门核心 4 页（固定顺序）
const tutGettingStartedCore: SidebarItem[] = [
  { text: '快速开始（选安装方式）', link: '/tutorials/getting-started/getting-started' },
  { text: 'macOS App 首次启动', link: '/tutorials/getting-started/onboarding' },
  { text: '命令行向导安装', link: '/tutorials/getting-started/wizard' },
  { text: '安装后配置与常见问题', link: '/tutorials/getting-started/setup' },
]
// 快速入门进阶参考（排除核心 4 页）
const tutGettingStartedCoreLinks = new Set(tutGettingStartedCore.map((i) => i.link))
const tutGettingStartedExtra = tutGettingStarted.filter((i) => !tutGettingStartedCoreLinks.has(i.link))

const tutInstallation = listMdItems('tutorials/installation')
const tutGateway = listMdItems('tutorials/gateway')
const tutChannels = listMdItems('tutorials/channels')
const tutProvidersAll = listMdItems('tutorials/providers')
// 自定义提供商单独置于底部分组，从自动列表中排除避免重复
const tutProviders = tutProvidersAll.filter((i) => i.link !== '/tutorials/providers/custom')
const tutProvidersCustom: SidebarItem[] = [
  { text: '自定义模型提供商', link: '/tutorials/providers/custom' },
]
const tutConcepts = listMdItems('tutorials/concepts')

export default withMermaid(defineConfig({
  lang: 'zh-CN',
  title: 'OpenClaw 源码剖析与指南',
  titleTemplate: ':title | OpenClaw Docs',
  description: '面向小白与开发者的 OpenClaw 实现剖析文档',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  head: [
    ['meta', { name: 'author', content: 'OpenClaw' }],
    ['meta', { name: 'robots', content: 'index, follow, max-image-preview:large' }],
    ['meta', { name: 'theme-color', content: '#161412' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { property: 'og:title', content: 'OpenClaw 源码剖析与指南' }],
    ['meta', { property: 'og:description', content: '面向小白与开发者的 OpenClaw 实现剖析文档，覆盖智能体框架、通道适配器、上下文管理与状态机。' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'OpenClaw 源码剖析与指南' }],
    ['meta', { name: 'twitter:description', content: '从 0 到 1 拆解 OpenClaw 核心实现，帮助开发者快速复刻同类项目。' }],
  ],
  themeConfig: {
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除查询',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '教程', link: '/tutorials/' },
      { text: '项目拆解', link: '/beginner-openclaw-guide/' },
      { text: '重点框架', link: '/beginner-openclaw-framework-focus/' },
    ],
    sidebar: {
      '/tutorials/getting-started/': [
        {
          text: '导航',
          items: [{ text: '教程中心', link: '/tutorials/' }],
        },
        {
          text: '新手必读',
          collapsed: false,
          items: tutGettingStartedCore,
        },
        {
          text: '进阶参考',
          collapsed: true,
          items: tutGettingStartedExtra,
        },
      ],
      '/tutorials/installation/': [
        {
          text: '安装部署',
          items: [
            { text: '教程中心', link: '/tutorials/' },
            ...tutInstallation,
          ],
        },
      ],
      '/tutorials/gateway/': [
        {
          text: '网关配置与运维',
          items: [
            { text: '教程中心', link: '/tutorials/' },
            ...tutGateway,
          ],
        },
      ],
      '/tutorials/channels/': [
        {
          text: '通道接入',
          items: [
            { text: '教程中心', link: '/tutorials/' },
            ...tutChannels,
          ],
        },
      ],
      '/tutorials/providers/': [
        {
          text: '模型 Provider',
          items: [
            { text: '教程中心', link: '/tutorials/' },
            ...tutProviders,
          ],
        },
        {
          text: '自定义接入',
          collapsed: false,
          items: tutProvidersCustom,
        },
      ],
      '/tutorials/concepts/': [
        {
          text: '核心概念',
          items: [
            { text: '教程中心', link: '/tutorials/' },
            ...tutConcepts,
          ],
        },
      ],
      '/beginner-openclaw-guide/': [
        {
          text: '导航台',
          items: [{ text: '项目完整拆解导航', link: '/beginner-openclaw-guide/' }],
        },
        {
          text: '阶段一 · 全局认知',
          collapsed: false,
          items: filterByRange(guideItems, 0, 6),
        },
        {
          text: '阶段二 · 模型与扩展',
          collapsed: true,
          items: filterByRange(guideItems, 7, 11),
        },
        {
          text: '阶段三 · 智能体框架',
          collapsed: true,
          items: filterByRange(guideItems, 12, 26),
        },
        {
          text: '阶段四 · Gateway 控制平面',
          collapsed: true,
          items: filterByRange(guideItems, 27, 42),
        },
        {
          text: '阶段五 · 复刻与补齐',
          collapsed: true,
          items: filterByRange(guideItems, 43, 99),
        },
      ],
      '/beginner-openclaw-framework-focus/': [
        {
          text: '导航台',
          items: [{ text: 'AI 核心框架导航', link: '/beginner-openclaw-framework-focus/' }],
        },
        {
          text: '框架总览与路线',
          collapsed: false,
          items: filterByRange(frameworkItems, 0, 6),
        },
        {
          text: 'AI 原理系列',
          collapsed: true,
          items: filterByRange(frameworkItems, 7, 15),
        },
        {
          text: '实战系列',
          collapsed: true,
          items: filterByRange(frameworkItems, 16, 21),
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/openclaw/openclaw' },
    ],
    darkModeSwitchLabel: '主题',
    darkModeSwitchTitle: '切换暗色模式',
    lightModeSwitchTitle: '切换亮色模式',
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
    footer: {
      message: '用工程视角拆解 AI 智能体框架',
      copyright: 'OpenClaw Implementation Guide',
    },
    outline: {
      label: '页面目录',
      level: [2, 3],
    },
    returnToTopLabel: '回到顶部',
    lastUpdated: {
      text: '最后更新',
    },
  },
  mermaid: {
    theme: 'default',
  },
}))
