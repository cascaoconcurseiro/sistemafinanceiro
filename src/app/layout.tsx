/**
 * LAYOUT PRINCIPAL DA APLICAÇÃO
 * 
 * Layout completo com todos os contextos e componentes
 */

import { Inter } from 'next/font/google';
import './globals.css';
import { ReactQueryProvider } from '@/providers/react-query-provider';
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
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        <LoggerInitializer />
        <ErrorBoundary>
          <ReactQueryProvider>
            <NotificationProvider>
              <UnifiedProvider>
                <PWAManager />
                <GlobalModals />
                {children}
              </UnifiedProvider>
            </NotificationProvider>
          </ReactQueryProvider>
        </ErrorBoundary>
        <LoggerDebugTrigger />
      </body>
    </html>
  );
}
