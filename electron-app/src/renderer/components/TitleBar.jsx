import { useState } from 'react'
import { KitabLogo } from './ui.jsx'

export function TitleBar({ dark, tok, t }) {
  const [hovMin,  setHovMin]  = useState(false)
  const [hovMax,  setHovMax]  = useState(false)
  const [hovClose, setHovClose] = useState(false)

  const btn = (label, hov, setHov, action, color) => (
    <button
      title={label}
      onClick={action}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 28, height: 28, borderRadius: 6,
        background: hov ? color : 'transparent',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hov ? '#fff' : tok.text2,
        fontSize: 13, lineHeight: 1,
        transition: 'background 0.15s, color 0.15s',
        flexShrink: 0,
      }}
    >{label}</button>
  )

  return (
    <div
      style={{
        height: 46,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px 0 20px',
        borderBottom: `1px solid ${tok.border}`,
        background: dark
          ? `linear-gradient(135deg, ${tok.bg2} 0%, ${tok.bg1} 100%)`
          : tok.bg2,
        // Make the whole bar draggable so the window can be moved
        WebkitAppRegion: 'drag',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      <KitabLogo size={22} dark={dark} amber={tok.amber} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, WebkitAppRegion: 'no-drag' }}>
        {/* Status dot */}
        <span style={{ fontFamily: tok.mono, fontSize: 10, color: tok.text2, marginRight: 8 }}>
          {t.tagline}
        </span>
        {btn('−', hovMin,   setHovMin,   () => window.kitab?.minimize(), tok.borderHover)}
        {btn('□', hovMax,   setHovMax,   () => window.kitab?.maximize(), tok.borderHover)}
        {btn('×', hovClose, setHovClose, () => window.kitab?.close(),   '#c0392b')}
      </div>
    </div>
  )
}
