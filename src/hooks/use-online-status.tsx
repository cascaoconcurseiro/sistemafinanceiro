'use client'

import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Verificar status inicial
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Hook para sincronizar quando voltar online
export function useSyncOnReconnect(syncFn: () => void | Promise<void>) {
  const isOnline = useOnlineStatus()

  useEffect(() => {
    if (isOnline) {
      syncFn()
    }
  }, [isOnline, syncFn])

  return isOnline
}
