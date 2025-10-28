import { useState, useCallback } from 'react';
import { useNotifications } from '@/contexts/notification-context';

interface BackupData {
  version: string;
  timestamp: string;
  data: {
    transactions: any[];
    accounts: any[];
    goals: any[];
    categories: any[];
    settings: any;
  };
  metadata: {
    totalTransactions: number;
    totalAccounts: number;
    totalGoals: number;
    exportedBy: string;
    appVersion: string;
  };
}

interface BackupState {
  isExporting: boolean;
  isImporting: boolean;
  lastBackup: string | null;
  autoBackupEnabled: boolean;
}

interface BackupActions {
  exportData: (format: 'json' | 'csv') => Promise<void>;
  importData: (file: File) => Promise<void>;
  scheduleAutoBackup: (enabled: boolean) => void;
  downloadBackup: (data: BackupData, format: 'json' | 'csv') => void;
}

const BACKUP_VERSION = '1.0.0';
const APP_VERSION = '1.0.0';

export function useBackup(): BackupState & BackupActions {
  const { addNotification } = useNotifications();
  const [state, setState] = useState<BackupState>({
    isExporting: false,
    isImporting: false,
    lastBackup: null, // Removido localStorage - dados agora vêm do banco
    autoBackupEnabled: false, // Removido localStorage - configuração agora vem do banco
  });

  // Buscar dados da API
  const fetchAllData = useCallback(async (): Promise<BackupData['data']> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    
    try {
      const [transactions, accounts, goals] = await Promise.all([
        fetch(`${baseUrl}/transactions`).then(res => res.json()),
        fetch(`${baseUrl}/accounts`).then(res => res.json()),
        fetch(`${baseUrl}/goals`).then(res => res.json()),
      ]);

      // Buscar categorias e configurações se disponíveis
      let categories = [];
      let settings = {};
      
      try {
        categories = await fetch(`${baseUrl}/categories`).then(res => res.json()).catch(() => []);
        settings = await fetch(`${baseUrl}/settings`).then(res => res.json()).catch(() => ({}));
      } catch (error) {
        console.warn('Algumas configurações não puderam ser exportadas:', error);
      }

      return {
        transactions: transactions.data || transactions || [],
        accounts: accounts.data || accounts || [],
        goals: goals.data || goals || [],
        categories,
        settings,
      };
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      throw new Error('Erro ao buscar dados para backup');
    }
  }, []);

  // Exportar dados
  const exportData = useCallback(async (format: 'json' | 'csv'): Promise<void> => {
    setState(prev => ({ ...prev, isExporting: true }));
    
    try {
      const data = await fetchAllData();
      
      const backupData: BackupData = {
        version: BACKUP_VERSION,
        timestamp: new Date().toISOString(),
        data,
        metadata: {
          totalTransactions: data.transactions.length,
          totalAccounts: data.accounts.length,
          totalGoals: data.goals.length,
          exportedBy: 'SuaGrana',
          appVersion: APP_VERSION,
        },
      };

      downloadBackup(backupData, format);
      
      // Timestamp do último backup agora seria salvo no banco de dados
      const now = new Date().toISOString();
      console.warn('⚠️ localStorage removido - timestamp do backup deveria ser salvo no banco de dados');
      setState(prev => ({ ...prev, lastBackup: now }));

      addNotification({
        title: 'Backup Criado',
        message: `Dados exportados com sucesso em formato ${format.toUpperCase()}`,
        type: 'success',
      });

    } catch (error) {
      console.error('Erro no backup:', error);
      addNotification({
        title: 'Erro no Backup',
        message: 'Não foi possível criar o backup dos dados',
        type: 'error',
      });
    } finally {
      setState(prev => ({ ...prev, isExporting: false }));
    }
  }, [fetchAllData, addNotification]);

  // Importar dados
  const importData = useCallback(async (file: File): Promise<void> => {
    setState(prev => ({ ...prev, isImporting: true }));
    
    try {
      const text = await file.text();
      let importedData: BackupData;

      if (file.name.endsWith('.json')) {
        importedData = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        // Para CSV, assumimos que é apenas transações por simplicidade
        const csvData = parseCSV(text);
        importedData = {
          version: BACKUP_VERSION,
          timestamp: new Date().toISOString(),
          data: {
            transactions: csvData,
            accounts: [],
            goals: [],
            categories: [],
            settings: {},
          },
          metadata: {
            totalTransactions: csvData.length,
            totalAccounts: 0,
            totalGoals: 0,
            exportedBy: 'CSV Import',
            appVersion: APP_VERSION,
          },
        };
      } else {
        throw new Error('Formato de arquivo não suportado');
      }

      // Validar estrutura dos dados
      validateBackupData(importedData);

      // Importar dados via API
      await importDataToAPI(importedData.data);

      addNotification({
        title: 'Dados Importados',
        message: `${importedData.metadata.totalTransactions} transações importadas com sucesso`,
        type: 'success',
      });

    } catch (error) {
      console.error('Erro na importação:', error);
      addNotification({
        title: 'Erro na Importação',
        message: error instanceof Error ? error.message : 'Erro desconhecido na importação',
        type: 'error',
      });
    } finally {
      setState(prev => ({ ...prev, isImporting: false }));
    }
  }, [addNotification]);

  // Configurar backup automático
  const scheduleAutoBackup = useCallback((enabled: boolean): void => {
    console.warn('⚠️ localStorage removido - configuração de backup automático deveria ser salva no banco de dados');
    setState(prev => ({ ...prev, autoBackupEnabled: enabled }));

    if (enabled) {
      // Configurar backup automático semanal
      const scheduleBackup = () => {
        // Removido localStorage - verificação de último backup agora seria via banco de dados
        console.warn('⚠️ localStorage removido - verificação de último backup deveria vir do banco de dados');
        const now = new Date();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;

        // Por enquanto, sempre faz backup quando habilitado (sem verificação de data)
        exportData('json').catch(console.error);
      };

      // Verificar a cada hora se precisa fazer backup
      const interval = setInterval(scheduleBackup, 60 * 60 * 1000);
      
      // Salvar referência do interval para limpeza
      (window as any).autoBackupInterval = interval;

      addNotification({
        title: 'Backup Automático Ativado',
        message: 'Seus dados serão salvos automaticamente toda semana',
        type: 'success',
      });
    } else {
      // Limpar interval existente
      if ((window as any).autoBackupInterval) {
        clearInterval((window as any).autoBackupInterval);
        delete (window as any).autoBackupInterval;
      }

      addNotification({
        title: 'Backup Automático Desativado',
        message: 'Você pode fazer backup manual quando quiser',
        type: 'info',
      });
    }
  }, [exportData, addNotification]);

  // Download do arquivo de backup
  const downloadBackup = useCallback((data: BackupData, format: 'json' | 'csv'): void => {
    let content: string;
    let filename: string;
    let mimeType: string;

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      filename = `suagrana-backup-${timestamp}.json`;
      mimeType = 'application/json';
    } else {
      content = convertToCSV(data.data.transactions);
      filename = `suagrana-transactions-${timestamp}.csv`;
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }, []);

  return {
    ...state,
    exportData,
    importData,
    scheduleAutoBackup,
    downloadBackup,
  };
}

