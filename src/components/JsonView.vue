<script setup lang="ts">
import { computed } from 'vue'
import { highlightJson } from '@/utils/json'

const props = defineProps<{
  content: string
}>()

const highlighted = computed(() => highlightJson(props.content))
</script>

<template>
  <pre class="json-view" aria-label="JSON"><code v-html="highlighted"></code></pre>
</template>

<style scoped>
.json-view {
  margin: 0;
  padding: var(--space-md);
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  line-height: 1.6;
  tab-size: 2;
  white-space: pre;
  overflow-wrap: normal;
  word-break: normal;
  color: var(--text-primary);
}
</style>
