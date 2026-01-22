import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '../shared/types'

// Custom APIs for renderer
const api = {
  // Auth
  login: (request: { serviceNumber: string; password: string }) => 
    ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGIN, request),
  register: (request: { serviceNumber: string; name: string; password: string; role?: string }) => 
    ipcRenderer.invoke(IPC_CHANNELS.AUTH_REGISTER, request),
  logout: () => 
    ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGOUT),
  getSession: () => 
    ipcRenderer.invoke(IPC_CHANNELS.AUTH_GET_SESSION),
  
  // Users
  getUsers: () => 
    ipcRenderer.invoke(IPC_CHANNELS.USERS_GET_ALL),
  updateUserRole: (data: { userId: number; role: string }) => 
    ipcRenderer.invoke(IPC_CHANNELS.USERS_UPDATE_ROLE, data),
  deleteUser: (userId: number) => 
    ipcRenderer.invoke(IPC_CHANNELS.USERS_DELETE, userId),
  
  // Parts
  getParts: (filter?: any) => 
    ipcRenderer.invoke(IPC_CHANNELS.PARTS_GET_ALL, filter),
  getPartById: (id: number) => 
    ipcRenderer.invoke(IPC_CHANNELS.PARTS_GET_BY_ID, id),
  createPart: (data: any) => 
    ipcRenderer.invoke(IPC_CHANNELS.PARTS_CREATE, data),
  updatePart: (data: any) => 
    ipcRenderer.invoke(IPC_CHANNELS.PARTS_UPDATE, data),
  deletePart: (id: number) => 
    ipcRenderer.invoke(IPC_CHANNELS.PARTS_DELETE, id),
  
  // Categories
  getCategories: () => 
    ipcRenderer.invoke(IPC_CHANNELS.CATEGORIES_GET_ALL),
  createCategory: (data: any) => 
    ipcRenderer.invoke(IPC_CHANNELS.CATEGORIES_CREATE, data),
  updateCategory: (data: any) => 
    ipcRenderer.invoke(IPC_CHANNELS.CATEGORIES_UPDATE, data),
  deleteCategory: (id: number) => 
    ipcRenderer.invoke(IPC_CHANNELS.CATEGORIES_DELETE, id),
  
  // Import/Export
  importPreview: () => 
    ipcRenderer.invoke(IPC_CHANNELS.IMPORT_PREVIEW),
  importExcel: (options: any) => 
    ipcRenderer.invoke(IPC_CHANNELS.IMPORT_EXCEL, options),
  exportExcel: () => 
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_EXCEL),
  
  // Dashboard
  getDashboardStats: () => 
    ipcRenderer.invoke(IPC_CHANNELS.DASHBOARD_STATS),
  getActivityLog: (options?: any) => 
    ipcRenderer.invoke(IPC_CHANNELS.ACTIVITY_LOG, options),
  
  // App
  getVersion: () => 
    ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
  checkUpdate: () => 
    ipcRenderer.invoke(IPC_CHANNELS.APP_CHECK_UPDATE),
  downloadUpdate: () => 
    ipcRenderer.invoke(IPC_CHANNELS.APP_DOWNLOAD_UPDATE),
  installUpdate: () => 
    ipcRenderer.invoke(IPC_CHANNELS.APP_INSTALL_UPDATE),
  
  // Logs
  getLogPath: () => 
    ipcRenderer.invoke('app:get-log-path'),
  getLogsDirectory: () => 
    ipcRenderer.invoke('app:get-logs-directory'),
  openLogsDirectory: () => 
    ipcRenderer.invoke('app:open-logs-directory'),
  
  // Event listeners
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_, info) => callback(info))
    return () => ipcRenderer.removeAllListeners('update-available')
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (_, info) => callback(info))
    return () => ipcRenderer.removeAllListeners('update-downloaded')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
