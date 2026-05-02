import { useState } from 'react'
import { T } from '../tokens.js'

// ─── KitabLogo ────────────────────────────────────────────────────────────────
export function KitabLogo({ size = 28, dark = true, amber }) {
  const accentColor = amber || T.amber
  const textColor   = dark ? T.text0 : '#1a1814'
  return (
    <svg width={size * 2.8} height={size} viewBox="0 0 78 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="2" width="6" height="24" rx="1" fill={accentColor}/>
      <rect x="7" y="4" width="10" height="20" rx="0.5"
        fill={dark ? '#1e1e28' : '#ddd6cb'}
        stroke={dark ? '#3a3a4a' : '#c8c0b4'}
        strokeWidth="0.5"/>
      <line x1="9" y1="9"  x2="15" y2="9"  stroke={accentColor} strokeWidth="0.8" strokeOpacity="0.6"/>
      <line x1="9" y1="12" x2="15" y2="12" stroke={accentColor} strokeWidth="0.8" strokeOpacity="0.4"/>
      <line x1="9" y1="15" x2="13" y2="15" stroke={accentColor} strokeWidth="0.8" strokeOpacity="0.3"/>
      <text x="22" y="20" fontFamily="'Syne', sans-serif" fontWeight="700"
        fontSize="16" fill={textColor} letterSpacing="-0.3">kitab</text>
    </svg>
  )
}

// ─── FieldInput ───────────────────────────────────────────────────────────────
export function FieldInput({ label, placeholder, value, onChange, hint, tok }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontFamily: tok.mono, fontSize: 11, letterSpacing: '0.08em',
        color: tok.text1, textTransform: 'uppercase',
      }}>
        {label}
        {hint && <span style={{ marginLeft: 6, color: tok.text2, textTransform: 'none', letterSpacing: 0 }}>— {hint}</span>}
      </label>
      <div style={{
        position: 'relative',
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
            width: '100%', border: 'none', background: 'transparent',
            padding: '10px 14px', fontFamily: tok.mono, fontSize: 13,
            color: tok.text0, outline: 'none',
          }}
        />
      </div>
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ label, checked, onChange, tok }) {
  return (
    <div onClick={() => onChange(!checked)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <div style={{
        width: 36, height: 20, borderRadius: 10,
        background: checked ? tok.amber : tok.bg3,
        border: `1px solid ${checked ? tok.amber : tok.border}`,
        position: 'relative', transition: 'background 0.2s, border-color 0.2s',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2,
          width: 14, height: 14, borderRadius: '50%',
          background: checked ? tok.bg0 : tok.text2,
          transition: 'left 0.2s, background 0.2s',
        }} />
      </div>
      <span style={{ fontFamily: tok.body, fontSize: 13, color: tok.text1 }}>{label}</span>
    </div>
  )
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, tok }) {
  const pct   = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const color = pct < 100 ? tok.amber : T.green
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ height: 4, borderRadius: 2, background: tok.bg3, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 2,
          background: color,
          transition: 'width 0.4s ease, background 0.4s',
          boxShadow: `0 0 8px ${color}80`,
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: tok.mono, fontSize: 11, color: tok.text2 }}>{Math.round(pct)}%</span>
        <span style={{ fontFamily: tok.mono, fontSize: 11, color: tok.text2 }}>{value} / {max}</span>
      </div>
    </div>
  )
}

// ─── StatPill ─────────────────────────────────────────────────────────────────
export function StatPill({ label, value, tok }) {
  return (
    <div style={{
      background: tok.bg2, border: `1px solid ${tok.border}`,
      borderRadius: 6, padding: '8px 12px',
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <span style={{ fontFamily: tok.mono, fontSize: 10, color: tok.text2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontFamily: tok.mono, fontSize: 14, color: tok.text0 }}>{value}</span>
    </div>
  )
}

// ─── LogEntry ─────────────────────────────────────────────────────────────────
export function LogEntry({ msg, level, tok }) {
  const colors = { error: T.red, warning: '#e09a3a', success: T.green, info: tok.text1 }
  const color  = colors[level] || tok.text1
  const time   = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '3px 0' }}>
      <span style={{ fontFamily: tok.mono, fontSize: 10, color: tok.text2, whiteSpace: 'nowrap', marginTop: 1 }}>{time}</span>
      <span style={{ fontFamily: tok.mono, fontSize: 12, color, lineHeight: 1.5 }}>{msg}</span>
    </div>
  )
}

// ─── QueueItem ───────────────────────────────────────────────────────────────
export function QueueItem({ id, onRemove, tok }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', background: tok.bg2, border: `1px solid ${tok.border}`,
      borderRadius: 6,
    }}>
      <span style={{ fontFamily: tok.mono, fontSize: 12, color: tok.text0 }}>{id}</span>
      <button
        onClick={onRemove}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: hov ? T.red : tok.text2, fontSize: 14, padding: '0 4px',
          transition: 'color 0.15s',
        }}
      >×</button>
    </div>
  )
}

// ─── Btn ──────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', disabled, tok, small }) {
  const [hov, setHov] = useState(false)
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
    },
  }
  const s = styles[variant]
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
        whiteSpace: 'nowrap',
      }}
    >{children}</button>
  )
}

// ─── ControlBar ──────────────────────────────────────────────────────────────
export function ControlBar({ lang, setLang, dark, setDark, tok }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {['en', 'az'].map(l => (
        <button key={l} onClick={() => setLang(l)} style={{
          background: lang === l ? tok.amberGlow : 'none',
          border: `1px solid ${lang === l ? tok.amber : tok.border}`,
          color: lang === l ? tok.amber : tok.text2,
          borderRadius: 4, padding: '4px 10px',
          fontFamily: tok.mono, fontSize: 11,
          cursor: 'pointer', transition: 'all 0.15s',
          letterSpacing: '0.06em',
        }}>{l.toUpperCase()}</button>
      ))}
      <div style={{ width: 1, height: 16, background: tok.border }} />
      <button onClick={() => setDark(!dark)} style={{
        background: 'none', border: `1px solid ${tok.border}`,
        color: tok.text2, borderRadius: 4, padding: '4px 10px',
        fontFamily: tok.mono, fontSize: 11, cursor: 'pointer',
        transition: 'all 0.15s',
      }}>
        {dark ? '☀' : '☾'}
      </button>
    </div>
  )
}
