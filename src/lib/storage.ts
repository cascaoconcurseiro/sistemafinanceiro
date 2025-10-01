/**
 * Storage Service - Gerenciamento de dados locais
 * Este arquivo fornece uma interface simples para armazenamento local
 */

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  status: 'planejamento' | 'andamento' | 'concluida';
  expenses: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
  }>;
}

class StorageService {
  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  private getStorageData<T>(key: string): T[] {
    if (!this.isClient()) return [];
    
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return [];
    }
  }

  private saveStorageData<T>(key: string, data: T[]): void {
    if (!this.isClient()) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }

  // Trip methods
  getTrips(): Trip[] {
    return this.getStorageData<Trip>('sua-grana-trips');
  }

  saveTrip(trip: Trip): void {
    const trips = this.getTrips();
    const existingIndex = trips.findIndex(t => t.id === trip.id);
    
    if (existingIndex >= 0) {
      trips[existingIndex] = trip;
    } else {
      trips.push(trip);
    }
    
    this.saveStorageData('sua-grana-trips', trips);
  }

  updateTrip(id: string, updates: Partial<Trip>): void {
    const trips = this.getTrips();
    const index = trips.findIndex(t => t.id === id);
    
    if (index >= 0) {
      trips[index] = { ...trips[index], ...updates };
      this.saveStorageData('sua-grana-trips', trips);
    }
  }

  deleteTrip(id: string): void {
    const trips = this.getTrips().filter(t => t.id !== id);
    this.saveStorageData('sua-grana-trips', trips);
  }

  generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

export const storage = new StorageService();
export type { Trip };
