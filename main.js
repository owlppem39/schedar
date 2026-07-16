const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_FILE = () => path.join(app.getPath('userData'), 'schedar-data.json');

function loadStore() {
  try {
    const raw = fs.readFileSync(DATA_FILE(), 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.personal) parsed.personal = {};
    if (!parsed.shared) parsed.shared = {};
    return parsed;
  } catch (e) {
    return { personal: {}, shared: {} };
  }
}

function saveStore(store) {
  fs.writeFileSync(DATA_FILE(), JSON.stringify(store), 'utf8');
}

/* -------- storage IPC handlers (mirrors the window.storage API the app expects) -------- */
ipcMain.handle('storage:get', (event, key, shared) => {
  const store = loadStore();
  const scope = shared ? store.shared : store.personal;
  if (!(key in scope)) {
    throw new Error(`Key not found: ${key}`);
  }
  return { key, value: scope[key], shared: !!shared };
});

ipcMain.handle('storage:set', (event, key, value, shared) => {
  const store = loadStore();
  const scope = shared ? store.shared : store.personal;
  scope[key] = value;
  saveStore(store);
  return { key, value, shared: !!shared };
});

ipcMain.handle('storage:delete', (event, key, shared) => {
  const store = loadStore();
  const scope = shared ? store.shared : store.personal;
  const existed = key in scope;
  delete scope[key];
  saveStore(store);
  return { key, deleted: existed, shared: !!shared };
});

ipcMain.handle('storage:list', (event, prefix, shared) => {
  const store = loadStore();
  const scope = shared ? store.shared : store.personal;
  const keys = Object.keys(scope).filter(k => !prefix || k.startsWith(prefix));
  return { keys, prefix: prefix || null, shared: !!shared };
});

/* -------- windows -------- */
let mainWin = null;
let widgetWin = null;
const isMac = process.platform === 'darwin';

function createWindow() {
  mainWin = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 860,
    minHeight: 560,
    title: 'Schedar',
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: isMac ? { x: 14, y: 9 } : undefined,
    backgroundColor: '#F3F4F9',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWin.loadFile('index.html');
  mainWin.on('closed', () => { mainWin = null; });
}

function createWidgetWindow() {
  if (widgetWin && !widgetWin.isDestroyed()) {
    widgetWin.show();
    widgetWin.focus();
    return;
  }
  widgetWin = new BrowserWindow({
    width: 220,
    height: 190,
    alwaysOnTop: true,
    frame: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    title: 'Schedar 타이머',
    backgroundColor: '#FFFFFF',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  if (process.platform === 'darwin') {
    widgetWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }
  widgetWin.loadFile('widget.html');
  widgetWin.on('closed', () => { widgetWin = null; });
}

/* -------- pomodoro widget IPC relay (main window <-> mini widget window) -------- */
ipcMain.handle('pomo:open-widget', () => { createWidgetWindow(); });
ipcMain.on('pomo:state', (event, payload) => {
  if (widgetWin && !widgetWin.isDestroyed()) {
    widgetWin.webContents.send('pomo:state', payload);
  }
});
ipcMain.on('pomo:control', (event, cmd) => {
  if (mainWin && !mainWin.isDestroyed()) {
    mainWin.webContents.send('pomo:control', cmd);
  }
});
ipcMain.on('pomo:widget-ready', () => {
  if (mainWin && !mainWin.isDestroyed()) {
    mainWin.webContents.send('pomo:widget-ready');
  }
});

app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(path.join(__dirname, 'icon.png'));
  }
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
