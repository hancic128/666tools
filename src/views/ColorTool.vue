<script setup lang="ts">
import { ref, watch } from 'vue'
import ViewHeader from '@/components/ViewHeader.vue'
import Button from '@/components/Button.vue'
import { useCopy } from '@/utils/useCopy'
import {
  hexToRgb,
  hslToRgb,
  PRESET_COLORS,
  rgbToHex,
  rgbToHsl,
  type RGB,
} from '@/utils/color'

const syncing = ref(false)
const hexInput = ref('#6366F1')
const rInput = ref(99)
const gInput = ref(102)
const bInput = ref(241)
const hInput = ref(239)
const sInput = ref(86)
const lInput = ref(67)
const { copied, copy } = useCopy()

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

function setRgb({ r, g, b }: RGB) {
  syncing.value = true
  rInput.value = r
  gInput.value = g
  bInput.value = b
  hexInput.value = rgbToHex({ r, g, b })
  const hsl = rgbToHsl({ r, g, b })
  hInput.value = hsl.h
  sInput.value = hsl.s
  lInput.value = hsl.l
  syncing.value = false
}

watch(hexInput, (v) => {
  if (syncing.value) return
  const rgb = hexToRgb(v)
  if (rgb) setRgb(rgb)
})

watch([rInput, gInput, bInput], () => {
  if (syncing.value) return
  setRgb({
    r: clamp(rInput.value, 0, 255),
    g: clamp(gInput.value, 0, 255),
    b: clamp(bInput.value, 0, 255),
  })
})

watch([hInput, sInput, lInput], () => {
  if (syncing.value) return
  const rgb = hslToRgb({
    h: clamp(hInput.value, 0, 360),
    s: clamp(sInput.value, 0, 100),
    l: clamp(lInput.value, 0, 100),
  })
  setRgb(rgb)
})

setRgb({ r: 99, g: 102, b: 241 })

function pickColor(e: Event) {
  const v = (e.target as HTMLInputElement).value
  const rgb = hexToRgb(v)
  if (rgb) setRgb(rgb)
}
</script>

<template>
  <div class="tool-page">
    <ViewHeader title="颜色转换" description="HEX / RGB / HSL 联动转换" tool-color="var(--tool-color)">
      <Button variant="primary" size="md" @click="copy(hexInput)">{{ copied ? '已复制!' : '复制 HEX' }}</Button>
    </ViewHeader>

    <div class="color-body">
      <div class="color-main">
        <div class="color-preview-col">
          <div class="color-swatch" :style="{ background: hexInput }"></div>
          <div class="color-picker-row">
            <span class="picker-label">取色器</span>
            <input type="color" class="color-picker" :value="hexInput.toLowerCase()" @input="pickColor" />
          </div>
        </div>

        <div class="color-fields">
          <div class="field-group">
            <span class="field-label">HEX</span>
            <input v-model="hexInput" class="field-input mono" spellcheck="false" />
          </div>
          <div class="field-group">
            <span class="field-label">RGB</span>
            <div class="field-row">
              <input v-model.number="rInput" type="number" min="0" max="255" class="field-input" />
              <input v-model.number="gInput" type="number" min="0" max="255" class="field-input" />
              <input v-model.number="bInput" type="number" min="0" max="255" class="field-input" />
            </div>
          </div>
          <div class="field-group">
            <span class="field-label">HSL</span>
            <div class="field-row">
              <input v-model.number="hInput" type="number" min="0" max="360" class="field-input" />
              <input v-model.number="sInput" type="number" min="0" max="100" class="field-input" />
              <input v-model.number="lInput" type="number" min="0" max="100" class="field-input" />
            </div>
          </div>
        </div>
      </div>

      <div class="palette">
        <span class="palette-label">预设色板</span>
        <div class="palette-grid">
          <button
            v-for="c in PRESET_COLORS"
            :key="c"
            class="swatch"
            :style="{ background: c }"
            :title="c"
            :class="{ active: hexInput.toUpperCase() === c }"
            @click="setRgb(hexToRgb(c)!)"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.color-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-lg) var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.color-main {
  display: flex;
  gap: var(--space-xl);
  flex-wrap: wrap;
}

.color-preview-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  flex-shrink: 0;
}

.color-swatch {
  width: 220px;
  height: 220px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.picker-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.color-picker {
  width: 44px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: none;
  cursor: pointer;
}

.color-fields {
  flex: 1;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.field-group {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.field-label {
  width: 40px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.field-row {
  display: flex;
  gap: var(--space-sm);
  flex: 1;
}

.field-input {
  flex: 1;
  padding: 6px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.field-input:focus {
  border-color: var(--brand-primary-light);
}

.mono {
  font-family: var(--font-mono);
}

.palette {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.palette-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.palette-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.swatch {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.12s ease;
}

.swatch:hover {
  transform: scale(1.12);
}

.swatch.active {
  border-color: var(--text-primary);
  box-shadow: 0 0 0 2px var(--bg-primary);
}
</style>
