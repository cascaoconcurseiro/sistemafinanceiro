const { PrismaClient } = require('@prisma/client');

// Configurar DATABASE_URL manualmente
process.env.DATABASE_URL = 'file:./prisma/dev.db';

const prisma = new PrismaClient();

// 🇧🇷 CATEGORIAS COMPLETAS PARA O BRASIL (45 categorias)
const COMPLETE_CATEGORIES = [
  // ============================================
  // RECEITAS (10 categorias)
  // ============================================
  { name: 'Salário', type: 'RECEITA', icon: '💰', color: '#10b981', description: 'Salário mensal' },
  { name: 'Freelance', type: 'RECEITA', icon: '💼', color: '#3b82f6', description: 'Trabalhos autônomos' },
  { name: 'Investimentos', type: 'RECEITA', icon: '📈', color: '#8b5cf6', description: 'Rendimentos de investimentos' },
  { name: 'Aluguel Recebido', type: 'RECEITA', icon: '🏠', color: '#06b6d4', description: 'Aluguel de imóveis' },
  { name: 'Pensão', type: 'RECEITA', icon: '👨‍👩‍👧', color: '#14b8a6', description: 'Pensão alimentícia' },
  { name: 'Bonificação', type: 'RECEITA', icon: '🎁', color: '#22c55e', description: 'Bônus e gratificações' },
  { name: 'Venda', type: 'RECEITA', icon: '🏷️', color: '#84cc16', description: 'Venda de produtos/serviços' },
  { name: 'Reembolso', type: 'RECEITA', icon: '💵', color: '#10b981', description: 'Reembolsos recebidos' },
  { name: 'Prêmio', type: 'RECEITA', icon: '🏆', color: '#f59e0b', description: 'Prêmios e sorteios' },
  { name: 'Outras Receitas', type: 'RECEITA', icon: '💸', color: '#6366f1', description: 'Outras entradas' },

  // ============================================
  // DESPESAS (35 categorias)
  // ============================================
  
  // Alimentação (4)
  { name: 'Alimentação', type: 'DESPESA', icon: '🍔', color: '#ef4444', description: 'Restaurantes e lanches' },
  { name: 'Supermercado', type: 'DESPESA', icon: '🛒', color: '#dc2626', description: 'Compras de mercado' },
  { name: 'Delivery', type: 'DESPESA', icon: '🍕', color: '#f97316', description: 'Pedidos de comida' },
  { name: 'Padaria', type: 'DESPESA', icon: '🥖', color: '#fb923c', description: 'Pães e confeitaria' },

  // Transporte (5)
  { name: 'Transporte', type: 'DESPESA', icon: '🚗', color: '#f59e0b', description: 'Transporte geral' },
  { name: 'Combustível', type: 'DESPESA', icon: '⛽', color: '#eab308', description: 'Gasolina e etanol' },
  { name: 'Uber/Taxi', type: 'DESPESA', icon: '🚕', color: '#facc15', description: 'Transporte por aplicativo' },
  { name: 'Estacionamento', type: 'DESPESA', icon: '🅿️', color: '#fde047', description: 'Estacionamentos' },
  { name: 'Manutenção Veículo', type: 'DESPESA', icon: '🔧', color: '#fef08a', description: 'Manutenção de carro/moto' },

  // Moradia (5)
  { name: 'Aluguel', type: 'DESPESA', icon: '🏠', color: '#8b5cf6', description: 'Aluguel mensal' },
  { name: 'Condomínio', type: 'DESPESA', icon: '🏢', color: '#a78bfa', description: 'Taxa de condomínio' },
  { name: 'Energia', type: 'DESPESA', icon: '💡', color: '#c4b5fd', description: 'Conta de luz' },
  { name: 'Água', type: 'DESPESA', icon: '💧', color: '#06b6d4', description: 'Conta de água' },
  { name: 'Internet/TV', type: 'DESPESA', icon: '📺', color: '#0ea5e9', description: 'Internet e TV a cabo' },

  // Saúde (4)
  { name: 'Saúde', type: 'DESPESA', icon: '🏥', color: '#ec4899', description: 'Consultas e exames' },
  { name: 'Farmácia', type: 'DESPESA', icon: '💊', color: '#f472b6', description: 'Medicamentos' },
  { name: 'Plano de Saúde', type: 'DESPESA', icon: '🩺', color: '#f9a8d4', description: 'Mensalidade do plano' },
  { name: 'Academia', type: 'DESPESA', icon: '💪', color: '#fda4af', description: 'Mensalidade de academia' },

  // Educação (3)
  { name: 'Educação', type: 'DESPESA', icon: '📚', color: '#3b82f6', description: 'Cursos e mensalidades' },
  { name: 'Material Escolar', type: 'DESPESA', icon: '✏️', color: '#60a5fa', description: 'Livros e materiais' },
  { name: 'Cursos Online', type: 'DESPESA', icon: '💻', color: '#93c5fd', description: 'Plataformas de ensino' },

  // Lazer e Entretenimento (5)
  { name: 'Lazer', type: 'DESPESA', icon: '🎮', color: '#f97316', description: 'Entretenimento geral' },
  { name: 'Cinema/Teatro', type: 'DESPESA', icon: '🎬', color: '#fb923c', description: 'Ingressos' },
  { name: 'Streaming', type: 'DESPESA', icon: '📺', color: '#fdba74', description: 'Netflix, Spotify, etc' },
  { name: 'Viagens', type: 'DESPESA', icon: '✈️', color: '#fed7aa', description: 'Turismo e viagens' },
  { name: 'Hobbies', type: 'DESPESA', icon: '🎨', color: '#ffedd5', description: 'Passatempos' },

  // Vestuário e Beleza (3)
  { name: 'Roupas', type: 'DESPESA', icon: '👕', color: '#a855f7', description: 'Vestuário' },
  { name: 'Calçados', type: 'DESPESA', icon: '👟', color: '#c084fc', description: 'Sapatos e tênis' },
  { name: 'Beleza', type: 'DESPESA', icon: '💄', color: '#e9d5ff', description: 'Salão e cosméticos' },

  // Serviços e Outros (6)
  { name: 'Telefone', type: 'DESPESA', icon: '📱', color: '#6366f1', description: 'Conta de celular' },
  { name: 'Seguros', type: 'DESPESA', icon: '🛡️', color: '#818cf8', description: 'Seguros diversos' },
  { name: 'Impostos', type: 'DESPESA', icon: '📄', color: '#a5b4fc', description: 'IPTU, IPVA, etc' },
  { name: 'Pets', type: 'DESPESA', icon: '🐕', color: '#c7d2fe', description: 'Cuidados com animais' },
  { name: 'Doações', type: 'DESPESA', icon: '❤️', color: '#e0e7ff', description: 'Caridade e doações' },
  { name: 'Outros Gastos', type: 'DESPESA', icon: '📦', color: '#64748b', description: 'Despesas diversas' },
];

