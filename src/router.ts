import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/json' },
  { path: '/json', name: 'json', component: () => import('@/views/JsonFormatter.vue') },
  { path: '/converter', name: 'converter', component: () => import('@/views/FormatConverter.vue') },
  { path: '/time', name: 'time', component: () => import('@/views/TimeConverter.vue') },
  { path: '/diff', name: 'diff', component: () => import('@/views/DiffTool.vue') },
  { path: '/base64', name: 'base64', component: () => import('@/views/Base64Tool.vue') },
  { path: '/url', name: 'url', component: () => import('@/views/UrlTool.vue') },
  { path: '/regex', name: 'regex', component: () => import('@/views/RegexTool.vue') },
  { path: '/jwt', name: 'jwt', component: () => import('@/views/JwtTool.vue') },
  { path: '/hash', name: 'hash', component: () => import('@/views/HashTool.vue') },
  { path: '/uuid', name: 'uuid', component: () => import('@/views/UuidTool.vue') },
  { path: '/color', name: 'color', component: () => import('@/views/ColorTool.vue') },
  { path: '/curl', name: 'curl', component: () => import('@/views/CurlTool.vue') },
  { path: '/text-stats', name: 'text-stats', component: () => import('@/views/TextStats.vue') },
  { path: '/case', name: 'case', component: () => import('@/views/CaseConverter.vue') },
  { path: '/qr', name: 'qr', component: () => import('@/views/QrTool.vue') },
  { path: '/radix', name: 'radix', component: () => import('@/views/RadixTool.vue') },
  { path: '/mermaid', name: 'mermaid', component: () => import('@/views/MermaidTool.vue') },
  { path: '/md-image', name: 'md-image', component: () => import('@/views/MarkdownImage.vue') },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
