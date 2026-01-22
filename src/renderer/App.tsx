import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { ToastProvider } from '@/components/ui/toast'
import { Loading } from '@/components/ui/spinner'
import { Layout } from '@/components/layout/Layout'
import { LoginPage } from '@/pages/Login'
import { HomePage } from '@/pages/Home'
import { InventoryPage } from '@/pages/Inventory'
import { PartDetailPage } from '@/pages/PartDetail'
import { DashboardPage } from '@/pages/Dashboard'
import { SettingsPage } from '@/pages/Settings'
import { ImportPage } from '@/pages/Import'

function ProtectedRoute({ children, requiredRoles }: { children: React.ReactNode; requiredRoles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuthStore()
  
  if (isLoading) {
    return <Loading message="Checking authentication..." />
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated, isLoading, checkSession } = useAuthStore()
  const { theme } = useUIStore()
  
  useEffect(() => {
    checkSession()
  }, [])
  
  useEffect(() => {
    // Apply theme on mount
    const root = document.documentElement
    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', systemDark)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
  }, [theme])
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading message="Starting application..." />
      </div>
    )
  }
  
  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<HomePage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="parts/:id" element={<PartDetailPage />} />
        <Route path="import" element={
          <ProtectedRoute requiredRoles={['admin', 'editor']}>
            <ImportPage />
          </ProtectedRoute>
        } />
        <Route path="dashboard" element={
          <ProtectedRoute requiredRoles={['admin', 'editor']}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </HashRouter>
  )
}
