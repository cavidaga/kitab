import { useState, useEffect, useRef } from 'react'
import { T } from '../tokens.js'
import {
  FieldInput, Toggle, ProgressBar, StatPill,
  LogEntry, QueueItem, Btn, ControlBar,
} from './ui.jsx'

export function CommandPanel({ lang, setLang, dark, setDark, tok, t }) {
  // ── Form state ────────────────────────────────────────────────────────────
  const [bookId,     setBookId]     = useState('')
  const [startPage,  setStartPage]  = useState('1')
  const [endPage,    setEndPage]    = useState('')
  const [deleteImgs, setDeleteImgs] = useState(false)

  // ── Output folder ─────────────────────────────────────────────────────────
  const [outputDir, setOutputDir] = useState('')

  // ── Download state ────────────────────────────────────────────────────────
  const [downloading,  setDownloading]  = useState(false)
  const [currentBibid, setCurrentBibid] = useState('')
  const [pagesDown,    setPagesDown]    = useState(0)
  const [pagesFailed,  setPagesFailed]  = useState(0)
  const [totalPages,   setTotalPages]   = useState(0)
  const [elapsed,      setElapsed]      = useState('—')
  const [startTime,    setStartTime]    = useState(null)

  // ── Queue ─────────────────────────────────────────────────────────────────
  const [queue, setQueue] = useState([])

  // ── Logs ──────────────────────────────────────────────────────────────────
  const [logs,     setLogs]     = useState([{ msg: 'Ready. Enter a Book ID to begin.', level: 'info' }])
  const [logsOpen, setLogsOpen] = useState(true)
  const logRef = useRef(null)

  // ── Elapsed timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!startTime) return
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - startTime) / 1000)
      const m = Math.floor(s / 60)
      setElapsed(m > 0 ? `${m}m ${s % 60}s` : `${s}s`)
    }, 1000)
    return () => clearInterval(id)
  }, [startTime])

  // ── Subscribe to download events from main process ────────────────────────
  useEffect(() => {
    if (!window.kitab?.onDownloadEvent) return
    const unsub = window.kitab.onDownloadEvent((evt) => {
      const { type, level, msg, page, total } = evt

      if (msg) {
        setLogs(l => [...l, { msg, level: level || 'info' }])
      }

      if (type === 'total') {
        setTotalPages(total)
      }
      if (type === 'progress') {
        setPagesDown(page)
      }
      if (type === 'failed') {
        setPagesFailed(f => f + 1)
      }
      if (type === 'done') {
        setDownloading(false)
        setCurrentBibid('')
        setStartTime(null)
      }
    })
    return unsub
  }, [])

  // ── Auto-scroll logs ──────────────────────────────────────────────────────
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const pickFolder = async () => {
    const dir = await window.kitab?.openDir()
    if (dir) setOutputDir(dir)
  }

  const startDownload = async (bibid) => {
    if (!outputDir) {
      const dir = await window.kitab?.openDir()
      if (!dir) {
        setLogs(l => [...l, { msg: 'No output folder selected.', level: 'warning' }])
        return
      }
      setOutputDir(dir)
    }

    const targetBibid = bibid || bookId.trim()
    if (!targetBibid) return

    setPagesDown(0)
    setPagesFailed(0)
    setTotalPages(0)
    setElapsed('—')
    setStartTime(Date.now())
    setDownloading(true)
    setCurrentBibid(targetBibid)
    setLogs(l => [...l, { msg: `Starting download: ${targetBibid}`, level: 'info' }])

    const result = await window.kitab?.startDownload({
      bibid: targetBibid,
      outputDir,
      startPage: parseInt(startPage) || 1,
      endPage:   parseInt(endPage)   || 0,
      deleteImages: deleteImgs,
    })

    if (result && !result.ok) {
      setDownloading(false)
      setStartTime(null)
      setLogs(l => [...l, { msg: result.error, level: 'error' }])
    }
  }

  const cancelDownload = async () => {
    await window.kitab?.cancelDownload({ bibid: currentBibid })
    setDownloading(false)
    setCurrentBibid('')
    setStartTime(null)
    setLogs(l => [...l, { msg: 'Download cancelled.', level: 'warning' }])
  }

  const addToQueue = () => {
    if (!bookId.trim()) return
    setQueue(q => [...q, bookId.trim()])
    setLogs(l => [...l, { msg: `Added to queue: ${bookId.trim()}`, level: 'info' }])
    setBookId('')
  }

  const processQueue = async () => {
    if (queue.length === 0) return
    const [next, ...rest] = queue
    setQueue(rest)
    await startDownload(next)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Sub-header: controls */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px',
        borderBottom: `1px solid ${tok.border}`,
      }}>
        {/* Status indicator */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: downloading ? T.green : tok.text2,
            ...(downloading ? { animation: 'pulse 1.8s ease-in-out infinite' } : {}),
          }} />
          <span style={{ fontFamily: tok.mono, fontSize: 10, color: downloading ? T.green : tok.text2 }}>
            {downloading ? t.downloading : t.idle}
          </span>
        </div>
        <ControlBar lang={lang} setLang={setLang} dark={dark} setDark={setDark} tok={tok} />
      </div>

      {/* Main content */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Book ID */}
        <FieldInput
          label={t.bookId}
          placeholder={t.bookIdPlaceholder}
          value={bookId}
          onChange={setBookId}
          tok={tok}
        />

        {/* Page range */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FieldInput label={t.startPage} placeholder="1" value={startPage} onChange={setStartPage} tok={tok} />
          <FieldInput label={t.endPage}   placeholder="∞" value={endPage}   onChange={setEndPage}   hint={t.optional} tok={tok} />
        </div>

        {/* Options */}
        <div style={{
          background: tok.bg2, border: `1px solid ${tok.border}`,
          borderRadius: 8, padding: '14px 16px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <span style={{ fontFamily: tok.mono, fontSize: 10, color: tok.text2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t.options}
          </span>
          <Toggle label={t.deleteImages} checked={deleteImgs} onChange={setDeleteImgs} tok={tok} />

          {/* Output folder picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Btn variant="ghost" small tok={tok} onClick={pickFolder}>
              {t.selectFolder}
            </Btn>
            {outputDir
              ? <span style={{ fontFamily: tok.mono, fontSize: 11, color: tok.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {outputDir}
                </span>
              : <span style={{ fontFamily: tok.mono, fontSize: 11, color: tok.text2 }}>{t.noFolder}</span>
            }
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Btn
              onClick={downloading ? cancelDownload : () => startDownload()}
              variant={downloading ? 'danger' : 'primary'}
              disabled={!downloading && !bookId.trim()}
              tok={tok}
            >
              {downloading ? t.cancelDownload : t.startDownload}
            </Btn>
          </div>
          <Btn onClick={addToQueue} variant="secondary" disabled={!bookId.trim()} tok={tok}>
            {t.addToQueue}
          </Btn>
        </div>

        {/* Progress */}
        {(downloading || pagesDown > 0) && (
          <div className="fade-in" style={{
            background: tok.bg2, border: `1px solid ${tok.border}`,
            borderRadius: 8, padding: '14px 16px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <span style={{ fontFamily: tok.mono, fontSize: 10, color: tok.text2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t.progress}{currentBibid ? ` — ${currentBibid}` : ''}
            </span>
            <ProgressBar value={pagesDown} max={totalPages || 1} tok={tok} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <StatPill label={t.downloaded} value={String(pagesDown)} tok={tok} />
              <StatPill label={t.failed}     value={String(pagesFailed)} tok={tok} />
              <StatPill label={t.elapsed}    value={elapsed} tok={tok} />
            </div>
          </div>
        )}

        {/* Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: tok.mono, fontSize: 10, color: tok.text2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t.queue} ({queue.length})
            </span>
            {queue.length > 0 && !downloading && (
              <Btn variant="ghost" small tok={tok} onClick={processQueue}>{t.startQueue}</Btn>
            )}
          </div>
          {queue.length === 0
            ? <div style={{ padding: '12px 0', color: tok.text2, fontFamily: tok.mono, fontSize: 12, textAlign: 'center' }}>
                {t.emptyQueue}
              </div>
            : queue.map((id, i) => (
                <QueueItem
                  key={i} id={id}
                  onRemove={() => setQueue(q => q.filter((_, j) => j !== i))}
                  tok={tok}
                />
              ))
          }
        </div>

        {/* Activity Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setLogsOpen(o => !o)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                color: tok.text2, fontFamily: tok.mono, fontSize: 10,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}
            >
              <span style={{
                transition: 'transform 0.2s',
                transform: logsOpen ? 'rotate(0)' : 'rotate(-90deg)',
                display: 'inline-block',
              }}>▾</span>
              {t.logs}
            </button>
            <Btn variant="ghost" small tok={tok} onClick={() => setLogs([])}>{t.clearLog}</Btn>
          </div>
          {logsOpen && (
            <div ref={logRef} style={{
              background: tok.bg0, border: `1px solid ${tok.border}`,
              borderRadius: 6, padding: '10px 12px',
              height: 120, overflow: 'auto',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              {logs.map((l, i) => <LogEntry key={i} msg={l.msg} level={l.level} tok={tok} />)}
            </div>
          )}
        </div>

        {/* Bottom spacer */}
        <div style={{ height: 8 }} />
      </div>
    </div>
  )
}
