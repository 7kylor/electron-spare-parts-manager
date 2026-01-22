import { useEffect, useState } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { 
  Sun, 
  Moon, 
  Monitor, 
  Download, 
  RefreshCw, 
  Database, 
  Info,
  CheckCircle,
  FileText,
  FolderOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function SettingsPage() {
  const { theme, setTheme } = useUIStore()
  const { user } = useAuthStore()
  const { addToast } = useToast()
  
  const [version, setVersion] = useState('')
  const [logPath, setLogPath] = useState('')
  const [updateStatus, setUpdateStatus] = useState<{
    checking: boolean
    available: boolean
    version?: string
    downloading: boolean
    downloaded: boolean
  }>({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false
  })
  
  useEffect(() => {
    window.api.getVersion().then(setVersion)
    window.api.getLogPath().then(setLogPath)
    
    // Listen for update events
    const unsubAvailable = window.api.onUpdateAvailable((info) => {
      setUpdateStatus(prev => ({ ...prev, available: true, version: info.version }))
      addToast({ title: 'Update Available', description: `Version ${info.version} is available`, variant: 'info' })
    })
    
    const unsubDownloaded = window.api.onUpdateDownloaded((info) => {
      setUpdateStatus(prev => ({ ...prev, downloaded: true, downloading: false }))
      addToast({ title: 'Update Ready', description: 'Restart to install the update', variant: 'success' })
    })
    
    return () => {
      unsubAvailable()
      unsubDownloaded()
    }
  }, [])
  
  const checkForUpdates = async () => {
    setUpdateStatus(prev => ({ ...prev, checking: true }))
    try {
      const result = await window.api.checkUpdate()
      if (result.available) {
        setUpdateStatus(prev => ({ ...prev, available: true, version: result.version }))
        addToast({ title: 'Update Available', description: `Version ${result.version} is available`, variant: 'info' })
      } else {
        addToast({ title: 'Up to Date', description: 'You are running the latest version', variant: 'success' })
      }
    } catch (error) {
      addToast({ title: 'Error', description: 'Failed to check for updates', variant: 'error' })
    } finally {
      setUpdateStatus(prev => ({ ...prev, checking: false }))
    }
  }
  
  const downloadUpdate = async () => {
    setUpdateStatus(prev => ({ ...prev, downloading: true }))
    try {
      await window.api.downloadUpdate()
    } catch (error) {
      setUpdateStatus(prev => ({ ...prev, downloading: false }))
      addToast({ title: 'Error', description: 'Failed to download update', variant: 'error' })
    }
  }
  
  const installUpdate = () => {
    window.api.installUpdate()
  }
  
  const openLogsDirectory = async () => {
    try {
      await window.api.openLogsDirectory()
      addToast({ title: 'Logs Folder Opened', description: 'The logs folder has been opened in your file manager', variant: 'success' })
    } catch (error) {
      addToast({ title: 'Error', description: 'Failed to open logs folder', variant: 'error' })
    }
  }
  
  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ] as const
  
  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences</p>
      </div>
      
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the application looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const isActive = theme === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all flex-1',
                    isActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-transparent bg-muted hover:bg-muted/80'
                  )}
                >
                  <Icon className={cn('h-6 w-6', isActive && 'text-primary')} />
                  <span className={cn('text-sm font-medium', isActive && 'text-primary')}>
                    {option.label}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.serviceNumber}</p>
            </div>
            <Badge className="capitalize">{user?.role}</Badge>
          </div>
        </CardContent>
      </Card>
      
      {/* Updates */}
      <Card>
        <CardHeader>
          <CardTitle>Updates</CardTitle>
          <CardDescription>Check for application updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Current Version</p>
                <p className="text-sm text-muted-foreground">v{version}</p>
              </div>
            </div>
          </div>
          
          {updateStatus.available && !updateStatus.downloaded && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-400">
                  Update Available: v{updateStatus.version}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-500">
                  A new version is available for download
                </p>
              </div>
              <Button 
                onClick={downloadUpdate} 
                disabled={updateStatus.downloading}
                size="sm"
              >
                {updateStatus.downloading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </div>
          )}
          
          {updateStatus.downloaded && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    Update Ready to Install
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    Restart the application to install
                  </p>
                </div>
              </div>
              <Button onClick={installUpdate} size="sm">
                Restart & Install
              </Button>
            </div>
          )}
          
          {!updateStatus.available && !updateStatus.downloaded && (
            <Button 
              variant="outline" 
              onClick={checkForUpdates}
              disabled={updateStatus.checking}
            >
              {updateStatus.checking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check for Updates
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
      
      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>Application information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Spare Parts Manager</strong> is an inventory management application 
            designed for tracking spare parts in industrial and maintenance environments.
          </p>
          <p>
            Built by Taher Al Kiyumi
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Database className="h-4 w-4" />
            <span>SQLite Database</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Logs & Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle>Logs & Diagnostics</CardTitle>
          <CardDescription>Access application logs for troubleshooting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Log Files</p>
                <p className="text-sm text-muted-foreground truncate max-w-md" title={logPath}>
                  {logPath || 'Loading...'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openLogsDirectory}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Open Logs Folder
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            If you encounter issues, the log files can be shared with support for debugging purposes.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
