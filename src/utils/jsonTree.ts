/**
 * JSON 树形渲染 + 折叠。
 * 折叠路径格式：$ / $.key / $[index]（含嵌套，如 $.a.b[0]）。
 * 折叠状态用 Set<string> 管理（组件内 reactive(new Set())）。
 */

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildPath(parent: string, key: string): string {
  return parent === '$' ? `$.${key}` : `${parent}.${key}`
}

/** 默认折叠：深度 ≥ collapseDepth 的节点 */
export function defaultCollapsedPaths(value: unknown, collapseDepth: number): Set<string> {
  const set = new Set<string>()
  function walk(v: unknown, path: string, depth: number) {
    if (Array.isArray(v)) {
      if (depth >= collapseDepth) set.add(path)
      v.forEach((c, i) => walk(c, `${path}[${i}]`, depth + 1))
    } else if (v !== null && typeof v === 'object') {
      if (depth >= collapseDepth) set.add(path)
      Object.entries(v).forEach(([k, c]) => walk(c, buildPath(path, k), depth + 1))
    }
  }
  walk(value, '$', 0)
  return set
}

function previewLabel(v: unknown): string {
  if (Array.isArray(v)) return v.length ? `...${v.length} items...` : '[]'
  const n = Object.keys(v as object).length
  return n ? `...${n} keys...` : '{}'
}

/** 渲染整棵 JSON 树为高亮 HTML（放入 <pre> 中使用） */
export function renderJsonTree(
  value: unknown,
  collapsed: Set<string>,
  indentSize: number,
): string {
  const renderNode = (v: unknown, path: string, depth: number): string => {
    const indent = (level: number) => ' '.repeat(level * indentSize)

    if (v === null) return '<span class="f-tok f-null">null</span>'
    if (typeof v === 'string') return `<span class="f-tok f-string">"${esc(v)}"</span>`
    if (typeof v === 'number') return `<span class="f-tok f-number">${v}</span>`
    if (typeof v === 'boolean') return `<span class="f-tok f-bool">${v}</span>`

    if (Array.isArray(v)) {
      if (v.length === 0) return '<span class="f-tok f-punct">[]</span>'
      if (collapsed.has(path)) {
        return `<span class="f-fold" data-path="${path}">[</span><span class="f-ellipsis" data-path="${path}">${esc(previewLabel(v))}</span><span class="f-tok f-punct">]</span>`
      }
      const body = v
        .map(
          (item, i) =>
            indent(depth + 1) +
            `<span class="f-tok f-index">${i}</span><span class="f-tok f-punct">:</span> ` +
            renderNode(item, `${path}[${i}]`, depth + 1),
        )
        .join(',\n')
      return `<span class="f-fold" data-path="${path}">[</span>\n${body}\n${indent(depth)}<span class="f-tok f-punct">]</span>`
    }

    if (v !== null && typeof v === 'object') {
      const entries = Object.entries(v)
      if (entries.length === 0) return '<span class="f-tok f-punct">{}</span>'
      if (collapsed.has(path)) {
        return `<span class="f-fold" data-path="${path}">{</span><span class="f-ellipsis" data-path="${path}">${esc(previewLabel(v))}</span><span class="f-tok f-punct">}</span>`
      }
      const body = entries
        .map(
          ([k, item]) =>
            indent(depth + 1) +
            `<span class="f-tok f-key">"${esc(k)}"</span><span class="f-tok f-punct">:</span> ` +
            renderNode(item, buildPath(path, k), depth + 1),
        )
        .join(',\n')
      return `<span class="f-fold" data-path="${path}">{</span>\n${body}\n${indent(depth)}<span class="f-tok f-punct">}</span>`
    }

    return esc(String(v))
  }

  return renderNode(value, '$', 0)
}
