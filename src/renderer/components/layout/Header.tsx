import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Package, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Moon, 
  Sun, 
  Monitor,
  User,
  Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const { user, logout } = useAuthStore()
  const { theme, setTheme, toggleSidebar } = useUIStore()
  const location = useLocation()
  
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/inventory', label: 'Inventory', icon: Package },
    ...(user?.role !== 'user' ? [{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    { path: '/settings', label: 'Settings', icon: Settings },
  ]
  
  const cycleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }
  
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Mobile menu button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Package className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline-block">Spare Parts Manager</span>
        </Link>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1 ml-6">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn('gap-2', isActive && 'bg-secondary')}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* User info */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{user.name}</span>
            <span className="text-xs bg-secondary px-2 py-0.5 rounded capitalize">
              {user.role}
            </span>
          </div>
        )}
        
        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={cycleTheme} title={`Theme: ${theme}`}>
          <ThemeIcon className="h-5 w-5" />
        </Button>
        
        {/* Logout */}
        <Button variant="ghost" size="icon" onClick={logout} title="Logout">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
