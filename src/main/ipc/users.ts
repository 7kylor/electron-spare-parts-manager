import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { users, sessions } from '../database/schema'
import { eq, and, gt, ne } from 'drizzle-orm'
import { IPC_CHANNELS, type User, type UserRole } from '../../shared/types'

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

async function isAdmin(): Promise<boolean> {
  const userId = await getCurrentUserId()
  if (!userId) return false
  
  const db = getDatabase()
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return user?.role === 'admin'
}

export function registerUsersHandlers(): void {
  const db = getDatabase()
  
  // Get all users (admin only)
  ipcMain.handle(IPC_CHANNELS.USERS_GET_ALL, async (): Promise<User[]> => {
    try {
      if (!await isAdmin()) {
        return []
      }
      
      const results = await db.select({
        id: users.id,
        serviceNumber: users.serviceNumber,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      }).from(users).orderBy(users.name)
      
      return results
    } catch (error) {
      console.error('Get users error:', error)
      return []
    }
  })
  
  // Update user role (admin only)
  ipcMain.handle(IPC_CHANNELS.USERS_UPDATE_ROLE, async (_, data: { userId: number; role: UserRole }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!await isAdmin()) {
        return { success: false, error: 'Unauthorized' }
      }
      
      const currentUserId = await getCurrentUserId()
      if (data.userId === currentUserId) {
        return { success: false, error: 'Cannot change your own role' }
      }
      
      await db
        .update(users)
        .set({ role: data.role, updatedAt: new Date().toISOString() })
        .where(eq(users.id, data.userId))
      
      return { success: true }
    } catch (error) {
      console.error('Update user role error:', error)
      return { success: false, error: 'Failed to update user role' }
    }
  })
  
  // Delete user (admin only)
  ipcMain.handle(IPC_CHANNELS.USERS_DELETE, async (_, userId: number): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!await isAdmin()) {
        return { success: false, error: 'Unauthorized' }
      }
      
      const currentUserId = await getCurrentUserId()
      if (userId === currentUserId) {
        return { success: false, error: 'Cannot delete your own account' }
      }
      
      // Delete user sessions first
      await db.delete(sessions).where(eq(sessions.userId, userId))
      
      // Delete user
      await db.delete(users).where(eq(users.id, userId))
      
      return { success: true }
    } catch (error) {
      console.error('Delete user error:', error)
      return { success: false, error: 'Failed to delete user. Make sure no parts are created by this user.' }
    }
  })
}
