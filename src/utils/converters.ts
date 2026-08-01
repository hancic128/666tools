/**
 * 格式互转：JSON ↔ JSON String ↔ YAML ↔ Python Dict。
 * YAML 解析为手写简易实现，支持缩进层级 / 列表 / 标量 / 引号字符串。
 */

export type ConvFormat = 'json' | 'json-string' | 'yaml' | 'python'

export const CONV_FORMATS: { value: ConvFormat; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'json-string', label: 'JSON String' },
  { value: 'yaml', label: 'YAML' },
  { value: 'python', label: 'Python Dict' },
]

/* ================= 解析 ================= */

export function parseSource(text: string, format: ConvFormat): unknown {
  switch (format) {
    case 'json':
      return JSON.parse(text)
    case 'json-string':
      return parseJsonString(text)
    case 'yaml':
      return parseYaml(text)
    case 'python':
      return parsePython(text)
  }
}

function parseJsonString(text: string): unknown {
  const first = JSON.parse(text)
  if (typeof first === 'string') {
    try {
      return JSON.parse(first)
    } catch {
      return first
    }
  }
  return first
}

/* ---------------- YAML ---------------- */

interface YamlLine {
  indent: number
  raw: string
}

function findColon(s: string): number {
  let inStr: string | null = null
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inStr) {
      if (c === '\\') i++
      else if (c === inStr) inStr = null
    } else if (c === '"' || c === "'") {
      inStr = c
    } else if (c === ':') {
      return i
    }
  }
  return -1
}

function unquoteScalar(s: string): string {
  const t = s.trim()
  if (t.length >= 2 && t[0] === t[t.length - 1] && (t[0] === '"' || t[0] === "'")) {
    return t.slice(1, -1)
  }
  return t
}

function parseScalar(s: string): unknown {
  const t = s.trim()
  if (!t) return null
  if (t === 'null' || t === '~' || t === 'Null' || t === 'NULL') return null
  if (t === 'true' || t === 'True' || t === 'TRUE') return true
  if (t === 'false' || t === 'False' || t === 'FALSE') return false
  if (/^-?\d+$/.test(t)) return Number(t)
  if (/^-?\d*\.\d+$/.test(t)) return Number(t)
  if (t[0] === '"' && t[t.length - 1] === '"') return t.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  if (t[0] === "'" && t[t.length - 1] === "'") return t.slice(1, -1)
  return t
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v)

function parseBlock(lines: YamlLine[], i: number, indent: number): { value: unknown; next: number } {
  if (i < lines.length && lines[i].indent === indent && lines[i].raw.startsWith('- ')) {
    return parseList(lines, i, indent)
  }
  return parseMap(lines, i, indent)
}

function parseMap(lines: YamlLine[], i: number, indent: number): { value: unknown; next: number } {
  const map: Record<string, unknown> = {}
  while (i < lines.length && lines[i].indent === indent) {
    const raw = lines[i].raw
    if (raw.startsWith('- ')) break
    const ci = findColon(raw)
    if (ci < 0) {
      i++
      continue
    }
    const key = unquoteScalar(raw.slice(0, ci))
    let rest = raw.slice(ci + 1).trimStart()
    if (rest === '') {
      if (i + 1 < lines.length && lines[i + 1].indent > indent) {
        const r = parseBlock(lines, i + 1, lines[i + 1].indent)
        map[key] = r.value
        i = r.next
      } else {
        map[key] = null
        i++
      }
    } else {
      map[key] = parseScalar(rest)
      i++
    }
  }
  return { value: map, next: i }
}

function parseList(lines: YamlLine[], i: number, indent: number): { value: unknown; next: number } {
  const items: unknown[] = []
  while (i < lines.length && lines[i].indent === indent && lines[i].raw.startsWith('- ')) {
    const content = lines[i].raw.slice(2).trimStart()
    if (content === '') {
      if (i + 1 < lines.length && lines[i + 1].indent > indent) {
        const r = parseBlock(lines, i + 1, lines[i + 1].indent)
        items.push(r.value)
        i = r.next
      } else {
        items.push(null)
        i++
      }
      continue
    }
    const ci = findColon(content)
    if (ci >= 0) {
      // 内联 map 首项，后续同级缩进为其其余键
      const subIndent = indent + 2
      const map: Record<string, unknown> = {}
      const key = unquoteScalar(content.slice(0, ci))
      const rest = content.slice(ci + 1).trimStart()
      map[key] = rest === '' ? null : parseScalar(rest)
      i++
      while (i < lines.length && lines[i].indent === subIndent && !lines[i].raw.startsWith('- ')) {
        const c = lines[i].raw
        const c2 = findColon(c)
        if (c2 >= 0) {
          const k2 = unquoteScalar(c.slice(0, c2))
          const v2 = c.slice(c2 + 1).trimStart()
          map[k2] = v2 === '' ? null : parseScalar(v2)
        }
        i++
      }
      items.push(map)
    } else {
      items.push(parseScalar(content))
      i++
    }
  }
  return { value: items, next: i }
}

