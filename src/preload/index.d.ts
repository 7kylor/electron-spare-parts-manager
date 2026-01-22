import { ElectronAPI } from '@electron-toolkit/preload'
import type { 
  User, 
  Part, 
  Category, 
  AuthResponse, 
  PaginatedResponse, 
  DashboardStats,
  ActivityLog,
  ImportResult,
  PartsFilter,
  PartCreateRequest,
  PartUpdateRequest,
  LoginRequest,
  RegisterRequest,
  UserRole,
  CategoryType
} from '../shared/types'

interface API {
  // Auth
  login: (request: LoginRequest) => Promise<AuthResponse>
  register: (request: RegisterRequest) => Promise<AuthResponse>
  logout: () => Promise<{ success: boolean }>
  getSession: () => Promise<AuthResponse>
  
  // Users
  getUsers: () => Promise<User[]>
  updateUserRole: (data: { userId: number; role: UserRole }) => Promise<{ success: boolean; error?: string }>
  deleteUser: (userId: number) => Promise<{ success: boolean; error?: string }>
  
  // Parts
  getParts: (filter?: PartsFilter) => Promise<PaginatedResponse<Part>>
  getPartById: (id: number) => Promise<Part | null>
  createPart: (data: PartCreateRequest) => Promise<{ success: boolean; part?: Part; error?: string }>
  updatePart: (data: PartUpdateRequest) => Promise<{ success: boolean; part?: Part; error?: string }>
  deletePart: (id: number) => Promise<{ success: boolean; error?: string }>
  
  // Categories
  getCategories: () => Promise<Category[]>
  createCategory: (data: { name: string; type: CategoryType; description?: string }) => Promise<{ success: boolean; category?: Category; error?: string }>
  updateCategory: (data: { id: number; name?: string; type?: CategoryType; description?: string }) => Promise<{ success: boolean; category?: Category; error?: string }>
  deleteCategory: (id: number) => Promise<{ success: boolean; error?: string }>
  
  // Import/Export
  importPreview: () => Promise<{ success: boolean; data?: any[]; columns?: string[]; error?: string }>
  importExcel: (options: { 
    data: any[]; 
    columnMapping: Record<string, string>;
    defaultCategoryId?: number;
    defaultMinQuantity?: number 
  }) => Promise<ImportResult>
  exportExcel: () => Promise<{ success: boolean; filePath?: string; error?: string }>
  
  // Dashboard
  getDashboardStats: () => Promise<DashboardStats>
  getActivityLog: (options?: { page?: number; limit?: number }) => Promise<{ data: ActivityLog[]; total: number }>
  
  // App
  getVersion: () => Promise<string>
  checkUpdate: () => Promise<{ available: boolean; version?: string }>
  downloadUpdate: () => Promise<{ success: boolean }>
  installUpdate: () => void
  
  // Logs
  getLogPath: () => Promise<string>
  getLogsDirectory: () => Promise<string>
  openLogsDirectory: () => Promise<{ success: boolean }>
  
  // Event listeners
  onUpdateAvailable: (callback: (info: any) => void) => () => void
  onUpdateDownloaded: (callback: (info: any) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
