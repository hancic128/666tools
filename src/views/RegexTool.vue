<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import ViewHeader from '@/components/ViewHeader.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import Button from '@/components/Button.vue'
import { useCopy } from '@/utils/useCopy'

const pattern = ref('')
const flags = reactive({ g: true, i: false, m: false })
const text = ref('')
const { copied, copy } = useCopy()

interface MatchInfo {
  start: number
  end: number
  text: string
}

function buildFlags(): string {
  return (flags.g ? 'g' : '') + (flags.i ? 'i' : '') + (flags.m ? 'm' : '')
}

function buildRegex(): RegExp | null {
  if (!pattern.value) return null
  try {
    return new RegExp(pattern.value, buildFlags())
  } catch {
    return null
  }
}

const regexError = computed(() => {
  if (!pattern.value) return ''
  try {
    new RegExp(pattern.value, buildFlags())
    return ''
  } catch (e) {
    return (e as Error).message
  }
})

function collectMatches(t: string, re: RegExp): MatchInfo[] {
  const list: MatchInfo[] = []
  let re2: RegExp
  try {
    re2 = new RegExp(re.source, re.flags.replace(/g/g, '') + 'g')
  } catch {
    return list
  }
  let m: RegExpExecArray | null
  let guard = 0
  while ((m = re2.exec(t)) !== null) {
    if (m.index === re2.lastIndex) re2.lastIndex++
    list.push({ start: m.index, end: m.index + m[0].length, text: m[0] })
    if (++guard > 100000) break
  }
  return list
}

const matches = computed<MatchInfo[]>(() => {
  const re = buildRegex()
  if (!re || !text.value) return []
  const all = collectMatches(text.value, re)
  return flags.g ? all : all.slice(0, 1)
})

const highlightHtml = computed(() => {
  const t = text.value
  if (!t) return ''
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const re = buildRegex()
  if (!re) return esc(t)
  const ms = matches.value
  if (!ms.length) return esc(t)
  let out = ''
  let last = 0
  for (const m of ms) {
    out += esc(t.slice(last, m.start))
    out += `<mark class="match">${esc(m.text)}</mark>`
    last = m.end
  }
  out += esc(t.slice(last))
  return out
})

function copyMatches() {
  copy(matches.value.map((m) => m.text).join('\n'))
}
</script>

<template>
  <div class="tool-page">
    <ViewHeader title="正则测试" description="实时匹配高亮" tool-color="var(--tool-regex)">
      <div class="pattern-box">
        <span class="pattern-slash">/</span>
        <input v-model="pattern" class="pattern-input mono" placeholder="pattern" spellcheck="false" />
        <span class="pattern-slash">/</span>
        <div class="flag-btns">
          <button class="flag-btn" :class="{ active: flags.g }" @click="flags.g = !flags.g">g</button>
          <button class="flag-btn" :class="{ active: flags.i }" @click="flags.i = !flags.i">i</button>
          <button class="flag-btn" :class="{ active: flags.m }" @click="flags.m = !flags.m">m</button>
        </div>
      </div>
      <Button variant="primary" size="md" :disabled="!matches.length" @click="copyMatches">
        {{ copied ? '已复制!' : `复制 ${matches.length} 个匹配` }}
      </Button>
    </ViewHeader>

    <div class="split">
      <div class="panel">
        <div class="panel-header"><span class="panel-title">测试文本</span></div>
        <div class="panel-body">
          <CodeEditor v-model="text" placeholder="输入测试文本…" />
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">匹配结果</span>
          <span v-if="regexError" class="regex-error">{{ regexError }}</span>
          <span v-else class="match-count">共 {{ matches.length }} 处</span>
        </div>
        <div class="panel-body regex-output">
          <pre class="regex-text" v-html="highlightHtml"></pre>
          <div class="match-list">
            <div v-for="(m, i) in matches" :key="i" class="match-item">
              <span class="match-index">{{ i + 1 }}</span>
              <code class="match-content">{{ m.text }}</code>
              <span class="match-pos">@{{ m.start }}–{{ m.end }}</span>
            </div>
            <p v-if="!matches.length && text" class="match-empty">无匹配</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pattern-box {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.pattern-slash {
  color: var(--text-muted);
  font-weight: 600;
}

.pattern-input {
  width: 180px;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.flag-btns {
  display: flex;
  gap: 2px;
  margin-left: 4px;
}

.flag-btn {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.flag-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.flag-btn.active {
  background: var(--brand-primary);
  color: #fff;
}

.regex-error {
  font-size: var(--font-size-xs);
  color: var(--color-error);
}

.match-count {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.regex-output {
  display: flex;
  flex-direction: column;
}

.regex-text {
  flex: 1;
  min-height: 120px;
  margin: 0;
  padding: var(--space-md);
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--text-primary);
  overflow: auto;
}

.match-list {
  border-top: 1px solid var(--border);
  max-height: 180px;
  overflow: auto;
}

.match-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 4px var(--space-md);
  font-size: var(--font-size-sm);
}

.match-item:hover {
  background: var(--bg-tertiary);
}

.match-index {
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  width: 20px;
  flex-shrink: 0;
}

.match-content {
  flex: 1;
  font-family: var(--font-mono);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-pos {
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  flex-shrink: 0;
}

.match-empty {
  padding: var(--space-md);
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}
</style>

<style>
/* 高亮匹配（非 scoped，作用于 v-html 输出 <mark class="match">） */
mark.match {
  background: rgba(99, 102, 241, 0.3);
  color: var(--text-primary);
  border-radius: 2px;
}
</style>
