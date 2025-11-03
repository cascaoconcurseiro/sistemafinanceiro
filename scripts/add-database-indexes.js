const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addDatabaseIndexes() {
  try {
    console.log('🔍 Adicionando índices no banco de dados...\n');

    // SQLite não suporta criação de índices via Prisma diretamente
    // Mas podemos executar SQL raw
    
    const indexes = [
      // Índices para transações (queries mais comuns)
      'CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON transactions(account_id, date DESC)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)',
      
      // Índices para contas
      'CREATE INDEX IF NOT EXISTS idx_accounts_user_active ON accounts(user_id, is_active)',
      'CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type)',
      
      // Índices para cartões de crédito
      'CREATE INDEX IF NOT EXISTS idx_credit_cards_user ON credit_cards(user_id, is_active)',
      
      // Índices para categorias
      'CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id, is_active)',
      
      // Índices para metas
      'CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id, status)',
      
      // Índices para orçamentos
      'CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id, is_active)',
    ];

    for (const indexSql of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexSql);
        const indexName = indexSql.match(/idx_\w+/)?.[0] || 'unknown';
        console.log(`✅ Índice criado: ${indexName}`);
      } catch (error) {
        // Ignorar erro se índice já existe
        if (!error.message.includes('already exists')) {
          console.error(`❌ Erro ao criar índice:`, error.message);
        }
      }
    }

    console.log('\n✅ Índices adicionados com sucesso!');
    console.log('📊 Performance das consultas deve melhorar significativamente.');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDatabaseIndexes();
