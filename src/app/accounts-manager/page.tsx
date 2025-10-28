'use client';

import { ModernAppLayout } from '@/components/modern-app-layout';
import { EnhancedAccountsManager } from '@/components/enhanced-accounts-manager';

export default function AccountsManagerPage() {
  return (
    <ModernAppLayout 
      title="Contas"
      subtitle="Gerencie suas contas bancárias e cartões de crédito"
    >
      <EnhancedAccountsManager />
    </ModernAppLayout>
  );
}