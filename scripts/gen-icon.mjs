import { deflateSync, crc32 } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const S = 1024
const buf = Buffer.alloc(S * S * 4)
const INDIGO = [99, 102, 241, 255]
const WHITE = [255, 255, 255, 255]

const c = S / 2
for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    const dx = Math.abs(x - c)
    const dy = Math.abs(y - c)
    let color = INDIGO
    // 外菱形（白色）
    if (dx + dy <= S * 0.30) color = WHITE
    // 内菱形镂空（回到品牌色）
    if (dx + dy <= S * 0.17) color = INDIGO
    const i = (y * S + x) * 4
    buf[i] = color[0]
    buf[i + 1] = color[1]
    buf[i + 2] = color[2]
    buf[i + 3] = color[3]
  }
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(S, 0)
ihdr.writeUInt32BE(S, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 6 // color type RGBA

// 每行前置 filter byte 0
const raw = Buffer.alloc(S * (S * 4 + 1))
for (let y = 0; y < S; y++) {
  raw[y * (S * 4 + 1)] = 0
  buf.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4)
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

writeFileSync(new URL('../app-icon.png', import.meta.url), png)
console.log('app-icon.png generated', png.length, 'bytes')
