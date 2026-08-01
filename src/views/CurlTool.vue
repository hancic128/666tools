<script setup lang="ts">
import { computed, ref } from 'vue'
import ViewHeader from '@/components/ViewHeader.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import Button from '@/components/Button.vue'
import { useCopy } from '@/utils/useCopy'
import { parseCurl, toAxios, toFetch, toGo, toPython } from '@/utils/curl'

const input = ref('')
const lang = ref<'fetch' | 'axios' | 'python' | 'go'>('fetch')
const { copied, copy } = useCopy()

const LANGS = [
  { value: 'fetch', label: 'JavaScript Fetch' },
  { value: 'axios', label: 'Axios' },
  { value: 'python', label: 'Python requests' },
  { value: 'go', label: 'Go net/http' },
]

const output = computed(() => {
  if (!input.value.trim()) return ''
  const c = parseCurl(input.value)
  if (!c.url) return '⚠ 未识别到 URL，请粘贴 curl 命令'
  switch (lang.value) {
    case 'fetch':
      return toFetch(c)
    case 'axios':
      return toAxios(c)
    case 'python':
      return toPython(c)
    case 'go':
      return toGo(c)
  }
})

const outputLanguage = computed(() => {
  if (lang.value === 'python') return 'python'
  if (lang.value === 'go') return 'go'
  return 'javascript'
})
</script>

<template>
  <div class="tool-page">
    <ViewHeader title="Curl 转代码" description="curl 命令 → fetch / axios / python / go" tool-color="var(--tool-curl)">
      <div class="lang-tabs">
        <button
          v-for="l in LANGS"
          :key="l.value"
          class="lang-tab"
          :class="{ active: lang === l.value }"
          @click="lang = l.value as typeof lang"
        >
          {{ l.label }}
        </button>
      </div>
      <Button variant="primary" size="md" :disabled="!output" @click="copy(output)">
        {{ copied ? '已复制!' : '复制代码' }}
      </Button>
    </ViewHeader>

    <div class="split">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">curl 命令</span></div>
        <div class="panel-body">
          <CodeEditor
            v-model="input"
            placeholder="例如：curl -X POST https://api.example.com/users -H &quot;Content-Type: application/json&quot; -d &apos;{&quot;name&quot;:&quot;alice&quot;}&apos;"
          />
        </div>
      </div>
      <div class="panel">
        <div class="panel-header"><span class="panel-title">生成的代码</span></div>
        <div class="panel-body">
          <CodeEditor :model-value="output" :language="outputLanguage" readonly placeholder="生成的代码将显示在这里…" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lang-tabs {
  display: flex;
  gap: 4px;
}

.lang-tab {
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

.lang-tab:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.lang-tab.active {
  background: var(--tool-curl);
  border-color: var(--tool-curl);
  color: #fff;
}
</style>
