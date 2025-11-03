'use client';

export const dynamic = 'force-dynamic';

import { ModernAppLayout } from '@/components/layout/modern-app-layout';
import { SharedExpenses } from '@/components/features/shared-expenses/shared-expenses';

export default function SharedPage() {
  return (
    <ModernAppLayout
      title="Despesas Compartilhadas"
      subtitle="Gerencie despesas divididas com outras pessoas"
    >
      <SharedExpenses />
    </ModernAppLayout>
  );
}
