import { ipcMain, dialog } from 'electron'
import { getDatabase } from '../database'
import { parts, categories, activityLogs, users, sessions } from '../database/schema'
import { eq, and, gt } from 'drizzle-orm'
import * as XLSX from 'xlsx'
import { readFileSync, writeFileSync } from 'fs'
import { IPC_CHANNELS, type ImportResult, type Part } from '../../shared/types'

async function getCurrentUserId(): Promise<number | null> {
  if (!global.currentSessionToken) return null
  
  const db = getDatabase()
  const now = new Date().toISOString()
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(
      eq(sessions.token, global.currentSessionToken),
      gt(sessions.expiresAt, now)
    ))
    .limit(1)
  
  return session?.userId ?? null
}

function calculateStatus(quantity: number, minQuantity: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (quantity === 0) return 'out_of_stock'
  if (quantity < minQuantity) return 'low_stock'
  return 'in_stock'
}

export function registerImportExportHandlers(): void {
  const db = getDatabase()
  
  // Import preview - show file dialog and return parsed data
  ipcMain.handle(IPC_CHANNELS.IMPORT_PREVIEW, async (): Promise<{ success: boolean; data?: any[]; columns?: string[]; error?: string }> => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Import Excel File',
        filters: [
          { name: 'Excel Files', extensions: ['xlsx', 'xls'] }
        ],
        properties: ['openFile']
      })
      
      if (result.canceled || !result.filePaths[0]) {
        return { success: false, error: 'No file selected' }
      }
      
      const filePath = result.filePaths[0]
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(sheet)
      
      if (data.length === 0) {
        return { success: false, error: 'Excel file is empty' }
      }
      
      const columns = Object.keys(data[0] as object)
      
      return { success: true, data, columns }
    } catch (error) {
      console.error('Import preview error:', error)
      return { success: false, error: 'Failed to read Excel file' }
    }
  })
  
  // Import Excel file
  ipcMain.handle(IPC_CHANNELS.IMPORT_EXCEL, async (_, options: { 
    data: any[], 
    columnMapping: Record<string, string>,
    defaultCategoryId?: number,
    defaultMinQuantity?: number 
  }): Promise<ImportResult> => {
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        return { success: false, imported: 0, errors: ['Not authenticated'], warnings: [] }
      }
      
      const { data, columnMapping, defaultCategoryId, defaultMinQuantity = 5 } = options
      
      // Get all categories for lookup
      const allCategories = await db.select().from(categories)
      const categoryMap = new Map(allCategories.map(c => [c.name.toLowerCase(), c.id]))
      
      const errors: string[] = []
      const warnings: string[] = []
      let imported = 0
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const rowNum = i + 2 // Excel row number (1-based + header)
        
        try {
          // Map columns
          const name = row[columnMapping.name]?.toString().trim()
          const partNumber = row[columnMapping.partNumber]?.toString().trim()
          const boxNumber = row[columnMapping.boxNumber]?.toString().trim()
          const quantity = parseInt(row[columnMapping.quantity]) || 0
          const categoryName = row[columnMapping.category]?.toString().trim()
          const description = row[columnMapping.description]?.toString().trim()
          const minQuantity = parseInt(row[columnMapping.minQuantity]) || defaultMinQuantity
          
          // Validate required fields
          if (!name) {
            errors.push(`Row ${rowNum}: Missing name`)
            continue
          }
          if (!partNumber) {
            errors.push(`Row ${rowNum}: Missing part number`)
            continue
          }
          if (!boxNumber) {
            errors.push(`Row ${rowNum}: Missing box number`)
            continue
          }
          
          // Find or use default category
          let categoryId = defaultCategoryId
          if (categoryName) {
            const foundCategoryId = categoryMap.get(categoryName.toLowerCase())
            if (foundCategoryId) {
              categoryId = foundCategoryId
            } else {
              warnings.push(`Row ${rowNum}: Category "${categoryName}" not found, using default`)
            }
          }
          
          if (!categoryId) {
            errors.push(`Row ${rowNum}: No category specified and no default set`)
            continue
          }
          
          const status = calculateStatus(quantity, minQuantity)
          
          await db.insert(parts).values({
            name,
            partNumber: partNumber.toUpperCase(),
            boxNumber: boxNumber.toUpperCase(),
            quantity,
            status,
            categoryId,
            description,
            minQuantity,
            createdBy: userId
          })
          
          imported++
        } catch (rowError: any) {
          errors.push(`Row ${rowNum}: ${rowError.message}`)
        }
      }
      
      await db.insert(activityLogs).values({
        userId,
        action: 'imported',
        details: `Imported ${imported} parts from Excel`
      })
      
      return { success: true, imported, errors, warnings }
    } catch (error: any) {
      console.error('Import error:', error)
      return { success: false, imported: 0, errors: [error.message], warnings: [] }
    }
  })
  
  // Export to Excel
  ipcMain.handle(IPC_CHANNELS.EXPORT_EXCEL, async (): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        return { success: false, error: 'Not authenticated' }
      }
      
      // Get all parts with category info
      const allParts = await db
        .select({
          id: parts.id,
          name: parts.name,
          partNumber: parts.partNumber,
          boxNumber: parts.boxNumber,
          quantity: parts.quantity,
          status: parts.status,
          description: parts.description,
          minQuantity: parts.minQuantity,
          categoryName: categories.name,
          categoryType: categories.type,
          createdAt: parts.createdAt,
          updatedAt: parts.updatedAt
        })
        .from(parts)
        .leftJoin(categories, eq(parts.categoryId, categories.id))
        .orderBy(parts.name)
      
      // Format for Excel
      const exportData = allParts.map(p => ({
        'Part Name': p.name,
        'Part Number': p.partNumber,
        'Box Number': p.boxNumber,
        'Quantity': p.quantity,
        'Status': p.status.replace('_', ' ').toUpperCase(),
        'Min Quantity': p.minQuantity,
        'Category': p.categoryName,
        'Category Type': p.categoryType,
        'Description': p.description || '',
        'Created At': p.createdAt,
        'Updated At': p.updatedAt
      }))
      
      // Create workbook
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      
      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }))
      worksheet['!cols'] = colWidths
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Spare Parts')
      
      // Show save dialog
      const result = await dialog.showSaveDialog({
        title: 'Export to Excel',
        defaultPath: `spare-parts-export-${new Date().toISOString().split('T')[0]}.xlsx`,
        filters: [
          { name: 'Excel Files', extensions: ['xlsx'] }
        ]
      })
      
      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Export cancelled' }
      }
      
      XLSX.writeFile(workbook, result.filePath)
      
      await db.insert(activityLogs).values({
        userId,
        action: 'exported',
        details: `Exported ${allParts.length} parts to Excel`
      })
      
      return { success: true, filePath: result.filePath }
    } catch (error: any) {
      console.error('Export error:', error)
      return { success: false, error: error.message }
    }
  })
}
