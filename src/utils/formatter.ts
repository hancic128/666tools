/**
 * 代码格式化 + 语法高亮（SQL / Python / XML / HTML / YAML）。
 * 高亮输出已转义 HTML，类名 f-tok / f-keyword / f-string / f-number /
 * f-bool / f-null / f-key / f-comment / f-builtin / f-decorator / f-tag / f-attr。
 */
import { formatDialect, mysql } from 'sql-formatter'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/* ---------------- SQL ---------------- */

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'INSERT', 'INTO', 'VALUES',
  'UPDATE', 'SET', 'DELETE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER',
  'CROSS', 'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION',
  'ALL', 'DISTINCT', 'AS', 'ASC', 'DESC', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'PRIMARY', 'KEY', 'FOREIGN',
  'REFERENCES', 'NULL', 'IS', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'COUNT', 'SUM',
  'AVG', 'MIN', 'MAX', 'BEGIN', 'COMMIT', 'ROLLBACK', 'TRUNCATE', 'DEFAULT', 'UNIQUE',
  'WITH', 'RECURSIVE', 'EXCEPT', 'INTERSECT', 'MERGE', 'RETURNING', 'CONFLICT',
  'OVER', 'PARTITION', 'WINDOW', 'ROWS', 'RANGE', 'UNBOUNDED', 'PRECEDING',
  'FOLLOWING', 'CURRENT', 'ROW', 'LATERAL', 'FETCH', 'FIRST', 'NEXT', 'ONLY',
  'VIEW', 'REPLACE', 'TRIGGER', 'PROCEDURE', 'FUNCTION', 'SEQUENCE', 'SCHEMA',
  'GRANT', 'REVOKE', 'USING', 'NATURAL', 'IGNORE', 'DUPLICATE',
  'TINYINT', 'SMALLINT', 'MEDIUMINT', 'BIGINT', 'INT', 'INTEGER', 'DECIMAL',
  'NUMERIC', 'FLOAT', 'DOUBLE', 'REAL', 'BOOLEAN', 'BIT', 'DATETIME', 'TIMESTAMP',
  'TIME', 'YEAR', 'CHAR', 'VARCHAR', 'TEXT', 'BLOB', 'ENUM', 'JSON',
  'AUTO_INCREMENT', 'ENGINE', 'CHARSET', 'COLLATE', 'COMMENT', 'LOCK', 'SHARE',
  'DUPLICATE', 'DISTRIBUTED', 'HASH', 'BUCKETS', 'PROPERTIES', 'OLAP', 'LESS', 'THAN',
])

function tokenizeSql(sql: string): string[] {
  const tokens: string[] = []
  let i = 0
  const n = sql.length
  while (i < n) {
    const ch = sql[i]
    if (ch === '-' && sql[i + 1] === '-') {
      let j = i + 2
      while (j < n && sql[j] !== '\n') j++
      tokens.push(sql.slice(i, j))
      i = j
      continue
    }
    if (ch === "'" || ch === '"') {
      const quote = ch
      let j = i + 1
      let buf = ch
      while (j < n) {
        if (sql[j] === '\\') {
          buf += sql.slice(j, j + 2)
          j += 2
          continue
        }
        buf += sql[j]
        if (sql[j] === quote) break
        j++
      }
      tokens.push(buf)
      i = Math.min(n, j + 1)
      continue
    }
    if (/[A-Za-z0-9_]/.test(ch)) {
      let j = i
      while (j < n && /[A-Za-z0-9_]/.test(sql[j])) j++
      tokens.push(sql.slice(i, j))
      i = j
      continue
    }
    if (/\s/.test(ch)) {
      let j = i
      let hasNl = false
      while (j < n && /\s/.test(sql[j])) {
        if (sql[j] === '\n') hasNl = true
        j++
      }
      tokens.push(hasNl ? '\n' : sql.slice(i, j))
      i = j
      continue
    }
    tokens.push(ch)
    i++
  }
  return tokens
}

/**
 * SQL 格式化：基于 sql-formatter（MySQL 方言）。
 * 关键字统一大写；缩进宽度由 UI 的 indentSize 传入（2 / 4 空格）。
 * Doris/StarRocks 特有语法（DUPLICATE KEY、VALUES [ 分区、PROPERTIES 等）
 * sql-formatter 无法识别，直接走 fallbackFormatSql 保留原有换行与缩进；
 * 其他解析失败的语法同样降级，保证不抛错。
 */
