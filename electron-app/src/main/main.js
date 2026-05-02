const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const { downloadBook, cancelDownload } = require('./downloader')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Disable hardware sandbox on Linux to prevent launch issues for end-users
// on modern distributions (like Ubuntu 24.04+) with strict user namespaces.
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox')
}

// ─── Create Window ────────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 820,
    minWidth: 560,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#060608',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  return win
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  const win = createWindow()

  // ── Window controls ─────────────────────────────────────────────────────────
  ipcMain.on('window:minimize', () => win.minimize())
  ipcMain.on('window:maximize', () => {
    win.isMaximized() ? win.unmaximize() : win.maximize()
  })
  ipcMain.on('window:close', () => win.close())

  // ── Choose output directory ──────────────────────────────────────────────────
  ipcMain.handle('dialog:openDir', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      title: 'Select folder to save downloads',
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // ── Start download ───────────────────────────────────────────────────────────
  ipcMain.handle('download:start', async (event, opts) => {
    const emitEvent = (evt) => {
      // Guard: window may have been closed
      if (!win.isDestroyed()) {
        win.webContents.send('download:event', { bibid: opts.bibid, ...evt })
      }
    }

    // Run async, don't await — progress streams back via emitEvent
    downloadBook(opts, emitEvent).catch((err) => {
      emitEvent({ type: 'log', level: 'error', msg: `Unexpected error: ${err.message}` })
      emitEvent({ type: 'done', level: 'error', msg: 'Download failed.' })
    })

    return { ok: true }
  })

  // ── Cancel download ──────────────────────────────────────────────────────────
  ipcMain.handle('download:cancel', async (event, { bibid }) => {
    cancelDownload(bibid)
    return { ok: true }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
