<script setup lang="ts">
import { computed, ref } from 'vue'
import ViewHeader from '@/components/ViewHeader.vue'
import CodeEditor from '@/components/CodeEditor.vue'

const input = ref('')

interface Stat {
  label: string
  value: string
}

const stats = computed<Stat[]>(() => {
  const t = input.value
  return [
    { label: '总字符', value: String(t.length) },
    { label: '不含空格', value: String(t.replace(/\s/g, '').length) },
    { label: '字节数', value: new TextEncoder().encode(t).length.toLocaleString() },
    { label: '词数', value: String((t.match(/\S+/g) || []).length) },
    { label: '总行数', value: String(t.split('\n').length) },
    { label: '非空行', value: String(t.split('\n').filter((l) => l.trim()).length) },
    { label: '段落数', value: String(t.split(/\n\s*\n/).filter((p) => p.trim()).length) },
    { label: '中文字符', value: String((t.match(/[一-龥]/g) || []).length) },
    { label: '英文字母', value: String((t.match(/[A-Za-z]/g) || []).length) },
    { label: '数字', value: String((t.match(/[0-9]/g) || []).length) },
    { label: '标点符号', value: String((t.match(/[\p{P}\p{S}]/gu) || []).length) },
  ]
})

const freq = computed<{ word: string; count: number }[]>(() => {
  const segs = input.value.match(/[一-龥]+|[a-zA-Z]+/g) || []
  const count = new Map<string, number>()
  for (const seg of segs) {
    if (/^[一-龥]+$/.test(seg)) {
      for (const ch of seg) count.set(ch, (count.get(ch) || 0) + 1)
    } else {
      const w = seg.toLowerCase()
      count.set(w, (count.get(w) || 0) + 1)
    }
  }
  return [...count.entries()]
    .map(([word, n]) => ({ word, count: n }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
})
</script>

<template>
  <div class="tool-page">
    <ViewHeader title="文本统计" description="字符 / 行 / 词频统计" tool-color="var(--tool-stats)">
      <span class="total-hint">统计中</span>
    </ViewHeader>

    <div class="split">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">文本</span></div>
        <div class="panel-body">
          <CodeEditor v-model="input" placeholder="粘贴要统计的文本…" />
        </div>
      </div>
      <div class="panel">
        <div class="panel-header"><span class="panel-title">统计结果</span></div>
        <div class="panel-body stats-body">
          <div class="stat-grid">
            <div v-for="s in stats" :key="s.label" class="stat-card">
              <span class="stat-value">{{ s.value }}</span>
              <span class="stat-label">{{ s.label }}</span>
            </div>
          </div>

          <div class="freq-block">
            <h3 class="freq-title">Top 10 词频（中文按字 / 英文按词）</h3>
            <div v-if="freq.length" class="freq-list">
              <div v-for="(f, i) in freq" :key="f.word" class="freq-row">
                <span class="freq-rank">{{ i + 1 }}</span>
                <span class="freq-word">{{ f.word }}</span>
                <div class="freq-bar-wrap">
                  <div class="freq-bar" :style="{ width: Math.min(100, (f.count / freq[0].count) * 100) + '%' }"></div>
                </div>
                <span class="freq-count">{{ f.count }}</span>
              </div>
            </div>
            <p v-else class="freq-empty">暂无数据</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.total-hint {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.stats-body {
  overflow: auto;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--space-md);
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--tool-stats);
  font-family: var(--font-mono);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.freq-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
}

.freq-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.freq-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-sm);
}

.freq-rank {
  width: 18px;
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  flex-shrink: 0;
}

.freq-word {
  width: 90px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.freq-bar-wrap {
  flex: 1;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.freq-bar {
  height: 100%;
  background: var(--tool-stats);
  border-radius: 4px;
  opacity: 0.75;
  transition: width 0.2s ease;
}

.freq-count {
  width: 32px;
  text-align: right;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.freq-empty {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}
</style>
