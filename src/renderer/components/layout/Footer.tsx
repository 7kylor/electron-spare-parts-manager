import { useEffect, useState } from 'react'

export function Footer() {
  const [version, setVersion] = useState('')
  
  useEffect(() => {
    window.api.getVersion().then(setVersion)
  }, [])
  
  return (
    <footer className="border-t py-4 px-6 text-center text-sm text-muted-foreground">
      <div className="flex items-center justify-between">
        <p>Spare Parts Manager {version && `v${version}`}</p>
        <p className="hidden sm:block">Built by Taher Al Kiyumi</p>
      </div>
    </footer>
  )
}
