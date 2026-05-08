import { canvasDataToBinary } from './filesys'

const encoder = new TextEncoder()

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89
const PAGE_MARGIN = 36

function flattenCanvasToJpeg(canvas: HTMLCanvasElement) {
  const flattenedCanvas = document.createElement('canvas')
  flattenedCanvas.width = canvas.width
  flattenedCanvas.height = canvas.height

  const ctx = flattenedCanvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create PDF canvas context')
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, flattenedCanvas.width, flattenedCanvas.height)
  ctx.drawImage(canvas, 0, 0)

  return flattenedCanvas.toDataURL('image/jpeg', 0.92)
}

function concatChunks(chunks: Uint8Array[], totalLength: number) {
  const result = new Uint8Array(totalLength)
  let offset = 0

  chunks.forEach((chunk) => {
    result.set(chunk, offset)
    offset += chunk.length
  })

  return result
}

export function canvasToPdfBytes(canvas: HTMLCanvasElement) {
  const imageBytes = canvasDataToBinary(flattenCanvasToJpeg(canvas))
  const contentWidth = A4_WIDTH - PAGE_MARGIN * 2
  const contentHeight = A4_HEIGHT - PAGE_MARGIN * 2
  const imageDrawWidth = contentWidth
  const imageDrawHeight = (canvas.height / canvas.width) * imageDrawWidth
  const pageCount = Math.max(1, Math.ceil(imageDrawHeight / contentHeight))
  const imageObjectNumber = 3 + pageCount * 2
  const objectCount = imageObjectNumber
  const offsets: number[] = new Array(objectCount + 1).fill(0)
  const chunks: Uint8Array[] = []
  let totalLength = 0

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes)
    totalLength += bytes.length
  }

  const pushText = (text: string) => {
    pushBytes(encoder.encode(text))
  }

  const addTextObject = (objectNumber: number, body: string) => {
    offsets[objectNumber] = totalLength
    pushText(`${objectNumber} 0 obj\n${body}\nendobj\n`)
  }

  pushText('%PDF-1.4\n')
  addTextObject(1, '<< /Type /Catalog /Pages 2 0 R >>')

  const pageObjects = Array.from({ length: pageCount }, (_, index) => `${3 + index} 0 R`).join(' ')
  addTextObject(2, `<< /Type /Pages /Kids [${pageObjects}] /Count ${pageCount} >>`)

  for (let index = 0; index < pageCount; index += 1) {
    const pageObjectNumber = 3 + index
    const contentObjectNumber = 3 + pageCount + index

    addTextObject(
      pageObjectNumber,
      [
        '<< /Type /Page',
        '/Parent 2 0 R',
        `/MediaBox [0 0 ${A4_WIDTH} ${A4_HEIGHT}]`,
        `/Resources << /XObject << /Im0 ${imageObjectNumber} 0 R >> >>`,
        `/Contents ${contentObjectNumber} 0 R`,
        '>>',
      ].join(' '),
    )
  }

  for (let index = 0; index < pageCount; index += 1) {
    const contentObjectNumber = 3 + pageCount + index
    const imageOffsetY = A4_HEIGHT - PAGE_MARGIN - imageDrawHeight + index * contentHeight
    const content = [
      'q',
      `${imageDrawWidth.toFixed(2)} 0 0 ${imageDrawHeight.toFixed(2)} ${PAGE_MARGIN.toFixed(2)} ${imageOffsetY.toFixed(2)} cm`,
      '/Im0 Do',
      'Q',
    ].join('\n')
    const streamContent = `${content}\n`
    const contentBytes = encoder.encode(streamContent)

    addTextObject(
      contentObjectNumber,
      `<< /Length ${contentBytes.length} >>\nstream\n${streamContent}endstream`,
    )
  }

  offsets[imageObjectNumber] = totalLength
  pushText(
    [
      `${imageObjectNumber} 0 obj`,
      `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height}`,
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>`,
      'stream',
      '',
    ].join('\n'),
  )
  pushBytes(imageBytes)
  pushText('\nendstream\nendobj\n')

  const xrefOffset = totalLength
  pushText(`xref\n0 ${objectCount + 1}\n`)
  pushText('0000000000 65535 f \n')

  for (let index = 1; index <= objectCount; index += 1) {
    pushText(`${String(offsets[index]).padStart(10, '0')} 00000 n \n`)
  }

  pushText(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`)

  return concatChunks(chunks, totalLength)
}
