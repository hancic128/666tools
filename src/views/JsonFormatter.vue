<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import ViewHeader from '@/components/ViewHeader.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import Button from '@/components/Button.vue'
import Select from '@/components/Select.vue'
import { useCopy } from '@/utils/useCopy'
import { useCmdEnter } from '@/utils/useHotkey'
import { defaultCollapsedPaths, renderJsonTree } from '@/utils/jsonTree'
import {
  formatHtml,
  formatPython,
  formatSql,
  formatXml,
  highlightPython,
  highlightSql,
  highlightXml,
} from '@/utils/formatter'

type Format = 'json' | 'sql' | 'python' | 'xml' | 'html'

const CACHE_KEY = 'devtools-formatter-cache'

const format = ref<Format>('json')
const input = ref('')
const indentSize = ref(2)
const collapseDepth = ref(2) // -1 表示不折叠
const collapsed = reactive(new Set<string>())

const FORMAT_OPTIONS = [
  { value: 'json', label: 'JSON' },
  { value: 'sql', label: 'SQL' },
  { value: 'python', label: 'Python' },
  { value: 'xml', label: 'XML' },
  { value: 'html', label: 'HTML' },
]
const INDENT_OPTIONS = [
  { value: '2', label: '2 空格' },
  { value: '4', label: '4 空格' },
]
const DEPTH_OPTIONS = [
  { value: '-1', label: '不折叠' },
  { value: '1', label: '深度 1' },
  { value: '2', label: '深度 2' },
  { value: '3', label: '深度 3' },
  { value: '4', label: '深度 4' },
]

const { copied, copy } = useCopy()

/* ---------- 解析 / 格式化 ---------- */

const jsonParsed = computed<unknown>(() => {
  if (format.value !== 'json') return null
  try {
    return JSON.parse(input.value)
  } catch {
    return null
  }
})

const error = computed(() => {
  if (!input.value.trim()) return ''
  if (format.value === 'json') {
    try {
      JSON.parse(input.value)
      return ''
    } catch (e) {
      return `JSON 解析错误：${(e as Error).message}`
    }
  }
  try {
    formatText()
    return ''
  } catch (e) {
    return String((e as Error).message || e)
  }
})

function formatText(): string {
  switch (format.value) {
    case 'json':
      return JSON.stringify(JSON.parse(input.value), null, indentSize.value)
    case 'sql':
      return formatSql(input.value, indentSize.value)
    case 'python':
      return formatPython(input.value)
    case 'xml':
      return formatXml(input.value)
    case 'html':
      return formatHtml(input.value)
  }
}

const treeHtml = computed(() => {
  if (format.value !== 'json' || jsonParsed.value === null) return ''
  return renderJsonTree(jsonParsed.value, collapsed, indentSize.value)
})

const highlightedHtml = computed(() => {
  if (format.value === 'json' || !input.value.trim()) return ''
  try {
    const formatted = formatText()
    switch (format.value) {
      case 'sql':
        return highlightSql(formatted)
      case 'python':
        return highlightPython(formatted)
      case 'xml':
      case 'html':
        return highlightXml(formatted)
    }
  } catch (e) {
    return escErr(String((e as Error).message || e))
  }
  return ''
})

function escErr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function collapseThreshold(): number {
  return collapseDepth.value === -1 ? Infinity : collapseDepth.value
}

function resetFold() {
  collapsed.clear()
  const v = jsonParsed.value
  if (v !== null) {
    defaultCollapsedPaths(v, collapseThreshold()).forEach((p) => collapsed.add(p))
  }
}

function expandAll() {
  collapsed.clear()
}

function collapseAll() {
  collapsed.clear()
  const v = jsonParsed.value
  if (v !== null) {
    defaultCollapsedPaths(v, 0).forEach((p) => collapsed.add(p))
  }
}

watch([input, format, collapseDepth], () => {
  resetFold()
})

/** 树点击：切换折叠 */
function onTreeClick(e: Event) {
  const el = (e.target as HTMLElement).closest('[data-path]') as HTMLElement | null
  if (!el) return
  const path = el.getAttribute('data-path')!
  if (collapsed.has(path)) collapsed.delete(path)
  else collapsed.add(path)
}

