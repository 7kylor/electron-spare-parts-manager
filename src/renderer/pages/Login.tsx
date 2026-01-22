import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { Package, Eye, EyeOff } from 'lucide-react'

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [serviceNumber, setServiceNumber] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { login, register } = useAuthStore()
  const { addToast } = useToast()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      let result
      if (isRegister) {
        if (!name.trim()) {
          addToast({ title: 'Error', description: 'Please enter your name', variant: 'error' })
          return
        }
        result = await register(serviceNumber, name, password)
      } else {
        result = await login(serviceNumber, password)
      }
      
      if (!result.success) {
        addToast({ 
          title: 'Error', 
          description: result.error || 'Authentication failed', 
          variant: 'error' 
        })
      } else {
        addToast({ 
          title: 'Success', 
          description: isRegister ? 'Account created successfully' : 'Welcome back!', 
          variant: 'success' 
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Package className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Spare Parts Manager</CardTitle>
          <CardDescription>
            {isRegister 
              ? 'Create an account to get started' 
              : 'Sign in with your service number'}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceNumber">Service Number</Label>
              <Input
                id="serviceNumber"
                placeholder="e.g., EMP001"
                value={serviceNumber}
                onChange={(e) => setServiceNumber(e.target.value.toUpperCase())}
                required
                autoFocus
              />
            </div>
            
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  {isRegister ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isRegister ? 'Create Account' : 'Sign In'
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="link" 
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Register"}
            </Button>
          </CardFooter>
        </form>
        
        {/* Demo credentials hint */}
        {!isRegister && (
          <div className="px-6 pb-6">
            <div className="text-xs text-center text-muted-foreground bg-muted p-3 rounded-md">
              <p className="font-medium mb-1">Demo Credentials:</p>
              <p>Admin: ADMIN001 / admin123</p>
              <p>Editor: EMP001 / editor123</p>
              <p>User: EMP002 / user123</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
