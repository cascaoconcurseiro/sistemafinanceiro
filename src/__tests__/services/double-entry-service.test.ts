/**
 * TESTES: DoubleEntryService
 * Testa o serviço de partidas dobradas
 */

import { DoubleEntryService } from '@/lib/services/double-entry-service';

describe('DoubleEntryService', () => {
  const mockTx = {
    journalEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  } as any;

  const mockTransaction = {
    id: 'tx-1',
    userId: 'user-1',
    accountId: 'account-1',
    categoryId: 'category-1',
    amount: 100,
    type: 'DESPESA',
    description: 'Teste',
    date: new Date(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createJournalEntries', () => {
    it('deve criar 2 lançamentos para DESPESA', async () => {
      mockTx.account.findFirst.mockResolvedValue({
        id: 'expense-account',
        name: 'Despesa - Teste',
      });

      mockTx.journalEntry.findMany.mockResolvedValue([
        { entryType: 'DEBITO', amount: 100 },
        { entryType: 'CREDITO', amount: 100 },
      ]);

      await DoubleEntryService.createJournalEntries(mockTx, mockTransaction);

      expect(mockTx.journalEntry.create).toHaveBeenCalledTimes(2);
      
      // Verificar DÉBITO (despesa)
      expect(mockTx.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entryType: 'DEBITO',
            amount: 100,
          }),
        })
      );

      // Verificar CRÉDITO (conta)
      expect(mockTx.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entryType: 'CREDITO',
            amount: 100,
          }),
        })
      );
    });

    it('deve criar 2 lançamentos para RECEITA', async () => {
      const receita = { ...mockTransaction, type: 'RECEITA' };

      mockTx.account.findFirst.mockResolvedValue({
        id: 'revenue-account',
        name: 'Receita - Teste',
      });

      mockTx.journalEntry.findMany.mockResolvedValue([
        { entryType: 'DEBITO', amount: 100 },
        { entryType: 'CREDITO', amount: 100 },
      ]);

      await DoubleEntryService.createJournalEntries(mockTx, receita);

      expect(mockTx.journalEntry.create).toHaveBeenCalledTimes(2);
    });

    it('não deve criar lançamentos para cartão de crédito', async () => {
      const cartao = { 
        ...mockTransaction, 
        creditCardId: 'card-1',
        accountId: null,
      };

      await DoubleEntryService.createJournalEntries(mockTx, cartao);

      expect(mockTx.journalEntry.create).not.toHaveBeenCalled();
    });
  });

  describe('validateBalance', () => {
    it('deve validar lançamentos balanceados', async () => {
      mockTx.journalEntry.findMany.mockResolvedValue([
        { entryType: 'DEBITO', amount: 100 },
        { entryType: 'CREDITO', amount: 100 },
      ]);

      await expect(
        DoubleEntryService.validateBalance(mockTx, 'tx-1')
      ).resolves.not.toThrow();
    });

    it('deve lançar erro para lançamentos desbalanceados', async () => {
      mockTx.journalEntry.findMany.mockResolvedValue([
        { entryType: 'DEBITO', amount: 100 },
        { entryType: 'CREDITO', amount: 50 },
      ]);

      await expect(
        DoubleEntryService.validateBalance(mockTx, 'tx-1')
      ).rejects.toThrow('Partidas não balanceadas');
    });
  });
});
