import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { users, sessions } from '../database/schema'
import { eq, and, gt } from 'drizzle-orm'
import { createHash, randomBytes } from 'crypto'
import { IPC_CHANNELS, type LoginRequest, type RegisterRequest, type AuthResponse, type User } from '../../shared/types'
import { logger } from '../logger'

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

function mapUserToResponse(user: typeof users.$inferSelect): User {
  return {
    id: user.id,
    serviceNumber: user.serviceNumber,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }
}

export function registerAuthHandlers(): void {
  const db = getDatabase()
  
  // Login
  ipcMain.handle(IPC_CHANNELS.AUTH_LOGIN, async (_, request: LoginRequest): Promise<AuthResponse> => {
    try {
      const { serviceNumber, password } = request
      const passwordHash = hashPassword(password)
      
      const [user] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.serviceNumber, serviceNumber.toUpperCase()),
          eq(users.passwordHash, passwordHash)
        ))
        .limit(1)
      
      if (!user) {
        return { success: false, error: 'Invalid service number or password' }
      }
      
      // Create session
      const token = generateToken()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      
      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt
      })
      
      // Store token for later retrieval
      global.currentSessionToken = token
      
      return { success: true, user: mapUserToResponse(user) }
    } catch (error) {
      logger.error('Login error:', error)
      return { success: false, error: 'An error occurred during login' }
    }
  })
  
  // Register
  ipcMain.handle(IPC_CHANNELS.AUTH_REGISTER, async (_, request: RegisterRequest): Promise<AuthResponse> => {
    try {
      const { serviceNumber, name, password, role = 'user' } = request
      logger.info(`Registration attempt for service number: ${serviceNumber.toUpperCase()}`)
      
      // Check if service number already exists
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.serviceNumber, serviceNumber.toUpperCase()))
        .limit(1)
      
      if (existing) {
        return { success: false, error: 'Service number already registered' }
      }
      
      // Create user
      const passwordHash = hashPassword(password)
      const [user] = await db.insert(users).values({
        serviceNumber: serviceNumber.toUpperCase(),
        name,
        passwordHash,
        role
      }).returning()
      
      // Create session
      const token = generateToken()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      
      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt
      })
      
      global.currentSessionToken = token
      
      logger.info(`User registered successfully: ${user.serviceNumber}`)
      return { success: true, user: mapUserToResponse(user) }
    } catch (error) {
      logger.error('Register error:', error)
      return { success: false, error: 'An error occurred during registration' }
    }
  })
  
  // Logout
  ipcMain.handle(IPC_CHANNELS.AUTH_LOGOUT, async (): Promise<{ success: boolean }> => {
    try {
      if (global.currentSessionToken) {
        await db.delete(sessions).where(eq(sessions.token, global.currentSessionToken))
        global.currentSessionToken = undefined
        logger.info('User logged out')
      }
      return { success: true }
    } catch (error) {
      logger.error('Logout error:', error)
      return { success: false }
    }
  })
  
  // Get current session
  ipcMain.handle(IPC_CHANNELS.AUTH_GET_SESSION, async (): Promise<AuthResponse> => {
    try {
      if (!global.currentSessionToken) {
        return { success: false }
      }
      
      const now = new Date().toISOString()
      const [session] = await db
        .select()
        .from(sessions)
        .where(and(
          eq(sessions.token, global.currentSessionToken),
          gt(sessions.expiresAt, now)
        ))
        .limit(1)
      
      if (!session) {
        global.currentSessionToken = undefined
        return { success: false }
      }
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1)
      
      if (!user) {
        return { success: false }
      }
      
      return { success: true, user: mapUserToResponse(user) }
    } catch (error) {
      logger.error('Get session error:', error)
      return { success: false }
    }
  })
}

// Global declaration for session token
declare global {
  var currentSessionToken: string | undefined
}