async function createCompleteCategories() {
  try {
    console.log('🇧🇷 Criando TODAS as categorias brasileiras...\n');
    console.log(`📊 Total de categorias: ${COMPLETE_CATEGORIES.length}`);
    console.log(`   💰 Receitas: ${COMPLETE_CATEGORIES.filter(c => c.type === 'RECEITA').length}`);
    console.log(`   💸 Despesas: ${COMPLETE_CATEGORIES.filter(c => c.type === 'DESPESA').length}\n`);
    
    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true }
    });
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado!');
      console.log('💡 Crie um usuário primeiro com: node scripts/create-admin-user.js');
      return;
    }
    
    console.log(`👥 Encontrados ${users.length} usuário(s)\n`);
    
    for (const user of users) {
      console.log(`\n📝 Processando: ${user.name} (${user.email})`);
      
      // Verificar categorias existentes
      const existingCategories = await prisma.category.findMany({
        where: { userId: user.id }
      });
      
      console.log(`   📂 Categorias existentes: ${existingCategories.length}`);
      
      let created = 0;
      let updated = 0;
      let skipped = 0;
      
      for (const category of COMPLETE_CATEGORIES) {
        // Verificar se já existe
        const exists = existingCategories.find(
          c => c.name === category.name && c.type === category.type
        );
        
        if (exists) {
          // Atualizar se necessário (ícone, cor, descrição)
          if (exists.icon !== category.icon || exists.color !== category.color) {
            await prisma.category.update({
              where: { id: exists.id },
              data: {
                icon: category.icon,
                color: category.color,
                description: category.description
              }
            });
            updated++;
          } else {
            skipped++;
          }
          continue;
        }
        
        // Criar categoria
        await prisma.category.create({
          data: {
            userId: user.id,
            name: category.name,
            type: category.type,
            icon: category.icon,
            color: category.color,
            description: category.description,
            isDefault: true,
            isActive: true
          }
        });
        
        created++;
      }
      
      console.log(`   ✅ Criadas: ${created}`);
      console.log(`   🔄 Atualizadas: ${updated}`);
      console.log(`   ⏭️  Ignoradas: ${skipped}`);
      console.log(`   📊 Total final: ${existingCategories.length + created}`);
    }
    
    console.log('\n✅ Processo concluído com sucesso!');
    console.log('\n💡 Dica: Recarregue a página para ver as novas categorias');
    
  } catch (error) {
    console.error('\n❌ Erro:', error);
    console.error('\n📝 Detalhes:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createCompleteCategories();
