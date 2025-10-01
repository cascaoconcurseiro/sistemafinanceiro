/**
 * BACKUP DO LAYOUT ORIGINAL
 */

import { Inter } from 'next/font/google';
import './globals.css';
import { UnifiedProvider } from '@/contexts/unified-context-simple';
import { NotificationProvider } from '@/contexts/notification-context';
import { GlobalModals } from '@/components/global-modals';
import { PWAManager } from '@/components/pwa-manager';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoggerInitializer } from '@/components/logger-initializer';
import { LoggerDebugTrigger } from '@/components/ui/logger-debug-trigger';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SuaGrana - Controle Financeiro Pessoal',
  description: 'Sistema completo de controle financeiro pessoal',
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <LoggerInitializer />
        <ErrorBoundary>
          <NotificationProvider>
            <UnifiedProvider>
              <PWAManager />
              <GlobalModals />
              {children}
            </UnifiedProvider>
          </NotificationProvider>
        </ErrorBoundary>
        <LoggerDebugTrigger />
      </body>
    </html>
  );
}
