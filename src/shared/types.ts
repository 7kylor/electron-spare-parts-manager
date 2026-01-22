// Shared types between main and renderer processes

export type UserRole = 'admin' | 'editor' | 'user'
export type PartStatus = 'in_stock' | 'low_stock' | 'out_of_stock'
export type CategoryType = 'mechanical' | 'piping' | 'electrical' | 'specialty'

export interface User {
  id: number
  serviceNumber: string
  name: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: number
  name: string
  type: CategoryType
  description?: string
  createdAt: string
}

export interface Part {
  id: number
  name: string
  partNumber: string
  boxNumber: string
  quantity: number
  status: PartStatus
  categoryId: number
  category?: Category
  description?: string
  minQuantity: number
  createdBy: number
  createdByUser?: User
  createdAt: string
  updatedAt: string
}

export interface ActivityLog {
  id: number
  userId: number
  user?: User
  action: string
  partId?: number
  part?: Part
  details?: string
  createdAt: string
}

// API Types
export interface LoginRequest {
  serviceNumber: string
  password: string
}

export interface RegisterRequest {
  serviceNumber: string
  name: string
  password: string
  role?: UserRole
}

export interface AuthResponse {
  success: boolean
  user?: User
  error?: string
}

export interface PartCreateRequest {
  name: string
  partNumber: string
  boxNumber: string
  quantity: number
  categoryId: number
  description?: string
  minQuantity?: number
}

export interface PartUpdateRequest extends Partial<PartCreateRequest> {
  id: number
}

export interface PartsFilter {
  search?: string
  status?: PartStatus
  categoryId?: number
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface DashboardStats {
  totalParts: number
  totalQuantity: number
  lowStockCount: number
  outOfStockCount: number
  categoryCounts: { category: string; count: number }[]
  recentActivity: ActivityLog[]
}

export interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
  warnings: string[]
}

// IPC Channel Names
export const IPC_CHANNELS = {
  // Auth
  AUTH_LOGIN: 'auth:login',
  AUTH_REGISTER: 'auth:register',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_GET_SESSION: 'auth:get-session',
  
  // Users
  USERS_GET_ALL: 'users:get-all',
  USERS_UPDATE_ROLE: 'users:update-role',
  USERS_DELETE: 'users:delete',
  
  // Parts
  PARTS_GET_ALL: 'parts:get-all',
  PARTS_GET_BY_ID: 'parts:get-by-id',
  PARTS_CREATE: 'parts:create',
  PARTS_UPDATE: 'parts:update',
  PARTS_DELETE: 'parts:delete',
  PARTS_SEARCH: 'parts:search',
  
  // Categories
  CATEGORIES_GET_ALL: 'categories:get-all',
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',
  
  // Import/Export
  IMPORT_EXCEL: 'import:excel',
  EXPORT_EXCEL: 'export:excel',
  IMPORT_PREVIEW: 'import:preview',
  
  // Dashboard
  DASHBOARD_STATS: 'dashboard:stats',
  ACTIVITY_LOG: 'activity:log',
  
  // App
  APP_GET_VERSION: 'app:get-version',
  APP_CHECK_UPDATE: 'app:check-update',
  APP_DOWNLOAD_UPDATE: 'app:download-update',
  APP_INSTALL_UPDATE: 'app:install-update'
} as const
