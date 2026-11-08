/**
 * http.js — HTTP transport for the library sites, which sit behind Cloudflare.
 *
 * Cloudflare only accepts requests made from a page that passed its browser
 * check, so each origin gets a hidden window parked on that site and every
 * request is a fetch() run inside it. If the check needs the user (e.g. a
 * "Verify you are human" box), the window is shown until it passes.
 */

'use strict'

const { BrowserWindow } = require('electron')

const PARTITION      = 'persist:anl'
const FETCH_TIMEOUT  = 30000
const SHOW_DELAY_MS  = 60000   // fallback only; a visible checkbox shows it sooner
const VERIFY_WAIT_MS = 5 * 60 * 1000
const QUIET_WAIT_MS  = 20000
const MAX_VERIFIES   = 2

const agents = new Map()   // origin → { win, ready: Promise|null }

function isChallengePage(wc) {
  return wc.executeJavaScript(
    `document.title === 'Just a moment...' || typeof window._cf_chl_opt !== 'undefined'`
  ).catch(() => true)
}

// A Turnstile checkbox only appears when the check cannot pass on its own.
function needsUser(wc) {
  return wc.executeJavaScript(`(() => {
    if (document.title !== 'Just a moment...') return false
    const box = document.querySelector('#challenge-stage iframe, iframe[src*="challenges.cloudflare.com"]')
    if (!box) return false
    const r = box.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  })()`).catch(() => false)
}

function getAgent(origin) {
  let agent = agents.get(origin)
  if (agent && !agent.win.isDestroyed()) return agent

  // The default Electron user agent must be kept: overriding it makes
  // Cloudflare's check fail in a loop.
  const win = new BrowserWindow({
    width: 520,
    height: 640,
    show: false,
    title: `Kitab — ${new URL(origin).host}`,
    autoHideMenuBar: true,
    webPreferences: {
      partition: PARTITION,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  })
  win.webContents.setAudioMuted(true)
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  // Closing a shown verification window only hides it; the agent stays usable.
  win.on('close', (e) => {
    if (agents.get(origin) === agent) {
      e.preventDefault()
      win.hide()
      win.emit('verify-dismissed')
    }
  })

  agent = { win, ready: null }
  agents.set(origin, agent)
  return agent
}

/**
 * Navigate the agent window to `url` and wait until Cloudflare lets it through.
 * interactive=false never shows the window and gives up quickly.
 */
function verify(agent, url, { interactive, onChallenge }) {
  if (agent.ready) return agent.ready

  const { win } = agent
  const wc = win.webContents

  agent.ready = new Promise((resolve, reject) => {
    let settled = false
    let showTimer = null
    let giveUpTimer = null
    let watchTimer = null

    const finish = (err) => {
      if (settled) return
      settled = true
      clearTimeout(showTimer)
      clearTimeout(giveUpTimer)
      clearInterval(watchTimer)
      wc.removeListener('did-finish-load', check)
      win.removeListener('verify-dismissed', onDismiss)
      if (!win.isDestroyed()) win.hide()
      err ? reject(err) : resolve()
    }

    const check = async () => {
      if (!(await isChallengePage(wc))) finish()
    }
    const onDismiss = () => finish(new Error('Cloudflare verification was cancelled.'))

    wc.on('did-finish-load', check)
    win.on('verify-dismissed', onDismiss)

    let shown = false
    const show = (reason) => {
      if (settled || shown || win.isDestroyed()) return
      shown = true
      clearInterval(watchTimer)
      if (onChallenge) onChallenge(reason)
      win.show()
    }

    // An automatic pass finishes on its own, so the window stays hidden unless
    // a Turnstile checkbox needs a click, or the check stalls entirely.
    if (interactive) {
      showTimer = setTimeout(() => show('slow'), SHOW_DELAY_MS)
      watchTimer = setInterval(async () => { if (await needsUser(wc)) show('checkbox') }, 1000)
    }
    giveUpTimer = setTimeout(
      () => finish(new Error('Cloudflare verification timed out.')),
      interactive ? VERIFY_WAIT_MS : QUIET_WAIT_MS,
    )

    wc.loadURL(url).catch(() => {})
  }).finally(() => { agent.ready = null })

  return agent.ready
}

function pageFetch(wc, url, referrer) {
  return wc.executeJavaScript(`(async () => {
    const res = await fetch(${JSON.stringify(url)}, {
      credentials: 'include',
      cache: 'no-store',
      ${referrer ? `referrer: ${JSON.stringify(referrer)},` : ''}
      signal: AbortSignal.timeout(${FETCH_TIMEOUT}),
    })
    return {
      status: res.status,
      challenge: res.headers.get('cf-mitigated') === 'challenge',
      body: new Uint8Array(await res.arrayBuffer()),
    }
  })()`)
}

// ── Public API ────────────────────────────────────────────────────────────────
/**
 * GET a URL and return its body as a Buffer.
 *   interactive  – show a verification window if Cloudflare needs the user
 *   referrer     – same-origin Referer to send with the request
 *   onChallenge  – called when the verification window is shown, with
 *                  reason 'checkbox' (needs a click) or 'slow' (fallback)
 */
async function fetchBuf(url, { interactive = true, referrer, onChallenge } = {}) {
  const { origin } = new URL(url)
  const agent = getAgent(origin)

  for (let verifies = 0; ; verifies++) {
    const wc = agent.win.webContents
    const onSite = wc.getURL().startsWith(`${origin}/`) && !(await isChallengePage(wc))

    if (onSite) {
      const res = await pageFetch(wc, url, referrer)
      if (!res.challenge) {
        if (res.status < 200 || res.status >= 300) throw new Error(`HTTP ${res.status} for ${url}`)
        return Buffer.from(res.body)
      }
    }

    if (verifies >= MAX_VERIFIES) {
      throw new Error(`Blocked by Cloudflare verification (${new URL(url).host}).`)
    }
    await verify(agent, referrer || url, { interactive, onChallenge })
  }
}

async function fetchText(url, opts) {
  return (await fetchBuf(url, opts)).toString('utf8')
}

// Must run before the app quits: agent windows veto their own 'close'.
function closeAll() {
  for (const { win } of agents.values()) {
    if (!win.isDestroyed()) win.destroy()
  }
  agents.clear()
}

module.exports = { fetchBuf, fetchText, closeAll }
