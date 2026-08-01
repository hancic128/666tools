const DIGITS = '0123456789abcdef'

/** 按指定进制解析字符串为 BigInt（支持负数，自动剥离 0x/0b/0o 前缀） */
export function parseRadix(input: string, radix: number): bigint {
  let s = input.trim().toLowerCase()
  const neg = s.startsWith('-')
  if (neg) s = s.slice(1)

  if (radix === 16 && /^0x/.test(s)) s = s.slice(2)
  else if (radix === 2 && /^0b/.test(s)) s = s.slice(2)
  else if (radix === 8 && /^0o/.test(s)) s = s.slice(2)

  if (!s) throw new Error('empty')

  let n = 0n
  for (const ch of s) {
    const d = DIGITS.indexOf(ch)
    if (d < 0 || d >= radix) throw new Error(`invalid digit "${ch}" for radix ${radix}`)
    n = n * BigInt(radix) + BigInt(d)
  }
  return neg ? -n : n
}

/** 将 BigInt 按指定进制格式化为字符串 */
export function formatRadix(n: bigint, radix: number): string {
  if (n === 0n) return '0'
  const neg = n < 0n
  let v = neg ? -n : n
  let s = ''
  while (v > 0n) {
    s = DIGITS[Number(v % BigInt(radix))] + s
    v /= BigInt(radix)
  }
  return neg ? '-' + s : s
}

/** 批量转换：按空白/逗号分隔 */
export function convertRadix(input: string, from: number, to: number): string[] {
  const items = input.trim().split(/[\s,]+/).filter(Boolean)
  return items.map((item) => {
    try {
      return formatRadix(parseRadix(item, from), to)
    } catch {
      return `⚠ 无法解析: ${item}`
    }
  })
}
