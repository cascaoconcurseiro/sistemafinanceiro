'use client';

import { useState, useEffect } from 'react';
import { LoggerDebugPanel } from './logger-debug-panel';

export function LoggerDebugTrigger() {
  const [showPanel, setShowPanel] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [isLoggerReady, setIsLoggerReady] = useState(false);

  useEffect(() => {
    // Logger temporariamente desabilitado para corrigir problemas de webpack
    setIsLoggerReady(false);
    setErrorCount(0);
    
    // Em desenvolvimento, sempre mostrar o painel para debug
    if (process.env.NODE_ENV === 'development') {
      setIsLoggerReady(true);
    }
  }, []);

  const updateErrorCount = async () => {
    // Logger temporariamente desabilitado
    setErrorCount(0);
  };

  // Só mostrar o botão se o logger estiver pronto ou se houver erros
  const shouldShow = isLoggerReady || errorCount > 0 || process.env.NODE_ENV === 'development';

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
        title={`Sistema de Logs ${errorCount > 0 ? `(${errorCount} erros)` : ''}`}
        aria-label="Abrir painel de debug de logs"
      >
        <div className="relative">
          {errorCount > 0 ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          )}
          
          {errorCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {errorCount > 99 ? '99+' : errorCount}
            </span>
          )}
        </div>
      </button>

      {showPanel && (
        <LoggerDebugPanel onClose={() => setShowPanel(false)} />
      )}
    </>
  );
}
