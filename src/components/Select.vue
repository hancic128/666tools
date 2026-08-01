<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

export interface SelectOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: SelectOption[]
    disabled?: boolean
    width?: string
  }>(),
  { disabled: false, width: '' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const current = () => props.options.find((o) => o.value === props.modelValue)

function toggle() {
  if (!props.disabled) open.value = !open.value
}

function select(opt: SelectOption) {
  emit('update:modelValue', opt.value)
  open.value = false
}

function onDocClick(e: MouseEvent) {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="rootEl" class="select" :class="{ disabled, open }" :style="width ? { width } : {}" @click="toggle">
    <div class="select-trigger">
      <span class="select-value" :class="{ placeholder: !current() }">
        {{ current()?.label ?? '请选择' }}
      </span>
      <svg class="chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
    <Transition name="dropdown">
      <div v-if="open" class="select-dropdown">
        <div
          v-for="opt in options"
          :key="opt.value"
          class="select-option"
          :class="{ selected: opt.value === modelValue }"
          @click.stop="select(opt)"
        >
          {{ opt.label }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.select {
  position: relative;
  min-width: 120px;
  user-select: none;
}

.select.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.select-trigger:hover {
  border-color: var(--brand-primary-light);
}

.select-value.placeholder {
  color: var(--text-muted);
}

.chevron {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.2s ease;
}

.select.open .chevron {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  max-height: 240px;
  overflow: auto;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 4px;
}

.select-option {
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
}

.select-option:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.select-option.selected {
  background: var(--brand-primary);
  color: #fff;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
