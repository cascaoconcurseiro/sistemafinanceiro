'use client';

import { useUnified } from '@/contexts/unified-context-simple';
import { useEffect, useState } from 'react';

export function DebugAccounts() {
  const { accounts, transactions, loading } = useUnified();
  const [localStorageData, setLocalStorageData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    console.log('🔍 DebugAccounts montado');
    console.log('🔍 Contas:', accounts);
    console.log('🔍 Transações:', transactions);
    
    // Dados agora vêm do banco de dados, não do localStorage
    console.warn('debug-accounts - localStorage removido, use banco de dados');
    
    try {
      // Simulação de dados sem localStorage
      const data = {
        accounts: [],
        transactions: [],
        initialized: 'Dados agora vêm do banco de dados'
      };
      
      console.log('🔍 Dados simulados (localStorage removido):', data);
      
      // Forçar inicialização se necessário
      console.log('🚀 Sistema inicializado via banco de dados');
      import('@/lib/data-initialization').then(({ dataInitializer }) => {
        dataInitializer.initializeDefaultData().then(() => {
          console.log('✅ Inicialização via banco de dados concluída');
        });
      });
    } catch (error) {
      console.error('❌ Erro ao simular dados:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }, [accounts, transactions]);

  if (!mounted) {
    return null;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '2px solid red', 
      padding: '15px',
      zIndex: 9999,
      fontSize: '12px',
      maxWidth: '400px',
      color: 'black',
      maxHeight: '80vh',
      overflow: 'auto'
    }}>
      <h3 style={{ color: 'red', margin: '0 0 10px 0' }}>🔍 DEBUG - Estado das Contas</h3>
      
      {error && (
        <div style={{ marginBottom: '10px', color: 'red' }}>
          <strong>Erro:</strong> {error}
        </div>
      )}
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Estado do Unified Context:</strong><br/>
        Loading: {loading ? 'Sim' : 'Não'}<br/>
        Contas no estado: {accounts?.length || 0}<br/>
        Transações no estado: {transactions?.length || 0}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Banco de Dados:</strong><br/>
        Inicializado: Dados agora vêm do banco de dados<br/>
        Contas no banco: {accounts?.length || 0}<br/>
        Transações no banco: {transactions?.length || 0}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Primeira conta:</strong><br/>
        {accounts?.length > 0 ? accounts[0].name : 'Nenhuma'}
      </div>
      
      {accounts?.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Contas no banco de dados:</strong><br/>
          {accounts.map((acc: any, i: number) => (
            <div key={i}>{acc.name} ({acc.type})</div>
          ))}
        </div>
      )}
    </div>
  );
}
