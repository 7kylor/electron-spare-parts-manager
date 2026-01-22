import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Loading } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import {
  Package,
  AlertTriangle,
  PackageX,
  Boxes,
  Users,
  Activity,
  Trash2
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import type { DashboardStats, User, ActivityLog } from '../../../src/shared/types'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export function DashboardPage() {
  const { user } = useAuthStore()
  const { addToast } = useToast()
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const isAdmin = user?.role === 'admin'
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    setIsLoading(true)
    try {
      const [statsData, usersData] = await Promise.all([
        window.api.getDashboardStats(),
        isAdmin ? window.api.getUsers() : Promise.resolve([])
      ])
      setStats(statsData)
      setUsers(usersData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleUpdateRole = async (userId: number, role: string) => {
    const result = await window.api.updateUserRole({ userId, role: role as any })
    if (result.success) {
      addToast({ title: 'Success', description: 'User role updated', variant: 'success' })
      loadData()
    } else {
      addToast({ title: 'Error', description: result.error || 'Failed to update role', variant: 'error' })
    }
  }
  
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    const result = await window.api.deleteUser(userId)
    if (result.success) {
      addToast({ title: 'Success', description: 'User deleted', variant: 'success' })
      loadData()
    } else {
      addToast({ title: 'Error', description: result.error || 'Failed to delete user', variant: 'error' })
    }
  }
  
  if (isLoading) {
    return <Loading message="Loading dashboard..." />
  }
  
  if (!stats) {
    return <div>Failed to load dashboard data</div>
  }
  
  // Prepare chart data
  const categoryChartData = stats.categoryCounts.slice(0, 8).map(c => ({
    name: c.category.length > 15 ? c.category.substring(0, 15) + '...' : c.category,
    count: c.count
  }))
  
  const statusChartData = [
    { name: 'In Stock', value: stats.totalParts - stats.lowStockCount - stats.outOfStockCount },
    { name: 'Low Stock', value: stats.lowStockCount },
    { name: 'Out of Stock', value: stats.outOfStockCount }
  ].filter(d => d.value > 0)
  
  const statusColors = ['#10b981', '#f59e0b', '#ef4444']
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your inventory and activity</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Parts by Category</CardTitle>
            <CardDescription>Top 8 categories by number of parts</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Stock Status Distribution</CardTitle>
            <CardDescription>Overview of inventory health</CardDescription>
          </CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No status data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* User Management & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management (Admin only) */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>User Management</CardTitle>
              </div>
              <CardDescription>{users.length} registered user(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-sm text-muted-foreground">{u.serviceNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        options={[
                          { value: 'user', label: 'User' },
                          { value: 'editor', label: 'Editor' },
                          { value: 'admin', label: 'Admin' }
                        ]}
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        disabled={u.id === user?.id}
                        className="w-28"
                      />
                      {u.id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Recent Activity */}
        <Card className={isAdmin ? '' : 'lg:col-span-2'}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
            <CardDescription>Latest actions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent activity</p>
              ) : (
                stats.recentActivity.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 text-sm">
                    <div className={cn(
                      'w-2 h-2 rounded-full mt-2',
                      activity.action === 'created' && 'bg-green-500',
                      activity.action === 'updated' && 'bg-blue-500',
                      activity.action === 'deleted' && 'bg-red-500',
                      activity.action === 'imported' && 'bg-purple-500',
                      activity.action === 'exported' && 'bg-amber-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p>
                        <span className="font-medium">{activity.user?.name || 'Unknown'}</span>
                        {' '}
                        <span className="text-muted-foreground">{activity.action}</span>
                        {activity.details && (
                          <span className="text-muted-foreground"> - {activity.details}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(activity.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
