'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from 'cmdk'
import { 
  Home, 
  CreditCard, 
  TrendingUp, 
  Settings, 
  Users, 
  PlusCircle,
  Search,
  FileText,
} from 'lucide-react'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const runCommand = (command: () => void) => {
    onOpenChange(false)
    command()
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Digite um comando ou busque..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        
        <CommandGroup heading="Ações Rápidas">
          <CommandItem onSelect={() => runCommand(() => router.push('/transactions/new'))}>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Nova Transação</span>
            <kbd className="ml-auto text-xs">Ctrl+N</kbd>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/accounts/new'))}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Nova Conta</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/trips/new'))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Nova Viagem</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navegação">
          <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/transactions'))}>
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>Transações</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/accounts'))}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Contas</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/reports'))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Relatórios</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/trips'))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Viagens</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Configurações">
          <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/audit'))}>
            <Search className="mr-2 h-4 w-4" />
            <span>Auditoria de Dados</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
