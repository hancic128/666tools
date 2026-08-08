<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ViewHeader from '@/components/ViewHeader.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import Button from '@/components/Button.vue'
import Select from '@/components/Select.vue'
import { useCopy } from '@/utils/useCopy'
import mermaid from 'mermaid'

type Mode = 'split' | 'code' | 'preview'

const CACHE_KEY = '666tools-mermaid-cache'

const SAMPLE = `flowchart TD
    A[用户访问] --> B{已登录?}
    B -->|是| C[进入首页]
    B -->|否| D[登录页]
    D --> E[输入账号密码]
    E --> F{验证通过?}
    F -->|通过| C
    F -->|失败| G[提示错误]
    G --> E`

const mode = ref<Mode>('split')
const code = ref('')
const error = ref('')
const svg = ref('')
const zoom = ref(1)
const pan = ref({ x: 0, y: 0 })
const dragging = ref(false)
const { copied, copy } = useCopy()

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: 'split', label: '双栏' },
  { value: 'code', label: '仅代码' },
  { value: 'preview', label: '仅预览' },
]

let dragStart = { x: 0, y: 0, px: 0, py: 0 }
let renderSeq = 0

function isDark(): boolean {
  const root = document.documentElement
  return (
    root.classList.contains('dark') ||
    (!root.classList.contains('light') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )
}

async function render() {
  const seq = ++renderSeq
  if (!code.value.trim()) {
    svg.value = ''
    error.value = ''
    return
  }
  try {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark() ? 'dark' : 'default',
      securityLevel: 'loose',
      flowchart: { useMaxWidth: false },
      sequence: { useMaxWidth: false },
      gantt: { useMaxWidth: false },
    })
    const id = `mmd-${seq}-${Math.random().toString(36).slice(2, 8)}`
    const result = await mermaid.render(id, code.value)
    if (seq !== renderSeq) return
    svg.value = result.svg
    error.value = ''
    zoom.value = 1
    pan.value = { x: 0, y: 0 }
  } catch (e) {
    if (seq !== renderSeq) return
    error.value = `渲染失败：${(e as Error).message}`
    svg.value = ''
  }
}

watch(code, render)

/* 主题联动：监听 document 上的 dark/light class 变化 */
let observer: MutationObserver | undefined
onMounted(() => {
  if (!code.value) code.value = SAMPLE
  observer = new MutationObserver(() => render())
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})
onBeforeUnmount(() => observer?.disconnect())

/* 缩放 */
function clampZoom(v: number) {
  return Math.min(4, Math.max(0.25, v))
}

function onWheel(e: WheelEvent) {
  if (!e.ctrlKey) return
  e.preventDefault()
  zoom.value = clampZoom(zoom.value + (e.deltaY > 0 ? -0.1 : 0.1))
}

/* 平移 */
function onMouseDown(e: MouseEvent) {
  if (e.button !== 0 || !svg.value) return
  dragging.value = true
  dragStart = { x: e.clientX, y: e.clientY, px: pan.value.x, py: pan.value.y }
}

function onMouseMove(e: MouseEvent) {
  if (!dragging.value) return
  pan.value = { x: dragStart.px + (e.clientX - dragStart.x), y: dragStart.py + (e.clientY - dragStart.y) }
}

function onMouseUp() {
  dragging.value = false
}

/* 导出 */
function downloadSvg() {
  if (!svg.value) return
  const blob = new Blob([svg.value], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'mermaid.svg'
  a.click()
  URL.revokeObjectURL(url)
}

function downloadPng() {
  if (!svg.value) return
  const blob = new Blob([svg.value], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const img = new Image()
  img.onload = () => {
    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(img.width * scale)
    canvas.height = Math.ceil(img.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'mermaid.png'
    a.click()
    URL.revokeObjectURL(url)
  }
  img.src = url
}

/* 缓存 */
function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw && typeof raw === 'string') code.value = raw
  } catch {
    /* ignore */
  }
}
watch(
  code,
  (v) => {
    try {
      localStorage.setItem(CACHE_KEY, v)
    } catch {
      /* ignore */
    }
  },
  { immediate: true },
)

loadCache()
</script>

<template>
  <div class="tool-page">
    <ViewHeader title="Mermaid 图表" description="Mermaid 代码 → SVG 图表" tool-color="var(--tool-mermaid)">
      <Select :model-value="mode" :options="MODE_OPTIONS" width="96px" @update:model-value="(v: string) => (mode = v as Mode)" />
      <template v-if="svg">
        <Button variant="ghost" size="sm" @click="zoom = clampZoom(zoom * 1.25)">＋</Button>
        <Button variant="ghost" size="sm" @click="zoom = clampZoom(zoom * 0.8)">－</Button>
        <Button variant="ghost" size="sm" @click="zoom = 1; pan = { x: 0, y: 0 }">重置</Button>
        <Button variant="secondary" size="sm" @click="downloadSvg">SVG</Button>
        <Button variant="secondary" size="sm" @click="downloadPng">PNG</Button>
        <Button variant="secondary" size="sm" @click="copy(svg)">{{ copied ? '已复制!' : '复制源码' }}</Button>
      </template>
    </ViewHeader>

    <div class="mermaid-body">
      <template v-if="mode === 'split' || mode === 'code'">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">代码</span></div>
          <div class="panel-body">
            <CodeEditor v-model="code" language="mermaid" placeholder="输入 Mermaid 代码…" />
          </div>
        </div>
      </template>

      <template v-if="mode === 'split' || mode === 'preview'">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">预览</span>
            <span v-if="svg" class="zoom-hint">Ctrl+滚轮缩放 · 拖拽平移 · {{ Math.round(zoom * 100) }}%</span>
            <span v-else-if="error" class="mermaid-error">{{ error }}</span>
          </div>
          <div
            class="panel-body mermaid-stage"
            :class="{ dragging }"
            @wheel="onWheel"
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseup="onMouseUp"
            @mouseleave="onMouseUp"
          >
            <div
              v-if="svg"
              class="mermaid-canvas"
              :style="{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: 'center center' }"
              v-html="svg"
            ></div>
            <p v-else-if="!error" class="stage-empty">等待渲染…</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.mermaid-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: var(--space-lg);
  padding: var(--space-lg) var(--space-xl);
}

.mermaid-body > .panel {
  flex: 1;
}

.zoom-hint {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.mermaid-error {
  font-size: var(--font-size-xs);
  color: var(--color-error);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mermaid-stage {
  overflow: hidden;
  cursor: grab;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.mermaid-stage.dragging {
  cursor: grabbing;
}

.mermaid-canvas {
  margin: auto;
  max-width: none;
}

.stage-empty {
  margin: auto;
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}
</style>
