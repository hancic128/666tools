<script setup lang="ts">
import { computed, ref } from 'vue'
import ViewHeader from '@/components/ViewHeader.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import Select from '@/components/Select.vue'

type DiffFormat = 'text' | 'json' | 'properties'
const format = ref<DiffFormat>('text')
const left = ref('')
const right = ref('')

const FORMAT_OPTIONS = [
  { value: 'text', label: '文本' },
  { value: 'json', label: 'JSON' },
  { value: 'properties', label: 'Properties' },
]

interface DiffRow {
  type: 'same' | 'add' | 'del'
  leftText: string
  rightText: string
  leftNo: number | null
  rightNo: number | null
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function highlightLine(line: string): string {
  if (format.value === 'properties') {
    const i = line.indexOf('=')
    if (i >= 0) {
      return `<span class="diff-key">${esc(line.slice(0, i))}</span><span class="diff-eq">=</span><span class="diff-val">${esc(line.slice(i + 1))}</span>`
    }
  }
  return esc(line)
}

function splitLines(text: string): string[] {
  if (!text) return []
  if (format.value === 'json') {
    try {
      return JSON.stringify(JSON.parse(text), null, 2).split('\n')
    } catch {
      return text.split('\n')
    }
  }
  if (format.value === 'properties') {
    return text
      .split('\n')
      .filter((l) => l.includes('='))
      .map((l) => l.trim())
      .sort()
  }
  return text.split('\n')
}

function lcsDiff(a: string[], b: string[]): { type: 'same' | 'add' | 'del'; a: string; b: string }[] {
  const n = a.length
  const m = b.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const result: { type: 'same' | 'add' | 'del'; a: string; b: string }[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      result.push({ type: 'same', a: a[i], b: b[j] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: 'del', a: a[i], b: '' })
      i++
    } else {
      result.push({ type: 'add', a: '', b: b[j] })
      j++
    }
  }
  while (i < n) {
    result.push({ type: 'del', a: a[i], b: '' })
    i++
  }
  while (j < m) {
    result.push({ type: 'add', a: '', b: b[j] })
    j++
  }
  return result
}

const rows = computed<DiffRow[]>(() => {
  const a = splitLines(left.value)
  const b = splitLines(right.value)
  const diff = lcsDiff(a, b)
  let ln = 0
  let rn = 0
  return diff.map((d) => {
    const row: DiffRow = { type: d.type, leftText: d.a, rightText: d.b, leftNo: null, rightNo: null }
    if (d.type !== 'add') row.leftNo = ++ln
    if (d.type !== 'del') row.rightNo = ++rn
    return row
  })
})
</script>

<template>
  <div class="tool-page">
    <ViewHeader title="文本对比" description="LCS 差异高亮" tool-color="var(--tool-diff)">
      <Select :model-value="format" :options="FORMAT_OPTIONS" width="108px" @update:model-value="(v: string) => (format = v as DiffFormat)" />
    </ViewHeader>

    <div class="diff-inputs">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">原始文本 A</span></div>
        <div class="panel-body">
          <CodeEditor v-model="left" placeholder="左侧文本…" />
        </div>
      </div>
      <div class="panel">
        <div class="panel-header"><span class="panel-title">原始文本 B</span></div>
        <div class="panel-body">
          <CodeEditor v-model="right" placeholder="右侧文本…" />
        </div>
      </div>
    </div>

    <div class="diff-body">
      <div class="diff-col">
        <div v-for="(row, i) in rows" :key="i" class="diff-row" :class="row.type === 'del' ? 'row-del' : row.type === 'add' ? 'row-empty' : 'row-same'">
          <span class="line-no">{{ row.leftNo ?? '' }}</span>
          <code class="line-content" v-html="row.leftText ? highlightLine(row.leftText) : '&nbsp;'"></code>
        </div>
      </div>
      <div class="diff-col">
        <div v-for="(row, i) in rows" :key="i" class="diff-row" :class="row.type === 'add' ? 'row-add' : row.type === 'del' ? 'row-empty' : 'row-same'">
          <span class="line-no">{{ row.rightNo ?? '' }}</span>
          <code class="line-content" v-html="row.rightText ? highlightLine(row.rightText) : '&nbsp;'"></code>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.diff-inputs {
  display: flex;
  gap: var(--space-lg);
  padding: 0 var(--space-xl);
  height: 30%;
  min-height: 140px;
  flex-shrink: 0;
}

.diff-inputs .panel {
  flex: 1;
}

.diff-body {
  flex: 1;
  min-height: 0;
  display: flex;
  margin: var(--space-lg) var(--space-xl);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: auto;
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  line-height: 1.6;
  background: var(--bg-primary);
}

.diff-col {
  flex: 1;
  min-width: 0;
}

.diff-col:first-child {
  border-right: 1px solid var(--border);
}

.diff-row {
  display: flex;
  align-items: baseline;
  padding: 0 var(--space-sm);
}

.line-no {
  width: 40px;
  flex-shrink: 0;
  text-align: right;
  padding-right: var(--space-sm);
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  user-select: none;
}

.line-content {
  flex: 1;
  min-width: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.row-same {
  background: transparent;
}
.row-del {
  background: rgba(239, 68, 68, 0.14);
}
.row-add {
  background: rgba(16, 185, 129, 0.14);
}
.row-empty {
  background: var(--bg-secondary);
  color: var(--text-muted);
}
.row-del .line-content {
  color: #b91c1c;
}
.row-add .line-content {
  color: #047857;
}
</style>

<style>
/* properties 高亮（非 scoped） */
.diff-key {
  color: var(--f-key);
  font-weight: 600;
}
.diff-eq {
  color: var(--text-muted);
}
.diff-val {
  color: var(--f-string);
}
</style>
