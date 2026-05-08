/**
 * downloader.js — Pure Node.js download engine for Kitab.
 *
 * No Python required. Uses:
 *   - Node built-in http/https  → page & image fetching
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

const http  = require('http')
const https = require('https')
const fs    = require('fs')
const path  = require('path')
const { PDFDocument } = require('pdf-lib')

const BASE_URL      = 'http://web2.anl.az:81/read'
const META_BASE_URL = 'https://ek.anl.az/lib/item'
const UA            = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
const DELAY_MS      = 2000
const MIN_IMG_BYTES = 1024
const TIMEOUT_MS    = 15000

// ── Active cancel flags ───────────────────────────────────────────────────────
const cancelFlags = new Map()   // bibid → { cancelled: Boolean }

function cancelDownload(bibid) {
  const flag = cancelFlags.get(bibid)
  if (flag) flag.cancelled = true
}

// ── Low-level HTTP helper ─────────────────────────────────────────────────────
function fetchBuf(url, extraHeaders = {}, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects < 0) return reject(new Error('Too many redirects'))
    const mod = url.startsWith('https') ? https : http
    const req = mod.get(url, {
      headers: { 'User-Agent': UA, 'Referer': BASE_URL, ...extraHeaders },
      timeout: TIMEOUT_MS,
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href
        res.resume()
        return resolve(fetchBuf(loc, extraHeaders, redirects - 1))
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${url}`)) })
  })
}

// Like fetchBuf but also returns response headers (for cookie extraction)
function fetchBufWithHeaders(url, extraHeaders = {}, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects < 0) return reject(new Error('Too many redirects'))
    const mod = url.startsWith('https') ? https : http
    const req = mod.get(url, {
      headers: { 'User-Agent': UA, 'Referer': BASE_URL, ...extraHeaders },
      timeout: TIMEOUT_MS,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href
        res.resume()
        return resolve(fetchBufWithHeaders(loc, extraHeaders, redirects - 1))
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const chunks = []
      const resHeaders = res.headers
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve({ buf: Buffer.concat(chunks), headers: resHeaders }))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${url}`)) })
  })
}

function fetchText(url) {
  return fetchBuf(url).then(b => b.toString('utf8'))
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

// ── Total pages ───────────────────────────────────────────────────────────────
async function getTotalPages(bibid) {
  const html = await fetchText(`${BASE_URL}/page.php?bibid=${bibid}&pno=1`)
  const m = html.match(/last_page_params="\?bibid=\d+&pno=(\d+)"/)
  if (m) return parseInt(m[1], 10)
  throw new Error('Could not determine total page count.')
}

// ── Download a single page image ──────────────────────────────────────────────
async function downloadPage(bibid, pageNo, outFile) {
  const preloadUrl = `${BASE_URL}/page.php?bibid=${bibid}&pno=${pageNo}`
  const imageUrl   = `${BASE_URL}/img.php?bibid=${bibid}&pno=${pageNo}`

  // Hit page.php first to trigger server-side preload and collect any session cookie
  const { headers: preloadHeaders } = await fetchBufWithHeaders(preloadUrl)
  await sleep(DELAY_MS)

  // Build cookie string from Set-Cookie headers so the image request is authorised
  const setCookieHeader = preloadHeaders['set-cookie']
  const cookieStr = Array.isArray(setCookieHeader)
    ? setCookieHeader.map(c => c.split(';')[0]).join('; ')
    : (setCookieHeader ? setCookieHeader.split(';')[0] : '')

  // The image server checks that Referer matches the exact page URL for this book
  const imgHeaders = {
    'Referer': preloadUrl,
    ...(cookieStr ? { 'Cookie': cookieStr } : {}),
  }

  const imgBuf = await fetchBuf(imageUrl, imgHeaders)
  if (imgBuf.length < MIN_IMG_BYTES) throw new Error('Image too small — likely invalid.')

  fs.writeFileSync(outFile, imgBuf)
  return true
}

// ── Metadata from catalogue ───────────────────────────────────────────────────
async function fetchMetadata(bibid) {
  try {
    const html = await fetchText(`${META_BASE_URL}?id=chamo:${bibid}&theme=e-kataloq`)
    const meta = {}
    const title  = html.match(/<h1 class="title">([\s\S]*?)<\/h1>/i)
    const author = html.match(/class="author">([\s\S]*?)<\/a>/i)
    const date   = html.match(/\$c\s+(\d{4})\s*<\/div>/)
    if (title)  meta.title  = title[1].replace(/<[^>]+>/g, '').trim()
    if (author) meta.author = author[1].replace(/<[^>]+>/g, '').trim()
    if (date)   meta.creationDate = date[1]
    return meta
  } catch {
    return {}
  }
}

// ── PDF assembly ──────────────────────────────────────────────────────────────
async function createPdf(bookDir, bibid, startPage, endPage, deleteImages, emitEvent) {
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
  const meta = await fetchMetadata(bibid)
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

    let totalPages
    try {
      totalPages = await getTotalPages(bibid)
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
        await downloadPage(bibid, pageNo, outFile)
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
    await createPdf(bookDir, bibid, start, end, deleteImages, emitEvent)
    emitEvent({ type: 'done', msg: 'Download complete!', level: 'success' })
    return true

  } finally {
    cancelFlags.delete(bibid)
  }
}

module.exports = { downloadBook, cancelDownload, normalizeBibid }