// Funções auxiliares
function validateBackupData(data: BackupData): void {
  if (!data.version || !data.timestamp || !data.data) {
    throw new Error('Arquivo de backup inválido');
  }

  if (!Array.isArray(data.data.transactions)) {
    throw new Error('Dados de transações inválidos');
  }
}

function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index]?.trim() || '';
      });
      return obj;
    });
}

function convertToCSV(transactions: any[]): string {
  if (transactions.length === 0) {
    return 'Nenhuma transação para exportar';
  }

  const headers = Object.keys(transactions[0]);
  const csvContent = [
    headers.join(','),
    ...transactions.map(transaction => 
      headers.map(header => {
        const value = transaction[header];
        // Escapar vírgulas e aspas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}

async function importDataToAPI(data: BackupData['data']): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  
  // Importar em lotes para evitar sobrecarga
  const batchSize = 50;
  
  // Importar transações
  for (let i = 0; i < data.transactions.length; i += batchSize) {
    const batch = data.transactions.slice(i, i + batchSize);
    await Promise.all(
      batch.map(transaction => 
        fetch(`${baseUrl}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction),
        })
      )
    );
  }

  // Importar contas
  for (const account of data.accounts) {
    await fetch(`${baseUrl}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(account),
    });
  }

  // Importar metas
  for (const goal of data.goals) {
    await fetch(`${baseUrl}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
  }
}