export function parseYaml(text: string): unknown {
  const lines: YamlLine[] = []
  for (const line of text.split('\n')) {
    const trimmed = line.trimEnd()
    const content = trimmed.trimStart()
    if (!content || content.startsWith('#')) continue
    lines.push({ indent: trimmed.length - content.length, raw: content })
  }
  if (!lines.length) return null
  return parseBlock(lines, 0, lines[0].indent).value
}

/* ---------------- Python ---------------- */

function pythonToJsonText(text: string): string {
  let out = ''
  let i = 0
  const n = text.length
  // dict(...) 未闭合数 + 参数内普通括号深度（区分 dict 的 ) 与值里的 )）
  let dictDepth = 0
  let rawDepth = 0
  while (i < n) {
    const ch = text[i]
    if (ch === "'" || ch === '"') {
      const quote = ch
      let j = i + 1
      let buf = '"'
      while (j < n) {
        if (text[j] === '\\') {
          const c = text[j + 1]
          if (quote === "'" && c === "'") {
            buf += "'"
            j += 2
            continue
          }
          buf += c === '"' ? '\\"' : '\\' + c
          j += 2
          continue
        }
        if (text[j] === quote) break
        buf += text[j]
        j++
      }
      buf += '"'
      out += buf
      i = Math.min(n, j + 1)
      continue
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i
      while (j < n && /[A-Za-z0-9_]/.test(text[j])) j++
      const word = text.slice(i, j)
      // dict(...) → { }
      let k = j
      while (k < n && /\s/.test(text[k])) k++
      if (word === 'dict' && text[k] === '(') {
        out += '{'
        dictDepth++
        i = k + 1
        continue
      }
      // dict 参数列表内的 key=value → "key": value
      let eq = false
      if (dictDepth > 0) {
        let m = j
        while (m < n && /\s/.test(text[m])) m++
        if (text[m] === '=') eq = true
      }
      if (word === 'True') out += 'true'
      else if (word === 'False') out += 'false'
      else if (word === 'None') out += 'null'
      else if (eq) out += `"${word}":`
      else out += `"${word}"`
      if (eq) {
        let m = j
        while (m < n && /\s/.test(text[m])) m++
        i = m + 1
      } else {
        i = j
      }
      continue
    }
    if (ch === '(' && dictDepth > 0) {
      // 参数值里的普通括号（如 tuple）：原样保留并计数
      out += '('
      rawDepth++
      i++
      continue
    }
    if (ch === ')' && dictDepth > 0) {
      if (rawDepth > 0) {
        out += ')'
        rawDepth--
      } else {
        out += '}'
        dictDepth--
      }
      i++
      continue
    }
    out += ch
    i++
  }
  return out.replace(/,\s*([}\]])/g, '$1')
}

export function parsePython(text: string): unknown {
  return JSON.parse(pythonToJsonText(text))
}

/* ================= 序列化 ================= */

export function serializeValue(value: unknown, format: ConvFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(value, null, 2)
    case 'json-string':
      return JSON.stringify(JSON.stringify(value, null, 2))
    case 'yaml':
      return yamlSerialize(value, 0)
    case 'python':
      return pythonSerialize(value)
  }
}

const inline = (v: unknown): string => {
  if (v === null) return 'null'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'string') {
    if (!v || /^[!&*?|>%@`"']|[:#]|\s$|^\s/.test(v)) return JSON.stringify(v)
    return v
  }
  if (Array.isArray(v)) return JSON.stringify(v)
  if (isObj(v)) return JSON.stringify(v)
  return String(v)
}

function yamlSerialize(value: unknown, indent: number): string {
  const pad = ' '.repeat(indent)
  const pad2 = ' '.repeat(indent + 2)
  if (value === null) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return inline(value)

  if (Array.isArray(value)) {
    if (!value.length) return '[]'
    return value
      .map((item) => {
        if (isObj(item)) {
          const entries = Object.entries(item)
          if (!entries.length) return pad + '- {}'
          const [k0, v0] = entries[0]
          let s = pad + `- ${k0}: ${inline(v0)}`
          for (const [k, v] of entries.slice(1)) s += '\n' + pad2 + `${k}: ${inline(v)}`
          return s
        }
        if (Array.isArray(item)) return pad + '- ' + yamlSerialize(item, indent + 2).trimStart()
        return pad + '- ' + inline(item)
      })
      .join('\n')
  }

  const entries = Object.entries(value as Record<string, unknown>)
  if (!entries.length) return '{}'
  return entries
    .map(([k, v]) => {
      if (isObj(v)) return pad + `${k}:\n` + yamlSerialize(v, indent + 2)
      if (Array.isArray(v)) return pad + `${k}:\n` + yamlSerialize(v, indent + 2)
      return pad + `${k}: ${inline(v)}`
    })
    .join('\n')
}

const validIdent = /^[A-Za-z_][A-Za-z0-9_]*$/

function pythonSerialize(value: unknown): string {
  if (value === null) return 'None'
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return JSON.stringify(value).replace(/"/g, "'")
  if (Array.isArray(value)) return '[' + value.map(pythonSerialize).join(', ') + ']'
  const entries = Object.entries(value as Record<string, unknown>)
  const body = entries
    .map(([k, v]) =>
      validIdent.test(k) ? `${k}=${pythonSerialize(v)}` : `'${k}': ${pythonSerialize(v)}`,
    )
    .join(', ')
  return `dict(${body})`
}
