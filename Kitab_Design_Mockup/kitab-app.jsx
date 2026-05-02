// Kitab — Modern Redesign
// Three layout variations presented on a design canvas

const { useState, useEffect, useRef } = React;

// ─── Tokens ──────────────────────────────────────────────────────────────────
const T = {
  bg0:    '#060608',
  bg1:    '#0d0d10',
  bg2:    '#14141a',
  bg3:    '#1c1c24',
  border: '#2a2a35',
  borderHover: '#3e3e50',
  text0:  '#f0ede8',
  text1:  '#a09d98',
  text2:  '#5c5a58',
  amber:  '#e6a43a',
  amberDim: '#a37020',
  amberGlow: 'rgba(230,164,58,0.12)',
  red:    '#e05a4e',
  green:  '#4ec97a',
  mono:   "'DM Mono', monospace",
  display:"'Syne', sans-serif",
  body:   "'DM Sans', sans-serif",
};

// Light mode overrides
const TL = {
  bg0:    '#f5f2ee',
  bg1:    '#ede9e4',
  bg2:    '#e4dfd8',
  bg3:    '#dcd6ce',
  border: '#ccc7be',
  borderHover: '#b0aa9e',
  text0:  '#1a1814',
  text1:  '#6b6560',
  text2:  '#a09a94',
  amber:  '#b5780a',
  amberDim: '#d4980e',
  amberGlow: 'rgba(181,120,10,0.10)',
};

// Translations
const LANG = {
  en: {
    title: 'Kitab',
    tagline: 'Azerbaijan National Library',
    bookId: 'Book ID',
    bookIdPlaceholder: 'vtls000000004',
    startPage: 'Start page',
    endPage: 'End page',
    deleteImages: 'Delete images after PDF',
    notifications: 'Desktop notifications',
    startDownload: 'Download',
    cancelDownload: 'Cancel',
    addToQueue: 'Add to queue',
    queue: 'Queue',
    removeSelected: 'Remove',
    startQueue: 'Process queue',
    logs: 'Activity log',
    clearLog: 'Clear',
    darkMode: 'Dark',
    lightMode: 'Light',
    language: 'Language',
    pages: 'pages',
    downloaded: 'Downloaded',
    failed: 'Failed',
    elapsed: 'Elapsed',
    remaining: 'Remaining',
    emptyQueue: 'No books queued',
    downloading: 'Downloading…',
    idle: 'Ready',
    options: 'Options',
    progress: 'Progress',
    optional: 'optional',
  },
  az: {
    title: 'Kitab',
    tagline: 'Azərbaycan Milli Kitabxanası',
    bookId: 'Kitab ID',
    bookIdPlaceholder: 'vtls000000004',
    startPage: 'Başlanğıc səhifəsi',
    endPage: 'Son səhifəsi',
    deleteImages: 'PDF sonra şəkilləri sil',
    notifications: 'Bildirişlər',
    startDownload: 'Yüklə',
    cancelDownload: 'Dayandır',
    addToQueue: 'Sıraya əlavə et',
    queue: 'Sıra',
    removeSelected: 'Sil',
    startQueue: 'Sıranı başlat',
    logs: 'Jurnal',
    clearLog: 'Təmizlə',
    darkMode: 'Qaranlıq',
    lightMode: 'İşıqlı',
    language: 'Dil',
    pages: 'səhifə',
    downloaded: 'Yükləndi',
    failed: 'Xəta',
    elapsed: 'Keçən vaxt',
    remaining: 'Qalan vaxt',
    emptyQueue: 'Sıra boşdur',
    downloading: 'Yüklənir…',
    idle: 'Hazır',
    options: 'Seçimlər',
    progress: 'İrəliləyiş',
    optional: 'istəyə görə',
  }
};

