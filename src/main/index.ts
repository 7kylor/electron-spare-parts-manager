import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDatabase, closeDatabase } from './database'
import { seedDatabase, ensureCategories } from './database/seed'
import { registerAllHandlers } from './ipc'
import electronUpdater from 'electron-updater'
import { IPC_CHANNELS } from '../shared/types'
import { initLogger, logger, getLogPath, getLogsDirectory } from './logger'

const { autoUpdater } = electronUpdater

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    ...(process.platform === 'linux' ? {} : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    logger.info('Main window ready to show')
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  
  // Log renderer errors
  mainWindow.webContents.on('render-process-gone', (_, details) => {
    logger.error('Renderer process gone:', details)
  })
  
  mainWindow.webContents.on('crashed', () => {
    logger.error('Renderer process crashed')
  })
}

// Initialize database and handlers
async function initialize(): Promise<void> {
  try {
    logger.info('Initializing database...')
    initDatabase()
    
    logger.info('Seeding database...')
    await seedDatabase()
    
    logger.info('Ensuring all categories exist...')
    await ensureCategories()
    
    logger.info('Registering IPC handlers...')
    registerAllHandlers()
    
    // Register app handlers
    registerAppHandlers()
    
    logger.info('Initialization complete')
  } catch (error) {
    logger.error('Initialization error:', error)
    throw error
  }
}

function registerAppHandlers(): void {
  // Get app version
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => {
    return app.getVersion()
  })
  
  // Get log file path
  ipcMain.handle('app:get-log-path', () => {
    return getLogPath()
  })
  
  // Get logs directory
  ipcMain.handle('app:get-logs-directory', () => {
    return getLogsDirectory()
  })
  
  // Open logs directory
  ipcMain.handle('app:open-logs-directory', () => {
    shell.openPath(getLogsDirectory())
    return { success: true }
  })
  
  // Check for updates
  ipcMain.handle(IPC_CHANNELS.APP_CHECK_UPDATE, async () => {
    try {
      logger.info('Checking for updates...')
      const result = await autoUpdater.checkForUpdates()
      const available = result?.updateInfo?.version !== app.getVersion()
      logger.info(`Update check result: ${available ? 'Update available' : 'No updates'}`)
      return {
        available,
        version: result?.updateInfo?.version
      }
    } catch (error) {
      logger.error('Update check error:', error)
      return { available: false }
    }
  })
  
  // Download update
  ipcMain.handle(IPC_CHANNELS.APP_DOWNLOAD_UPDATE, async () => {
    try {
      logger.info('Downloading update...')
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (error) {
      logger.error('Update download error:', error)
      return { success: false }
    }
  })
  
  // Install update
  ipcMain.handle(IPC_CHANNELS.APP_INSTALL_UPDATE, () => {
    logger.info('Installing update and restarting...')
    autoUpdater.quitAndInstall()
  })
}

// Configure auto updater
function configureAutoUpdater(): void {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  
  autoUpdater.on('update-available', (info) => {
    logger.info('Update available:', info.version)
    mainWindow?.webContents.send('update-available', info)
  })
  
  autoUpdater.on('update-downloaded', (info) => {
    logger.info('Update downloaded:', info.version)
    mainWindow?.webContents.send('update-downloaded', info)
  })
  
  autoUpdater.on('error', (error) => {
    logger.error('Auto updater error:', error)
  })
}

// App lifecycle
app.whenReady().then(async () => {
  // Initialize logger first
  initLogger()
  
  // Set app user model id for Windows
  electronApp.setAppUserModelId('com.sparepartsmanager.app')

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await initialize()
  createWindow()
  configureAutoUpdater()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  logger.info('All windows closed')
  closeDatabase()
  if (process.platform !== 'darwin') {
    logger.info('Quitting application')
    app.quit()
  }
})

// Handle certificate errors (for development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  logger.warn('Certificate error:', { url, error: error.toString() })
  if (is.dev) {
    event.preventDefault()
    callback(true)
  } else {
    callback(false)
  }
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason)
})
