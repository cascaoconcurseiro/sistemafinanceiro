'use client'

import { useEffect, useCallback } from 'react'

interface ShortcutConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  callback: () => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
        const altMatch = shortcut.alt ? event.altKey : !event.altKey
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault()
          shortcut.callback()
          break
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])
}

// Hook específico para atalhos comuns do app
export function useAppShortcuts({
  onNewTransaction,
  onSearch,
  onCommandPalette,
}: {
  onNewTransaction?: () => void
  onSearch?: () => void
  onCommandPalette?: () => void
}) {
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrl: true,
      callback: () => onNewTransaction?.(),
      description: 'Nova transação',
    },
    {
      key: 'f',
      ctrl: true,
      callback: () => onSearch?.(),
      description: 'Buscar',
    },
    {
      key: 'k',
      ctrl: true,
      callback: () => onCommandPalette?.(),
      description: 'Command Palette',
    },
  ])
}
