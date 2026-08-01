<script setup lang="ts">
import { computed, ref } from 'vue'
import ViewHeader from '@/components/ViewHeader.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import Button from '@/components/Button.vue'
import JsonView from '@/components/JsonView.vue'
import { useCopy } from '@/utils/useCopy'

const input = ref('')
const tab = ref<'header' | 'payload'>('header')
const { copied, copy } = useCopy()

function decodeSegment(seg: string): string {
  const b64 = seg.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

interface ParseResult {
  header: Record<string, unknown>
  payload: Record<string, unknown> | string
  signature: string
}

const result = computed<{ ok: true; data: ParseResult } | { ok: false; error: string } | null>(() => {
  const s = input.value.trim()
  if (!s) return null
  const parts = s.split('.')
  if (parts.length < 3) return { ok: false, error: 'JWT 需包含三段（header.payload.signature）' }
  try {
    const header = JSON.parse(decodeSegment(parts[0]))
    const payloadRaw = decodeSegment(parts[1])
    let payload: Record<string, unknown> | string
    try {
      payload = JSON.parse(payloadRaw)
    } catch {
      payload = payloadRaw
    }
    return { ok: true, data: { header, payload, signature: parts.slice(2).join('.') } }
  } catch (e) {
    return { ok: false, error: `解析失败：${(e as Error).message}` }
  }
})

function humanDuration(ms: number): string {
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec} 秒`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} 分钟 ${sec % 60} 秒`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时 ${min % 60} 分钟`
  const day = Math.floor(hour / 24)
  return `${day} 天 ${hour % 24} 小时`
}

const timeInfo = computed(() => {
  if (!result.value?.ok || typeof result.value.data.payload === 'string') return null
  const p = result.value.data.payload
  const now = Date.now() / 1000
  const info: { exp?: { label: string; expired: boolean; remaining: string }; iat?: string } = {}
  if (typeof p.exp === 'number') {
    const diff = p.exp - now
    info.exp = {
      label: new Date(p.exp * 1000).toLocaleString(),
      expired: diff < 0,
      remaining: humanDuration(Math.abs(diff) * 1000) + (diff < 0 ? '（已过期）' : '（剩余）'),
    }
  }
  if (typeof p.iat === 'number') {
    info.iat = new Date(p.iat * 1000).toLocaleString()
  }
  return info
})

const payloadJson = computed(() => {
  if (!result.value?.ok) return ''
  const p = result.value.data.payload
  return typeof p === 'string' ? p : JSON.stringify(p, null, 2)
})
</script>

<template>
  <div class="tool-page">
    <ViewHeader title="JWT 解析" description="粘贴 JWT 自动解析 Header / Payload" tool-color="var(--tool-jwt)">
      <Button variant="primary" size="md" @click="copy(input.trim())">{{ copied ? '已复制!' : '复制 JWT' }}</Button>
    </ViewHeader>

    <div class="split">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">JWT 输入</span></div>
        <div class="panel-body">
          <CodeEditor v-model="input" placeholder="粘贴 JWT…" :line-numbers="false" />
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div class="jwt-tabs">
            <button class="jwt-tab" :class="{ active: tab === 'header' }" @click="tab = 'header'">Header</button>
            <button class="jwt-tab" :class="{ active: tab === 'payload' }" @click="tab = 'payload'">Payload</button>
          </div>
          <span v-if="result?.ok" class="jwt-badges">
            <span v-if="timeInfo?.exp" class="badge" :class="timeInfo.exp.expired ? 'badge-expired' : 'badge-valid'">
              {{ timeInfo.exp.expired ? '已过期' : '有效' }}
            </span>
          </span>
        </div>

        <div v-if="!result" class="panel-body jwt-empty">等待输入 JWT…</div>
        <div v-else-if="!result.ok" class="panel-body jwt-empty jwt-error">{{ result.error }}</div>
        <div v-else class="panel-body jwt-content">
          <div class="jwt-claims">
            <div v-if="timeInfo?.exp" class="claim-row">
              <span class="claim-label">exp 过期时间</span>
              <span class="claim-value">
                {{ timeInfo.exp.label }}
                <em :class="timeInfo.exp.expired ? 'text-expired' : 'text-remaining'">{{ timeInfo.exp.remaining }}</em>
              </span>
            </div>
            <div v-if="timeInfo?.iat" class="claim-row">
              <span class="claim-label">iat 签发时间</span>
              <span class="claim-value">{{ timeInfo.iat }}</span>
            </div>
          </div>
          <JsonView v-if="tab === 'payload'" :content="payloadJson" />
          <JsonView v-else :content="JSON.stringify(result.data.header, null, 2)" />
        </div>
      </div>
    </div>

    <div v-if="result?.ok" class="signature-bar">
      <span class="signature-label">Signature</span>
      <code class="signature-value">{{ result.data.signature }}</code>
    </div>
  </div>
</template>

<style scoped>
.jwt-tabs {
  display: flex;
  gap: 2px;
}

.jwt-tab {
  padding: 4px 12px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
}

.jwt-tab:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.jwt-tab.active {
  color: var(--brand-primary);
  background: rgba(99, 102, 241, 0.12);
}

.jwt-badges {
  display: flex;
  gap: var(--space-sm);
}

.badge {
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.badge-valid {
  background: rgba(16, 185, 129, 0.15);
  color: var(--color-success);
}

.badge-expired {
  background: rgba(239, 68, 68, 0.15);
  color: var(--color-error);
}

.jwt-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}

.jwt-error {
  color: var(--color-error);
}

.jwt-content {
  overflow: auto;
}

.jwt-claims {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md);
  border-bottom: 1px solid var(--border);
  font-size: var(--font-size-sm);
}

.claim-row {
  display: flex;
  gap: var(--space-md);
}

.claim-label {
  color: var(--text-muted);
  width: 110px;
  flex-shrink: 0;
}

.claim-value {
  color: var(--text-primary);
}

.text-expired {
  color: var(--color-error);
  font-style: normal;
  margin-left: 6px;
}

.text-remaining {
  color: var(--color-success);
  font-style: normal;
  margin-left: 6px;
}

.signature-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-xl);
  border-top: 1px solid var(--border);
  background: var(--bg-secondary);
  font-size: var(--font-size-sm);
}

.signature-label {
  color: var(--text-muted);
  flex-shrink: 0;
  font-weight: 600;
}

.signature-value {
  font-family: var(--font-mono);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
