/**
 * downloader.js — Download engine for Kitab.
 *
 * No Python required. Uses:
 *   - ./http (Electron session) → page & image fetching through Cloudflare
 *   - pdf-lib                   → JPEG-to-PDF assembly + metadata
 *
 * emitEvent(evt) is called with structured objects:
 *   { type:'total',    total:<int>, msg? }
 *   { type:'progress', page:<int>, total:<int>, msg?, level? }
 *   { type:'skipped',  page:<int> }
 *   { type:'failed',   page:<int>, msg, level:'warning' }
 *   { type:'log',      level:'info|success|warning|error', msg }
 *   { type:'done',     msg, level:'success' }
 */

'use strict'

const fs    = require('fs')
const path  = require('path')
const { PDFDocument } = require('pdf-lib')
const { fetchBuf, fetchText } = require('./http')

const BASE_URL      = 'https://web2.anl.az/read'
const META_BASE_URL = 'https://ek.anl.az/lib/item'
const DELAY_MS      = 2000
const MIN_IMG_BYTES = 1024

// ── Active cancel flags ───────────────────────────────────────────────────────
const cancelFlags = new Map()   // bibid → { cancelled: Boolean }

function cancelDownload(bibid) {
  const flag = cancelFlags.get(bibid)
  if (flag) flag.cancelled = true
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ── Book ID normalisation ─────────────────────────────────────────────────────
function normalizeBibid(raw) {
  if (/^vtls/i.test(raw)) {
    const n = raw.replace(/\D/g, '').replace(/^0+/, '') || null
    if (n) return n
  } else if (/^\d+$/.test(raw)) {
    return raw.replace(/^0+/, '') || '0'
  }
  throw new Error(`Invalid Book ID "${raw}". Must be numeric or start with "vtls".`)
}

function htmlToText(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Book info (page count + header metadata) ──────────────────────────────────
async function getBookInfo(bibid, netOpts) {
  const html = await fetchText(`${BASE_URL}/page.php?bibid=${bibid}&pno=1`, netOpts)
  const m = html.match(/last_page_params="\?bibid=\d+&pno=(\d+)"/)
  if (!m) throw new Error('Could not determine total page count.')

  const meta   = {}
  const title  = html.match(/class="book-title[^"]*">([\s\S]*?)<\/h2>/i)
  const author = html.match(/class="book-author[^"]*">([\s\S]*?)<\/p>/i)
  if (title)  meta.title  = htmlToText(title[1])
  if (author) meta.author = htmlToText(author[1])

  return { totalPages: parseInt(m[1], 10), meta }
}

// ── Download a single page image ──────────────────────────────────────────────
async function downloadPage(bibid, pageNo, outFile, netOpts) {
  const preloadUrl = `${BASE_URL}/page.php?bibid=${bibid}&pno=${pageNo}`
  const imageUrl   = `${BASE_URL}/img.php?bibid=${bibid}&pno=${pageNo}`

  // Hit page.php first to trigger the server-side preload for this page
  await fetchBuf(preloadUrl, netOpts)
  await sleep(DELAY_MS)

  // The image server checks that Referer matches the exact page URL for this book
  const imgBuf = await fetchBuf(imageUrl, { ...netOpts, referrer: preloadUrl })
  if (imgBuf.length < MIN_IMG_BYTES) throw new Error('Image too small — likely invalid.')

  fs.writeFileSync(outFile, imgBuf)
  return true
}

// ── Metadata from catalogue (falls back to the reader page header) ────────────
async function fetchMetadata(bibid, fallback = {}) {
  try {
    const html = await fetchText(`${META_BASE_URL}?id=chamo:${bibid}&theme=e-kataloq`, { interactive: false })
    const meta = { ...fallback }
    const title  = html.match(/<h1 class="title">([\s\S]*?)<\/h1>/i)
    const author = html.match(/class="author">([\s\S]*?)<\/a>/i)
    const date   = html.match(/\$c\s+(\d{4})\s*<\/div>/)
    if (title)  meta.title  = htmlToText(title[1])
    if (author) meta.author = htmlToText(author[1])
    if (date)   meta.creationDate = date[1]
    return meta
  } catch {
    return { ...fallback }
  }
}

// ── PDF assembly ──────────────────────────────────────────────────────────────
async function createPdf(bookDir, bibid, startPage, endPage, deleteImages, pageMeta, emitEvent) {
  const pdfPath = path.join(bookDir, `book_${bibid}.pdf`)
  const pdfDoc  = await PDFDocument.create()

  let embedded = 0
  for (let p = startPage; p <= endPage; p++) {
    const imgFile = path.join(bookDir, `page_${p}.jpg`)
    if (!fs.existsSync(imgFile)) continue
    try {
      const jpegBytes = fs.readFileSync(imgFile)
      const jpegImg   = await pdfDoc.embedJpg(jpegBytes)
      const page      = pdfDoc.addPage([jpegImg.width, jpegImg.height])
      page.drawImage(jpegImg, { x: 0, y: 0, width: jpegImg.width, height: jpegImg.height })
      embedded++
    } catch (e) {
      emitEvent({ type: 'log', level: 'warning', msg: `Skipping page ${p}: ${e.message}` })
    }
  }

  if (embedded === 0) {
    emitEvent({ type: 'log', level: 'error', msg: 'No valid images to build PDF.' })
    return
  }

  // Embed metadata
  const meta = await fetchMetadata(bibid, pageMeta)
  if (meta.title)  pdfDoc.setTitle(meta.title)
  if (meta.author) pdfDoc.setAuthor(meta.author)
  pdfDoc.setProducer('Kitab — Azerbaijan National Library')
  pdfDoc.setCreationDate(new Date())

  const pdfBytes = await pdfDoc.save()
  fs.writeFileSync(pdfPath, pdfBytes)
  emitEvent({ type: 'log', level: 'success', msg: `PDF saved: ${pdfPath}` })
  if (meta.title) {
    emitEvent({ type: 'log', level: 'info', msg: `Metadata applied — Title: ${meta.title}` })
  }

  // Cleanup
  if (deleteImages) {
    for (let p = startPage; p <= endPage; p++) {
      const f = path.join(bookDir, `page_${p}.jpg`)
      try { if (fs.existsSync(f)) fs.unlinkSync(f) } catch {}
    }
  }
}

// ── Main download orchestrator ────────────────────────────────────────────────
async function downloadBook({ bibid: rawBibid, outputDir, startPage = 1, endPage = null, deleteImages = false }, emitEvent) {
  const bibid   = normalizeBibid(rawBibid)
  const bookDir = path.join(outputDir, `book_${bibid}`)
  fs.mkdirSync(bookDir, { recursive: true })

  const flag = { cancelled: false }
  cancelFlags.set(bibid, flag)

  try {
    emitEvent({ type: 'log', level: 'info', msg: `Fetching info for book ID: ${bibid}…` })

    const netOpts = {
      onChallenge: (reason) => emitEvent({
        type: 'log', level: 'warning',
        msg: reason === 'checkbox'
          ? 'The library site is asking for a human check — tick the box in the window that opened.'
          : 'The library site is taking a while to verify this computer — a window opened in case it needs you.',
      }),
    }

    let totalPages, pageMeta
    try {
      ({ totalPages, meta: pageMeta } = await getBookInfo(bibid, netOpts))
    } catch (e) {
      emitEvent({ type: 'log', level: 'error', msg: `Error fetching total pages: ${e.message}` })
      return false
    }

    const end   = (endPage && endPage > 0 && endPage <= totalPages) ? endPage : totalPages
    const start = (startPage >= 1 && startPage <= end) ? startPage : 1
    const total = end - start + 1

    emitEvent({
      type: 'total', total,
      msg: `Downloading pages ${start}–${end} of ${totalPages}.`, level: 'info',
    })

    let pagesDownloaded = 0

    for (let pageNo = start; pageNo <= end; pageNo++) {
      if (flag.cancelled) {
        emitEvent({ type: 'log', level: 'warning', msg: 'Download cancelled.' })
        return false
      }

      const outFile = path.join(bookDir, `page_${pageNo}.jpg`)

      // Skip already-downloaded pages
      if (fs.existsSync(outFile) && fs.statSync(outFile).size >= MIN_IMG_BYTES) {
        pagesDownloaded++
        emitEvent({ type: 'progress', page: pagesDownloaded, total })
        continue
      }

      try {
        await downloadPage(bibid, pageNo, outFile, netOpts)
        pagesDownloaded++
        emitEvent({
          type: 'progress', page: pagesDownloaded, total,
          msg: `Page ${pageNo} downloaded.`, level: 'success',
        })
      } catch (e) {
        emitEvent({
          type: 'failed', page: pageNo,
          msg: `Page ${pageNo} failed: ${e.message}`, level: 'warning',
        })
      }
    }

    emitEvent({ type: 'log', level: 'info', msg: 'Combining images into PDF…' })
    await createPdf(bookDir, bibid, start, end, deleteImages, pageMeta, emitEvent)
    emitEvent({ type: 'done', msg: 'Download complete!', level: 'success' })
    return true

  } finally {
    cancelFlags.delete(bibid)
  }
}

module.exports = { downloadBook, cancelDownload, normalizeBibid }
