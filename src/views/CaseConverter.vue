<script setup lang="ts">
import { computed, ref } from 'vue'
import ViewHeader from '@/components/ViewHeader.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import Button from '@/components/Button.vue'
import { useCopy } from '@/utils/useCopy'
import { useCmdEnter } from '@/utils/useHotkey'
import { CASE_FORMATS, convertCase, type CaseFormat } from '@/utils/case'

const format = ref<CaseFormat>('camel')
const input = ref('')
const { copied, copy } = useCopy()

const output = computed(() => convertCase(input.value, format.value))

useCmdEnter(() => copy(output.value))
</script>

<template>
  <div class="tool-page">
    <ViewHeader title="大小写转换" description="9 种命名格式一键转换" tool-color="var(--tool-case)">
      <Button variant="primary" size="md" @click="copy(output)">{{ copied ? '已复制!' : '复制结果' }}</Button>
    </ViewHeader>

    <div class="format-strip">
      <button
        v-for="f in CASE_FORMATS"
        :key="f.value"
        class="format-btn"
        :class="{ active: format === f.value }"
        @click="format = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <div class="split">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">输入</span></div>
        <div class="panel-body">
          <CodeEditor v-model="input" placeholder="例如：my_variable_name 或 MyVariableName…" />
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

<style scoped>
.format-strip {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  padding: var(--space-lg) var(--space-xl) var(--space-md);
  flex-shrink: 0;
}

.format-btn {
  padding: 5px 12px;
  font-size: var(--font-size-sm);
  font-family: var(--font-mono);
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.format-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.format-btn.active {
  background: var(--brand-primary);
  border-color: var(--brand-primary);
  color: #fff;
}
</style>
