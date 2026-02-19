/**
 * OpenClaw Docs — VitePress Theme Entry
 *
 * 主要职责：
 *   1. 扩展 DefaultTheme，注入全局样式
 *   2. 为页面中所有 Mermaid 图表挂载点击缩放 Lightbox
 *
 * Lightbox 功能：
 *   · 滚轮 / 双指捏合缩放（以光标为中心）
 *   · 鼠标拖拽 / 单指平移
 *   · 双击 / F 键 适应屏幕
 *   · Esc / 点击背景 关闭
 *   · +/- 键步进缩放
 */
import DefaultTheme from 'vitepress/theme'
import { onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'
import './style.css'

// ─────────────────────────────────────────────────────────────────────────────
// Pan/Zoom State
// 单例 modal 使用模块级状态，无需在每次打开时重新分配
// ─────────────────────────────────────────────────────────────────────────────

const pz = { scale: 1, tx: 0, ty: 0 }
const drag = { active: false, moved: false, x: 0, y: 0 }

// ─────────────────────────────────────────────────────────────────────────────
// Pure Zoom Math
// ─────────────────────────────────────────────────────────────────────────────

function applyTransform(wrap: HTMLElement, scaleEl: HTMLElement) {
  wrap.style.transform = `translate(${pz.tx}px, ${pz.ty}px) scale(${pz.scale})`
  scaleEl.textContent   = `${Math.round(pz.scale * 100)}%`
}

/** 以画面坐标 (cx, cy) 为中心缩放 factor 倍，范围限制在 [0.08, 10] */
function zoomAt(
  cx: number, cy: number, factor: number,
  wrap: HTMLElement, scaleEl: HTMLElement,
) {
  const next = Math.min(Math.max(0.08, pz.scale * factor), 10)
  const r    = next / pz.scale
  pz.tx      = cx - (cx - pz.tx) * r
  pz.ty      = cy - (cy - pz.ty) * r
  pz.scale   = next
  applyTransform(wrap, scaleEl)
}

/** 读取 SVG 自然尺寸（优先 viewBox，回退 width/height 属性或 clientWidth） */
function getSvgSize(svg: SVGElement): { w: number; h: number } {
  const vb = svg.viewBox?.baseVal
  if (vb?.width > 0) return { w: vb.width, h: vb.height }
  return {
    w: parseFloat(svg.getAttribute('width')  ?? '0') || svg.clientWidth  || 800,
    h: parseFloat(svg.getAttribute('height') ?? '0') || svg.clientHeight || 600,
  }
}

/** 将图表缩放并居中至适应视口（最大初始比例 2.5×） */
function fitScreen(canvas: HTMLElement, wrap: HTMLElement, scaleEl: HTMLElement) {
  const svg = wrap.querySelector('svg') as SVGElement | null
  if (!svg) return
  const { w, h } = getSvgSize(svg)
  pz.scale = Math.min((canvas.clientWidth * 0.88) / w, (canvas.clientHeight * 0.80) / h, 2.5)
  pz.tx    = (canvas.clientWidth  - w * pz.scale) / 2
  pz.ty    = (canvas.clientHeight - h * pz.scale) / 2
  applyTransform(wrap, scaleEl)
}

// ─────────────────────────────────────────────────────────────────────────────
// Lightbox Modal（单例，惰性创建）
// ─────────────────────────────────────────────────────────────────────────────

/** 模块级 open 函数；buildModal() 首次调用后赋值 */
let openDiagram: ((svg: SVGElement) => void) | null = null

const MODAL_HTML = /* html */`
  <div class="oc-dz-canvas">
    <div class="oc-dz-wrap"></div>
  </div>

  <div class="oc-dz-topbar" aria-hidden="true">
    <span class="oc-dz-hint">滚轮缩放 &nbsp;·&nbsp; 拖拽平移 &nbsp;·&nbsp; 双击还原</span>
  </div>

  <button class="oc-dz-close" title="关闭 (Esc)" aria-label="关闭">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <line x1="1" y1="1"  x2="11" y2="11"/>
      <line x1="11" y1="1" x2="1"  y2="11"/>
    </svg>
  </button>

  <div class="oc-dz-controls" role="toolbar" aria-label="缩放控制">
    <button class="oc-dz-btn" data-action="zoomin" title="放大 (+)">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
           stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <circle cx="6" cy="6" r="5"/>
        <line x1="9"   y1="9"   x2="13"  y2="13"/>
        <line x1="6"   y1="3.5" x2="6"   y2="8.5"/>
        <line x1="3.5" y1="6"   x2="8.5" y2="6"/>
      </svg>
    </button>
    <button class="oc-dz-btn" data-action="zoomout" title="缩小 (-)">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
           stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <circle cx="6" cy="6" r="5"/>
        <line x1="9"   y1="9" x2="13"  y2="13"/>
        <line x1="3.5" y1="6" x2="8.5" y2="6"/>
      </svg>
    </button>
    <div class="oc-dz-sep"></div>
    <button class="oc-dz-btn oc-dz-btn--fit" data-action="fit" title="适应屏幕 (F)">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
           stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round">
        <polyline points="1,4 1,1 4,1"/>
        <polyline points="10,1 13,1 13,4"/>
        <polyline points="13,10 13,13 10,13"/>
        <polyline points="4,13 1,13 1,10"/>
      </svg>
    </button>
    <div class="oc-dz-sep"></div>
    <span class="oc-dz-scale" aria-live="polite">100%</span>
  </div>
`

function buildModal() {
  if (openDiagram) return  // 已创建，直接复用

  const modal = document.createElement('div')
  modal.id = 'oc-dz-modal'
  modal.setAttribute('role', 'dialog')
  modal.setAttribute('aria-modal', 'true')
  modal.innerHTML = MODAL_HTML
  document.body.appendChild(modal)

  const canvas  = modal.querySelector<HTMLElement>('.oc-dz-canvas')!
  const wrap    = modal.querySelector<HTMLElement>('.oc-dz-wrap')!
  const scaleEl = modal.querySelector<HTMLElement>('.oc-dz-scale')!

  // 常用操作的本地快捷引用
  const fit    = ()           => fitScreen(canvas, wrap, scaleEl)
  const zoomCtr = (f: number) => zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, f, wrap, scaleEl)
  const apply  = ()           => applyTransform(wrap, scaleEl)

  // ── 关闭 ────────────────────────────────────────────────────────────────
  function close() {
    modal.classList.remove('active')
    setTimeout(() => { wrap.innerHTML = '' }, 280) // 等退场动画结束再清空 DOM
  }

  modal.querySelector('.oc-dz-close')!.addEventListener('click', close)

  // 点击画布背景关闭（拖拽结束后不触发）
  canvas.addEventListener('click', (e) => {
    if (drag.moved) { drag.moved = false; return }
    if (e.target === canvas) close()
  })

  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return
    ;({
      Escape: close,
      f: fit,  F: fit,
      '+': () => zoomCtr(1.2),
      '=': () => zoomCtr(1.2),
      '-': () => zoomCtr(1 / 1.2),
    } as Record<string, () => void>)[e.key]?.()
  })

  // ── 滚轮缩放 ─────────────────────────────────────────────────────────────
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault()
    const { left, top } = canvas.getBoundingClientRect()
    zoomAt(e.clientX - left, e.clientY - top, e.deltaY < 0 ? 1.12 : 1 / 1.12, wrap, scaleEl)
  }, { passive: false })

  // ── 鼠标拖拽平移 ──────────────────────────────────────────────────────────
  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return
    drag.active = true
    drag.moved  = false
    drag.x      = e.clientX
    drag.y      = e.clientY
    canvas.classList.add('dragging')
  })

  window.addEventListener('mousemove', (e) => {
    if (!drag.active) return
    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true
    pz.tx  += dx;  pz.ty  += dy
    drag.x  = e.clientX; drag.y = e.clientY
    apply()
  })

  window.addEventListener('mouseup', () => {
    if (drag.active) { drag.active = false; canvas.classList.remove('dragging') }
  })

  // ── 双击适应屏幕 ──────────────────────────────────────────────────────────
  canvas.addEventListener('dblclick', fit)

  // ── 触摸：单指平移 + 双指捏合缩放 ────────────────────────────────────────
  let lastTouches: TouchList | null = null
  let pinchDist = 0

  canvas.addEventListener('touchstart', (e) => {
    lastTouches = e.touches
    if (e.touches.length === 2) {
      pinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
    }
  }, { passive: true })

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault()
    if (!lastTouches) return

    if (e.touches.length === 2 && pinchDist > 0) {
      // 双指捏合：以两指中心缩放
      const dx   = e.touches[0].clientX - e.touches[1].clientX
      const dy   = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const mx   = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const my   = (e.touches[0].clientY + e.touches[1].clientY) / 2
      zoomAt(mx, my, dist / pinchDist, wrap, scaleEl)
      pinchDist = dist
    } else if (e.touches.length === 1 && lastTouches.length === 1) {
      // 单指平移
      pz.tx += e.touches[0].clientX - lastTouches[0].clientX
      pz.ty += e.touches[0].clientY - lastTouches[0].clientY
      apply()
    }

    lastTouches = e.touches
  }, { passive: false })

  // ── 底部工具栏按钮 ────────────────────────────────────────────────────────
  modal.querySelectorAll<HTMLButtonElement>('.oc-dz-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      ;({
        zoomin:  () => zoomCtr(1.3),
        zoomout: () => zoomCtr(1 / 1.3),
        fit,
      } as Record<string, () => void>)[btn.dataset.action ?? '']?.()
    })
  })

  // ── 打开图表 ──────────────────────────────────────────────────────────────
  openDiagram = (svg: SVGElement) => {
    // 克隆 SVG 并恢复自然尺寸（缩放由 CSS transform 控制）
    wrap.innerHTML = svg.outerHTML
    const cloned = wrap.querySelector('svg')!
    const { w, h } = getSvgSize(cloned)
    cloned.setAttribute('width',  String(w))
    cloned.setAttribute('height', String(h))
    cloned.style.cssText = 'display:block;max-width:none;'

    modal.classList.add('active')
    // 双帧等待确保布局稳定后再计算 fit
    requestAnimationFrame(() => requestAnimationFrame(fit))
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 绑定页面中的 Mermaid 图表
// ─────────────────────────────────────────────────────────────────────────────

function attachZoom() {
  if (typeof document === 'undefined') return
  document.querySelectorAll<HTMLElement>('.vp-doc .mermaid:not([data-zoom-ready])').forEach((el) => {
    el.setAttribute('data-zoom-ready', '1')
    el.addEventListener('click', () => {
      const svg = el.querySelector('svg')
      if (!svg) return
      buildModal()
      openDiagram!(svg)
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// VitePress Theme 入口
// ─────────────────────────────────────────────────────────────────────────────

export default {
  extends: DefaultTheme,
  setup() {
    const route = useRoute()
    // Mermaid 是异步渲染的，需要延迟两次确保 SVG 已挂载
    const init = () => nextTick(() => { setTimeout(attachZoom, 400); setTimeout(attachZoom, 1400) })
    onMounted(init)
    watch(() => route.path, init)
  },
}
