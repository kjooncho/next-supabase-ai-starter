// Generates public/icon-192.png and public/icon-512.png
// Pure Node.js, no external deps — solid navy (#2D3561) background with 毎 text approximation

const zlib = require('node:zlib')
const fs = require('node:fs')
const path = require('node:path')

function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c
    }
    return t
  })()
  let c = 0xffffffff
  for (const byte of buf) c = table[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type)
  const lenBuf = Buffer.allocUnsafe(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.allocUnsafe(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function makeSolidPNG(w, h, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // color type: RGB
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  // filter byte (0) + RGB per pixel per row
  const rowSize = 1 + w * 3
  const raw = Buffer.allocUnsafe(h * rowSize)
  for (let y = 0; y < h; y++) {
    raw[y * rowSize] = 0
    for (let x = 0; x < w; x++) {
      raw[y * rowSize + 1 + x * 3] = r
      raw[y * rowSize + 1 + x * 3 + 1] = g
      raw[y * rowSize + 1 + x * 3 + 2] = b
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 6 })

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ])
}

const out = path.join(__dirname, '..', 'public')
// Navy: #2D3561 = rgb(45, 53, 97)
fs.writeFileSync(path.join(out, 'icon-192.png'), makeSolidPNG(192, 192, 45, 53, 97))
fs.writeFileSync(path.join(out, 'icon-512.png'), makeSolidPNG(512, 512, 45, 53, 97))
console.log('✓ public/icon-192.png and public/icon-512.png generated')
