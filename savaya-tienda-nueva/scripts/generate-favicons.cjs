// Run: node --env-file=.env.local scripts/generate-favicons.js
// Requires sharp (already in devDependencies via Next.js)

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const MARK_SRC = path.join(ROOT, 'public/images/savaya-mark.png')
const LOGO_SRC = path.join(ROOT, 'public/images/savaya-logo.png')
const APP_DIR = path.join(ROOT, 'src/app')
const PUBLIC_DIR = path.join(ROOT, 'public')

// ICO binary format: embeds PNG data for each size
function buildIco(images) {
  const count = images.length
  const dataOffset = 6 + count * 16
  const totalSize = dataOffset + images.reduce((s, { png }) => s + png.length, 0)
  const buf = Buffer.alloc(totalSize)

  buf.writeUInt16LE(0, 0)     // reserved
  buf.writeUInt16LE(1, 2)     // type: icon
  buf.writeUInt16LE(count, 4) // image count

  let cursor = dataOffset
  for (let i = 0; i < count; i++) {
    const { png, size } = images[i]
    const off = 6 + i * 16
    buf.writeUInt8(size >= 256 ? 0 : size, off)      // width (0 = 256)
    buf.writeUInt8(size >= 256 ? 0 : size, off + 1)  // height
    buf.writeUInt8(0, off + 2)                        // color count
    buf.writeUInt8(0, off + 3)                        // reserved
    buf.writeUInt16LE(1, off + 4)                     // planes
    buf.writeUInt16LE(32, off + 6)                    // bits per pixel
    buf.writeUInt32LE(png.length, off + 8)            // data size
    buf.writeUInt32LE(cursor, off + 12)               // data offset
    png.copy(buf, cursor)
    cursor += png.length
  }
  return buf
}

async function main() {
  // Transparent padding so the mark is square with breathing room
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 }

  // icon.png — 512×512 (used by Next.js for <link rel="icon">)
  await sharp(MARK_SRC)
    .resize(512, 512, { fit: 'contain', background: transparent })
    .png()
    .toFile(path.join(APP_DIR, 'icon.png'))
  console.log('✓ src/app/icon.png (512×512)')

  // apple-icon.png — 180×180
  await sharp(MARK_SRC)
    .resize(180, 180, { fit: 'contain', background: transparent })
    .png()
    .toFile(path.join(APP_DIR, 'apple-icon.png'))
  console.log('✓ src/app/apple-icon.png (180×180)')

  // favicon.ico — multi-size: 16, 32, 48
  const icoImages = await Promise.all(
    [16, 32, 48].map(async (size) => {
      const png = await sharp(MARK_SRC)
        .resize(size, size, { fit: 'contain', background: transparent })
        .png()
        .toBuffer()
      return { png, size }
    })
  )
  fs.writeFileSync(path.join(APP_DIR, 'favicon.ico'), buildIco(icoImages))
  console.log('✓ src/app/favicon.ico (16, 32, 48)')

  // og-image.png — 1200×630 branded OG / Twitter card image
  // Logo centered on brand off-white #FAF7F2, padded to 1:1.905 ratio
  const BG = { r: 250, g: 247, b: 242, alpha: 1 }
  const logoResized = await sharp(LOGO_SRC)
    .resize(540, 400, { fit: 'contain', background: BG })
    .flatten({ background: BG })
    .png()
    .toBuffer()

  const { width: lw, height: lh } = await sharp(logoResized).metadata()
  const left = Math.round((1200 - lw) / 2)
  const top = Math.round((630 - lh) / 2)

  await sharp({ create: { width: 1200, height: 630, channels: 4, background: BG } })
    .composite([{ input: logoResized, left, top }])
    .png()
    .toFile(path.join(PUBLIC_DIR, 'og-image.png'))
  console.log('✓ public/og-image.png (1200×630)')

  console.log('\nDone. Commit all generated files.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
