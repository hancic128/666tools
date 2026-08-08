<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

interface ToolItem {
  name: string
  path: string
  label: string
  color: string
  icon: string
}

const TOOLS: ToolItem[] = [
  { name: 'json', path: '/json', label: '格式化', color: 'var(--tool-json)', icon: '<path d="M8 3H7a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-4a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>' },
  { name: 'converter', path: '/converter', label: '转换', color: 'var(--tool-converter)', icon: '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>' },
  { name: 'time', path: '/time', label: '时间', color: 'var(--tool-time)', icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  { name: 'diff', path: '/diff', label: '对比', color: 'var(--tool-diff)', icon: '<path d="M7 3v6a3 3 0 0 0 3 3h4a3 3 0 0 1 3 3v6"/><path d="M17 3v6a3 3 0 0 1-3 3h-4a3 3 0 0 0-3 3v6"/><circle cx="7" cy="18" r="2.5"/><circle cx="17" cy="6" r="2.5"/>' },
  { name: 'mermaid', path: '/mermaid', label: 'Mermaid', color: 'var(--tool-mermaid)', icon: '<rect x="6" y="2.5" width="12" height="6" rx="1.5"/><rect x="3" y="15.5" width="8" height="6" rx="1.5"/><rect x="13" y="15.5" width="8" height="6" rx="1.5"/><path d="M12 8.5v4.5"/><path d="M7 15.5v-2.5h10v2.5"/>' },
  { name: 'base64', path: '/base64', label: 'Base64', color: 'var(--tool-base64)', icon: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>' },
  { name: 'url', path: '/url', label: 'URL', color: 'var(--tool-url)', icon: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>' },
  { name: 'regex', path: '/regex', label: '正则', color: 'var(--tool-regex)', icon: '<circle cx="12" cy="12" r="2.5"/><path d="M12 2.5v3"/><path d="M12 18.5v3"/><path d="M2.5 12h3"/><path d="M18.5 12h3"/><path d="m5 5 2 2"/><path d="m17 17 2 2"/><path d="m19 5-2 2"/><path d="m7 17-2 2"/>' },
  { name: 'jwt', path: '/jwt', label: 'JWT', color: 'var(--tool-jwt)', icon: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>' },
  { name: 'hash', path: '/hash', label: 'Hash', color: 'var(--tool-hash)', icon: '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>' },
  { name: 'uuid', path: '/uuid', label: 'UUID', color: 'var(--tool-uuid)', icon: '<path d="M12 10a2 2 0 0 0-2 2c0 1.5-.5 3-1.5 4.5"/><path d="M12 10a2 2 0 0 1 2 2c0 1.5.5 3 1.5 4.5"/><path d="M12 14a3 3 0 0 1-3 3c-1 0-2 1-2.5 2.5"/><path d="M12 14a3 3 0 0 0 3 3c1 0 2 1 2.5 2.5"/><path d="M7 6.5A6 6 0 0 1 18 9"/><path d="M6 10a7 7 0 0 0 .5 2.5"/>' },
  { name: 'color', path: '/color', label: '颜色', color: 'var(--tool-color)', icon: '<path d="M12 22a10 10 0 1 1 10-10c0 1.7-1.3 3-3 3h-2a2 2 0 0 0-2 2v.5c0 .8-.7 1.5-1.5 1.5H12"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="11.5" r="1"/>' },
  { name: 'curl', path: '/curl', label: 'Curl', color: 'var(--tool-curl)', icon: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>' },
  { name: 'text-stats', path: '/text-stats', label: '统计', color: 'var(--tool-stats)', icon: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>' },
  { name: 'case', path: '/case', label: '命名', color: 'var(--tool-case)', icon: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>' },
  { name: 'qr', path: '/qr', label: '二维码', color: 'var(--tool-qr)', icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/>' },
  { name: 'radix', path: '/radix', label: '进制', color: 'var(--tool-radix)', icon: '<rect x="8" y="2" width="8" height="4" rx="1"/><rect x="8" y="18" width="8" height="4" rx="1"/><line x1="4" y1="8" x2="4" y2="10"/><line x1="20" y1="8" x2="20" y2="10"/><line x1="4" y1="14" x2="4" y2="16"/><line x1="20" y1="14" x2="20" y2="16"/>' },
]

const route = useRoute()

const expanded = ref(false)
const pinned = ref(localStorage.getItem('666tools-sidebar-pinned') === '1')
const theme = ref<'light' | 'dark' | 'system'>(initTheme())

function initTheme(): 'light' | 'dark' | 'system' {
  const t = localStorage.getItem('666tools-theme')
  return t === 'dark' || t === 'light' ? t : 'system'
}

function applyTheme(t: 'light' | 'dark' | 'system') {
  const root = document.documentElement
  root.classList.toggle('dark', t === 'dark')
  root.classList.toggle('light', t === 'light')
}

applyTheme(theme.value)

const collapsed = computed(() => !expanded.value && !pinned.value)

const sidebarWidth = () => (expanded.value || pinned.value ? 'var(--sidebar-expanded)' : 'var(--sidebar-collapsed)')

function onEnter() {
  expanded.value = true
}
function onLeave() {
  expanded.value = pinned.value
}
function togglePin() {
  pinned.value = !pinned.value
  localStorage.setItem('666tools-sidebar-pinned', pinned.value ? '1' : '0')
  if (!pinned.value) expanded.value = false
}
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('666tools-theme', theme.value)
  applyTheme(theme.value)
}

const isDark = () => theme.value === 'dark' || (theme.value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

const isActive = (tool: ToolItem) => route.name === tool.name

const media = window.matchMedia('(prefers-color-scheme: dark)')
function onSystemChange() {
  // 系统模式下的自动跟随
  if (theme.value === 'system') applyTheme('system')
}
onMounted(() => media.addEventListener('change', onSystemChange))
onBeforeUnmount(() => media.removeEventListener('change', onSystemChange))
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }" :style="{ width: sidebarWidth() }" @mouseenter="onEnter" @mouseleave="onLeave">
    <div class="sidebar-brand">
      <div class="brand-logo" :style="{ background: 'var(--brand-primary)' }">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </div>
      <span v-if="expanded || pinned" class="brand-name">开发者工具箱</span>
    </div>

    <nav class="sidebar-nav">
      <RouterLink
        v-for="tool in TOOLS"
        :key="tool.name"
        :to="tool.path"
        class="nav-item"
        :class="{ active: isActive(tool) }"
      >
        <span class="nav-icon" :style="{ color: tool.color }">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="tool.icon"></svg>
        </span>
        <span v-if="expanded || pinned" class="nav-label">{{ tool.label }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <button class="footer-btn" :class="{ active: pinned }" :title="pinned ? '取消固定' : '固定侧边栏'" @click="togglePin">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 17v5" />
          <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z" />
        </svg>
      </button>
      <button class="footer-btn" :title="isDark() ? '切换到亮色' : '切换到暗色'" @click="toggleTheme">
        <svg v-if="isDark()" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  transition: width 0.2s ease;
  overflow: hidden;
  flex-shrink: 0;
  z-index: 10;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-sm);
  height: 52px;
  flex-shrink: 0;
}

.brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.brand-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: 2px;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.sidebar-nav::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-nav::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 3px;
}

/* 悬停侧边栏时显示滚动条 */
.sidebar:hover .sidebar-nav {
  scrollbar-color: var(--bg-hover) transparent;
}
.sidebar:hover .sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--bg-hover);
}
.sidebar:hover .sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* 折叠态：图标居中、去掉横向内边距 */
.sidebar.collapsed .sidebar-brand {
  justify-content: center;
  padding: var(--space-md) 0;
}
.sidebar.collapsed .sidebar-nav {
  padding: 0;
}
.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 8px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 8px var(--space-sm);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: rgba(99, 102, 241, 0.14);
  color: var(--text-primary);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.nav-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.sidebar-footer {
  display: flex;
  justify-content: space-around;
  padding: var(--space-md) var(--space-sm);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.footer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.footer-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.footer-btn.active {
  background: rgba(99, 102, 241, 0.16);
  color: var(--brand-primary);
}

.footer-btn.active:hover {
  background: rgba(99, 102, 241, 0.22);
  color: var(--brand-primary-dark);
}
</style>
