/**
 * Markdown 转图片的主题定义。
 * 每个主题通过 CSS 变量注入渲染容器，内置 5 套排版：
 * 简洁白 / 暖阳（小红书红） / 深夜 / 马卡龙 / 报刊。
 */

export interface MdTheme {
  id: string
  name: string
  desc: string
  /** 注入 .md-canvas 的 CSS 变量（含背景与字体） */
  vars: Record<string, string>
}

export const MD_THEMES: MdTheme[] = [
  {
    id: 'clean',
    name: '简洁白',
    desc: '白底黑字，干净通用',
    vars: {
      '--md-bg': '#ffffff',
      '--md-text': '#1f2937',
      '--md-heading': '#111827',
      '--md-muted': '#6b7280',
      '--md-link': '#2563eb',
      '--md-code-bg': '#f3f4f6',
      '--md-code-text': '#374151',
      '--md-quote-bg': '#f8fafc',
      '--md-quote-border': '#cbd5e1',
      '--md-th-bg': '#f1f5f9',
      '--md-table-border': '#e2e8f0',
      '--md-hr': '#e5e7eb',
      '--md-accent': '#2563eb',
      '--md-font': "-apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
      '--md-serif': "Georgia, 'Songti SC', 'SimSun', serif",
    },
  },
  {
    id: 'warm',
    name: '暖阳',
    desc: '米黄底红标题，小红书风格',
    vars: {
      '--md-bg': 'linear-gradient(160deg, #fff7ed 0%, #ffedd5 100%)',
      '--md-text': '#44403c',
      '--md-heading': '#b91c1c',
      '--md-muted': '#a8a29e',
      '--md-link': '#ea580c',
      '--md-code-bg': '#ffffff',
      '--md-code-text': '#7c2d12',
      '--md-quote-bg': 'rgba(254, 226, 226, 0.6)',
      '--md-quote-border': '#f87171',
      '--md-th-bg': '#fee2e2',
      '--md-table-border': '#fecaca',
      '--md-hr': '#fed7aa',
      '--md-accent': '#b91c1c',
      '--md-font': "-apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
      '--md-serif': "Georgia, 'Songti SC', 'SimSun', serif",
    },
  },
  {
    id: 'dark',
    name: '深夜',
    desc: '深色底亮字，科技感',
    vars: {
      '--md-bg': 'linear-gradient(160deg, #111827 0%, #1f2937 100%)',
      '--md-text': '#d1d5db',
      '--md-heading': '#f9fafb',
      '--md-muted': '#6b7280',
      '--md-link': '#60a5fa',
      '--md-code-bg': '#374151',
      '--md-code-text': '#e5e7eb',
      '--md-quote-bg': '#1f2937',
      '--md-quote-border': '#4b5563',
      '--md-th-bg': '#374151',
      '--md-table-border': '#4b5563',
      '--md-hr': '#374151',
      '--md-accent': '#60a5fa',
      '--md-font': "-apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
      '--md-serif': "Georgia, 'Songti SC', 'SimSun', serif",
    },
  },
  {
    id: 'macaron',
    name: '马卡龙',
    desc: '粉紫渐变，清新少女感',
    vars: {
      '--md-bg': 'linear-gradient(160deg, #fdf4ff 0%, #fce7f3 50%, #ede9fe 100%)',
      '--md-text': '#4c1d95',
      '--md-heading': '#7c3aed',
      '--md-muted': '#a78bfa',
      '--md-link': '#db2777',
      '--md-code-bg': 'rgba(255, 255, 255, 0.7)',
      '--md-code-text': '#6b21a8',
      '--md-quote-bg': 'rgba(255, 255, 255, 0.6)',
      '--md-quote-border': '#d8b4fe',
      '--md-th-bg': 'rgba(255, 255, 255, 0.6)',
      '--md-table-border': '#e9d5ff',
      '--md-hr': '#f0abfc',
      '--md-accent': '#db2777',
      '--md-font': "-apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
      '--md-serif': "Georgia, 'Songti SC', 'SimSun', serif",
    },
  },
  {
    id: 'paper',
    name: '报刊',
    desc: '米白粗黑标题，报纸排版',
    vars: {
      '--md-bg': '#fdfaf3',
      '--md-text': '#292524',
      '--md-heading': '#1c1917',
      '--md-muted': '#a8a29e',
      '--md-link': '#1d4ed8',
      '--md-code-bg': '#f5f0e8',
      '--md-code-text': '#57534e',
      '--md-quote-bg': '#f5f0e8',
      '--md-quote-border': '#a8a29e',
      '--md-th-bg': '#efe7d8',
      '--md-table-border': '#e7dfd0',
      '--md-hr': '#d6cfc0',
      '--md-accent': '#1c1917',
      '--md-font': "Georgia, 'Songti SC', 'SimSun', serif",
      '--md-serif': "Georgia, 'Songti SC', 'SimSun', serif",
    },
  },
]

/** 渲染画布宽度（px，手机竖版基准） */
export const MD_CANVAS_W = 750

/** 可选导出比例：宽 : 高 */
export const MD_RATIOS = [
  { id: '3-4', name: '3:4', w: 750, h: 1000, desc: '小红书封面' },
  { id: '1-1', name: '1:1', w: 750, h: 750, desc: '正方形' },
  { id: '9-16', name: '9:16', w: 750, h: 1333, desc: '竖屏故事' },
]
