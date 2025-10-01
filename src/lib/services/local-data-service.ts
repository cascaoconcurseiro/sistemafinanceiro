// ARQUIVO DESATIVADO - USE DatabaseService
// Este arquivo foi desativado como parte da migração para usar apenas o banco de dados.
// Todas as funcionalidades foram migradas para DatabaseService.

export interface BackupData {
  version: string;
  timestamp: string;
  accounts: any[];
  transactions: any[];
  categories: any[];
  budgets: any[];
  goals: any[];
  settings: any;
  metadata: {
    totalAccounts: number;
    totalTransactions: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

export interface ImportResult {
  success: boolean;
  message: string;
  imported: {
    accounts: number;
    transactions: number;
    categories: number;
    budgets: number;
    goals: number;
  };
  errors: string[];
}

export interface DataExport {
  accounts: any[];
  transactions: any[];
  goals: any[];
  trips: any[];
  investments: any[];
  settings: any;
  timestamp: string;
  version: string;
}

class LocalDataService {
  constructor() {
    throw new Error("local-data-service.ts foi desativado. Use DatabaseService ao invés.");
  }

  getAccounts() {
    throw new Error("local-data-service.ts foi desativado. Use DatabaseService.getAccounts() ao invés.");
  }

  getTransactions() {
    throw new Error("local-data-service.ts foi desativado. Use DatabaseService.getTransactions() ao invés.");
  }

  setStorageData() {
    throw new Error("local-data-service.ts foi desativado. Use DatabaseService ao invés.");
  }

  getStorageData() {
    throw new Error("local-data-service.ts foi desativado. Use DatabaseService ao invés.");
  }

  removeStorageData() {
    throw new Error("local-data-service.ts foi desativado. Use DatabaseService ao invés.");
  }

  getDataExport() {
    throw new Error("local-data-service.ts foi desativado. Use DatabaseService ao invés.");
  }

  importData() {
    throw new Error("local-data-service.ts foi desativado. Use DatabaseService ao invés.");
  }

  getStorageInfo() {
    throw new Error("local-data-service.ts foi desativado. Use DatabaseService ao invés.");
  }
}

export const localDataService = new LocalDataService();