/* ---------- 复制 ---------- */

function copyOutput() {
  if (!input.value.trim()) return
  if (error.value) return
  let text = ''
  if (format.value === 'json') text = JSON.stringify(jsonParsed.value, null, indentSize.value)
  else text = formatText()
  copy(text)
}

/* ---------- 缓存 ---------- */

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return
    const c = JSON.parse(raw)
    if (typeof c.input === 'string') input.value = c.input
    if (['json', 'sql', 'python', 'xml', 'html'].includes(c.format)) format.value = c.format
    if (c.indentSize === 2 || c.indentSize === 4) indentSize.value = c.indentSize
    if (typeof c.collapseDepth === 'number') collapseDepth.value = c.collapseDepth
  } catch {
    /* 忽略损坏缓存 */
  }
}

watch(
  [input, format, indentSize, collapseDepth],
  () => {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          input: input.value,
          format: format.value,
          indentSize: indentSize.value,
          collapseDepth: collapseDepth.value,
        }),
      )
    } catch {
      /* localStorage 满时静默失败 */
    }
  },
  { deep: false },
)

loadCache()
resetFold()
useCmdEnter(() => copyOutput())
</script>

<template>
  <div class="tool-page">
    <ViewHeader title="代码格式化" description="JSON / SQL / Python / XML / HTML" tool-color="var(--tool-json)">
      <Select :model-value="format" :options="FORMAT_OPTIONS" width="96px" @update:model-value="(v: string) => (format = v as Format)" />
      <Select :model-value="String(indentSize)" :options="INDENT_OPTIONS" width="84px" @update:model-value="(v: string) => (indentSize = Number(v))" />
      <Select
        v-if="format === 'json'"
        :model-value="String(collapseDepth)"
        :options="DEPTH_OPTIONS"
        width="88px"
        @update:model-value="(v: string) => (collapseDepth = Number(v))"
      />
      <template v-if="format === 'json'">
        <Button variant="ghost" size="sm" @click="expandAll">全部展开</Button>
        <Button variant="ghost" size="sm" @click="collapseAll">全部折叠</Button>
      </template>
      <Button variant="secondary" size="md" @click="copyOutput">{{ copied ? '已复制!' : '复制结果' }}</Button>
      <Button variant="primary" size="md" @click="copyOutput">格式化</Button>
    </ViewHeader>

    <div class="split">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">输入</span></div>
        <div class="panel-body">
          <CodeEditor v-model="input" :language="format" placeholder="粘贴要格式化的代码…（Cmd+Enter 格式化）" />
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">输出</span>
          <span v-if="error" class="format-error">{{ error }}</span>
        </div>
        <div class="panel-body">
          <pre v-if="format === 'json' && jsonParsed !== null && !error" class="format-output json-tree" v-html="treeHtml" @click="onTreeClick"></pre>
          <pre v-else-if="format !== 'json' && !error" class="format-output" v-html="highlightedHtml"></pre>
          <p v-else-if="!input.trim()" class="format-empty">等待输入…</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.format-error {
  font-size: var(--font-size-xs);
  color: var(--color-error);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.format-output {
  margin: 0;
  padding: var(--space-md);
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  line-height: 1.6;
  tab-size: 2;
  white-space: pre;
  overflow: auto;
  user-select: text;
}

.json-tree {
  cursor: text;
}

.format-empty {
  padding: var(--space-md);
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}

/* 折叠交互 */
:deep(.f-fold) {
  cursor: pointer;
  color: var(--text-secondary);
  font-weight: 700;
}
:deep(.f-fold:hover) {
  color: var(--brand-primary);
}
:deep(.f-ellipsis) {
  cursor: pointer;
  font-style: italic;
  color: var(--brand-primary);
  background: rgba(99, 102, 241, 0.1);
  border-radius: 2px;
  padding: 0 2px;
}
:deep(.f-ellipsis:hover) {
  background: rgba(99, 102, 241, 0.2);
}
:deep(.f-tok.f-index) {
  color: var(--text-muted);
  font-weight: 600;
}
</style>
