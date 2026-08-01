<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import ViewHeader from '@/components/ViewHeader.vue'
import Button from '@/components/Button.vue'
import Select from '@/components/Select.vue'
import { useCopy } from '@/utils/useCopy'

type Tab = 'ts2date' | 'date2ts' | 'duration'
const tab = ref<Tab>('ts2date')
const { copied, copy } = useCopy()

const TABS: { value: Tab; label: string }[] = [
  { value: 'ts2date', label: '时间戳 → 日期' },
  { value: 'date2ts', label: '日期 → 时间戳' },
  { value: 'duration', label: '时长转换' },
]

/* 实时时钟 */
const nowTs = ref(Math.floor(Date.now() / 1000))
let timer: number | undefined
onMounted(() => {
  timer = window.setInterval(() => {
    nowTs.value = Math.floor(Date.now() / 1000)
  }, 1000)
})
onBeforeUnmount(() => window.clearInterval(timer))

/* Tab 1：时间戳 → 日期 */
const tsInput = ref('')
const tsUnit = ref('auto')
const TS_UNITS = [
  { value: 'auto', label: '自动' },
  { value: 's', label: '秒' },
  { value: 'ms', label: '毫秒' },
  { value: 'us', label: '微秒' },
  { value: 'ns', label: '纳秒' },
]

function tsToMs(value: number, unit: string): number {
  if (unit === 'auto') {
    const digits = Math.abs(value).toString().replace(/\./g, '').length
    if (digits <= 10) return value * 1000
    if (digits <= 13) return value
    if (digits <= 16) return value / 1000
    return value / 1e6
  }
  if (unit === 's') return value * 1000
  if (unit === 'us') return value / 1000
  if (unit === 'ns') return value / 1e6
  return value
}

const tsDate = computed(() => {
  const v = parseFloat(tsInput.value)
  if (Number.isNaN(v)) return null
  const ms = tsToMs(v, tsUnit.value)
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return null
  return { local: d.toLocaleString(), utc: d.toUTCString(), iso: d.toISOString() }
})

/* Tab 2：日期 → 时间戳 */
const dtInput = ref('')
const dtTz = ref('local')
const DT_TZ = [
  { value: 'local', label: '本地时区' },
  { value: 'utc', label: 'UTC' },
]

/** datetime-local 值转 Date；UTC 时仅在缺秒时补 :00 */
function parseDateTime(value: string, utc: boolean): Date {
  if (!utc) return new Date(value)
  const s = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? value + ':00' : value
  return new Date(s + 'Z')
}

const dtResult = computed(() => {
  if (!dtInput.value) return null
  const d = parseDateTime(dtInput.value, dtTz.value === 'utc')
  if (Number.isNaN(d.getTime())) return null
  const t = d.getTime()
  return { s: Math.floor(t / 1000), ms: t, us: t * 1000, ns: t * 1e6 }
})

/* Tab 3：时长转换 */
const durInput = ref('')
const durUnit = ref('ms')
const DUR_UNITS = [
  { value: 'ms', label: '毫秒' },
  { value: 's', label: '秒' },
  { value: 'min', label: '分钟' },
  { value: 'h', label: '小时' },
  { value: 'd', label: '天' },
  { value: 'w', label: '周' },
]
const UNIT_MS: Record<string, number> = { ms: 1, s: 1000, min: 60000, h: 3600000, d: 86400000, w: 604800000 }

const durResult = computed(() => {
  const v = parseFloat(durInput.value)
  if (Number.isNaN(v)) return null
  const ms = v * UNIT_MS[durUnit.value]
  return { ms, s: ms / 1000, min: ms / 60000, h: ms / 3600000, d: ms / 86400000, w: ms / 604800000 }
})

function humanize(ms: number): string {
  const abs = Math.abs(ms)
  const sign = ms < 0 ? '-' : ''
  let sec = Math.floor(abs / 1000)
  const d = Math.floor(sec / 86400)
  sec %= 86400
  const h = Math.floor(sec / 3600)
  sec %= 3600
  const m = Math.floor(sec / 60)
  sec %= 60
  const parts: string[] = []
  if (d) parts.push(`${d} 天`)
  if (h) parts.push(`${h} 小时`)
  if (m) parts.push(`${m} 分钟`)
  if (sec || !parts.length) parts.push(`${sec} 秒`)
  return sign + parts.join(' ')
}

const humanReadable = computed(() => (durResult.value ? humanize(durResult.value.ms) : ''))

const nowLocal = computed(() => new Date().toLocaleTimeString())
</script>

