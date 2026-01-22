import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceNumber: text('service_number').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'editor', 'user'] }).notNull().default('user'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
})

// Categories table
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', { enum: ['mechanical', 'piping', 'electrical', 'specialty'] }).notNull(),
  description: text('description'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
})

// Parts table
export const parts = sqliteTable('parts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  partNumber: text('part_number').notNull(),
  boxNumber: text('box_number').notNull(),
  quantity: integer('quantity').notNull().default(0),
  status: text('status', { enum: ['in_stock', 'low_stock', 'out_of_stock'] }).notNull().default('out_of_stock'),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  description: text('description'),
  minQuantity: integer('min_quantity').notNull().default(5),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
})

// Activity logs table
export const activityLogs = sqliteTable('activity_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  partId: integer('part_id').references(() => parts.id),
  details: text('details'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
})

// Session table for persistent login
export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
})

// Type exports for Drizzle
export type UserInsert = typeof users.$inferInsert
export type UserSelect = typeof users.$inferSelect
export type CategoryInsert = typeof categories.$inferInsert
export type CategorySelect = typeof categories.$inferSelect
export type PartInsert = typeof parts.$inferInsert
export type PartSelect = typeof parts.$inferSelect
export type ActivityLogInsert = typeof activityLogs.$inferInsert
export type ActivityLogSelect = typeof activityLogs.$inferSelect
export type SessionInsert = typeof sessions.$inferInsert
export type SessionSelect = typeof sessions.$inferSelect
