<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import ViewHeader from '@/components/ViewHeader.vue'
import Button from '@/components/Button.vue'
import Select from '@/components/Select.vue'
import { useCopy } from '@/utils/useCopy'

const count = ref(5)
const format = ref<'standard' | 'upper' | 'compact'>('standard')
const uuids = ref<string[]>([])

const COUNT_OPTIONS = Array.from({ length: 20 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} 个`,
}))
const FORMAT_OPTIONS = [
  { value: 'standard', label: '标准' },
  { value: 'upper', label: '大写' },
  { value: 'compact', label: '无连字符' },
]

function gen() {
  uuids.value = Array.from({ length: count.value }, () => {
    const u = crypto.randomUUID()
    if (format.value === 'upper') return u.toUpperCase()
    if (format.value === 'compact') return u.replace(/-/g, '')
    return u
  })
}

watch([count, format], gen)
onMounted(gen)

function setCount(v: string) {
  count.value = Number(v)
}
function setFormat(v: string) {
  format.value = v as 'standard' | 'upper' | 'compact'
}

const { copy } = useCopy()
const copiedIndex = ref<number | null>(null)
const allCopied = ref(false)

function copyItem(uuid: string, idx: number) {
  copy(uuid)
  copiedIndex.value = idx
  window.setTimeout(() => {
    if (copiedIndex.value === idx) copiedIndex.value = null
  }, 1000)
}

function copyAll() {
  copy(uuids.value.join('\n'))
  allCopied.value = true
  window.setTimeout(() => {
    allCopied.value = false
  }, 1000)
}
</script>

<template>
  <div class="tool-page">
    <ViewHeader title="UUID 生成" description="UUID v4 批量生成" tool-color="var(--tool-uuid)">
      <Select :model-value="String(count)" :options="COUNT_OPTIONS" width="80px" @update:model-value="setCount" />
      <Select :model-value="format" :options="FORMAT_OPTIONS" width="100px" @update:model-value="setFormat" />
      <Button variant="secondary" size="md" @click="gen">重新生成</Button>
      <Button variant="primary" size="md" @click="copyAll">{{ allCopied ? '已复制!' : '复制全部' }}</Button>
    </ViewHeader>

    <div class="uuid-body">
      <div class="uuid-grid">
        <div
          v-for="(u, i) in uuids"
          :key="u"
          class="uuid-item"
          title="点击复制"
          @click="copyItem(u, i)"
        >
          <code class="uuid-text">{{ u }}</code>
          <Transition name="fade">
            <span v-if="copiedIndex === i" class="uuid-copied">已复制!</span>
          </Transition>
        </div>
      </div>
      <p class="uuid-hint">点击单个 UUID 复制</p>
    </div>
  </div>
</template>

<style scoped>
.uuid-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-lg) var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.uuid-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-md);
}

.uuid-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.uuid-item:hover {
  border-color: var(--tool-uuid);
  background: var(--bg-tertiary);
}

.uuid-text {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  word-break: break-all;
}

.uuid-copied {
  position: absolute;
  right: var(--space-sm);
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--font-size-xs);
  color: var(--color-success);
  font-weight: 600;
}

.uuid-hint {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
