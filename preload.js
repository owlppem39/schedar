const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('platformInfo', {
  platform: process.platform,
  isMac: process.platform === 'darwin',
});

contextBridge.exposeInMainWorld('storage', {
  get: (key, shared = false) => ipcRenderer.invoke('storage:get', key, shared),
  set: (key, value, shared = false) => ipcRenderer.invoke('storage:set', key, value, shared),
  delete: (key, shared = false) => ipcRenderer.invoke('storage:delete', key, shared),
  list: (prefix, shared = false) => ipcRenderer.invoke('storage:list', prefix, shared),
});

/* Bridge for the always-on-top Pomodoro mini widget window.
   Used by BOTH the main window (sends state, receives control commands)
   and the widget window (receives state, sends control commands). */
contextBridge.exposeInMainWorld('pomoBridge', {
  openWidget: () => ipcRenderer.invoke('pomo:open-widget'),
  sendState: (state) => ipcRenderer.send('pomo:state', state),
  onState: (cb) => ipcRenderer.on('pomo:state', (event, state) => cb(state)),
  sendControl: (cmd) => ipcRenderer.send('pomo:control', cmd),
  onControl: (cb) => ipcRenderer.on('pomo:control', (event, cmd) => cb(cmd)),
  onWidgetReady: (cb) => ipcRenderer.on('pomo:widget-ready', () => cb()),
  widgetReady: () => ipcRenderer.send('pomo:widget-ready'),
});