export function formatSql(sql: string, indentSize = 2): string {
  const cleaned = cleanBackticks(sql)
  if (DORIS_HINTS.test(cleaned)) return fallbackFormatSql(cleaned)
  try {
    return formatDialect(cleaned, {
      dialect: mysql,
      keywordCase: 'upper',
      tabWidth: indentSize,
    })
  } catch {
    return fallbackFormatSql(cleaned)
  }
}

/** Doris/StarRocks 特有语法特征 */
const DORIS_HINTS = /\b(DUPLICATE KEY|DISTRIBUTED BY|ENGINE\s*=\s*OLAP|PROPERTIES|VALUES\s*\[)/i

/** 清理反引号标识符内部的首尾空白：` x ` → `x` */
function cleanBackticks(sql: string): string {
  return sql.replace(/`[^`\n]*`/g, (m) => {
    const inner = m.slice(1, -1).trim()
    return inner ? '`' + inner + '`' : m
  })
}

/**
 * 宽松兜底格式化：sql-formatter 无法解析的语法（Doris 分区 `VALUES [ (...)`、
 * 方括号列表等）走这里。保留输入的换行结构，按括号深度补缩进、
 * 关键字大写，保证不抛错且缩进正常。
 */
function fallbackFormatSql(sql: string): string {
  const out: string[] = []
  let depth = 0 // 当前括号深度（( [）
  let backtick = false // 是否在反引号标识符内
  let lineStart = true
  for (const t of tokenizeSql(sql)) {
    if (t === '\n') {
      if (out.length && out[out.length - 1] !== '\n') out.push('\n')
      lineStart = true
      continue
    }
    if (t.trim() === '') continue
    let disp = t
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(disp)) {
      const u = disp.toUpperCase()
      if (SQL_KEYWORDS.has(u)) disp = u
    }
    // 闭合括号：先减深度再输出（决定本行行首缩进）
    if (disp === ')' || disp === ']') depth = Math.max(0, depth - 1)
    if (lineStart) {
      if (depth > 0) out.push(' '.repeat(depth * 2))
      lineStart = false
    }
    // 反引号块状态：开反引号后内部 token 紧贴，闭反引号紧贴后恢复空格
    const closingBt = disp === '`' && backtick
    const inBt = backtick
    if (disp === '`') backtick = !backtick
    const last = out[out.length - 1]
    const noSpace =
      inBt || closingBt || // 反引号标识符内部：`x`
      disp === ',' || disp === ')' || disp === ']' || disp === ';' || disp === '.' ||
      last === undefined ||
      last === '(' || last === '[' || last === '.' || last === '\n' || last.endsWith(' ')
    if (!noSpace) out.push(' ')
    out.push(disp)
    if (disp === '(' || disp === '[') depth++
  }
  return out.join('').trim()
}

export function highlightSql(code: string): string {
  return tokenizeSql(code)
    .map((t) => {
      if (t === '\n') return '\n'
      if (t.trim() === '') return esc(t)
      if (t.startsWith('--')) return `<span class="f-tok f-comment">${esc(t)}</span>`
      if (t[0] === "'" || t[0] === '"') return `<span class="f-tok f-string">${esc(t)}</span>`
      if (/^\d/.test(t)) return `<span class="f-tok f-number">${esc(t)}</span>`
      const upper = t.toUpperCase()
      if (SQL_KEYWORDS.has(upper)) return `<span class="f-tok f-keyword">${esc(upper)}</span>`
      return esc(t)
    })
    .join('')
}

/* ---------------- Python ---------------- */

const PY_KEYWORDS = new Set([
  'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break',
  'continue', 'pass', 'import', 'from', 'as', 'try', 'except', 'finally', 'with',
  'lambda', 'yield', 'global', 'nonlocal', 'assert', 'raise', 'del', 'not', 'and',
  'or', 'in', 'is', 'async', 'await', 'match', 'case', 'None', 'True', 'False',
])

const PY_BUILTINS = new Set([
  'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple',
  'type', 'isinstance', 'sum', 'min', 'max', 'abs', 'enumerate', 'zip', 'map',
  'filter', 'sorted', 'open', 'input', 'repr', 'bool', 'object', 'Exception',
])

function tokenizePy(code: string): string[] {
  const tokens: string[] = []
  let i = 0
  const n = code.length
  while (i < n) {
    const ch = code[i]
    if (ch === '#') {
      let j = i
      while (j < n && code[j] !== '\n') j++
      tokens.push(code.slice(i, j))
      i = j
      continue
    }
    if (ch === '@' || (code.startsWith('"""', i)) || (code.startsWith("'''", i))) {
      // decorator
      if (ch === '@' && /[A-Za-z_.]/.test(code[i + 1] ?? '')) {
        let j = i
        while (j < n && !/\s/.test(code[j])) j++
        tokens.push(code.slice(i, j))
        i = j
        continue
      }
    }
    if (code.startsWith('"""', i) || code.startsWith("'''", i)) {
      const q = code.slice(i, i + 3)
      let j = i + 3
      while (j < n && !code.startsWith(q, j)) j++
      tokens.push(code.slice(i, Math.min(n, j + 3)))
      i = Math.min(n, j + 3)
      continue
    }
    if (ch === "'" || ch === '"') {
      const quote = ch
      let j = i + 1
      let buf = ch
      while (j < n) {
        if (code[j] === '\\') {
          buf += code.slice(j, j + 2)
          j += 2
          continue
        }
        buf += code[j]
        if (code[j] === quote) break
        j++
      }
      tokens.push(buf)
      i = Math.min(n, j + 1)
      continue
    }
    if (/[A-Za-z0-9_]/.test(ch)) {
      let j = i
      while (j < n && /[A-Za-z0-9_]/.test(code[j])) j++
      tokens.push(code.slice(i, j))
      i = j
      continue
    }
    if (/\s/.test(ch)) {
      let j = i
      while (j < n && /\s/.test(code[j])) j++
      tokens.push(code.slice(i, j))
      i = j
      continue
    }
    tokens.push(ch)
    i++
  }
  return tokens
}

/** Python 格式化：清理尾随空格、压缩多余空行（非真实重排缩进） */
export function formatPython(code: string, _indentSize = 2): string {
  const lines = code.split('\n').map((l) => l.replace(/\s+$/, ''))
  const cleaned: string[] = []
  let blank = 0
  for (const line of lines) {
    if (line.trim() === '') {
      blank++
      if (blank <= 2) cleaned.push('')
    } else {
      blank = 0
      cleaned.push(line)
    }
  }
  while (cleaned.length && cleaned[cleaned.length - 1].trim() === '') cleaned.pop()
  return cleaned.join('\n') + '\n'
}

export function highlightPython(code: string): string {
  return tokenizePy(code)
    .map((t) => {
      if (t.trim() === '') return esc(t)
      if (t.startsWith('#')) return `<span class="f-tok f-comment">${esc(t)}</span>`
      if (t.startsWith('@')) return `<span class="f-tok f-decorator">${esc(t)}</span>`
      if (t.startsWith('"""') || t.startsWith("'''") || t[0] === "'" || t[0] === '"') {
        return `<span class="f-tok f-string">${esc(t)}</span>`
      }
      if (/^\d/.test(t)) return `<span class="f-tok f-number">${esc(t)}</span>`
      if (PY_KEYWORDS.has(t)) return `<span class="f-tok f-keyword">${esc(t)}</span>`
      if (PY_BUILTINS.has(t)) return `<span class="f-tok f-builtin">${esc(t)}</span>`
      return esc(t)
    })
    .join('')
}

/* ---------------- XML / HTML ---------------- */

function prettyXmlLike(xml: string, mime: 'text/xml' | 'text/html'): string {
  const doc = new DOMParser().parseFromString(xml, mime)
  if (mime === 'text/xml') {
    const err = doc.querySelector('parsererror')
    if (err) throw new Error('XML 解析错误')
  }
  const out: string[] = []
  const walk = (node: Node, depth: number) => {
    const pad = ' '.repeat(depth * 2)
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      const tagName = mime === 'text/html' ? el.tagName.toLowerCase() : el.tagName
      const attrs = Array.from(el.attributes)
        .map((a) => ` ${a.name}="${a.value}"`)
        .join('')
      const children = Array.from(el.childNodes)
      const hasElement = children.some((c) => c.nodeType === Node.ELEMENT_NODE)
      if (!hasElement) {
        const text = children
          .filter((c) => c.nodeType === Node.TEXT_NODE)
          .map((c) => (c.textContent ?? '').trim())
          .join('')
        out.push(text ? `${pad}<${tagName}${attrs}>${esc(text)}</${tagName}>` : `${pad}<${tagName}${attrs} />`)
        return
      }
      out.push(`${pad}<${tagName}${attrs}>`)
      for (const c of children) walk(c, depth + 1)
      out.push(`${pad}</${tagName}>`)
    } else if (node.nodeType === Node.TEXT_NODE) {
      const t = (node.textContent ?? '').trim()
      if (t) out.push(`${pad}${esc(t)}`)
    } else if (node.nodeType === Node.COMMENT_NODE) {
      out.push(`${pad}<!--${node.textContent}-->`)
    }
  }
  walk(doc.documentElement, 0)
  return out.join('\n')
}

