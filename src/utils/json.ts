/**
 * JSON 语法高亮（token 级）。
 * JsonView / JsonFormatter 共用同一套高亮类名。
 * 配色（VS Code Dark 风格，在 main.css 定义）：
 *   .tok-key / .tok-string / .tok-number / .tok-bool / .tok-punct
 */
const TOKEN_RE =
  /"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b|[{}[\],:]/g

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** 字符串 token 结束后，跳过空白，其后紧跟冒号则为 key */
function isKey(code: string, end: number): boolean {
  let j = end
  while (j < code.length && /\s/.test(code[j])) j++
  return code[j] === ':'
}

export function highlightJson(code: string): string {
  let out = ''
  let last = 0
  for (const m of code.matchAll(TOKEN_RE)) {
    const i = m.index!
    const token = m[0]
    out += escapeHtml(code.slice(last, i))

    let cls: string
    if (token === '{' || token === '}' || token === '[' || token === ']' || token === ',' || token === ':') {
      cls = 'tok-punct'
    } else if (token[0] === '"') {
      cls = isKey(code, i + token.length) ? 'tok-key' : 'tok-string'
    } else if (token === 'true' || token === 'false' || token === 'null') {
      cls = 'tok-bool'
    } else {
      cls = 'tok-number'
    }
    out += `<span class="${cls}">${escapeHtml(token)}</span>`
    last = i + token.length
  }
  out += escapeHtml(code.slice(last))
  return out
}
