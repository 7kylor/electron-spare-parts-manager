import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

// Default visible columns
const defaultColumns = ['name', 'partNumber', 'boxNumber', 'quantity', 'category', 'status']

interface UIState {
  theme: Theme
  sidebarOpen: boolean
  visibleColumns: string[]
  
  // Actions
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setVisibleColumns: (columns: string[]) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarOpen: true,
      visibleColumns: defaultColumns,
      
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
      
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setVisibleColumns: (columns) => set({ visibleColumns: columns }),
    }),
    {
      name: 'ui-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme after rehydration
        if (state?.theme) {
          applyTheme(state.theme)
        }
        // Ensure default columns if not set
        if (!state?.visibleColumns) {
          state && (state.visibleColumns = defaultColumns)
        }
      }
    }
  )
)

function applyTheme(theme: Theme) {
  const root = document.documentElement
  
  if (theme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', systemDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const { theme } = useUIStore.getState()
    if (theme === 'system') {
      document.documentElement.classList.toggle('dark', e.matches)
    }
  })
}
