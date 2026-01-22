import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { usePartsStore } from '@/stores/partsStore'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loading } from '@/components/ui/spinner'
import { PartFormDialog } from '@/components/parts/PartFormDialog'
import { DeleteConfirmDialog } from '@/components/parts/DeleteConfirmDialog'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Package, 
  MapPin, 
  Hash, 
  Layers,
  Calendar,
  User
} from 'lucide-react'
import { cn, formatDate, getStatusColor, getStatusLabel, getCategoryTypeColor } from '@/lib/utils'
import type { Part } from '../../../src/shared/types'

export function PartDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedPart, getPartById, deletePart } = usePartsStore()
  const { user } = useAuthStore()
  const { addToast } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const canEdit = user?.role === 'admin' || user?.role === 'editor'
  const canDelete = user?.role === 'admin'
  
  useEffect(() => {
    if (id) {
      setIsLoading(true)
      getPartById(parseInt(id)).finally(() => setIsLoading(false))
    }
  }, [id])
  
  const handleDelete = async () => {
    if (!selectedPart) return
    
    const result = await deletePart(selectedPart.id)
    if (result.success) {
      addToast({ title: 'Success', description: 'Part deleted successfully', variant: 'success' })
      navigate('/inventory')
    } else {
      addToast({ title: 'Error', description: result.error || 'Failed to delete part', variant: 'error' })
    }
    setShowDeleteDialog(false)
  }
  
  if (isLoading) {
    return <Loading message="Loading part details..." />
  }
  
  if (!selectedPart) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Part not found</h2>
        <p className="text-muted-foreground mb-4">The requested part could not be found.</p>
        <Link to="/inventory">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
        </Link>
      </div>
    )
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to="/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{selectedPart.name}</h1>
            <p className="text-muted-foreground font-mono">{selectedPart.partNumber}</p>
          </div>
        </div>
        
        {(canEdit || canDelete) && (
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Part Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Part Number
                  </p>
                  <p className="font-mono font-medium">{selectedPart.partNumber}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Box / Location
                  </p>
                  <p className="font-medium">{selectedPart.boxNumber}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Category
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{selectedPart.category?.name || '-'}</p>
                    {selectedPart.category && (
                      <Badge className={getCategoryTypeColor(selectedPart.category.type)}>
                        {selectedPart.category.type}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedPart.description && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p>{selectedPart.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Created By
                  </p>
                  <p>{selectedPart.createdByUser?.name || 'Unknown'}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Created At
                  </p>
                  <p>{formatDate(selectedPart.createdAt)}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-muted-foreground">Minimum Quantity</p>
                  <p>{selectedPart.minQuantity}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Last Updated
                  </p>
                  <p>{formatDate(selectedPart.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Stock Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-5xl font-bold">{selectedPart.quantity}</p>
                <p className="text-muted-foreground">units in stock</p>
              </div>
              
              <div className="flex justify-center">
                <Badge className={cn(getStatusColor(selectedPart.status), 'text-base px-4 py-1')}>
                  {getStatusLabel(selectedPart.status)}
                </Badge>
              </div>
              
              {selectedPart.status !== 'in_stock' && (
                <div className={cn(
                  'p-3 rounded-lg text-sm',
                  selectedPart.status === 'out_of_stock' 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                )}>
                  {selectedPart.status === 'out_of_stock' 
                    ? 'This part is out of stock. Consider reordering.'
                    : `Running low. Minimum quantity is ${selectedPart.minQuantity}.`}
                </div>
              )}
              
              {canEdit && (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setShowEditDialog(true)}
                >
                  Update Quantity
                </Button>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={`/inventory?search=${selectedPart.boxNumber}`}>
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="h-4 w-4 mr-2" />
                  View all in {selectedPart.boxNumber}
                </Button>
              </Link>
              {selectedPart.category && (
                <Link to={`/inventory?categoryId=${selectedPart.categoryId}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Layers className="h-4 w-4 mr-2" />
                    View all {selectedPart.category.name}
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Dialogs */}
      <PartFormDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        part={selectedPart}
      />
      
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Part"
        description={`Are you sure you want to delete "${selectedPart.name}"? This action cannot be undone.`}
      />
    </div>
  )
}
