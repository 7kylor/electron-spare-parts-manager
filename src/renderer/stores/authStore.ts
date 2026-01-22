import { create } from 'zustand'
import type { User } from '../../shared/types'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  login: (serviceNumber: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (serviceNumber: string, name: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  
  login: async (serviceNumber, password) => {
    set({ isLoading: true })
    try {
      const response = await window.api.login({ serviceNumber, password })
      if (response.success && response.user) {
        set({ user: response.user, isAuthenticated: true })
        return { success: true }
      }
      return { success: false, error: response.error || 'Login failed' }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      set({ isLoading: false })
    }
  },
  
  register: async (serviceNumber, name, password) => {
    set({ isLoading: true })
    try {
      const response = await window.api.register({ serviceNumber, name, password })
      if (response.success && response.user) {
        set({ user: response.user, isAuthenticated: true })
        return { success: true }
      }
      return { success: false, error: response.error || 'Registration failed' }
    } catch (error) {
      console.error('Register error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      set({ isLoading: false })
    }
  },
  
  logout: async () => {
    try {
      await window.api.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      set({ user: null, isAuthenticated: false })
    }
  },
  
  checkSession: async () => {
    set({ isLoading: true })
    try {
      const response = await window.api.getSession()
      if (response.success && response.user) {
        set({ user: response.user, isAuthenticated: true })
      } else {
        set({ user: null, isAuthenticated: false })
      }
    } catch (error) {
      console.error('Session check error:', error)
      set({ user: null, isAuthenticated: false })
    } finally {
      set({ isLoading: false })
    }
  }
}))
