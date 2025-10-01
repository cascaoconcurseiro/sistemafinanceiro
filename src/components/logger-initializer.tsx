'use client';

import { useEffect } from 'react';

export function LoggerInitializer() {
  useEffect(() => {
    // Inicializar o logger de forma mais robusta
    if (typeof window !== 'undefined') {
      try {
        // Importar dinamicamente para evitar problemas de SSR
        import('@/lib/logger').then(({ logger, loggerUtils }) => {
          // Verificar se o logger foi importado corretamente
          if (!logger || typeof logger.info !== 'function') {
            console.error('❌ Logger não foi importado corretamente:', { logger, loggerUtils });
            return;
          }

          // Disponibilizar o logger globalmente para debug
          (window as any).logger = logger;
          (window as any).loggerUtils = loggerUtils;
          
          // Log de inicialização
          logger.info('Sistema de logging inicializado', 'LoggerInitializer', {
            sessionId: loggerUtils.getSessionId(),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
          });

          // Adicionar comando de debug no console
          console.log('🔍 Sistema de Logging SuaGrana inicializado!');
          console.log('📊 Para ver logs: loggerUtils.getRecentErrors()');
          console.log('📋 Para exportar logs: loggerUtils.exportLogs()');
          console.log('🧹 Para limpar logs: loggerUtils.clearLogs()');
          console.log('🆔 Session ID:', loggerUtils.getSessionId());
          
          // Disparar evento customizado para indicar que o logger está pronto
          window.dispatchEvent(new CustomEvent('logger-ready'));
        }).catch((error) => {
          console.error('❌ Erro ao inicializar sistema de logging:', error);
        });
      } catch (error) {
        console.error('❌ Erro crítico na inicialização do logger:', error);
      }
    }
  }, []);

  return null; // Este componente não renderiza nada
}
