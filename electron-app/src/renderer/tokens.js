// ─── Design Tokens ────────────────────────────────────────────────────────────
export const T = {
  bg0:         '#060608',
  bg1:         '#0d0d10',
  bg2:         '#14141a',
  bg3:         '#1c1c24',
  border:      '#2a2a35',
  borderHover: '#3e3e50',
  text0:       '#f0ede8',
  text1:       '#a09d98',
  text2:       '#5c5a58',
  amber:       '#e6a43a',
  amberDim:    '#a37020',
  amberGlow:   'rgba(230,164,58,0.12)',
  red:         '#e05a4e',
  green:       '#4ec97a',
  mono:        "'DM Mono', monospace",
  display:     "'Syne', sans-serif",
  body:        "'DM Sans', sans-serif",
}

export const TL = {
  bg0:         '#f5f2ee',
  bg1:         '#ede9e4',
  bg2:         '#e4dfd8',
  bg3:         '#dcd6ce',
  border:      '#ccc7be',
  borderHover: '#b0aa9e',
  text0:       '#1a1814',
  text1:       '#6b6560',
  text2:       '#a09a94',
  amber:       '#b5780a',
  amberDim:    '#d4980e',
  amberGlow:   'rgba(181,120,10,0.10)',
}

export function tok(dark) {
  return dark ? T : { ...T, ...TL }
}
