<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import ViewHeader from '@/components/ViewHeader.vue'
import Button from '@/components/Button.vue'
import ThemePicker from '@/components/ThemePicker.vue'
import MarkdownIt from 'markdown-it'
import { toBlob, toCanvas, toPng } from 'html-to-image'
import { MD_CANVAS_W, MD_PAGE_H, MD_THEMES } from '@/utils/mdThemes'

/* ---------- Markdown 解析 ---------- */

const md = new MarkdownIt('default', { html: false, linkify: true, breaks: true })
// 链接新窗口打开
md.renderer.rules.link_open = (tokens, idx, options, _env, self) => {
  tokens[idx].attrSet('target', '_blank')
  tokens[idx].attrSet('rel', 'noopener noreferrer')
  return self.renderToken(tokens, idx, options)
}

/* ---------- 状态 ---------- */

const EXAMPLE = `# 提高效率的 5 个小技巧

> 每天 15 分钟，改变你的工作节奏

## 1. 早上先做最难的事

把一天最不想面对的任务**放在第一位**，你会惊讶地发现：

- 大脑清醒时效率最高
- 完成后的成就感持续一整天

## 2. 用番茄钟切割时间

25 分钟专注 + 5 分钟休息，比连续工作 2 小时更有效。

## 3. 批量处理琐事

把回复消息、整理文件集中到一个时间段，避免频繁切换。

## 4. 学会说「不」

保护自己的时间，优先做**重要**的事。

## 5. 睡前写明日清单

\`3 件最重要的事\` 就够了。

---

觉得有用的话，点个赞收藏吧 ❤️`

const input = ref(EXAMPLE)
const themeId = ref('warm')
const multiPage = ref(false)

const theme = computed(() => MD_THEMES.find((t) => t.id === themeId.value) ?? MD_THEMES[0])

const html = computed(() => md.render(input.value))

const canvasStyle = computed(() => ({
  ...theme.value.vars,
  width: MD_CANVAS_W + 'px',
  background: 'var(--md-bg)',
}))

/* ---------- 预览缩放（宽度自适应面板，不放大） ---------- */

const stageRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLElement | null>(null)
const stageW = ref(0)
const canvasH = ref(1000)

const scale = computed(() => (stageW.value ? Math.min(stageW.value / MD_CANVAS_W, 1) : 1))
const stageH = computed(() => canvasH.value * scale.value)

let ro: ResizeObserver | null = null
onMounted(() => {
  ro = new ResizeObserver(() => {
    if (stageRef.value) stageW.value = stageRef.value.clientWidth
    if (canvasRef.value) canvasH.value = canvasRef.value.offsetHeight
  })
  if (stageRef.value) ro.observe(stageRef.value)
  if (canvasRef.value) ro.observe(canvasRef.value)
  if (stageRef.value) stageW.value = stageRef.value.clientWidth
  if (canvasRef.value) canvasH.value = canvasRef.value.offsetHeight
})
onBeforeUnmount(() => ro?.disconnect())

function loadExample() {
  input.value = EXAMPLE
}

/* ---------- 导出 ---------- */

const EXPORT_OPTS = { pixelRatio: 2, cacheBust: true }
const copied = ref(false)
let copyTimer: number | undefined

function downloadPng(dataUrl: string, name: string) {
  const a = document.createElement('a')
  a.download = name
  a.href = dataUrl
  a.click()
}

async function exportPng() {
  const node = canvasRef.value
  if (!node) return
  try {
    if (!multiPage.value) {
      // 单页：整图一张
      downloadPng(await toPng(node, EXPORT_OPTS), `md-image-${Date.now()}.png`)
      return
    }
    // 多页：整图按页高切分，每页一张
    const full = await toCanvas(node, EXPORT_OPTS)
    const pageH = MD_PAGE_H * EXPORT_OPTS.pixelRatio
    const pages = Math.max(1, Math.ceil(full.height / pageH))
    for (let i = 0; i < pages; i++) {
      const page = document.createElement('canvas')
      page.width = full.width
      page.height = Math.min(pageH, full.height - i * pageH)
      const ctx = page.getContext('2d')
      if (!ctx) return
      ctx.drawImage(full, 0, -i * pageH)
      downloadPng(page.toDataURL('image/png'), pages > 1 ? `md-image-${i + 1}-${pages}.png` : `md-image-${Date.now()}.png`)
    }
  } catch (e) {
    alert('导出失败：' + String((e as Error).message || e))
  }
}

async function copyImage() {
  const node = canvasRef.value
  if (!node) return
  try {
    const blob = await toBlob(node, EXPORT_OPTS)
    if (!blob) return
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    copied.value = true
    window.clearTimeout(copyTimer)
    copyTimer = window.setTimeout(() => (copied.value = false), 1500)
  } catch (e) {
    alert('复制失败：' + String((e as Error).message || e))
  }
}
</script>

