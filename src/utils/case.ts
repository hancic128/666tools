/** 大小写转换：9 种命名格式 */

export type CaseFormat =
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'const'
  | 'sentence'
  | 'title'
  | 'lower'
  | 'upper'

export const CASE_FORMATS: { value: CaseFormat; label: string }[] = [
  { value: 'camel', label: 'camelCase' },
  { value: 'pascal', label: 'PascalCase' },
  { value: 'snake', label: 'snake_case' },
  { value: 'kebab', label: 'kebab-case' },
  { value: 'const', label: 'CONSTANT_CASE' },
  { value: 'sentence', label: 'Sentence case' },
  { value: 'title', label: 'Title Case' },
  { value: 'lower', label: 'lower case' },
  { value: 'upper', label: 'UPPER CASE' },
]

/** 按词边界拆分（支持 camelCase / snake_case / kebab-case / 空格 / 数字 / 缩写） */
function splitWords(input: string): string[] {
  const matches = input.match(
    /[A-Z]{2,}(?=[A-Z][a-z]|[0-9]|\W|$)|[A-Z]?[a-z]+|[A-Z]+|[0-9]+/g,
  )
  return matches ?? []
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

export function convertCase(input: string, format: CaseFormat): string {
  const words = splitWords(input)
  if (!words.length) return ''
  switch (format) {
    case 'camel':
      return words[0].toLowerCase() + words.slice(1).map(cap).join('')
    case 'pascal':
      return words.map(cap).join('')
    case 'snake':
      return words.map((w) => w.toLowerCase()).join('_')
    case 'kebab':
      return words.map((w) => w.toLowerCase()).join('-')
    case 'const':
      return words.map((w) => w.toUpperCase()).join('_')
    case 'sentence':
      return cap(words[0]) + words.slice(1).map((w) => w.toLowerCase()).join(' ')
    case 'title':
      return words.map(cap).join(' ')
    case 'lower':
      return words.map((w) => w.toLowerCase()).join(' ')
    case 'upper':
      return words.map((w) => w.toUpperCase()).join(' ')
  }
}
