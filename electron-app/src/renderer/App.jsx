import { useState } from 'react'
import { tok as makeTok } from './tokens.js'
import { LANG } from './i18n.js'
import { TitleBar } from './components/TitleBar.jsx'
import { CommandPanel } from './components/CommandPanel.jsx'

export default function App() {
  const [lang, setLang] = useState('en')
  const [dark, setDark] = useState(true)

  const tok = makeTok(dark)
  const t   = LANG[lang]

  return (
    <div style={{
      width:  '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: tok.bg1,
      border: `1px solid ${tok.border}`,
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: dark
        ? '0 24px 60px rgba(0,0,0,0.6)'
        : '0 12px 40px rgba(0,0,0,0.15)',
      fontFamily: tok.body,
      color: tok.text0,
      transition: 'background 0.25s, color 0.25s',
    }}>
      <TitleBar dark={dark} tok={tok} t={t} />
      <CommandPanel
        lang={lang} setLang={setLang}
        dark={dark} setDark={setDark}
        tok={tok} t={t}
      />
    </div>
  )
}
