<script setup lang="ts">
import { computed, ref } from 'vue'
import ViewHeader from '@/components/ViewHeader.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import Button from '@/components/Button.vue'
import Select from '@/components/Select.vue'
import { useCopy } from '@/utils/useCopy'
import { useCmdEnter } from '@/utils/useHotkey'

const mode = ref<'encode' | 'decode'>('encode')
const input = ref('')
const { copied, copy } = useCopy()

const MODE_OPTIONS = [
  { value: 'encode', label: '编码' },
  { value: 'decode', label: '解码' },
]

const output = computed(() => {
  if (!input.value) return ''
  try {
    return mode.value === 'encode'
      ? encodeURIComponent(input.value)
      : decodeURIComponent(input.value)
  } catch {
    return '⚠ 无效的 URL 编码'
  }
})

function setMode(v: string) {
  mode.value = v as 'encode' | 'decode'
}

function swap() {
  input.value = output.value
  mode.value = mode.value === 'encode' ? 'decode' : 'encode'
}

useCmdEnter(() => copy(output.value))
</script>

<template>
  <div class="tool-page">
    <ViewHeader title="URL 编解码" description="encodeURIComponent / decodeURIComponent" tool-color="var(--tool-url)">
      <Select :model-value="mode" :options="MODE_OPTIONS" width="88px" @update:model-value="setMode" />
      <Button variant="ghost" size="md" title="交换输入/输出" @click="swap">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" />
        </svg>
        交换
      </Button>
      <Button variant="primary" size="md" @click="copy(output)">{{ copied ? '已复制!' : '复制结果' }}</Button>
    </ViewHeader>

    <div class="split">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">输入</span></div>
        <div class="panel-body">
          <CodeEditor v-model="input" placeholder="输入要编码 / 解码的 URL 或文本…" />
        </div>
      </div>
      <div class="panel">
        <div class="panel-header"><span class="panel-title">输出</span></div>
        <div class="panel-body">
          <CodeEditor :model-value="output" readonly placeholder="结果将显示在这里…" />
        </div>
      </div>
    </div>
  </div>
</template>
