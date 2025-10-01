/**
 * Adapter para transformar dados entre frontend e API PostgreSQL
 */

interface FrontendTransaction {
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'shared';
  category: string;
  date: string;
  accountId?: string;
  notes?: string;
  tags?: string[];
}

interface PostgresTransaction {
  description: string;
  date: string;
  created_by: string;
  tenant_id: string;
  status?: string;
  tags?: string;
  metadata?: any;
  entries: Array<{
    id?: string;
    account_id: string;
    category_id: string;
    debit: number;
    credit: number;
    description?: string;
  }>;
}

export class TransactionAdapter {
  /**
   * Transforma dados do frontend para formato da API PostgreSQL
   */
  static frontendToPostgres(
    frontendData: FrontendTransaction,
    options: {
      userId: string;
      tenantId: string;
      accountId?: string;
      categoryId?: string;
    }
  ): PostgresTransaction {
    const { userId, tenantId, accountId, categoryId } = options;
    
    // Determinar se é débito ou crédito baseado no tipo
    const isIncome = frontendData.type === 'income';
    const debit = isIncome ? 0 : Math.abs(frontendData.amount);
    const credit = isIncome ? Math.abs(frontendData.amount) : 0;

    return {
      description: frontendData.description,
      date: frontendData.date,
      created_by: userId,
      tenant_id: tenantId,
      status: 'COMPLETED',
      tags: frontendData.tags?.join(',') || null,
      metadata: frontendData.notes ? { notes: frontendData.notes } : null,
      entries: [
        {
          id: crypto.randomUUID(),
          account_id: accountId || frontendData.accountId || '',
          category_id: categoryId || '',
          debit,
          credit,
          description: frontendData.description,
        },
      ],
    };
  }

  /**
   * Transforma dados da API PostgreSQL para formato do frontend
   */
  static postgrestoFrontend(postgresData: any): any {
    // Calcular amount baseado nos entries
    const totalCredit = postgresData.entries?.reduce(
      (sum: number, entry: any) => sum + Number(entry.credit || 0), 0
    ) || 0;
    
    const totalDebit = postgresData.entries?.reduce(
      (sum: number, entry: any) => sum + Number(entry.debit || 0), 0
    ) || 0;

    const amount = totalCredit > 0 ? totalCredit : -totalDebit;
    const type = totalCredit > 0 ? 'income' : 'expense';

    // Pegar primeiro entry para category e account
    const firstEntry = postgresData.entries?.[0];
    const category = firstEntry?.categories?.name || 'Sem categoria';
    const account = firstEntry?.accounts?.name || 'Sem conta';

    return {
      id: postgresData.id,
      description: postgresData.description,
      amount,
      type,
      category,
      account,
      date: postgresData.date,
      notes: postgresData.metadata?.notes || '',
      createdAt: postgresData.created_at || postgresData.createdAt,
      updatedAt: postgresData.updated_at || postgresData.updatedAt,
      // Campos originais para compatibilidade
      entries: postgresData.entries || [],
      users: postgresData.users || null,
    };
  }

  /**
   * Busca IDs de usuário e tenant padrão
   */
  static async getDefaultIds(): Promise<{ userId: string; tenantId: string }> {
    // TODO: Implementar busca real de usuário logado
    // Por enquanto, usar IDs fixos que sabemos que existem
    return {
      userId: 'demo-user-1',
      tenantId: 'demo-tenant-1',
    };
  }

  /**
   * Busca ID da categoria por nome
   */
  static async getCategoryId(categoryName: string): Promise<string> {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      
      if (data.success && data.data) {
        const category = data.data.find(
          (cat: any) => cat.name.toLowerCase() === categoryName.toLowerCase()
        );
        return category?.id || '57a2b4d3-f18a-419d-be84-17ce692c6d4a'; // Fallback para categoria padrão
      }
    } catch (error) {
      console.warn('Erro ao buscar categoria:', error);
    }
    
    // Retornar ID da categoria padrão "Alimentação"
    return '57a2b4d3-f18a-419d-be84-17ce692c6d4a';
  }

  /**
   * Busca ID da conta por nome
   */
  static async getAccountId(accountName: string): Promise<string> {
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      
      if (data.success && data.data) {
        const account = data.data.find(
          (acc: any) => acc.name.toLowerCase() === accountName.toLowerCase()
        );
        return account?.id || '3b830127-7e2e-4102-8f31-e90349276623'; // Fallback para conta padrão
      }
    } catch (error) {
      console.warn('Erro ao buscar conta:', error);
    }
    
    // Retornar ID da conta padrão "Conta Corrente"
    return '3b830127-7e2e-4102-8f31-e90349276623';
  }
}