export function formatXml(xml: string): string {
  return prettyXmlLike(xml, 'text/xml')
}

export function formatHtml(html: string): string {
  return prettyXmlLike(html, 'text/html')
}

function highlightTag(tag: string): string {
  let s = tag.replace(/\s+([\w:-]+)=("([^"]*)"|'([^']*)')/g, (_, name, __, dv, sv) => {
    const val = dv !== undefined ? dv : sv
    return ` <span class="f-tok f-attr">${esc(name)}</span><span class="f-tok f-punct">=</span><span class="f-tok f-string">"${esc(val)}"</span>`
  })
  s = s.replace(/^<\/?([a-zA-Z][\w:-]*)/, (m, name) => {
    const open = m.startsWith('</') ? '</' : '<'
    return `<span class="f-tok f-punct">${esc(open)}</span><span class="f-tok f-tag">${esc(name)}</span>`
  })
  s = s.replace(/\s*(\/?>)$/, (_, close) => esc(close))
  return s
}

export function highlightXml(code: string): string {
  const parts = code.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) ?? []
  return parts
    .map((p) => {
      if (p.startsWith('<!--')) return `<span class="f-tok f-comment">${esc(p)}</span>`
      if (p.startsWith('<')) return highlightTag(p)
      return esc(p)
    })
    .join('')
}

