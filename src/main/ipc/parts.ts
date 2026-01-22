import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { parts, categories, users, activityLogs, sessions } from '../database/schema'
import { eq, like, or, and, sql, desc, asc, gt } from 'drizzle-orm'
import { 
  IPC_CHANNELS, 
  type Part, 
  type PartCreateRequest, 
  type PartUpdateRequest, 
  type PartsFilter, 
  type PaginatedResponse 
} from '../../shared/types'

function calculateStatus(quantity: number, minQuantity: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (quantity === 0) return 'out_of_stock'
  if (quantity < minQuantity) return 'low_stock'
  return 'in_stock'
}

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

async function logActivity(userId: number, action: string, partId?: number, details?: string): Promise<void> {
  const db = getDatabase()
  await db.insert(activityLogs).values({
    userId,
    action,
    partId,
    details
  })
}

export function registerPartsHandlers(): void {
  const db = getDatabase()
  
  // Get all parts with filtering and pagination
  ipcMain.handle(IPC_CHANNELS.PARTS_GET_ALL, async (_, filter: PartsFilter = {}): Promise<PaginatedResponse<Part>> => {
    try {
      const { search, status, categoryId, page = 1, limit = 20, sortBy = 'updatedAt', sortOrder = 'desc' } = filter
      const offset = (page - 1) * limit
      
      // Build where conditions
      const conditions: any[] = []
      
      if (search) {
        const searchPattern = `%${search}%`
        conditions.push(
          or(
            like(parts.name, searchPattern),
            like(parts.partNumber, searchPattern),
            like(parts.boxNumber, searchPattern)
          )
        )
      }
      
      if (status) {
        conditions.push(eq(parts.status, status))
      }
      
      if (categoryId) {
        conditions.push(eq(parts.categoryId, categoryId))
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined
      
      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(parts)
        .where(whereClause)
      
      const total = countResult?.count ?? 0
      
      // Get paginated results with joins
      const sortColumn = sortBy === 'name' ? parts.name 
        : sortBy === 'partNumber' ? parts.partNumber
        : sortBy === 'quantity' ? parts.quantity
        : sortBy === 'status' ? parts.status
        : parts.updatedAt
      
      const orderFn = sortOrder === 'asc' ? asc : desc
      
      const results = await db
        .select({
          id: parts.id,
          name: parts.name,
          partNumber: parts.partNumber,
          boxNumber: parts.boxNumber,
          quantity: parts.quantity,
          status: parts.status,
          categoryId: parts.categoryId,
          description: parts.description,
          minQuantity: parts.minQuantity,
          createdBy: parts.createdBy,
          createdAt: parts.createdAt,
          updatedAt: parts.updatedAt,
          categoryName: categories.name,
          categoryType: categories.type,
          createdByName: users.name
        })
        .from(parts)
        .leftJoin(categories, eq(parts.categoryId, categories.id))
        .leftJoin(users, eq(parts.createdBy, users.id))
        .where(whereClause)
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset)
      
      const mappedResults: Part[] = results.map(r => ({
        id: r.id,
        name: r.name,
        partNumber: r.partNumber,
        boxNumber: r.boxNumber,
        quantity: r.quantity,
        status: r.status,
        categoryId: r.categoryId,
        description: r.description ?? undefined,
        minQuantity: r.minQuantity,
        createdBy: r.createdBy,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        category: r.categoryName ? {
          id: r.categoryId,
          name: r.categoryName,
          type: r.categoryType!,
          createdAt: ''
        } : undefined,
        createdByUser: r.createdByName ? {
          id: r.createdBy,
          serviceNumber: '',
          name: r.createdByName,
          role: 'user',
          createdAt: '',
          updatedAt: ''
        } : undefined
      }))
      
      return {
        data: mappedResults,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    } catch (error) {
      console.error('Get parts error:', error)
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
    }
  })
  
  // Get part by ID
  ipcMain.handle(IPC_CHANNELS.PARTS_GET_BY_ID, async (_, id: number): Promise<Part | null> => {
    try {
      const [result] = await db
        .select({
          id: parts.id,
          name: parts.name,
          partNumber: parts.partNumber,
          boxNumber: parts.boxNumber,
          quantity: parts.quantity,
          status: parts.status,
          categoryId: parts.categoryId,
          description: parts.description,
          minQuantity: parts.minQuantity,
          createdBy: parts.createdBy,
          createdAt: parts.createdAt,
          updatedAt: parts.updatedAt,
          categoryName: categories.name,
          categoryType: categories.type,
          categoryDescription: categories.description,
          createdByName: users.name,
          createdByServiceNumber: users.serviceNumber
        })
        .from(parts)
        .leftJoin(categories, eq(parts.categoryId, categories.id))
        .leftJoin(users, eq(parts.createdBy, users.id))
        .where(eq(parts.id, id))
        .limit(1)
      
      if (!result) return null
      
      return {
        id: result.id,
        name: result.name,
        partNumber: result.partNumber,
        boxNumber: result.boxNumber,
        quantity: result.quantity,
        status: result.status,
        categoryId: result.categoryId,
        description: result.description ?? undefined,
        minQuantity: result.minQuantity,
        createdBy: result.createdBy,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        category: result.categoryName ? {
          id: result.categoryId,
          name: result.categoryName,
          type: result.categoryType!,
          description: result.categoryDescription ?? undefined,
          createdAt: ''
        } : undefined,
        createdByUser: result.createdByName ? {
          id: result.createdBy,
          serviceNumber: result.createdByServiceNumber!,
          name: result.createdByName,
          role: 'user',
          createdAt: '',
          updatedAt: ''
        } : undefined
      }
    } catch (error) {
      console.error('Get part by ID error:', error)
      return null
    }
  })
  
  // Create part
  ipcMain.handle(IPC_CHANNELS.PARTS_CREATE, async (_, request: PartCreateRequest): Promise<{ success: boolean; part?: Part; error?: string }> => {
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        return { success: false, error: 'Not authenticated' }
      }
      
      const { name, partNumber, boxNumber, quantity, categoryId, description, minQuantity = 5 } = request
      const status = calculateStatus(quantity, minQuantity)
      
      const [newPart] = await db.insert(parts).values({
        name,
        partNumber: partNumber.toUpperCase(),
        boxNumber: boxNumber.toUpperCase(),
        quantity,
        status,
        categoryId,
        description,
        minQuantity,
        createdBy: userId
      }).returning()
      
      await logActivity(userId, 'created', newPart.id, `Created part: ${name}`)
      
      return { success: true, part: { ...newPart, description: newPart.description ?? undefined } }
    } catch (error) {
      console.error('Create part error:', error)
      return { success: false, error: 'Failed to create part' }
    }
  })
  
  // Update part
  ipcMain.handle(IPC_CHANNELS.PARTS_UPDATE, async (_, request: PartUpdateRequest): Promise<{ success: boolean; part?: Part; error?: string }> => {
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        return { success: false, error: 'Not authenticated' }
      }
      
      const { id, ...updates } = request
      
      // Get current part for minQuantity if not provided
      const [currentPart] = await db.select().from(parts).where(eq(parts.id, id)).limit(1)
      if (!currentPart) {
        return { success: false, error: 'Part not found' }
      }
      
      const quantity = updates.quantity ?? currentPart.quantity
      const minQuantity = updates.minQuantity ?? currentPart.minQuantity
      const status = calculateStatus(quantity, minQuantity)
      
      const updateData: any = {
        ...updates,
        status,
        updatedAt: new Date().toISOString()
      }
      
      if (updates.partNumber) {
        updateData.partNumber = updates.partNumber.toUpperCase()
      }
      if (updates.boxNumber) {
        updateData.boxNumber = updates.boxNumber.toUpperCase()
      }
      
      const [updatedPart] = await db
        .update(parts)
        .set(updateData)
        .where(eq(parts.id, id))
        .returning()
      
      await logActivity(userId, 'updated', id, `Updated part: ${updatedPart.name}`)
      
      return { success: true, part: { ...updatedPart, description: updatedPart.description ?? undefined } }
    } catch (error) {
      console.error('Update part error:', error)
      return { success: false, error: 'Failed to update part' }
    }
  })
  
  // Delete part
  ipcMain.handle(IPC_CHANNELS.PARTS_DELETE, async (_, id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        return { success: false, error: 'Not authenticated' }
      }
      
      const [part] = await db.select().from(parts).where(eq(parts.id, id)).limit(1)
      if (!part) {
        return { success: false, error: 'Part not found' }
      }
      
      // Delete related activity logs first
      await db.delete(activityLogs).where(eq(activityLogs.partId, id))
      
      // Delete the part
      await db.delete(parts).where(eq(parts.id, id))
      
      await logActivity(userId, 'deleted', undefined, `Deleted part: ${part.name} (${part.partNumber})`)
      
      return { success: true }
    } catch (error) {
      console.error('Delete part error:', error)
      return { success: false, error: 'Failed to delete part' }
    }
  })
}
