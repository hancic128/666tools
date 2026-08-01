/** Curl 命令解析 + 生成 4 种语言代码 */

export interface ParsedCurl {
  url: string
  method: string
  headers: { name: string; value: string }[]
  data: string
  auth: string
  insecure: boolean
}

function tokenizeCurl(cmd: string): string[] {
  const tokens: string[] = []
  let i = 0
  const n = cmd.length
  while (i < n) {
    while (i < n && /\s/.test(cmd[i])) i++
    if (i >= n) break
    let buf = ''
    while (i < n && !/\s/.test(cmd[i])) {
      const c = cmd[i]
      if (c === '"' || c === "'") {
        const quote = c
        i++
        while (i < n && cmd[i] !== quote) {
          buf += cmd[i]
          i++
        }
        i++
      } else {
        buf += c
        i++
      }
    }
    tokens.push(buf)
  }
  return tokens
}

export function parseCurl(cmd: string): ParsedCurl {
  const result: ParsedCurl = {
    url: '',
    method: 'GET',
    headers: [],
    data: '',
    auth: '',
    insecure: false,
  }
  const tokens = tokenizeCurl(cmd)
  let i = 0
  while (i < tokens.length) {
    const t = tokens[i]
    const val = () => tokens[i + 1] ?? ''
    switch (t) {
      case 'curl':
      case '-k':
      case '--insecure':
      case '-s':
      case '--silent':
      case '-L':
      case '--location':
      case '-v':
      case '--verbose':
        if (t === '-k' || t === '--insecure') result.insecure = true
        i++
        break
      case '-X':
      case '--request':
        result.method = val().toUpperCase() || 'GET'
        i += 2
        break
      case '-H':
      case '--header': {
        const h = val()
        const idx = h.indexOf(':')
        if (idx >= 0) {
          result.headers.push({ name: h.slice(0, idx).trim(), value: h.slice(idx + 1).trim() })
        }
        i += 2
        break
      }
      case '-d':
      case '--data':
      case '--data-raw':
      case '--data-binary':
      case '--data-urlencode':
        result.data = result.data ? `${result.data}&${val()}` : val()
        i += 2
        break
      case '-u':
      case '--user':
        result.auth = val()
        i += 2
        break
      case '-F':
      case '--form':
        i += 2
        break
      default:
        if (t.startsWith('http://') || t.startsWith('https://')) {
          result.url = t
        }
        i++
        break
    }
  }
  return result
}

const escJs = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

const escPy = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

const splitAuth = (auth: string): [string, string] => {
  const i = auth.indexOf(':')
  return i >= 0 ? [auth.slice(0, i), auth.slice(i + 1)] : [auth, '']
}

export function toFetch(c: ParsedCurl): string {
  const lines: string[] = []
  lines.push(`const response = await fetch("${c.url}", {`)
  lines.push(`  method: "${c.method}",`)
  if (c.headers.length) {
    lines.push(`  headers: {`)
    for (const h of c.headers) lines.push(`    "${h.name}": "${escJs(h.value)}",`)
    lines.push(`  },`)
  }
  if (c.data) lines.push(`  body: "${escJs(c.data)}",`)
  lines.push(`});`)
  lines.push(`const data = await response.json();`)
  return lines.join('\n')
}

export function toAxios(c: ParsedCurl): string {
  const lines: string[] = []
  lines.push(`const response = await axios({`)
  lines.push(`  method: "${c.method}",`)
  lines.push(`  url: "${c.url}",`)
  if (c.headers.length) {
    lines.push(`  headers: {`)
    for (const h of c.headers) lines.push(`    "${h.name}": "${escJs(h.value)}",`)
    lines.push(`  },`)
  }
  if (c.data) lines.push(`  data: "${escJs(c.data)}",`)
  lines.push(`});`)
  return lines.join('\n')
}

export function toPython(c: ParsedCurl): string {
  const lines: string[] = []
  lines.push(`import requests`)
  lines.push('')
  const [user, pass] = splitAuth(c.auth)
  if (c.auth) lines.push(`auth = ("${escPy(user)}", "${escPy(pass)}")`)
  if (c.headers.length) {
    lines.push(`headers = {`)
    for (const h of c.headers) lines.push(`    "${h.name}": "${escPy(h.value)}",`)
    lines.push(`}`)
  }
  const args: string[] = [`"${c.method}"`, `"${c.url}"`]
  if (c.auth) args.push(`auth=auth`)
  if (c.headers.length) args.push(`headers=headers`)
  if (c.data) {
    const isJson = c.headers.some((h) => h.name.toLowerCase() === 'content-type' && h.value.includes('json'))
    args.push(isJson ? `json=${c.data}` : `data="${escPy(c.data)}"`)
  }
  lines.push(`response = requests.request(${args.join(', ')})`)
  return lines.join('\n')
}

export function toGo(c: ParsedCurl): string {
  const [user, pass] = splitAuth(c.auth)
  const lines: string[] = []
  lines.push(`package main`)
  lines.push('')
  lines.push(`import (`)
  lines.push(`  "fmt"`)
  lines.push(`  "io"`)
  lines.push(`  "net/http"`)
  if (c.data) lines.push(`  "strings"`)
  lines.push(`)`)
  lines.push('')
  lines.push(`func main() {`)
  lines.push(`  url := "${c.url}"`)
  if (c.data) {
    lines.push(`  body := strings.NewReader("${escGo(c.data)}")`)
  } else {
    lines.push(`  var body io.Reader`)
  }
  lines.push(`  req, err := http.NewRequest("${c.method}", url, body)`)
  lines.push(`  if err != nil {`)
  lines.push(`    panic(err)`)
  lines.push(`  }`)
  for (const h of c.headers) lines.push(`  req.Header.Set("${h.name}", "${escGo(h.value)}")`)
  if (c.auth) lines.push(`  req.SetBasicAuth("${escGo(user)}", "${escGo(pass)}")`)
  lines.push(`  resp, err := http.DefaultClient.Do(req)`)
  lines.push(`  if err != nil {`)
  lines.push(`    panic(err)`)
  lines.push(`  }`)
  lines.push(`  defer resp.Body.Close()`)
  lines.push(`  bodyBytes, _ := io.ReadAll(resp.Body)`)
  lines.push(`  fmt.Println(string(bodyBytes))`)
  lines.push(`}`)
  return lines.join('\n')
}

const escGo = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
