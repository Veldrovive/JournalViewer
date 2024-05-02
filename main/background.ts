import path from 'path'
import { app, ipcMain, BrowserWindow, screen } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'

import bonjour from 'bonjour'

const isProd = process.env.NODE_ENV === 'production'
const devServerHost = 'localhost'
const devServerPort = 4651

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

;(async () => {
  await app.whenReady()

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  const mainWindow = createWindow('main', {
    width, height,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isProd) {
    await mainWindow.loadURL('app://./home')

    // Listen for http mDNS broadcasts
    let journalService = null

    const bonjourService = bonjour()
    const browser = bonjourService.find({ type: 'http' })

    browser.on('up', (service) => {
      console.log('Found Service', service)
      if (service.name.toLowerCase().includes('journal server')) {
        console.log('Found Journal Service', service)
        journalService = service
        mainWindow.webContents.send('journal_service', journalService)
      }
    })

    browser.on('down', (service) => {
      if (service.name.toLowerCase().includes('journal server')) {
        journalService = null
        mainWindow.webContents.send('journal_service', journalService)
      }
    })

    ipcMain.on('refresh_services', () => {
      mainWindow.webContents.send('journal_service', journalService)
    })
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    mainWindow.webContents.openDevTools()

    ipcMain.on('refresh_services', () => {
      mainWindow.webContents.send('journal_service', {
        port: devServerPort,
        addresses: [devServerHost],
      })
    })
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('message', async (event, arg) => {
    console.log('Got message', arg)
  event.reply('message', `${arg} World!`)
})

ipcMain.on('fitbit-auth', async (message_event, arg) => {
    console.log('Got fitbit-auth message', arg)
    const authUrl = arg

    var authWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        // 'node-integration': false,
        // 'web-security': false
    });

    authWindow.loadURL(authUrl);
    authWindow.show();

    authWindow.webContents.on('will-redirect', (event, newUrl) => {
        console.log('Redirecting to', newUrl)
        const url = new URL(newUrl)
        const code = url.searchParams.get('code')
        if (code) {
            event.preventDefault()
            authWindow.close()
            message_event.reply('fitbit-auth', code)
        }
    });

    authWindow.on('closed', () => {
        authWindow = null
    });
})
