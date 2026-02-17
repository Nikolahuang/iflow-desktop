const { app, BrowserWindow, Menu, Tray, globalShortcut, ipcMain, shell } = require('electron');
const path = require('path');
const log = require('electron-log');

log.transports.file.level = 'info';
log.transports.console.level = 'info';

let mainWindow = null;
let tray = null;
const IFLOW_URL = 'https://iflow.cn/';

function createWindow() {
  log.info('正在创建主窗口...');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: '心流AI助手',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      allowRunningInsecureContent: false
    },
    show: false
  });

  mainWindow.loadURL(IFLOW_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log.info('主窗口已显示');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      log.info('窗口已隐藏到系统托盘');
    }
  });

  const menuTemplate = [
    {
      label: '文件',
      submenu: [
        {
          label: '刷新',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) mainWindow.reload();
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.isQuitting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+E', role: 'forceReload' },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: '最大化', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: '始终置顶', type: 'checkbox', checked: false, click: (menuItem) => {
          mainWindow.setAlwaysOnTop(menuItem.checked);
        }}
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于心流AI助手',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于心流AI助手',
              message: '心流AI助手 v1.0.0',
              detail: '让知识随心流动\n\n一款AI助手，帮助你高效获取知识。'
            });
          }
        },
        { type: 'separator' },
        {
          label: '访问官网',
          click: () => {
            shell.openExternal('https://iflow.cn/');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  log.info('应用菜单已创建');
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  
  try {
    tray = new Tray(iconPath);
  } catch (e) {
    log.warn('无法加载托盘图标，使用默认图标');
    return;
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示心流AI助手',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: '刷新',
      click: () => {
        if (mainWindow) mainWindow.reload();
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('心流AI助手');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  log.info('系统托盘已创建');
}

function registerGlobalShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
  log.info('全局快捷键已注册: Ctrl+Shift+I 显示/隐藏窗口');
}

app.whenReady().then(() => {
  log.info('应用启动中...');
  createWindow();
  createTray();
  registerGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  log.info('应用退出，全局快捷键已注销');
});

process.on('uncaughtException', (error) => {
  log.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('未处理的Promise拒绝:', reason);
});