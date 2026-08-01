<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    readonly?: boolean
    language?: string
    lineNumbers?: boolean
  }>(),
  { placeholder: '', readonly: false, language: 'text', lineNumbers: true },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const textareaEl = ref<HTMLTextAreaElement | null>(null)
const linesEl = ref<HTMLDivElement | null>(null)

const lineCount = computed(() => props.modelValue.split('\n').length)
const lineNumbersText = computed(() =>
  Array.from({ length: lineCount.value }, (_, i) => i + 1).join('\n'),
)

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}

function onScroll(e: Event) {
  const el = e.target as HTMLTextAreaElement
  if (linesEl.value) {
    linesEl.value.scrollTop = el.scrollTop
    linesEl.value.scrollLeft = el.scrollLeft
  }
}

/** 供父组件聚焦 */
function focus() {
  textareaEl.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <div class="code-editor" :class="{ 'with-lines': lineNumbers }">
    <div v-if="lineNumbers" ref="linesEl" class="line-numbers" aria-hidden="true">
      <pre class="line-numbers-text" v-text="lineNumbersText"></pre>
    </div>
    <textarea
      ref="textareaEl"
      class="editor-input"
      :value="modelValue"
      :placeholder="placeholder"
      :readonly="readonly"
      :spellcheck="false"
      @input="onInput"
      @scroll="onScroll"
    ></textarea>
  </div>
</template>

<style scoped>
.code-editor {
  display: flex;
  height: 100%;
  min-height: 0;
  background: var(--bg-primary);
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  line-height: 1.6;
}

.line-numbers {
  flex-shrink: 0;
  overflow: hidden;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  user-select: none;
}

.line-numbers-text {
  padding: var(--space-md) var(--space-sm) var(--space-md) var(--space-md);
  text-align: right;
  color: var(--text-muted);
  font: inherit;
  tab-size: 2;
}

.editor-input {
  flex: 1;
  min-width: 0;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  padding: var(--space-md);
  color: var(--text-primary);
  font: inherit;
  tab-size: 2;
  white-space: pre;
  overflow: auto;
}

.editor-input::placeholder {
  color: var(--text-muted);
}
</style>
