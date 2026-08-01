import { ref } from 'vue'

/** 复制反馈：复制后 copied 置 true，1 秒后自动恢复 */
export function useCopy() {
  const copied = ref(false)
  let timer: number | undefined

  async function copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* 剪贴板不可用时静默失败 */
    }
    copied.value = true
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      copied.value = false
    }, 1000)
  }

  return { copied, copy }
}
