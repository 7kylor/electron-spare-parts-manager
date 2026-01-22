import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Search, 
  FileSpreadsheet, 
  BarChart3, 
  ArrowRight, 
  AlertTriangle,
  PackageX,
  Boxes
} from 'lucide-react'
import type { DashboardStats } from '../../../src/shared/types'

export function HomePage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  
  useEffect(() => {
    window.api.getDashboardStats().then(setStats)
  }, [])
  
  const features = [
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Track spare parts with detailed information including part numbers, quantities, and physical locations.'
    },
    {
      icon: Search,
      title: 'Powerful Search',
      description: 'Find parts instantly by name, part number, box number, or category with highlighted results.'
    },
    {
      icon: FileSpreadsheet,
      title: 'Excel Import/Export',
      description: 'Bulk import parts from Excel files or export your inventory for backup and sharing.'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Monitor stock levels, track usage patterns, and get alerts for low stock items.'
    }
  ]
  
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Manage your spare parts inventory efficiently. Track stock levels, find parts quickly, and never run out of critical components.
        </p>
      </div>
      
      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Parts</p>
                  <p className="text-3xl font-bold">{stats.totalParts}</p>
                </div>
                <Boxes className="h-10 w-10 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Quantity</p>
                  <p className="text-3xl font-bold">{stats.totalQuantity.toLocaleString()}</p>
                </div>
                <Package className="h-10 w-10 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={stats.lowStockCount > 0 ? 'border-amber-200 dark:border-amber-800' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                  <p className="text-3xl font-bold">{stats.lowStockCount}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-amber-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={stats.outOfStockCount > 0 ? 'border-red-200 dark:border-red-800' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                  <p className="text-3xl font-bold">{stats.outOfStockCount}</p>
                </div>
                <PackageX className="h-10 w-10 text-red-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Alerts */}
      {stats && (stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium">Attention Required</p>
                <p className="text-sm text-muted-foreground">
                  {stats.outOfStockCount > 0 && `${stats.outOfStockCount} item(s) out of stock. `}
                  {stats.lowStockCount > 0 && `${stats.lowStockCount} item(s) running low.`}
                </p>
              </div>
              <Link to="/inventory?status=low_stock">
                <Button variant="outline" size="sm">
                  View Items
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Link to="/inventory">
          <Button size="lg" className="gap-2">
            <Package className="h-5 w-5" />
            View Inventory
          </Button>
        </Link>
        {user?.role !== 'user' && (
          <>
            <Link to="/inventory?action=add">
              <Button size="lg" variant="outline" className="gap-2">
                <Package className="h-5 w-5" />
                Add New Part
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="gap-2">
                <BarChart3 className="h-5 w-5" />
                View Dashboard
              </Button>
            </Link>
          </>
        )}
      </div>
      
      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Card key={index} className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Category Summary */}
      {stats && stats.categoryCounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Parts by Category</CardTitle>
            <CardDescription>Distribution of parts across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.categoryCounts.slice(0, 10).map((cat, index) => (
                <Badge key={index} variant="secondary" className="text-sm py-1">
                  {cat.category}: {cat.count}
                </Badge>
              ))}
              {stats.categoryCounts.length > 10 && (
                <Badge variant="outline" className="text-sm py-1">
                  +{stats.categoryCounts.length - 10} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
