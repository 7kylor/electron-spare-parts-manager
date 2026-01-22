import * as React from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

interface ToastProps {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
  onClose: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ id, title, description, variant = 'default', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [id, onClose])
  
  const Icon = {
    default: Info,
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[variant]
  
  return (
    <div
      className={cn(
        'pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all animate-slide-up',
        {
          'border-border bg-background': variant === 'default',
          'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950': variant === 'success',
          'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950': variant === 'error',
          'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950': variant === 'warning',
          'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950': variant === 'info',
        }
      )}
    >
      <Icon className={cn('h-5 w-5', {
        'text-foreground': variant === 'default',
        'text-green-600 dark:text-green-400': variant === 'success',
        'text-red-600 dark:text-red-400': variant === 'error',
        'text-amber-600 dark:text-amber-400': variant === 'warning',
        'text-blue-600 dark:text-blue-400': variant === 'info',
      })} />
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
      <button
        onClick={() => onClose(id)}
        className="absolute right-1 top-1 rounded-md p-1 opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

interface ToastContextValue {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])
  
  const addToast = React.useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...toast, id, onClose: removeToast }])
  }, [])
  
  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])
  
  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