<template>
  <div class="tool-page">
    <ViewHeader title="Markdown 转图片" description="主题排版 · 手机竖版 · 导出 PNG" tool-color="var(--tool-mdimg)">
      <ThemePicker :model-value="themeId" :themes="MD_THEMES" @update:model-value="(v: string) => (themeId = v)" />
      <Button
        variant="ghost"
        size="sm"
        :class="{ 'btn-toggle-active': multiPage }"
        :title="multiPage ? '关闭分页：导出单张长图' : '开启分页：按每页 ' + MD_PAGE_H + 'px 切分多张'"
        @click="multiPage = !multiPage"
      >
        多页
      </Button>
      <Button variant="ghost" size="sm" @click="loadExample">示例</Button>
      <Button variant="secondary" size="md" @click="copyImage">{{ copied ? '已复制!' : '复制图片' }}</Button>
      <Button variant="primary" size="md" @click="exportPng">导出 PNG</Button>
    </ViewHeader>

    <div class="split">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">Markdown</span></div>
        <div class="panel-body">
          <textarea v-model="input" class="md-input" placeholder="输入 Markdown 内容…"></textarea>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">预览 · {{ theme.name }}{{ multiPage ? ` · 多页（每页 ${MD_PAGE_H}px）` : '' }}</span>
        </div>
        <div class="panel-body">
          <div class="md-stage" ref="stageRef" :style="{ minHeight: stageH + 'px' }">
            <div
              class="md-scale"
              :style="{ width: MD_CANVAS_W + 'px', transform: `scale(${scale})`, transformOrigin: 'top left' }"
            >
              <div ref="canvasRef" class="md-canvas" :style="canvasStyle">
                <div class="md-body" v-html="html"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.md-input {
  width: 100%;
  height: 100%;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  line-height: 1.7;
  padding: var(--space-md);
  box-sizing: border-box;
}

/* 多页开关激活态 */
.btn-toggle-active {
  background: rgba(99, 102, 241, 0.16);
  color: var(--brand-primary);
  border-color: var(--brand-primary);
}

.md-stage {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: var(--space-lg);
  box-sizing: border-box;
}

.md-scale {
  flex-shrink: 0;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  border-radius: 12px;
}

.md-canvas {
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 12px;
}

/* Markdown 排版（主题变量来自 .md-canvas 内联样式） */
.md-body {
  padding: 72px 60px;
  font-family: var(--md-font);
  color: var(--md-text);
  font-size: 26px;
  line-height: 1.8;
  word-break: break-word;
}

.md-body :deep(h1) {
  font-size: 44px;
  line-height: 1.4;
  font-weight: 800;
  color: var(--md-heading);
  margin: 0 0 28px;
  padding-bottom: 20px;
  border-bottom: 4px solid var(--md-accent);
}

.md-body :deep(h2) {
  font-size: 34px;
  line-height: 1.4;
  font-weight: 700;
  color: var(--md-heading);
  margin: 44px 0 16px;
  padding-left: 18px;
  border-left: 6px solid var(--md-accent);
}

.md-body :deep(h3) {
  font-size: 29px;
  line-height: 1.4;
  font-weight: 600;
  color: var(--md-heading);
  margin: 32px 0 12px;
}

.md-body :deep(p) {
  margin: 0 0 20px;
}

.md-body :deep(strong) {
  color: var(--md-heading);
  font-weight: 700;
}

.md-body :deep(a) {
  color: var(--md-link);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.md-body :deep(ul),
.md-body :deep(ol) {
  margin: 0 0 20px;
  padding-left: 36px;
}

.md-body :deep(li) {
  margin-bottom: 10px;
}

.md-body :deep(li::marker) {
  color: var(--md-accent);
}

.md-body :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background: var(--md-code-bg);
  color: var(--md-code-text);
  padding: 3px 10px;
  border-radius: 8px;
}

.md-body :deep(pre) {
  background: var(--md-code-bg);
  color: var(--md-code-text);
  padding: 20px 24px;
  border-radius: 12px;
  overflow-x: auto;
  margin: 0 0 20px;
  font-size: 22px;
  line-height: 1.6;
}

.md-body :deep(pre code) {
  background: none;
  padding: 0;
  font-size: inherit;
}

.md-body :deep(blockquote) {
  margin: 0 0 24px;
  padding: 16px 24px;
  background: var(--md-quote-bg);
  border-left: 6px solid var(--md-quote-border);
  border-radius: 0 12px 12px 0;
  color: var(--md-text);
}

.md-body :deep(blockquote p) {
  margin: 0;
}

.md-body :deep(hr) {
  border: none;
  border-top: 2px solid var(--md-hr);
  margin: 36px 0;
}

.md-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0 0 20px;
  font-size: 24px;
}

.md-body :deep(th),
.md-body :deep(td) {
  border: 1px solid var(--md-table-border);
  padding: 10px 14px;
  text-align: left;
}

.md-body :deep(th) {
  background: var(--md-th-bg);
  font-weight: 600;
  color: var(--md-heading);
}

.md-body :deep(img) {
  max-width: 100%;
  border-radius: 12px;
  display: block;
  margin: 8px 0 20px;
}
</style>
