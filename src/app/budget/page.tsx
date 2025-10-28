'use client';

export const dynamic = 'force-dynamic';

import { ModernAppLayout } from '@/components/modern-app-layout';
import { BudgetInsights } from '@/components/budget-insights';

export default function BudgetPage() {
  return (
    <ModernAppLayout
      title="Orçamento"
      subtitle="Planeje e controle seus gastos mensais"
    >
      <div className="p-4 md:p-6">
        <BudgetInsights />
      </div>
    </ModernAppLayout>
  );
}
