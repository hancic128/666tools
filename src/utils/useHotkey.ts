import { onBeforeUnmount, onMounted } from 'vue'

/** 绑定 Cmd/Ctrl + Enter 快捷键 */
export function useCmdEnter(handler: () => void) {
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handler()
    }
  }
  onMounted(() => window.addEventListener('keydown', onKey))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
}
