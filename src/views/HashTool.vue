<script setup lang="ts">
import { ref, watch } from 'vue'
import ViewHeader from '@/components/ViewHeader.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import Button from '@/components/Button.vue'
import { useCopy } from '@/utils/useCopy'
import { md5 } from '@/utils/md5'

type Algo = 'md5' | 'sha1' | 'sha256' | 'sha512' | 'all'

const algo = ref<Algo>('all')
const input = ref('')
const { copied, copy } = useCopy()

const ALGO_OPTIONS: { value: Algo; label: string }[] = [
  { value: 'md5', label: 'MD5' },
  { value: 'sha1', label: 'SHA-1' },
  { value: 'sha256', label: 'SHA-256' },
  { value: 'sha512', label: 'SHA-512' },
  { value: 'all', label: '全部' },
]

const results = ref<{ name: string; value: string }[]>([])

async function compute() {
  const text = input.value
  if (!text) {
    results.value = []
    return
  }
  const bytes = new TextEncoder().encode(text)
  const list: { name: string; value: string }[] = []

  const selected: { name: string; algo: Algo }[] = algo.value === 'all'
    ? [
        { name: 'MD5', algo: 'md5' },
        { name: 'SHA-1', algo: 'sha1' },
        { name: 'SHA-256', algo: 'sha256' },
        { name: 'SHA-512', algo: 'sha512' },
      ]
    : [{ name: ALGO_OPTIONS.find((o) => o.value === algo.value)!.label, algo: algo.value }]

  const SHA_MAP: Record<string, 'SHA-1' | 'SHA-256' | 'SHA-512'> = {
    sha1: 'SHA-1',
    sha256: 'SHA-256',
    sha512: 'SHA-512',
  }

  for (const item of selected) {
    if (item.algo === 'md5') {
      list.push({ name: item.name, value: md5(text) })
    } else {
      const digest = await crypto.subtle.digest(SHA_MAP[item.algo], bytes)
      list.push({
        name: item.name,
        value: Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
      })
    }
  }
  results.value = list
}

watch([input, algo], compute, { immediate: true })

function copyAll() {
  copy(results.value.map((r) => `${r.name}: ${r.value}`).join('\n'))
}
</script>

<template>
  <div class="tool-page">
    <ViewHeader title="Hash 生成" description="MD5 / SHA-1 / SHA-256 / SHA-512（实时计算）" tool-color="var(--tool-hash)">
      <div class="algo-pills">
        <button
          v-for="o in ALGO_OPTIONS"
          :key="o.value"
          class="algo-pill"
          :class="{ active: algo === o.value }"
          @click="algo = o.value"
        >
          {{ o.label }}
        </button>
      </div>
      <Button variant="primary" size="md" @click="copyAll">{{ copied ? '已复制!' : '复制全部' }}</Button>
    </ViewHeader>

    <div class="split">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">输入</span></div>
        <div class="panel-body">
          <CodeEditor v-model="input" placeholder="输入要计算 Hash 的文本…" />
        </div>
      </div>
      <div class="panel">
        <div class="panel-header"><span class="panel-title">输出</span></div>
        <div class="panel-body hash-output">
          <div v-if="results.length" class="hash-list">
            <div v-for="r in results" :key="r.name" class="hash-row">
              <span class="hash-name">{{ r.name }}</span>
              <code class="hash-value">{{ r.value }}</code>
            </div>
          </div>
          <p v-else class="hash-empty">等待输入…</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.algo-pills {
  display: flex;
  gap: var(--space-sm);
}

.algo-pill {
  padding: 5px 12px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.algo-pill:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.algo-pill.active {
  background: var(--tool-hash);
  border-color: var(--tool-hash);
  color: #fff;
}

.hash-output {
  padding: var(--space-md);
}

.hash-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.hash-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.hash-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--tool-hash);
}

.hash-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  word-break: break-all;
  user-select: text;
}

.hash-empty {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}
</style>