/* ---------------- YAML ---------------- */

/** 标量值类型（null / 布尔 / 数字 / 纯字符串） */
function yamlScalarType(v: string): string | null {
  const t = v.trim()
  if (!t) return 'f-string'
  if (t === 'null' || t === '~' || t === 'Null' || t === 'NULL') return 'f-null'
  if (t === 'true' || t === 'True' || t === 'TRUE' || t === 'false' || t === 'False' || t === 'FALSE') return 'f-bool'
  if (/^-?\d+$/.test(t) || /^-?\d*\.\d+$/.test(t) || /^[-+]?\d+(\.\d+)?[eE][+-]?\d+$/.test(t)) return 'f-number'
  if (t[0] === '"' || t[0] === "'") return 'f-string'
  return null
}

export function highlightYaml(code: string): string {
  return code
    .split('\n')
    .map((line) => {
      if (!line.trim()) return ''
      const indent = line.match(/^\s*/)![0]
      // 列表项：- key: value 或 - value
      const list = line.match(/^(\s*-\s+)(.*)$/)
      if (list) {
        const rest = list[2]
        const kv = rest.match(/^([^:]+):\s*(.*)$/)
        if (kv) {
          const key = kv[1].trim()
          const val = kv[2]
          const st = yamlScalarType(val)
          const keyHtml = `<span class="f-tok f-key">${esc(key)}</span>`
          return `${esc(indent)}${esc('-')} ${keyHtml}<span class="f-tok f-punct">:</span>${st ? ` <span class="f-tok ${st}">${esc(val)}</span>` : (val ? ` ${esc(val)}` : '')}`
        }
        const st = yamlScalarType(rest)
        return `${esc(indent)}${esc('-')}${st ? ` <span class="f-tok ${st}">${esc(rest)}</span>` : ` ${esc(rest)}`}`
      }
      // 普通行：key: value
      const kv = line.match(/^(\s*)([^:]+):(?:\s*(.*))?$/)
      if (kv) {
        const key = kv[2].trim()
        const val = kv[3] ?? ''
        // 空值行（嵌套结构在下一行）：不加尾随空格/空 span
        const st = val ? yamlScalarType(val) : null
        return `${esc(kv[1])}<span class="f-tok f-key">${esc(key)}</span><span class="f-tok f-punct">:</span>${st ? ` <span class="f-tok ${st}">${esc(val)}</span>` : (val ? ` ${esc(val)}` : '')}`
      }
      return esc(line)
    })
    .join('\n')
}