// ─── Logo ─────────────────────────────────────────────────────────────────────
function KitabLogo({ size = 28, dark = true, amber }) {
  const accentColor = amber || T.amber;
  const textColor = dark ? T.text0 : TL.text0;
  return (
    <svg width={size * 2.8} height={size} viewBox="0 0 78 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Book spine */}
      <rect x="0" y="2" width="6" height="24" rx="1" fill={accentColor}/>
      {/* Pages */}
      <rect x="7" y="4" width="10" height="20" rx="0.5" fill={dark ? '#1e1e28' : '#ddd6cb'} stroke={dark ? '#3a3a4a' : '#c8c0b4'} strokeWidth="0.5"/>
      <line x1="9" y1="9" x2="15" y2="9" stroke={accentColor} strokeWidth="0.8" strokeOpacity="0.6"/>
      <line x1="9" y1="12" x2="15" y2="12" stroke={accentColor} strokeWidth="0.8" strokeOpacity="0.4"/>
      <line x1="9" y1="15" x2="13" y2="15" stroke={accentColor} strokeWidth="0.8" strokeOpacity="0.3"/>
      {/* Wordmark */}
      <text x="22" y="20" fontFamily="'Syne', sans-serif" fontWeight="700" fontSize="16" fill={textColor} letterSpacing="-0.3">kitab</text>
    </svg>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function FieldInput({ label, placeholder, value, onChange, hint, isDark }) {
  const [focused, setFocused] = useState(false);
  const tok = isDark ? T : {...T, ...TL};
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontFamily: tok.mono, fontSize:11, letterSpacing:'0.08em', color: tok.text1, textTransform:'uppercase' }}>
        {label}
        {hint && <span style={{ marginLeft:6, color: tok.text2, textTransform:'none', letterSpacing:0 }}>— {hint}</span>}
      </label>
      <div style={{
        position:'relative',
        border: `1px solid ${focused ? tok.amber : tok.border}`,
        borderRadius: 6,
        background: focused ? tok.amberGlow : tok.bg2,
        transition: 'border-color 0.2s, background 0.2s',
        boxShadow: focused ? `0 0 0 3px ${tok.amberGlow}` : 'none',
      }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            width:'100%', border:'none', background:'transparent',
            padding:'10px 14px', fontFamily: tok.mono, fontSize:13,
            color: tok.text0, outline:'none',
          }}
        />
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange, isDark }) {
  const tok = isDark ? T : {...T, ...TL};
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}
    >
      <div style={{
        width:36, height:20, borderRadius:10,
        background: checked ? tok.amber : tok.bg3,
        border: `1px solid ${checked ? tok.amber : tok.border}`,
        position:'relative', transition:'background 0.2s, border-color 0.2s',
        flexShrink:0,
      }}>
        <div style={{
          position:'absolute', top:2, left: checked ? 18 : 2,
          width:14, height:14, borderRadius:'50%',
          background: checked ? tok.bg0 : tok.text2,
          transition:'left 0.2s, background 0.2s',
        }} />
      </div>
      <span style={{ fontFamily: tok.body, fontSize:13, color: tok.text1 }}>{label}</span>
    </div>
  );
}

function ProgressBar({ value, max, isDark }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const tok = isDark ? T : {...T, ...TL};
  const color = pct < 40 ? tok.amber : pct < 80 ? tok.amber : T.green;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{
        height:4, borderRadius:2, background: tok.bg3, overflow:'hidden',
        position:'relative',
      }}>
        <div style={{
          height:'100%', width:`${pct}%`, borderRadius:2,
          background: color,
          transition:'width 0.4s ease, background 0.4s',
          boxShadow: `0 0 8px ${color}80`,
        }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <span style={{ fontFamily: tok.mono, fontSize:11, color: tok.text2 }}>{Math.round(pct)}%</span>
        <span style={{ fontFamily: tok.mono, fontSize:11, color: tok.text2 }}>{value} / {max}</span>
      </div>
    </div>
  );
}

