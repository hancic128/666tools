<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    toolColor?: string
  }>(),
  { description: '', toolColor: '' },
)
</script>

<template>
  <div class="view-header">
    <div class="view-header-text">
      <span class="view-header-bar" :style="{ background: toolColor || 'var(--brand-primary)' }"></span>
      <h1 class="view-header-title">{{ title }}</h1>
      <span v-if="description" class="view-header-desc">{{ description }}</span>
    </div>
    <div class="view-header-actions">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-xl);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.view-header-text {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 0;
}

.view-header-bar {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  flex-shrink: 0;
}

.view-header-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.view-header-desc {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.view-header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}
</style>
