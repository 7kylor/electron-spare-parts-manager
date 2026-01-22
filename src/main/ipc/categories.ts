import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { categories } from '../database/schema'
import { eq } from 'drizzle-orm'
import { IPC_CHANNELS, type Category, type CategoryType } from '../../shared/types'

export function registerCategoriesHandlers(): void {
  const db = getDatabase()
  
  // Get all categories
  ipcMain.handle(IPC_CHANNELS.CATEGORIES_GET_ALL, async (): Promise<Category[]> => {
    try {
      const results = await db.select().from(categories).orderBy(categories.type, categories.name)
      return results.map(c => ({
        ...c,
        description: c.description ?? undefined
      }))
    } catch (error) {
      console.error('Get categories error:', error)
      return []
    }
  })
  
  // Create category
  ipcMain.handle(IPC_CHANNELS.CATEGORIES_CREATE, async (_, data: { name: string; type: CategoryType; description?: string }): Promise<{ success: boolean; category?: Category; error?: string }> => {
    try {
      const [newCategory] = await db.insert(categories).values(data).returning()
      return { 
        success: true, 
        category: { ...newCategory, description: newCategory.description ?? undefined } 
      }
    } catch (error) {
      console.error('Create category error:', error)
      return { success: false, error: 'Failed to create category' }
    }
  })
  
  // Update category
  ipcMain.handle(IPC_CHANNELS.CATEGORIES_UPDATE, async (_, data: { id: number; name?: string; type?: CategoryType; description?: string }): Promise<{ success: boolean; category?: Category; error?: string }> => {
    try {
      const { id, ...updates } = data
      const [updatedCategory] = await db
        .update(categories)
        .set(updates)
        .where(eq(categories.id, id))
        .returning()
      
      if (!updatedCategory) {
        return { success: false, error: 'Category not found' }
      }
      
      return { 
        success: true, 
        category: { ...updatedCategory, description: updatedCategory.description ?? undefined } 
      }
    } catch (error) {
      console.error('Update category error:', error)
      return { success: false, error: 'Failed to update category' }
    }
  })
  
  // Delete category
  ipcMain.handle(IPC_CHANNELS.CATEGORIES_DELETE, async (_, id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      await db.delete(categories).where(eq(categories.id, id))
      return { success: true }
    } catch (error) {
      console.error('Delete category error:', error)
      return { success: false, error: 'Failed to delete category. Make sure no parts are using this category.' }
    }
  })
}
