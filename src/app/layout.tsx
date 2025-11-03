/**
 * LAYOUT PRINCIPAL DA APLICAÇÃO
 *
 * Layout completo com todos os contextos e componentes
 */

import { Inter } from 'next/font/google';
import './globals.css';
import { ReactQueryProvider } from '@/components/providers/react-query-provider';
import { UnifiedProvider } from '@/contexts/unified-financial-context';
import { NotificationProvider } from '@/contexts/notification-context';
import { PeriodProvider } from '@/contexts/period-context';
import { GlobalModalProvider } from '@/contexts/ui/global-modal-context';
import { GlobalModals } from '@/components/modals/global-modals';
import { PWAManager } from '@/components/features/pwa/pwa-manager';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ConditionalHeader } from '@/components/layout/conditional-header';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ReminderChecker } from '@/components/features/notifications/reminder-checker';
import { AuthInterceptor } from '@/components/auth-interceptor';

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
        <ErrorBoundary>
          <AuthProvider>
            <ReactQueryProvider>
              <NotificationProvider>
                <UnifiedProvider>
                  <PeriodProvider>
                    <GlobalModalProvider>
                    {/* PWAManager temporariamente desabilitado */}
                    <AuthInterceptor />
                    <ReminderChecker />
                    <GlobalModals />
                    <div className="min-h-screen flex flex-col">
                      {/* ConditionalHeader removido - usando ModernAppLayout nas páginas */}
                      <main className="flex-1">
                        {children}
                      </main>
                    </div>
                  </GlobalModalProvider>
                  </PeriodProvider>
                </UnifiedProvider>
              </NotificationProvider>
            </ReactQueryProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