function StatPill({ label, value, isDark }) {
  const tok = isDark ? T : {...T, ...TL};
  return (
    <div style={{
      background: tok.bg2, border:`1px solid ${tok.border}`,
      borderRadius:6, padding:'8px 12px',
      display:'flex', flexDirection:'column', gap:2,
    }}>
      <span style={{ fontFamily: tok.mono, fontSize:10, color: tok.text2, textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</span>
      <span style={{ fontFamily: tok.mono, fontSize:14, color: tok.text0 }}>{value}</span>
    </div>
  );
}

function LogEntry({ msg, level, isDark }) {
  const tok = isDark ? T : {...T, ...TL};
  const colors = { error: T.red, warning:'#e09a3a', success: T.green, info: tok.text1 };
  const color = colors[level] || tok.text1;
  return (
    <div style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'3px 0' }}>
      <span style={{ fontFamily: tok.mono, fontSize:10, color: tok.text2, whiteSpace:'nowrap', marginTop:1 }}>
        {new Date().toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
      </span>
      <span style={{ fontFamily: tok.mono, fontSize:12, color, lineHeight:1.5 }}>{msg}</span>
    </div>
  );
}

function QueueItem({ id, onRemove, isDark }) {
  const tok = isDark ? T : {...T, ...TL};
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'8px 12px', background: tok.bg2, border:`1px solid ${tok.border}`,
      borderRadius:6,
    }}>
      <span style={{ fontFamily: tok.mono, fontSize:12, color: tok.text0 }}>{id}</span>
      <button
        onClick={onRemove}
        style={{
          background:'none', border:'none', cursor:'pointer',
          color: tok.text2, fontSize:14, padding:'0 4px',
          transition:'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = T.red}
        onMouseLeave={e => e.currentTarget.style.color = tok.text2}
      >×</button>
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant='primary', disabled, isDark, small }) {
  const tok = isDark ? T : {...T, ...TL};
  const [hov, setHov] = useState(false);
  const styles = {
    primary: {
      background: hov && !disabled ? '#d4923a' : tok.amber,
      color: '#0a0806',
      border: 'none',
    },
    secondary: {
      background: hov && !disabled ? tok.bg3 : tok.bg2,
      color: tok.text0,
      border: `1px solid ${tok.border}`,
    },
    ghost: {
      background: 'none',
      color: hov && !disabled ? tok.text0 : tok.text1,
      border: `1px solid ${hov && !disabled ? tok.border : 'transparent'}`,
    },
    danger: {
      background: hov && !disabled ? '#c04030' : 'none',
      color: hov && !disabled ? '#fff' : T.red,
      border: `1px solid ${T.red}`,
    }
  };
  const s = styles[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...s,
        padding: small ? '6px 14px' : '10px 20px',
        borderRadius: 6,
        fontFamily: tok.mono,
        fontSize: small ? 11 : 13,
        fontWeight: 500,
        letterSpacing: '0.04em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
        whiteSpace:'nowrap',
      }}
    >{children}</button>
  );
}

