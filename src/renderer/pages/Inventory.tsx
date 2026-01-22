import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { usePartsStore } from '@/stores/partsStore'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loading } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { PartFormDialog } from '@/components/parts/PartFormDialog'
import { DeleteConfirmDialog } from '@/components/parts/DeleteConfirmDialog'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Package,
  Columns,
  Check
} from 'lucide-react'
import { cn, highlightText, getStatusColor, getStatusLabel, debounce } from '@/lib/utils'
import type { Part, PartStatus } from '../../../src/shared/types'

export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { visibleColumns, setVisibleColumns } = useUIStore()
  const { 
    parts, 
    categories, 
    totalParts, 
    totalPages, 
    currentPage, 
    isLoading,
    filter,
    fetchParts,
    fetchCategories,
    setFilter,
    deletePart
  } = usePartsStore()
  const { addToast } = useToast()
  
  const [searchInput, setSearchInput] = useState(filter.search || '')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editPart, setEditPart] = useState<Part | null>(null)
  const [deletingPart, setDeletingPart] = useState<Part | null>(null)
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  
  const canEdit = user?.role === 'admin' || user?.role === 'editor'
  const canDelete = user?.role === 'admin'
  
  // Column definitions
  const allColumns = [
    { key: 'name', label: 'Name', required: true },
    { key: 'partNumber', label: 'Part Number', required: false },
    { key: 'boxNumber', label: 'Box Number', required: false },
    { key: 'quantity', label: 'Quantity', required: false },
    { key: 'category', label: 'Category', required: false },
    { key: 'status', label: 'Status', required: false },
  ]
  
  const toggleColumn = (key: string) => {
    const column = allColumns.find(c => c.key === key)
    if (column?.required) return
    
    if (visibleColumns.includes(key)) {
      setVisibleColumns(visibleColumns.filter(c => c !== key))
    } else {
      setVisibleColumns([...visibleColumns, key])
    }
  }
  
  // Initialize from URL params
  useEffect(() => {
    fetchCategories()
    
    const status = searchParams.get('status') as PartStatus | null
    const search = searchParams.get('search')
    const action = searchParams.get('action')
    
    if (status || search) {
      setFilter({ 
        status: status || undefined, 
        search: search || undefined,
        page: 1 
      })
      if (search) setSearchInput(search)
    } else {
      fetchParts()
    }
    
    if (action === 'add' && canEdit) {
      setShowAddDialog(true)
      // Remove action from URL
      searchParams.delete('action')
      setSearchParams(searchParams)
    }
  }, [])
  
  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setFilter({ search: value || undefined, page: 1 })
    }, 300),
    [setFilter]
  )
  
  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    debouncedSearch(value)
  }
  
  const handleStatusFilter = (status: string) => {
    setFilter({ 
      status: status ? (status as PartStatus) : undefined, 
      page: 1 
    })
  }
  
  const handleCategoryFilter = (categoryId: string) => {
    setFilter({ 
      categoryId: categoryId ? parseInt(categoryId) : undefined, 
      page: 1 
    })
  }
  
  const handlePageChange = (page: number) => {
    setFilter({ page })
  }
  
  const handleDelete = async () => {
    if (!deletingPart) return
    
    const result = await deletePart(deletingPart.id)
    if (result.success) {
      addToast({ title: 'Success', description: 'Part deleted successfully', variant: 'success' })
    } else {
      addToast({ title: 'Error', description: result.error || 'Failed to delete part', variant: 'error' })
    }
    setDeletingPart(null)
  }
  
  const handleExport = async () => {
    const result = await window.api.exportExcel()
    if (result.success) {
      addToast({ title: 'Success', description: `Exported to ${result.filePath}`, variant: 'success' })
    } else {
      addToast({ title: 'Error', description: result.error || 'Export failed', variant: 'error' })
    }
  }
  
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' }
  ]
  
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(c => ({ value: c.id.toString(), label: c.name }))
  ]
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            {totalParts} part{totalParts !== 1 ? 's' : ''} in inventory
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Link to="/import">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </Link>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Part
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, part number, or box number..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select
              options={statusOptions}
              value={filter.status || ''}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full sm:w-40"
            />
            
            <Select
              options={categoryOptions}
              value={filter.categoryId?.toString() || ''}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              className="w-full sm:w-48"
            />
            
            {/* Column Visibility Toggle */}
            <div className="relative">
              <Button 
                variant="outline" 
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="w-full sm:w-auto"
              >
                <Columns className="h-4 w-4 mr-2" />
                Columns
              </Button>
              
              {showColumnMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowColumnMenu(false)} 
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-popover border rounded-md shadow-lg z-50 py-1">
                    <div className="px-3 py-2 text-sm font-medium border-b">
                      Toggle Columns
                    </div>
                    {allColumns.map((column) => (
                      <button
                        key={column.key}
                        onClick={() => toggleColumn(column.key)}
                        disabled={column.required}
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted transition-colors",
                          column.required && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <span>{column.label}</span>
                        {visibleColumns.includes(column.key) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <Loading message="Loading parts..." />
          ) : parts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No parts found</h3>
              <p className="text-muted-foreground mb-4">
                {filter.search || filter.status || filter.categoryId
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first part'}
              </p>
              {canEdit && !filter.search && !filter.status && !filter.categoryId && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Part
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.includes('name') && <TableHead>Name</TableHead>}
                  {visibleColumns.includes('partNumber') && <TableHead>Part Number</TableHead>}
                  {visibleColumns.includes('boxNumber') && <TableHead>Box Number</TableHead>}
                  {visibleColumns.includes('quantity') && <TableHead className="text-right">Quantity</TableHead>}
                  {visibleColumns.includes('category') && <TableHead>Category</TableHead>}
                  {visibleColumns.includes('status') && <TableHead>Status</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map((part) => (
                  <TableRow key={part.id}>
                    {visibleColumns.includes('name') && (
                      <TableCell className="font-medium">
                        {highlightText(part.name, searchInput)}
                      </TableCell>
                    )}
                    {visibleColumns.includes('partNumber') && (
                      <TableCell className="font-mono text-sm">
                        {highlightText(part.partNumber, searchInput)}
                      </TableCell>
                    )}
                    {visibleColumns.includes('boxNumber') && (
                      <TableCell>
                        {highlightText(part.boxNumber, searchInput)}
                      </TableCell>
                    )}
                    {visibleColumns.includes('quantity') && (
                      <TableCell className="text-right font-medium">
                        {part.quantity}
                      </TableCell>
                    )}
                    {visibleColumns.includes('category') && (
                      <TableCell className="text-muted-foreground">
                        {part.category?.name || '-'}
                      </TableCell>
                    )}
                    {visibleColumns.includes('status') && (
                      <TableCell>
                        <Badge className={cn(getStatusColor(part.status), 'font-normal')}>
                          {getStatusLabel(part.status)}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/parts/${part.id}`}>
                          <Button variant="ghost" size="icon" title="View details">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {canEdit && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Edit"
                            onClick={() => setEditPart(part)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingPart(part)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      {/* Dialogs */}
      <PartFormDialog
        open={showAddDialog || !!editPart}
        onClose={() => {
          setShowAddDialog(false)
          setEditPart(null)
        }}
        part={editPart}
      />
      
      <DeleteConfirmDialog
        open={!!deletingPart}
        onClose={() => setDeletingPart(null)}
        onConfirm={handleDelete}
        title="Delete Part"
        description={`Are you sure you want to delete "${deletingPart?.name}"? This action cannot be undone.`}
      />
    </div>
  )
}
