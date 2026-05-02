const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('kitab', {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close:    () => ipcRenderer.send('window:close'),

  // File dialog
  openDir: () => ipcRenderer.invoke('dialog:openDir'),

  // Download
  startDownload: (opts) => ipcRenderer.invoke('download:start', opts),
  cancelDownload: (opts) => ipcRenderer.invoke('download:cancel', opts),

  // Receive events from main process
  onDownloadEvent: (cb) => {
    const handler = (_event, data) => cb(data)
    ipcRenderer.on('download:event', handler)
    // Return cleanup function
    return () => ipcRenderer.removeListener('download:event', handler)
  },
})
