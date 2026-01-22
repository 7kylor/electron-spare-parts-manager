import { useState, useEffect } from 'react'
import { usePartsStore } from '@/stores/partsStore'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Part, Category } from '../../../../src/shared/types'

interface PartFormDialogProps {
  open: boolean
  onClose: () => void
  part?: Part | null
}

export function PartFormDialog({ open, onClose, part }: PartFormDialogProps) {
  const { categories, fetchCategories, createPart, updatePart } = usePartsStore()
  const { addToast } = useToast()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    partNumber: '',
    boxNumber: '',
    quantity: 0,
    categoryId: '',
    description: '',
    minQuantity: 5
  })
  
  const isEdit = !!part
  
  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories()
    }
  }, [])
  
  useEffect(() => {
    if (part) {
      setFormData({
        name: part.name,
        partNumber: part.partNumber,
        boxNumber: part.boxNumber,
        quantity: part.quantity,
        categoryId: part.categoryId.toString(),
        description: part.description || '',
        minQuantity: part.minQuantity
      })
    } else {
      setFormData({
        name: '',
        partNumber: '',
        boxNumber: '',
        quantity: 0,
        categoryId: categories[0]?.id.toString() || '',
        description: '',
        minQuantity: 5
      })
    }
  }, [part, open, categories])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const data = {
        ...formData,
        categoryId: parseInt(formData.categoryId),
        quantity: parseInt(formData.quantity.toString()),
        minQuantity: parseInt(formData.minQuantity.toString())
      }
      
      let result
      if (isEdit) {
        result = await updatePart({ id: part!.id, ...data })
      } else {
        result = await createPart(data)
      }
      
      if (result.success) {
        addToast({ 
          title: 'Success', 
          description: isEdit ? 'Part updated successfully' : 'Part created successfully',
          variant: 'success'
        })
        onClose()
      } else {
        addToast({ 
          title: 'Error', 
          description: result.error || 'Operation failed',
          variant: 'error'
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const categoryOptions = categories.map(c => ({
    value: c.id.toString(),
    label: `${c.name} (${c.type})`
  }))
  
  // Group categories by type
  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = []
    acc[cat.type].push(cat)
    return acc
  }, {} as Record<string, Category[]>)
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Part' : 'Add New Part'}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update the part details below.' 
              : 'Fill in the details for the new part.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Part Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., M8x30 Hex Bolt"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="partNumber">Part Number *</Label>
              <Input
                id="partNumber"
                value={formData.partNumber}
                onChange={(e) => handleChange('partNumber', e.target.value.toUpperCase())}
                placeholder="e.g., BLT-M8-30"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="boxNumber">Box Number *</Label>
              <Input
                id="boxNumber"
                value={formData.boxNumber}
                onChange={(e) => handleChange('boxNumber', e.target.value.toUpperCase())}
                placeholder="e.g., A1-01"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minQuantity">Min Quantity</Label>
              <Input
                id="minQuantity"
                type="number"
                min="0"
                value={formData.minQuantity}
                onChange={(e) => handleChange('minQuantity', parseInt(e.target.value) || 5)}
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                id="category"
                options={categoryOptions}
                value={formData.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                required
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Optional description or notes..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEdit ? 'Update Part' : 'Add Part'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
