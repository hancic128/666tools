<script setup lang="ts">
import { computed, ref } from 'vue'
import ViewHeader from '@/components/ViewHeader.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import Button from '@/components/Button.vue'
import Select from '@/components/Select.vue'
import { useCopy } from '@/utils/useCopy'
import { useCmdEnter } from '@/utils/useHotkey'
import { CONV_FORMATS, parseSource, serializeValue, type ConvFormat } from '@/utils/converters'

const from = ref<ConvFormat>('json')
const to = ref<ConvFormat>('yaml')
const input = ref('')
const { copied, copy } = useCopy()

const output = computed(() => {
  if (!input.value.trim()) return ''
  try {
    const value = parseSource(input.value, from.value)
    return serializeValue(value, to.value)
  } catch (e) {
    return `⚠ 转换失败：${(e as Error).message}`
  }
})

function swap() {
  input.value = output.value
  const t = from.value
  from.value = to.value
  to.value = t
}

useCmdEnter(() => copy(output.value))
</script>

<template>
  <div class="tool-page">
    <ViewHeader title="格式转换" description="JSON / JSON String / YAML / Python Dict 互转" tool-color="var(--tool-converter)">
      <Select :model-value="from" :options="CONV_FORMATS" width="112px" @update:model-value="(v: string) => (from = v as ConvFormat)" />
      <Button variant="ghost" size="md" title="交换源/目标格式" @click="swap">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" />
        </svg>
        交换
      </Button>
      <Select :model-value="to" :options="CONV_FORMATS" width="112px" @update:model-value="(v: string) => (to = v as ConvFormat)" />
      <Button variant="primary" size="md" @click="copy(output)">{{ copied ? '已复制!' : '复制结果' }}</Button>
    </ViewHeader>

    <div class="split">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">输入</span></div>
        <div class="panel-body">
          <CodeEditor v-model="input" placeholder="粘贴源格式内容…" />
        </div>
      </div>
      <div class="panel">
        <div class="panel-header"><span class="panel-title">输出</span></div>
        <div class="panel-body">
          <CodeEditor :model-value="output" readonly placeholder="转换结果…" />
        </div>
      </div>
    </div>
  </div>
</template>
