import { create } from 'zustand'
import type { Part, Category, PartsFilter, PaginatedResponse } from '../../shared/types'

interface PartsState {
  parts: Part[]
  categories: Category[]
  totalParts: number
  totalPages: number
  currentPage: number
  isLoading: boolean
  filter: PartsFilter
  selectedPart: Part | null
  
  // Actions
  fetchParts: (filter?: PartsFilter) => Promise<void>
  fetchCategories: () => Promise<void>
  createPart: (data: any) => Promise<{ success: boolean; error?: string }>
  updatePart: (data: any) => Promise<{ success: boolean; error?: string }>
  deletePart: (id: number) => Promise<{ success: boolean; error?: string }>
  setFilter: (filter: Partial<PartsFilter>) => void
  setSelectedPart: (part: Part | null) => void
  getPartById: (id: number) => Promise<Part | null>
}

export const usePartsStore = create<PartsState>((set, get) => ({
  parts: [],
  categories: [],
  totalParts: 0,
  totalPages: 0,
  currentPage: 1,
  isLoading: false,
  filter: {
    page: 1,
    limit: 20,
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  },
  selectedPart: null,
  
  fetchParts: async (filterOverride?: PartsFilter) => {
    set({ isLoading: true })
    try {
      const currentFilter = filterOverride || get().filter
      const response = await window.api.getParts(currentFilter)
      set({
        parts: response.data,
        totalParts: response.total,
        totalPages: response.totalPages,
        currentPage: response.page,
        filter: currentFilter
      })
    } catch (error) {
      console.error('Fetch parts error:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  
  fetchCategories: async () => {
    try {
      const categories = await window.api.getCategories()
      set({ categories })
    } catch (error) {
      console.error('Fetch categories error:', error)
    }
  },
  
  createPart: async (data) => {
    try {
      const response = await window.api.createPart(data)
      if (response.success) {
        await get().fetchParts()
      }
      return { success: response.success, error: response.error }
    } catch (error) {
      console.error('Create part error:', error)
      return { success: false, error: 'Failed to create part' }
    }
  },
  
  updatePart: async (data) => {
    try {
      const response = await window.api.updatePart(data)
      if (response.success) {
        await get().fetchParts()
        // Update selected part if it's the one being edited
        if (get().selectedPart?.id === data.id && response.part) {
          set({ selectedPart: response.part })
        }
      }
      return { success: response.success, error: response.error }
    } catch (error) {
      console.error('Update part error:', error)
      return { success: false, error: 'Failed to update part' }
    }
  },
  
  deletePart: async (id) => {
    try {
      const response = await window.api.deletePart(id)
      if (response.success) {
        await get().fetchParts()
        if (get().selectedPart?.id === id) {
          set({ selectedPart: null })
        }
      }
      return { success: response.success, error: response.error }
    } catch (error) {
      console.error('Delete part error:', error)
      return { success: false, error: 'Failed to delete part' }
    }
  },
  
  setFilter: (newFilter) => {
    const currentFilter = get().filter
    const updatedFilter = { ...currentFilter, ...newFilter }
    set({ filter: updatedFilter })
    get().fetchParts(updatedFilter)
  },
  
  setSelectedPart: (part) => set({ selectedPart: part }),
  
  getPartById: async (id) => {
    try {
      const part = await window.api.getPartById(id)
      if (part) {
        set({ selectedPart: part })
      }
      return part
    } catch (error) {
      console.error('Get part by ID error:', error)
      return null
    }
  }
}))
