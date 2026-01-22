import { registerAuthHandlers } from './auth'
import { registerPartsHandlers } from './parts'
import { registerCategoriesHandlers } from './categories'
import { registerUsersHandlers } from './users'
import { registerImportExportHandlers } from './import-export'
import { registerDashboardHandlers } from './dashboard'

export function registerAllHandlers(): void {
  registerAuthHandlers()
  registerPartsHandlers()
  registerCategoriesHandlers()
  registerUsersHandlers()
  registerImportExportHandlers()
  registerDashboardHandlers()
  
  console.log('All IPC handlers registered')
}