// ─── Language & Dark switcher row ─────────────────────────────────────────────
function ControlBar({ lang, setLang, dark, setDark, isDark }) {
  const tok = isDark ? T : {...T, ...TL};
  return (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      {/* Language pill */}
      {['en','az'].map(l => (
        <button key={l} onClick={() => setLang(l)} style={{
          background: lang === l ? tok.amberGlow : 'none',
          border: `1px solid ${lang === l ? tok.amber : tok.border}`,
          color: lang === l ? tok.amber : tok.text2,
          borderRadius:4, padding:'4px 10px',
          fontFamily: tok.mono, fontSize:11,
          cursor:'pointer', transition:'all 0.15s',
          letterSpacing:'0.06em',
        }}>{l.toUpperCase()}</button>
      ))}
      <div style={{ width:1, height:16, background: tok.border }} />
      {/* Dark/light */}
      <button onClick={() => setDark(!dark)} style={{
        background:'none', border:`1px solid ${tok.border}`,
        color: tok.text2, borderRadius:4, padding:'4px 10px',
        fontFamily: tok.mono, fontSize:11, cursor:'pointer',
        transition:'all 0.15s',
      }}>
        {dark ? '☀' : '☾'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VARIATION A — "Command" — Single column, terminal-inspired
// ═══════════════════════════════════════════════════════════════════
function VariantA({ lang, dark, progress }) {
  const t = LANG[lang];
  const tok = dark ? T : {...T, ...TL};
  const [bookId, setBookId] = useState('');
  const [startPage, setStartPage] = useState('1');
  const [endPage, setEndPage] = useState('');
  const [deleteImgs, setDeleteImgs] = useState(false);
  const [notifs, setNotifs] = useState(true);
  const [queue, setQueue] = useState(['vtls000000012', 'vtls000000087']);
  const [logs, setLogs] = useState([
    { msg:'Ready. Enter a Book ID to begin.', level:'info' },
  ]);
  const [downloading, setDownloading] = useState(false);
  const [logsOpen, setLogsOpen] = useState(true);
  const logRef = useRef(null);

  // Animate fake download
  useEffect(() => {
    if (!downloading) return;
    const id = setInterval(() => {
      setLogs(l => [...l, { msg:`Page ${Math.floor(Math.random()*100)+1} downloaded successfully.`, level:'success' }]);
    }, 800);
    return () => clearInterval(id);
  }, [downloading]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const addToQueue = () => {
    if (!bookId.trim()) return;
    setQueue(q => [...q, bookId.trim()]);
    setBookId('');
  };

  return (
    <div style={{
      width:520, background: tok.bg1,
      border:`1px solid ${tok.border}`, borderRadius:12,
      fontFamily: tok.body, overflow:'hidden',
      boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.6)' : '0 12px 40px rgba(0,0,0,0.15)',
    }}>
      {/* Header */}
      <div style={{
        padding:'18px 24px 16px', borderBottom:`1px solid ${tok.border}`,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background: dark ? `linear-gradient(135deg, ${tok.bg2} 0%, ${tok.bg1} 100%)` : tok.bg2,
      }}>
        <KitabLogo dark={dark} amber={tok.amber} />
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
          <span style={{ fontFamily: T.mono, fontSize:10, color: tok.text2, letterSpacing:'0.1em', textTransform:'uppercase' }}>
            {t.tagline}
          </span>
          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background: downloading ? T.green : tok.text2 }} />
            <span style={{ fontFamily: T.mono, fontSize:10, color: downloading ? T.green : tok.text2 }}>
              {downloading ? t.downloading : t.idle}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>
        {/* Book ID */}
        <FieldInput label={t.bookId} placeholder={t.bookIdPlaceholder} value={bookId} onChange={setBookId} isDark={dark} />

        {/* Pages row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <FieldInput label={t.startPage} placeholder="1" value={startPage} onChange={setStartPage} isDark={dark} />
          <FieldInput label={t.endPage} placeholder="∞" value={endPage} onChange={setEndPage} hint={t.optional} isDark={dark} />
        </div>

        {/* Options */}
        <div style={{
          background: tok.bg2, border:`1px solid ${tok.border}`,
          borderRadius:8, padding:'14px 16px',
          display:'flex', flexDirection:'column', gap:10,
        }}>
          <span style={{ fontFamily: T.mono, fontSize:10, color: tok.text2, textTransform:'uppercase', letterSpacing:'0.08em' }}>{t.options}</span>
          <Toggle label={t.deleteImages} checked={deleteImgs} onChange={setDeleteImgs} isDark={dark} />
          <Toggle label={t.notifications} checked={notifs} onChange={setNotifs} isDark={dark} />
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ flex:1 }}>
            <Btn onClick={() => setDownloading(!downloading)} variant={downloading ? 'danger' : 'primary'} isDark={dark}>
              {downloading ? t.cancelDownload : t.startDownload}
            </Btn>
          </div>
          <Btn onClick={addToQueue} variant="secondary" isDark={dark}>{t.addToQueue}</Btn>
        </div>

        {/* Progress */}
        {(downloading || progress > 0) && (
          <div style={{
            background: tok.bg2, border:`1px solid ${tok.border}`,
            borderRadius:8, padding:'14px 16px',
            display:'flex', flexDirection:'column', gap:12,
            animation:'fadeIn 0.3s ease',
          }}>
            <span style={{ fontFamily: T.mono, fontSize:10, color: tok.text2, textTransform:'uppercase', letterSpacing:'0.08em' }}>{t.progress}</span>
            <ProgressBar value={progress} max={200} isDark={dark} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
              <StatPill label={t.downloaded} value={`${progress}`} isDark={dark} />
              <StatPill label={t.failed} value="0" isDark={dark} />
              <StatPill label={t.elapsed} value="1m 24s" isDark={dark} />
              <StatPill label={t.remaining} value="3m 10s" isDark={dark} />
            </div>
          </div>
        )}

        {/* Queue */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily: T.mono, fontSize:10, color: tok.text2, textTransform:'uppercase', letterSpacing:'0.08em' }}>
              {t.queue} ({queue.length})
            </span>
            {queue.length > 0 && <Btn variant="ghost" small isDark={dark}>{t.startQueue}</Btn>}
          </div>
          {queue.length === 0
            ? <div style={{ padding:'12px 0', color: tok.text2, fontFamily: T.mono, fontSize:12, textAlign:'center' }}>{t.emptyQueue}</div>
            : queue.map((id, i) => <QueueItem key={i} id={id} onRemove={() => setQueue(q => q.filter((_,j)=>j!==i))} isDark={dark} />)
          }
        </div>

        {/* Log */}
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button onClick={() => setLogsOpen(o => !o)} style={{
              background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6,
              color: tok.text2, fontFamily: T.mono, fontSize:10,
              textTransform:'uppercase', letterSpacing:'0.08em',
            }}>
              <span style={{ transition:'transform 0.2s', transform: logsOpen ? 'rotate(0)':'rotate(-90deg)', display:'inline-block' }}>▾</span>
              {t.logs}
            </button>
            <Btn variant="ghost" small isDark={dark} onClick={() => setLogs([])}>{t.clearLog}</Btn>
          </div>
          {logsOpen && (
            <div ref={logRef} style={{
              background: tok.bg0, border:`1px solid ${tok.border}`,
              borderRadius:6, padding:'10px 12px',
              height:100, overflow:'auto',
              display:'flex', flexDirection:'column', gap:2,
            }}>
              {logs.map((l, i) => <LogEntry key={i} msg={l.msg} level={l.level} isDark={dark} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VARIATION B — "Split" — Sidebar nav + main panel
// ═══════════════════════════════════════════════════════════════════
function VariantB({ lang, dark, progress }) {
  const t = LANG[lang];
  const tok = dark ? T : {...T, ...TL};
  const [tab, setTab] = useState('download');
  const [bookId, setBookId] = useState('');
  const [startPage, setStartPage] = useState('1');
  const [endPage, setEndPage] = useState('');
  const [deleteImgs, setDeleteImgs] = useState(false);
  const [queue, setQueue] = useState(['vtls000000012', 'vtls000000087']);
  const [downloading, setDownloading] = useState(false);
  const [logs, setLogs] = useState([{ msg:'Ready.', level:'info' }]);

  useEffect(() => {
    if (!downloading) return;
    const id = setInterval(() => {
      setLogs(l => [...l, { msg:`Page downloaded.`, level:'success' }]);
    }, 1000);
    return () => clearInterval(id);
  }, [downloading]);

  const navItems = [
    { id:'download', label:'Download', icon:'↓' },
    { id:'queue', label: t.queue, icon:'≡' },
    { id:'logs', label: t.logs, icon:'◎' },
  ];

  return (
    <div style={{
      width:640, height:480, display:'flex',
      background: tok.bg1, border:`1px solid ${tok.border}`,
      borderRadius:12, overflow:'hidden',
      boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.6)' : '0 12px 40px rgba(0,0,0,0.15)',
    }}>
      {/* Sidebar */}
      <div style={{
        width:180, background: tok.bg0,
        borderRight:`1px solid ${tok.border}`,
        display:'flex', flexDirection:'column',
        padding:'20px 0',
        flexShrink:0,
      }}>
        <div style={{ padding:'0 20px 20px', borderBottom:`1px solid ${tok.border}` }}>
          <KitabLogo size={22} dark={dark} amber={tok.amber} />
          <div style={{ marginTop:6, fontFamily: T.mono, fontSize:9, color: tok.text2, letterSpacing:'0.08em', textTransform:'uppercase' }}>
            {t.tagline}
          </div>
        </div>

        <nav style={{ padding:'16px 0', flex:1, display:'flex', flexDirection:'column', gap:2 }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{
              display:'flex', alignItems:'center', gap:10, width:'100%',
              padding:'10px 20px', background: tab===n.id ? tok.amberGlow : 'none',
              border:'none', borderLeft: tab===n.id ? `2px solid ${tok.amber}` : '2px solid transparent',
              cursor:'pointer', textAlign:'left',
              transition:'all 0.15s',
            }}>
              <span style={{ fontFamily: T.mono, fontSize:14, color: tab===n.id ? tok.amber : tok.text2 }}>{n.icon}</span>
              <span style={{ fontFamily: tok.body, fontSize:13, color: tab===n.id ? tok.text0 : tok.text1, fontWeight: tab===n.id?500:400 }}>{n.label}</span>
            </button>
          ))}
        </nav>

        {/* Status */}
        <div style={{ padding:'16px 20px', borderTop:`1px solid ${tok.border}` }}>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background: downloading ? T.green : tok.text2 }} />
            <span style={{ fontFamily: T.mono, fontSize:10, color: tok.text2 }}>{downloading ? t.downloading : t.idle}</span>
          </div>
        </div>
      </div>

      {/* Main panel */}
      <div style={{ flex:1, overflow:'auto', padding:'24px' }}>
        {tab === 'download' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <h2 style={{ fontFamily: T.display, fontSize:18, fontWeight:700, color: tok.text0, marginBottom:4 }}>
              {t.startDownload}
            </h2>
            <FieldInput label={t.bookId} placeholder={t.bookIdPlaceholder} value={bookId} onChange={setBookId} isDark={dark} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <FieldInput label={t.startPage} placeholder="1" value={startPage} onChange={setStartPage} isDark={dark} />
              <FieldInput label={t.endPage} placeholder="∞" value={endPage} onChange={setEndPage} hint={t.optional} isDark={dark} />
            </div>
            <Toggle label={t.deleteImages} checked={deleteImgs} onChange={setDeleteImgs} isDark={dark} />
            {(downloading || progress > 0) && (
              <div style={{ background:tok.bg2, border:`1px solid ${tok.border}`, borderRadius:8, padding:'14px 16px' }}>
                <ProgressBar value={progress} max={200} isDark={dark} />
              </div>
            )}
            <div style={{ display:'flex', gap:8, paddingTop:4 }}>
              <Btn onClick={() => setDownloading(!downloading)} variant={downloading?'danger':'primary'} isDark={dark}>
                {downloading ? t.cancelDownload : t.startDownload}
              </Btn>
              <Btn onClick={() => { if(bookId) { setQueue(q=>[...q,bookId]); setBookId(''); } }} variant="secondary" isDark={dark}>
                {t.addToQueue}
              </Btn>
            </div>
          </div>
        )}

        {tab === 'queue' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontFamily: T.display, fontSize:18, fontWeight:700, color: tok.text0 }}>{t.queue}</h2>
              {queue.length > 0 && <Btn variant="primary" small isDark={dark}>{t.startQueue}</Btn>}
            </div>
            {queue.length === 0
              ? <p style={{ fontFamily:T.mono, fontSize:12, color:tok.text2 }}>{t.emptyQueue}</p>
              : queue.map((id,i) => <QueueItem key={i} id={id} onRemove={() => setQueue(q=>q.filter((_,j)=>j!==i))} isDark={dark} />)
            }
          </div>
        )}

        {tab === 'logs' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontFamily: T.display, fontSize:18, fontWeight:700, color: tok.text0 }}>{t.logs}</h2>
              <Btn variant="ghost" small isDark={dark} onClick={() => setLogs([])}>{t.clearLog}</Btn>
            </div>
            <div style={{
              background: tok.bg0, border:`1px solid ${tok.border}`,
              borderRadius:6, padding:'12px', height:320, overflow:'auto',
              display:'flex', flexDirection:'column', gap:3,
            }}>
              {logs.map((l,i) => <LogEntry key={i} {...l} isDark={dark} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VARIATION C — "Focus" — Centered hero, minimal chrome
// ═══════════════════════════════════════════════════════════════════
function VariantC({ lang, dark, progress }) {
  const t = LANG[lang];
  const tok = dark ? T : {...T, ...TL};
  const [bookId, setBookId] = useState('');
  const [startPage, setStartPage] = useState('1');
  const [endPage, setEndPage] = useState('');
  const [deleteImgs, setDeleteImgs] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [step, setStep] = useState('input'); // 'input' | 'progress'

  const handleStart = () => {
    setDownloading(true);
    setStep('progress');
  };
  const handleCancel = () => {
    setDownloading(false);
    setStep('input');
  };

  return (
    <div style={{
      width:480,
      background: dark
        ? 'radial-gradient(ellipse at 30% 20%, #13111e 0%, #090909 60%)'
        : 'radial-gradient(ellipse at 30% 20%, #eee8e0 0%, #f5f2ee 60%)',
      border:`1px solid ${tok.border}`,
      borderRadius:16, overflow:'hidden',
      boxShadow: dark
        ? '0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)'
        : '0 12px 40px rgba(0,0,0,0.12)',
    }}>
      {/* Top strip */}
      <div style={{
        height:3, background:`linear-gradient(90deg, ${tok.amber} 0%, ${tok.amberDim} 100%)`,
      }} />

      <div style={{ padding:'28px 32px', display:'flex', flexDirection:'column', gap:0 }}>
        {/* Hero header */}
        <div style={{ marginBottom:28, display:'flex', flexDirection:'column', gap:8, alignItems:'flex-start' }}>
          <KitabLogo size={32} dark={dark} amber={tok.amber} />
          <p style={{ fontFamily: T.mono, fontSize:11, color: tok.text2, letterSpacing:'0.1em', textTransform:'uppercase' }}>
            {t.tagline}
          </p>
        </div>

        {/* Animated step transition */}
        {step === 'input' ? (
          <div style={{ display:'flex', flexDirection:'column', gap:18, animation:'fadeIn 0.35s ease' }}>
            {/* Big book ID field */}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontFamily: T.mono, fontSize:11, color: tok.text1, letterSpacing:'0.08em', textTransform:'uppercase' }}>
                {t.bookId}
              </label>
              <div style={{
                background: tok.bg2, borderRadius:8,
                border:`1px solid ${tok.border}`,
                display:'flex', alignItems:'center', gap:0, overflow:'hidden',
              }}>
                <span style={{ padding:'0 14px', fontFamily:T.mono, fontSize:18, color: tok.amber, opacity:0.5 }}>#</span>
                <input
                  value={bookId}
                  onChange={e => setBookId(e.target.value)}
                  placeholder={t.bookIdPlaceholder}
                  style={{
                    flex:1, border:'none', background:'transparent',
                    padding:'14px 14px 14px 0',
                    fontFamily: T.mono, fontSize:16, color: tok.text0,
                    outline:'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <FieldInput label={t.startPage} placeholder="1" value={startPage} onChange={setStartPage} isDark={dark} />
              <FieldInput label={t.endPage} placeholder="∞" value={endPage} onChange={setEndPage} hint={t.optional} isDark={dark} />
            </div>

            <Toggle label={t.deleteImages} checked={deleteImgs} onChange={setDeleteImgs} isDark={dark} />

            <button
              onClick={handleStart}
              style={{
                width:'100%', padding:'14px',
                background: `linear-gradient(135deg, ${tok.amber} 0%, ${tok.amberDim} 100%)`,
                border:'none', borderRadius:8,
                fontFamily: T.mono, fontSize:14, fontWeight:500,
                color:'#0a0806', cursor:'pointer', letterSpacing:'0.04em',
                transition:'opacity 0.15s',
                marginTop:4,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}
            >
              {t.startDownload} →
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:20, animation:'fadeIn 0.35s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontFamily: T.mono, fontSize:12, color: tok.text2 }}>{t.bookId}</div>
                <div style={{ fontFamily: T.mono, fontSize:16, color: tok.text0, marginTop:2 }}>{bookId || 'vtls000000004'}</div>
              </div>
              <Btn onClick={handleCancel} variant="danger" small isDark={dark}>{t.cancelDownload}</Btn>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <ProgressBar value={progress} max={200} isDark={dark} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
              <StatPill label={t.downloaded} value={`${progress} ${t.pages}`} isDark={dark} />
              <StatPill label={t.failed} value="0" isDark={dark} />
              <StatPill label={t.elapsed} value="1m 24s" isDark={dark} />
              <StatPill label={t.remaining} value="~3m" isDark={dark} />
            </div>

            {/* Mini log */}
            <div style={{
              background: tok.bg0, border:`1px solid ${tok.border}`,
              borderRadius:6, padding:'10px 12px', height:80, overflow:'auto',
            }}>
              <LogEntry msg="Download started." level="info" isDark={dark} />
              {progress > 0 && <LogEntry msg={`${progress} pages processed.`} level="success" isDark={dark} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared wrapper for each artboard ──────────────────────────────
function ArtboardShell({ label, lang, setLang, dark, setDark, children }) {
  const tok = dark ? T : {...T, ...TL};
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'0 2px',
      }}>
        <span style={{ fontFamily: T.mono, fontSize:11, color: tok.text2, letterSpacing:'0.06em', textTransform:'uppercase' }}>{label}</span>
        <ControlBar lang={lang} setLang={setLang} dark={dark} setDark={setDark} isDark={dark} />
      </div>
      {children}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────
function App() {
  // Each variant gets its own lang/dark state
  const [langA, setLangA] = useState('en');
  const [darkA, setDarkA] = useState(true);
  const [langB, setLangB] = useState('en');
  const [darkB, setDarkB] = useState(true);
  const [langC, setLangC] = useState('en');
  const [darkC, setDarkC] = useState(true);

  // Shared animated progress for demo
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setProgress(p => p >= 200 ? 0 : p + 1);
    }, 150);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      minHeight:'100vh', background:'#060608',
      padding:'40px 60px',
      display:'flex', flexDirection:'column', gap:0,
    }}>
      {/* Page header */}
      <div style={{ marginBottom:40 }}>
        <h1 style={{ fontFamily: T.display, fontSize:28, fontWeight:800, color: T.text0, letterSpacing:'-0.02em' }}>
          Kitab — Redesign
        </h1>
        <p style={{ fontFamily: T.mono, fontSize:12, color: T.text1, marginTop:6 }}>
          Three layout variations · Toggle language & dark mode per card
        </p>
      </div>

      <div style={{ display:'flex', gap:60, flexWrap:'wrap', alignItems:'flex-start' }}>
        <ArtboardShell label="A — Command" lang={langA} setLang={setLangA} dark={darkA} setDark={setDarkA}>
          <VariantA lang={langA} dark={darkA} progress={progress} />
        </ArtboardShell>

        <ArtboardShell label="B — Split" lang={langB} setLang={setLangB} dark={darkB} setDark={setDarkB}>
          <VariantB lang={langB} dark={darkB} progress={progress} />
        </ArtboardShell>

        <ArtboardShell label="C — Focus" lang={langC} setLang={setLangC} dark={darkC} setDark={setDarkC}>
          <VariantC lang={langC} dark={darkC} progress={progress} />
        </ArtboardShell>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
