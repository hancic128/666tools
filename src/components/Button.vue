<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
  }>(),
  { variant: 'secondary', size: 'md', disabled: false },
)
</script>

<template>
  <button class="btn" :class="[`btn-${variant}`, `btn-${size}`]" :disabled="disabled">
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 500;
  border-radius: var(--radius-md);
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    opacity 0.15s ease;
  white-space: nowrap;
  user-select: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 尺寸 */
.btn-sm {
  padding: 4px 10px;
  font-size: var(--font-size-xs);
}
.btn-md {
  padding: 6px 14px;
  font-size: var(--font-size-sm);
}
.btn-lg {
  padding: 8px 18px;
  font-size: var(--font-size-base);
}

/* 变体 */
.btn-primary {
  background: var(--brand-primary);
  color: #fff;
}
.btn-primary:hover:not(:disabled) {
  background: var(--brand-primary-dark);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--bg-hover);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}
.btn-ghost:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
