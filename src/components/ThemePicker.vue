<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { MdTheme } from '@/utils/mdThemes'

const props = defineProps<{
  modelValue: string
  themes: MdTheme[]
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const current = () => props.themes.find((t) => t.id === props.modelValue) ?? props.themes[0]

function select(t: MdTheme) {
  emit('update:modelValue', t.id)
  open.value = false
}

function onDocClick(e: MouseEvent) {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="rootEl" class="theme-picker" :class="{ open }" @click="open = !open">
    <div class="picker-trigger">
      <span class="thumb" :style="{ background: current().vars['--md-bg'] }">
        <span class="thumb-title" :style="{ background: current().vars['--md-heading'] }"></span>
        <span class="thumb-line" :style="{ background: current().vars['--md-text'] }"></span>
        <span class="thumb-line short" :style="{ background: current().vars['--md-text'] }"></span>
      </span>
      <span class="picker-value">{{ current().name }}</span>
      <svg class="chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
    <Transition name="dropdown">
      <div v-if="open" class="picker-dropdown">
        <div
          v-for="t in themes"
          :key="t.id"
          class="picker-option"
          :class="{ selected: t.id === modelValue }"
          @click.stop="select(t)"
        >
          <span class="thumb" :style="{ background: t.vars['--md-bg'] }">
            <span class="thumb-title" :style="{ background: t.vars['--md-heading'] }"></span>
            <span class="thumb-line" :style="{ background: t.vars['--md-text'] }"></span>
            <span class="thumb-line short" :style="{ background: t.vars['--md-text'] }"></span>
          </span>
          <span class="option-meta">
            <span class="option-name">{{ t.name }}</span>
            <span class="option-desc">{{ t.desc }}</span>
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.theme-picker {
  position: relative;
  user-select: none;
}

.picker-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.picker-trigger:hover {
  border-color: var(--brand-primary-light);
}

.picker-value {
  color: var(--text-primary);
  white-space: nowrap;
}

.chevron {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.2s ease;
}

.theme-picker.open .chevron {
  transform: rotate(180deg);
}

/* 主题缩略图：背景 + 标题条 + 正文条 */
.thumb {
  position: relative;
  display: block;
  width: 44px;
  height: 30px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.thumb-title {
  position: absolute;
  left: 8px;
  top: 7px;
  width: 22px;
  height: 4px;
  border-radius: 2px;
}

.thumb-line {
  position: absolute;
  left: 8px;
  top: 16px;
  width: 28px;
  height: 3px;
  border-radius: 1.5px;
  opacity: 0.55;
}

.thumb-line.short {
  width: 18px;
  top: 22px;
  opacity: 0.35;
}

.picker-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 100;
  width: 200px;
  max-height: 280px;
  overflow: auto;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 4px;
}

.picker-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.picker-option:hover {
  background: var(--bg-tertiary);
}

.picker-option.selected {
  background: rgba(99, 102, 241, 0.14);
}

.option-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.option-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.option-desc {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
