import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { parts, categories, activityLogs, users } from '../database/schema'
import { eq, sql, desc } from 'drizzle-orm'
import { IPC_CHANNELS, type DashboardStats, type ActivityLog } from '../../shared/types'

export function registerDashboardHandlers(): void {
  const db = getDatabase()
  
  // Get dashboard stats
  ipcMain.handle(IPC_CHANNELS.DASHBOARD_STATS, async (): Promise<DashboardStats> => {
    try {
      // Total parts count
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(parts)
      const totalParts = totalResult?.count ?? 0
      
      // Total quantity
      const [quantityResult] = await db
        .select({ sum: sql<number>`coalesce(sum(quantity), 0)` })
        .from(parts)
      const totalQuantity = quantityResult?.sum ?? 0
      
      // Low stock count
      const [lowStockResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(parts)
        .where(eq(parts.status, 'low_stock'))
      const lowStockCount = lowStockResult?.count ?? 0
      
      // Out of stock count
      const [outOfStockResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(parts)
        .where(eq(parts.status, 'out_of_stock'))
      const outOfStockCount = outOfStockResult?.count ?? 0
      
      // Category counts
      const categoryCountsResult = await db
        .select({
          category: categories.name,
          count: sql<number>`count(${parts.id})`
        })
        .from(categories)
        .leftJoin(parts, eq(categories.id, parts.categoryId))
        .groupBy(categories.id, categories.name)
        .orderBy(desc(sql`count(${parts.id})`))
      
      const categoryCounts = categoryCountsResult.map(r => ({
        category: r.category,
        count: r.count ?? 0
      }))
      
      // Recent activity
      const recentActivityResult = await db
        .select({
          id: activityLogs.id,
          userId: activityLogs.userId,
          action: activityLogs.action,
          partId: activityLogs.partId,
          details: activityLogs.details,
          createdAt: activityLogs.createdAt,
          userName: users.name,
          userServiceNumber: users.serviceNumber,
          partName: parts.name
        })
        .from(activityLogs)
        .leftJoin(users, eq(activityLogs.userId, users.id))
        .leftJoin(parts, eq(activityLogs.partId, parts.id))
        .orderBy(desc(activityLogs.createdAt))
        .limit(20)
      
      const recentActivity: ActivityLog[] = recentActivityResult.map(r => ({
        id: r.id,
        userId: r.userId,
        action: r.action,
        partId: r.partId ?? undefined,
        details: r.details ?? undefined,
        createdAt: r.createdAt,
        user: r.userName ? {
          id: r.userId,
          serviceNumber: r.userServiceNumber!,
          name: r.userName,
          role: 'user',
          createdAt: '',
          updatedAt: ''
        } : undefined,
        part: r.partName && r.partId ? {
          id: r.partId,
          name: r.partName,
          partNumber: '',
          boxNumber: '',
          quantity: 0,
          status: 'in_stock',
          categoryId: 0,
          minQuantity: 5,
          createdBy: 0,
          createdAt: '',
          updatedAt: ''
        } : undefined
      }))
      
      return {
        totalParts,
        totalQuantity,
        lowStockCount,
        outOfStockCount,
        categoryCounts,
        recentActivity
      }
    } catch (error) {
      console.error('Dashboard stats error:', error)
      return {
        totalParts: 0,
        totalQuantity: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        categoryCounts: [],
        recentActivity: []
      }
    }
  })
  
  // Get activity log
  ipcMain.handle(IPC_CHANNELS.ACTIVITY_LOG, async (_, options: { page?: number; limit?: number } = {}): Promise<{ data: ActivityLog[]; total: number }> => {
    try {
      const { page = 1, limit = 50 } = options
      const offset = (page - 1) * limit
      
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(activityLogs)
      const total = countResult?.count ?? 0
      
      const results = await db
        .select({
          id: activityLogs.id,
          userId: activityLogs.userId,
          action: activityLogs.action,
          partId: activityLogs.partId,
          details: activityLogs.details,
          createdAt: activityLogs.createdAt,
          userName: users.name,
          userServiceNumber: users.serviceNumber
        })
        .from(activityLogs)
        .leftJoin(users, eq(activityLogs.userId, users.id))
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit)
        .offset(offset)
      
      const data: ActivityLog[] = results.map(r => ({
        id: r.id,
        userId: r.userId,
        action: r.action,
        partId: r.partId ?? undefined,
        details: r.details ?? undefined,
        createdAt: r.createdAt,
        user: r.userName ? {
          id: r.userId,
          serviceNumber: r.userServiceNumber!,
          name: r.userName,
          role: 'user',
          createdAt: '',
          updatedAt: ''
        } : undefined
      }))
      
      return { data, total }
    } catch (error) {
      console.error('Activity log error:', error)
      return { data: [], total: 0 }
    }
  })
}
