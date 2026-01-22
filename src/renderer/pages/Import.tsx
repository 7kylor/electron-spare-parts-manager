import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePartsStore } from '@/stores/partsStore'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { 
  Upload, 
  FileSpreadsheet, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react'
import { Link } from 'react-router-dom'

type ImportStep = 'upload' | 'mapping' | 'preview' | 'result'

export function ImportPage() {
  const navigate = useNavigate()
  const { categories, fetchCategories } = usePartsStore()
  const { addToast } = useToast()
  
  const [step, setStep] = useState<ImportStep>('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({
    name: '',
    partNumber: '',
    boxNumber: '',
    quantity: '',
    category: '',
    description: '',
    minQuantity: ''
  })
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('')
  const [importResult, setImportResult] = useState<{
    imported: number
    errors: string[]
    warnings: string[]
  } | null>(null)
  
  useEffect(() => {
    fetchCategories()
  }, [])
  
  const handleFileSelect = async () => {
    setIsLoading(true)
    try {
      const result = await window.api.importPreview()
      if (result.success && result.data && result.columns) {
        setData(result.data)
        setColumns(result.columns)
        
        // Auto-map common column names
        const newMapping = { ...mapping }
        const columnLower = result.columns.map((c: string) => c.toLowerCase())
        
        if (columnLower.includes('name')) newMapping.name = result.columns[columnLower.indexOf('name')]
        if (columnLower.includes('part name')) newMapping.name = result.columns[columnLower.indexOf('part name')]
        if (columnLower.includes('part number')) newMapping.partNumber = result.columns[columnLower.indexOf('part number')]
        if (columnLower.includes('partnumber')) newMapping.partNumber = result.columns[columnLower.indexOf('partnumber')]
        if (columnLower.includes('box number')) newMapping.boxNumber = result.columns[columnLower.indexOf('box number')]
        if (columnLower.includes('boxnumber')) newMapping.boxNumber = result.columns[columnLower.indexOf('boxnumber')]
        if (columnLower.includes('box')) newMapping.boxNumber = result.columns[columnLower.indexOf('box')]
        if (columnLower.includes('quantity')) newMapping.quantity = result.columns[columnLower.indexOf('quantity')]
        if (columnLower.includes('qty')) newMapping.quantity = result.columns[columnLower.indexOf('qty')]
        if (columnLower.includes('category')) newMapping.category = result.columns[columnLower.indexOf('category')]
        if (columnLower.includes('description')) newMapping.description = result.columns[columnLower.indexOf('description')]
        if (columnLower.includes('min quantity')) newMapping.minQuantity = result.columns[columnLower.indexOf('min quantity')]
        
        setMapping(newMapping)
        setStep('mapping')
      } else {
        addToast({ title: 'Error', description: result.error || 'Failed to read file', variant: 'error' })
      }
    } catch (error: any) {
      console.error('Import preview error:', error)
      addToast({ title: 'Error', description: error?.message || 'Failed to read file', variant: 'error' })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleImport = async () => {
    setIsLoading(true)
    try {
      const result = await window.api.importExcel({
        data,
        columnMapping: mapping,
        defaultCategoryId: defaultCategoryId ? parseInt(defaultCategoryId) : undefined,
        defaultMinQuantity: 5
      })
      
      setImportResult({
        imported: result.imported,
        errors: result.errors,
        warnings: result.warnings
      })
      setStep('result')
      
      if (result.imported > 0) {
        addToast({ 
          title: 'Import Complete', 
          description: `Successfully imported ${result.imported} part(s)`, 
          variant: 'success' 
        })
      }
    } catch (error) {
      addToast({ title: 'Error', description: 'Import failed', variant: 'error' })
    } finally {
      setIsLoading(false)
    }
  }
  
  const columnOptions = [
    { value: '', label: 'Not mapped' },
    ...columns.map(c => ({ value: c, label: c }))
  ]
  
  const categoryOptions = [
    { value: '', label: 'Select default...' },
    ...categories.map(c => ({ value: c.id.toString(), label: c.name }))
  ]
  
  const requiredFields = ['name', 'partNumber', 'boxNumber', 'quantity']
  const isMappingValid = requiredFields.every(field => mapping[field as keyof typeof mapping])
  
  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/inventory">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Parts</h1>
          <p className="text-muted-foreground">Import parts from an Excel file</p>
        </div>
      </div>
      
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {(['upload', 'mapping', 'preview', 'result'] as const).map((s, index) => (
          <div key={s} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${step === s ? 'bg-primary text-primary-foreground' : 
                index < ['upload', 'mapping', 'preview', 'result'].indexOf(step) 
                  ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}
            `}>
              {index < ['upload', 'mapping', 'preview', 'result'].indexOf(step) 
                ? <CheckCircle className="h-4 w-4" /> 
                : index + 1}
            </div>
            {index < 3 && <div className="w-12 h-0.5 bg-muted mx-1" />}
          </div>
        ))}
      </div>
      
      {/* Step Content */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Excel File</CardTitle>
            <CardDescription>
              Choose an Excel file (.xlsx or .xls) containing your parts data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Click below to select your Excel file
              </p>
              <Button onClick={handleFileSelect} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Reading file...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Select File
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {step === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
            <CardDescription>
              Map your Excel columns to the corresponding fields. Required fields are marked with *.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Part Name *</Label>
                <Select
                  options={columnOptions}
                  value={mapping.name}
                  onChange={(e) => setMapping(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Part Number *</Label>
                <Select
                  options={columnOptions}
                  value={mapping.partNumber}
                  onChange={(e) => setMapping(prev => ({ ...prev, partNumber: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Box Number *</Label>
                <Select
                  options={columnOptions}
                  value={mapping.boxNumber}
                  onChange={(e) => setMapping(prev => ({ ...prev, boxNumber: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Select
                  options={columnOptions}
                  value={mapping.quantity}
                  onChange={(e) => setMapping(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  options={columnOptions}
                  value={mapping.category}
                  onChange={(e) => setMapping(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Select
                  options={columnOptions}
                  value={mapping.description}
                  onChange={(e) => setMapping(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Label>Default Category (for rows without category)</Label>
              <Select
                options={categoryOptions}
                value={defaultCategoryId}
                onChange={(e) => setDefaultCategoryId(e.target.value)}
                className="mt-2"
              />
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('upload')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={() => setStep('preview')} 
                disabled={!isMappingValid}
              >
                Preview
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Import</CardTitle>
            <CardDescription>
              Review the first 10 rows before importing. Total: {data.length} row(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Box</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row[mapping.name] || '-'}</TableCell>
                      <TableCell className="font-mono">{row[mapping.partNumber] || '-'}</TableCell>
                      <TableCell>{row[mapping.boxNumber] || '-'}</TableCell>
                      <TableCell>{row[mapping.quantity] || '0'}</TableCell>
                      <TableCell>{row[mapping.category] || 'Default'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {data.length > 10 && (
              <p className="text-sm text-muted-foreground text-center">
                ... and {data.length - 10} more row(s)
              </p>
            )}
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleImport} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import {data.length} Parts
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {step === 'result' && importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Import Complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{importResult.imported} parts imported</p>
                <p className="text-muted-foreground">
                  {importResult.errors.length > 0 && `${importResult.errors.length} error(s). `}
                  {importResult.warnings.length > 0 && `${importResult.warnings.length} warning(s).`}
                </p>
              </div>
            </div>
            
            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-red-600 dark:text-red-400">Errors:</p>
                <div className="max-h-40 overflow-auto bg-red-50 dark:bg-red-950/30 rounded p-3">
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-sm text-red-700 dark:text-red-400">{err}</p>
                  ))}
                </div>
              </div>
            )}
            
            {importResult.warnings.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-amber-600 dark:text-amber-400">Warnings:</p>
                <div className="max-h-40 overflow-auto bg-amber-50 dark:bg-amber-950/30 rounded p-3">
                  {importResult.warnings.map((warn, i) => (
                    <p key={i} className="text-sm text-amber-700 dark:text-amber-400">{warn}</p>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => {
                setStep('upload')
                setData([])
                setColumns([])
                setImportResult(null)
              }}>
                Import More
              </Button>
              <Button onClick={() => navigate('/inventory')}>
                Go to Inventory
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
