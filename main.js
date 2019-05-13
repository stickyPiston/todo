const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const isDev = require('electron-is-dev')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 400,
    height: 100,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // Create menu template
  var menu = Menu.buildFromTemplate([
    {
      label: 'Menu',
      submenu: [
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'CommandOrControl+Option+I' : 'CommandOrControl+Alt+I',
          click () {
            win.webContents.toggleDevTools()
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click () {
            app.quit()
          }
        }
      ]
    }
  ])
  Menu.setApplicationMenu(menu)

  // and load the index.html of the app.
  win.loadFile('src/index.html')

  // Open the DevTools.
  // win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })

  ipcMain.on('heightChanged', (_event, arg) => {
    if (win.getSize()[1] >= (arg * 29 + 105)) {
      // Nothing ought to happen
    } else {
      win.setSize(win.getSize()[0], (arg * 29 + 105), true)
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow()
})

if (!isDev) {
  app.setLoginItemSettings({
    openAtLogin: true,
    args: [__dirname]
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})
