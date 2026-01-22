import log from 'electron-log'
import { app } from 'electron'
import { join } from 'path'

// Configure electron-log
export function initLogger(): void {
  // Set log file path
  const logPath = join(app.getPath('userData'), 'logs')
  
  // Configure file transport
  log.transports.file.resolvePathFn = () => join(logPath, 'app.log')
  log.transports.file.maxSize = 10 * 1024 * 1024 // 10MB max
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
  
  // Keep last 5 log files
  log.transports.file.archiveLogFn = (oldLogFile) => {
    const date = new Date().toISOString().split('T')[0]
    return oldLogFile.path.replace('app.log', `app-${date}.log`)
  }
  
  // Console output format
  log.transports.console.format = '[{h}:{i}:{s}] [{level}] {text}'
  
  // Catch unhandled errors
  log.errorHandler.startCatching({
    showDialog: false,
    onError: ({ error }) => {
      log.error('Unhandled error:', error)
    }
  })
  
  log.info('='.repeat(60))
  log.info('Application started')
  log.info(`Version: ${app.getVersion()}`)
  log.info(`Platform: ${process.platform}`)
  log.info(`Electron: ${process.versions.electron}`)
  log.info(`Node: ${process.versions.node}`)
  log.info(`Log path: ${logPath}`)
  log.info('='.repeat(60))
}

// Export configured logger
export const logger = log

// Helper to get log file path (for UI)
export function getLogPath(): string {
  return join(app.getPath('userData'), 'logs', 'app.log')
}

export function getLogsDirectory(): string {
  return join(app.getPath('userData'), 'logs')
}
