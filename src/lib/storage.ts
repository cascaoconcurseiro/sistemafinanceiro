/**
 * Storage Service - Tipos e interfaces para dados
 * Este arquivo fornece apenas tipos, sem lógica de banco de dados
 */

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  status: 'planned' | 'active' | 'completed';
  currency: string;
  participants: string[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SharedDebt {
  id: string;
  creditor: string;
  debtor: string;
  originalAmount: number;
  currentAmount: number;
  description?: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class StorageService {
  // DEPRECATED: Use API routes instead
  // This class is kept for type compatibility only
  
  async getTrips(): Promise<Trip[]> {
    console.warn('storage.getTrips() is deprecated. Use /api/trips instead');
    return [];
  }

  async saveTrip(trip: Trip): Promise<void> {
    console.warn('storage.saveTrip() is deprecated. Use /api/trips instead');
  }

  async updateTrip(id: string, updates: Partial<Trip>): Promise<void> {
    console.warn('storage.updateTrip() is deprecated. Use /api/trips instead');
  }

  async deleteTrip(id: string): Promise<void> {
    console.warn('storage.deleteTrip() is deprecated. Use /api/trips instead');
  }

  // SharedDebt methods - DEPRECATED
  async getSharedDebts(): Promise<SharedDebt[]> {
    console.warn('storage.getSharedDebts() is deprecated. Use API routes instead');
    return [];
  }

  async saveSharedDebt(debt: Omit<SharedDebt, 'id' | 'createdAt' | 'updatedAt'>): Promise<SharedDebt> {
    console.warn('storage.saveSharedDebt() is deprecated. Use API routes instead');
    throw new Error('Not implemented');
  }

  async updateSharedDebt(id: string, updates: Partial<SharedDebt>): Promise<void> {
    console.warn('storage.updateSharedDebt() is deprecated. Use API routes instead');
  }

  async deleteSharedDebt(id: string): Promise<void> {
    console.warn('storage.deleteSharedDebt() is deprecated. Use API routes instead');
  }
  processDebtPayment(
    creditor: string,
    debtor: string,
    amount: number,
    description?: string,
    transactionId?: string
  ): Promise<{
    paidDebts: SharedDebt[];
    remainingAmount: number;
    newDebt?: SharedDebt;
  }> {
    // TODO: Implementar lógica de processamento de pagamento de dívidas
    console.warn('processDebtPayment - Implementação pendente no DatabaseService');
    return Promise.resolve({
      paidDebts: [],
      remainingAmount: amount,
    });
  }

  generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

export const storage = new StorageService();
export type { Trip };
