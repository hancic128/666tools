<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import ViewHeader from '@/components/ViewHeader.vue'
import Button from '@/components/Button.vue'
import Select from '@/components/Select.vue'
import { useCopy } from '@/utils/useCopy'
import QRCode from 'qrcode'

const text = ref('')
const size = ref(256)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const error = ref('')
const { copied, copy } = useCopy()
const copiedImage = ref(false)

const SIZE_OPTIONS = [128, 192, 256, 384, 512].map((s) => ({ value: String(s), label: `${s}px` }))

async function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  if (!text.value.trim()) {
    error.value = ''
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    return
  }
  try {
    await QRCode.toCanvas(canvas, text.value, { width: size.value, margin: 2, errorCorrectionLevel: 'M' })
    error.value = ''
  } catch (e) {
    error.value = `二维码生成失败：${(e as Error).message}`
  }
}

watch([text, size], render)

onMounted(() => {
  if (text.value) render()
})

function download() {
  const canvas = canvasRef.value
  if (!canvas) return
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = 'qrcode.png'
  a.click()
}

async function copyImage() {
  const canvas = canvasRef.value
  if (!canvas) return
  try {
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas 为空'))), 'image/png'),
    )
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    copiedImage.value = true
    window.setTimeout(() => {
      copiedImage.value = false
    }, 1000)
  } catch {
    /* 剪贴板不可用 */
  }
}
</script>

<template>
  <div class="tool-page">
    <ViewHeader title="二维码生成" description="文本 / URL → QR 码" tool-color="var(--tool-qr)">
      <Select :model-value="String(size)" :options="SIZE_OPTIONS" width="88px" @update:model-value="(v: string) => (size = Number(v))" />
      <Button variant="secondary" size="md" :disabled="!text.trim()" @click="download">下载 PNG</Button>
      <Button variant="secondary" size="md" :disabled="!text.trim()" @click="copyImage">
        {{ copiedImage ? '已复制!' : '复制图片' }}
      </Button>
      <Button variant="primary" size="md" :disabled="!text.trim()" @click="copy(text)">{{ copied ? '已复制!' : '复制文本' }}</Button>
    </ViewHeader>

    <div class="qr-body">
      <textarea v-model="text" class="qr-input" placeholder="输入文本或 URL，自动生成二维码…" spellcheck="false"></textarea>
      <div class="qr-canvas-wrap">
        <canvas ref="canvasRef" class="qr-canvas" :width="size" :height="size"></canvas>
        <p v-if="error" class="qr-error">{{ error }}</p>
        <p v-else-if="!text.trim()" class="qr-hint">二维码将显示在这里</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qr-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-lg) var(--space-xl);
  display: flex;
  gap: var(--space-xl);
  align-items: flex-start;
}

.qr-input {
  flex: 1;
  min-width: 0;
  min-height: 160px;
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  resize: vertical;
}

.qr-input:focus {
  border-color: var(--brand-primary-light);
}

.qr-canvas-wrap {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}

.qr-canvas {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: #fff;
  max-width: 100%;
  height: auto;
}

.qr-error {
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

.qr-hint {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}
</style>