<template>
  <div class="tool-page">
    <ViewHeader title="时间戳转换" description="时间戳 ↔ 日期 · 时长换算" tool-color="var(--tool-time)">
      <span class="clock">
        <span class="clock-ts">当前：{{ nowTs }}</span>
        <span class="clock-time">{{ nowLocal }}</span>
      </span>
    </ViewHeader>

    <div class="tab-bar">
      <button v-for="t in TABS" :key="t.value" class="tab-btn" :class="{ active: tab === t.value }" @click="tab = t.value">
        {{ t.label }}
      </button>
    </div>

    <!-- Tab 1 -->
    <div v-if="tab === 'ts2date'" class="tab-body">
      <div class="form-row">
        <input v-model="tsInput" class="num-input mono" placeholder="输入时间戳…" spellcheck="false" />
        <Select :model-value="tsUnit" :options="TS_UNITS" width="96px" @update:model-value="(v: string) => (tsUnit = v)" />
        <Button variant="secondary" size="md" :disabled="!tsDate" @click="copy(tsInput)">{{ copied ? '已复制!' : '复制' }}</Button>
      </div>
      <div class="result-card">
        <div class="result-row"><span class="result-label">本地时间</span><code class="result-value">{{ tsDate?.local ?? '—' }}</code></div>
        <div class="result-row"><span class="result-label">UTC 时间</span><code class="result-value">{{ tsDate?.utc ?? '—' }}</code></div>
        <div class="result-row"><span class="result-label">ISO 8601</span><code class="result-value">{{ tsDate?.iso ?? '—' }}</code></div>
      </div>
    </div>

    <!-- Tab 2 -->
    <div v-else-if="tab === 'date2ts'" class="tab-body">
      <div class="form-row">
        <input v-model="dtInput" type="datetime-local" class="num-input mono" />
        <Select :model-value="dtTz" :options="DT_TZ" width="112px" @update:model-value="(v: string) => (dtTz = v)" />
        <Button variant="secondary" size="md" :disabled="!dtResult" @click="copy(String(dtResult?.ms))">{{ copied ? '已复制!' : '复制毫秒' }}</Button>
      </div>
      <div class="result-card">
        <div class="result-row"><span class="result-label">秒 (s)</span><code class="result-value">{{ dtResult?.s ?? '—' }}</code></div>
        <div class="result-row"><span class="result-label">毫秒 (ms)</span><code class="result-value">{{ dtResult?.ms ?? '—' }}</code></div>
        <div class="result-row"><span class="result-label">微秒 (μs)</span><code class="result-value">{{ dtResult?.us ?? '—' }}</code></div>
        <div class="result-row"><span class="result-label">纳秒 (ns)</span><code class="result-value">{{ dtResult?.ns ?? '—' }}</code></div>
      </div>
    </div>

    <!-- Tab 3 -->
    <div v-else class="tab-body">
      <div class="form-row">
        <input v-model="durInput" class="num-input mono" placeholder="输入时长数值…" spellcheck="false" />
        <Select :model-value="durUnit" :options="DUR_UNITS" width="88px" @update:model-value="(v: string) => (durUnit = v)" />
      </div>
      <div v-if="durResult" class="result-card">
        <div class="result-row"><span class="result-label">人类可读</span><code class="result-value human">{{ humanReadable }}</code></div>
        <div class="result-row"><span class="result-label">毫秒</span><code class="result-value">{{ durResult.ms.toLocaleString() }}</code></div>
        <div class="result-row"><span class="result-label">秒</span><code class="result-value">{{ durResult.s.toLocaleString() }}</code></div>
        <div class="result-row"><span class="result-label">分钟</span><code class="result-value">{{ durResult.min.toLocaleString() }}</code></div>
        <div class="result-row"><span class="result-label">小时</span><code class="result-value">{{ durResult.h.toLocaleString() }}</code></div>
        <div class="result-row"><span class="result-label">天</span><code class="result-value">{{ durResult.d.toLocaleString() }}</code></div>
        <div class="result-row"><span class="result-label">周</span><code class="result-value">{{ durResult.w.toLocaleString() }}</code></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.clock {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.clock-ts {
  font-family: var(--font-mono);
  color: var(--tool-time);
  font-weight: 600;
}

.clock-time {
  color: var(--text-muted);
}

.tab-bar {
  display: flex;
  gap: 4px;
  padding: 0 var(--space-xl);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.tab-btn {
  padding: 8px 14px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--tool-time);
  border-bottom-color: var(--tool-time);
  font-weight: 600;
}

.tab-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-lg) var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.form-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.num-input {
  flex: 1;
  max-width: 360px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.num-input:focus {
  border-color: var(--brand-primary-light);
}

.result-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.result-row {
  display: flex;
  gap: var(--space-md);
  align-items: baseline;
}

.result-label {
  width: 90px;
  flex-shrink: 0;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.result-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  word-break: break-all;
}

.result-value.human {
  color: var(--tool-time);
  font-weight: 600;
}
</style>
