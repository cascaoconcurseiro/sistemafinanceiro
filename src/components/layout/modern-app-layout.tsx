'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ArrowUpDown,
  Wallet,
  CreditCard,
  TrendingUp,
  Target,
  Calculator,
  Plane,
  Users,
  UserCheck,
  DollarSign,
  BarChart3,
  Calendar,
  Brain,
  Settings,
  PiggyBank,
  Menu,
  X,
  Bell,
  Shield,
  Database,
  LineChart,
  Zap,
  FileText,
  BookOpen,
  Briefcase,
  Activity,
  Layers,
  Eye,
  Gauge,
  AlertTriangle,
  Receipt,
  Repeat,
  Building,
  GraduationCap,
  Share2,
  Minimize2,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { EnhancedHeader } from './enhanced-header';
import { GlobalModals } from '../modals/global-modals';
import { cn } from '@/lib/utils';
import { useSafeTheme } from '@/hooks/use-safe-theme';
import { Button } from '@/components/ui/button';

interface ModernAppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

// 🎯 SISTEMA SIMPLIFICADO - Apenas 9 páginas essenciais
// Backup completo disponível em: SuaGranaoficial_BACKUP_COMPLETO_2025-09-09_22-02
const menuItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
    color: 'text-blue-600',
  },

  {
    title: 'Transações',
    url: '/transactions',
    icon: CreditCard,
    color: 'text-green-600',
  },
  {
    title: 'Contas',
    url: '/accounts-manager',
    icon: Wallet,
    color: 'text-purple-600',
  },
  {
    title: 'Cartão de Crédito',
    url: '/credit-card-bills',
    icon: CreditCard,
    color: 'text-amber-600',
  },
  {
    title: 'Metas',
    url: '/goals',
    icon: Target,
    color: 'text-orange-600',
  },
  {
    title: 'Compartilhado',
    url: '/shared',
    icon: Users,
    color: 'text-pink-600',
  },
  {
    title: 'Viagens',
    url: '/travel',
    icon: Users,
    color: 'text-cyan-600',
  },
  {
    title: 'Família',
    url: '/family',
    icon: Users,
    color: 'text-indigo-600',
  },
  {
    title: 'Configurações',
    url: '/settings',
    icon: Settings,
    color: 'text-gray-600',
  },
];

// 📝 PÁGINAS PRESERVADAS (acessíveis via URL direta):
// - Todas as funcionalidades de transação (formulário avançado)
// - Sistema completo de viagens (/travel/*)
// - Despesas compartilhadas completas (/shared)
// - Demais páginas acessíveis via URL mas não no menu

// 🔄 PARA RESTAURAR MENU COMPLETO:
// Restaure de: SuaGranaoficial_BACKUP_COMPLETO_2025-09-09_22-02

export function ModernAppLayout({
  children,
  title,
  subtitle,
}: ModernAppLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings, toggleTheme } = useSafeTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Renderização consistente para evitar erros de hidratação
  const renderSidebarHeader = () => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <PiggyBank className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-semibold text-foreground">SuaGrana</h1>
          <p className="text-xs text-muted-foreground">Controle Financeiro</p>
        </div>
      </div>
    );
  };

  const renderSidebarMenu = () => (
    <ul className="space-y-1">
      {menuItems.map((item) => {
        const isActive = pathname === item.url;
        return (
          <li key={item.url}>
            <Link
              href={item.url}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              {item.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  // Temporarily disabled hydration prevention to fix React loading issue
  // if (!isMounted) {
  //   return (
  //     <div className="flex min-h-screen w-full bg-background">
  //       <div className="flex-1 flex items-center justify-center">
  //         <div className="text-center">
  //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
  //           <p className="text-muted-foreground">Carregando...</p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div
      className="flex min-h-screen w-full bg-background"
      suppressHydrationWarning
    >
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out md:relative md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          {renderSidebarHeader()}
          {/* Close button */}
          <button
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 px-4 py-4 space-y-2">{renderSidebarMenu()}</nav>

        {/* Logout Button */}
        <div className="px-4 py-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', {
                  method: 'POST',
                  credentials: 'include',
                });
                window.location.href = '/login';
              } catch (error) {
                console.error('Erro ao fazer logout:', error);
                window.location.href = '/login';
              }
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Header */}
        <EnhancedHeader
          title={title}
          subtitle={subtitle}
          onOpenSidebar={toggleSidebar}
        />

        {/* Page Content */}
        <main className="flex-1 w-full overflow-auto p-6">{children}</main>
      </div>

      {/* Global Modals */}
      <GlobalModals />
    </div>
  );
}

export default ModernAppLayout;
