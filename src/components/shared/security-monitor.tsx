'use client';

import { useEffect } from 'react';

export function SecurityMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Sistema de segurança - localStorage foi removido do sistema
    console.info('🛡️ Sistema de segurança ativo - localStorage removido, usando apenas banco de dados');

    // Listener para alertas de segurança
    const handleSecurityViolation = (event: CustomEvent) => {
      console.error('🚨 VIOLAÇÃO DE SEGURANÇA:', event.detail);
    };

    const handleSecurityAlert = (event: CustomEvent) => {
      console.warn('🛡️ ALERTA DE SEGURANÇA:', event.detail);
    };

    window.addEventListener('security-violation', handleSecurityViolation as EventListener);
    window.addEventListener('security-alert', handleSecurityAlert as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('security-violation', handleSecurityViolation as EventListener);
      window.removeEventListener('security-alert', handleSecurityAlert as EventListener);
    };
  }, []);

  return null; // Este componente não renderiza nada
}
