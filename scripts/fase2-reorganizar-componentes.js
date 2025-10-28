/**
 * Fase 2: Reorganização de Componentes
 * Organiza componentes da raiz em estrutura por features
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = path.join(__dirname, '..', 'src', 'components');

// Mapeamento de componentes para suas features
const COMPONENT_MAPPING = {
  // Features - Accounts
  'features/accounts': [
    'account-history-modal.tsx',
    'account-history.tsx',
    'account-operations.tsx',
    'edit-account-modal.tsx',
    'enhanced-accounts-manager.tsx',
  ],
  
  // Features - Goals
  'features/goals': [
    'goal-money-manager.tsx',
    'emergency-reserve.tsx',
  ],
  
  // Features - Trips
  'features/trips': [
    'trip-checklist.tsx',
    'trip-currency-exchange.tsx',
    'trip-details.tsx',
    'trip-documents.tsx',
    'trip-expense-report.tsx',
    'trip-expenses.tsx',
    'trip-itinerary.tsx',
    'trip-overview.tsx',
    'trip-reports.tsx',
    'trip-settings.tsx',
    'trip-shared-expenses.tsx',
    'trip-sharing.tsx',
    'trip-shopping-list.tsx',
    'trip-transaction-analytics.tsx',
    'travel-expenses.tsx',
    'travel-shared-expenses.tsx',
    'itinerary-manager.tsx',
    'itinerary-progress.tsx',
    'quick-itinerary-creator.tsx',
    'document-checklist.tsx',
  ],
  
  // Features - Transactions
  'features/transactions': [
    'transaction-detail-card.tsx',
    'transaction-hierarchy-view.tsx',
    'unified-transaction-list.tsx',
    'new-transaction-button.tsx',
  ],
  
  // Features - Shared Expenses
  'features/shared-expenses': [
    'shared-expense-modal.tsx',
    'shared-expenses.tsx',
    'shared-expenses-billing.tsx',
    'shared-debts-display.tsx',
    'shared-installment-modal.tsx',
  ],
  
  // Features - Reports
  'features/reports': [
    'advanced-reports-dashboard.tsx',
    'cash-flow-projections.tsx',
    'budget-insights.tsx',
    'budget-performance-analyzer.tsx',
    'enhanced-reports-system.tsx',
    'simple-cash-flow.tsx',
  ],
  
  // Features - Credit Cards
  'features/credit-cards': [
    'credit-card-bills.tsx',
    'credit-card-notifications.tsx',
  ],
  
  // Features - Installments
  'features/installments': [
    'installments-manager.tsx',
    'recurring-bills-manager.tsx',
  ],
  
  // Features - Settings
  'features/settings': [
    'financial-settings-manager.tsx',
    'advanced-pwa-settings.tsx',
    'ai-settings.tsx',
    'income-configuration.tsx',
    'smart-budget-config.tsx',
    'financial-automation-manager.tsx',
  ],
  
  // Features - Notifications
  'features/notifications': [
    'enhanced-notification-system.tsx',
    'financial-notifications.tsx',
    'smart-notification-center.tsx',
    'smart-notifications.tsx',
    'reminder-checker.tsx',
  ],
  
  // Features - Family
  'features/family': [
    'family-member-form.tsx',
  ],
  
  // Features - Backup
  'features/backup': [
    'backup-manager.tsx',
  ],
  
  // Shared - Componentes compartilhados
  'shared': [
    'back-button.tsx',
    'period-selector.tsx',
    'offline-indicator.tsx',
    'sync-status.tsx',
    'debts-credits-section.tsx',
    'security-monitor.tsx',
  ],
  
  // Layout - Já existe, mas adicionar alguns
  'layout': [
    'modern-app-layout.tsx',
    'enhanced-header.tsx',
    'enhanced-financial-navigation.tsx',
    'dashboard-content.tsx',
  ],
  
  // Providers - Já existe
  'providers': [
    'client-providers.tsx',
    'enhanced-auth-provider.tsx',
    'theme-provider-wrapper.tsx',
    'client-error-boundary.tsx',
  ],
  
  // Optimization - Já existe
  'optimization': [
    'optimized-image.tsx',
    'optimized-page-transition.tsx',
    'lazy-components.tsx',
  ],
  
  // PWA
  'features/pwa': [
    'pwa-install-prompt.tsx',
    'pwa-manager.tsx',
  ],
  
  // Modals - Já existe
  'modals': [
    'global-modals.tsx',
  ],
};

function createDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Criado: ${path.relative(COMPONENTS_DIR, dirPath)}/`);
  }
}

function moveFile(fileName, targetDir) {
  const sourcePath = path.join(COMPONENTS_DIR, fileName);
  const targetPath = path.join(COMPONENTS_DIR, targetDir, fileName);
  
  if (!fs.existsSync(sourcePath)) {
    console.log(`⏭️  Não encontrado: ${fileName}`);
    return false;
  }
  
  // Criar diretório de destino
  createDirectory(path.dirname(targetPath));
  
  // Mover arquivo
  fs.renameSync(sourcePath, targetPath);
  console.log(`✅ Movido: ${fileName} → ${targetDir}/`);
  return true;
}

async function fase2() {
  console.log('🔄 Fase 2: Reorganização de Componentes\n');
  console.log('📊 Organizando componentes por features...\n');
  
  let movedCount = 0;
  let skippedCount = 0;
  
  // Processar cada categoria
  for (const [targetDir, files] of Object.entries(COMPONENT_MAPPING)) {
    console.log(`\n📂 Processando: ${targetDir}/`);
    
    for (const file of files) {
      if (moveFile(file, targetDir)) {
        movedCount++;
      } else {
        skippedCount++;
      }
    }
  }
  
  console.log('\n✅ Fase 2 concluída!');
  console.log(`📊 Estatísticas:`);
  console.log(`   ✅ Arquivos movidos: ${movedCount}`);
  console.log(`   ⏭️  Arquivos não encontrados: ${skippedCount}`);
  console.log('\n🎯 Componentes reorganizados por features!');
  console.log('\n⚠️  IMPORTANTE: Você precisará atualizar os imports nos arquivos que usam esses componentes.');
  console.log('   Exemplo: import { Component } from "@/components/component" ');
  console.log('         → import { Component } from "@/components/features/accounts/component"');
}

fase2()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });
