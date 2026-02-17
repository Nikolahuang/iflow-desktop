const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  
  onWindowStateChange: (callback) => {
    ipcRenderer.on('window-state-change', (event, state) => callback(state));
  },
  
  openExternal: (url) => ipcRenderer.send('open-external', url),
  
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body })
});

console.log('预加载脚本已加载');
