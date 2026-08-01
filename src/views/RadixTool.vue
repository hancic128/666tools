<script setup lang="ts">
import { computed, ref } from 'vue'
import ViewHeader from '@/components/ViewHeader.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import Button from '@/components/Button.vue'
import Select from '@/components/Select.vue'
import { useCopy } from '@/utils/useCopy'
import { useCmdEnter } from '@/utils/useHotkey'
import { convertRadix } from '@/utils/radix'

const from = ref(10)
const to = ref(16)
const input = ref('')
const { copied, copy } = useCopy()

const RADIX_OPTIONS = [
  { value: '2', label: '2 进制' },
  { value: '8', label: '8 进制' },
  { value: '10', label: '10 进制' },
  { value: '16', label: '16 进制' },
]

const output = computed(() => convertRadix(input.value, from.value, to.value).join('\n'))

function setFrom(v: string) {
  from.value = Number(v)
}
function setTo(v: string) {
  to.value = Number(v)
}

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
    <ViewHeader title="进制转换" description="2 / 8 / 10 / 16 进制互转，支持大数（BigInt）" tool-color="var(--tool-radix)">
      <Select :model-value="String(from)" :options="RADIX_OPTIONS" width="92px" @update:model-value="setFrom" />
      <Button variant="ghost" size="md" title="交换进制" @click="swap">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" />
        </svg>
        交换
      </Button>
      <Select :model-value="String(to)" :options="RADIX_OPTIONS" width="92px" @update:model-value="setTo" />
      <Button variant="primary" size="md" @click="copy(output)">{{ copied ? '已复制!' : '复制结果' }}</Button>
    </ViewHeader>

    <div class="split">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">输入（支持批量，空格或换行分隔）</span></div>
        <div class="panel-body">
          <CodeEditor v-model="input" placeholder="例如：255&#10;1024&#10;ff 10 1111（一行一个或空格分隔）…" />
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
