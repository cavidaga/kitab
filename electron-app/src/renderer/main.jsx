import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
import '@fontsource/syne/700.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(<App />)
