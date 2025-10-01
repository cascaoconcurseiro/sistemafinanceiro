'use client';

import { ModernAppLayout } from './modern-app-layout';
import FinancialDashboard from './dashboards/financial/financial-dashboard';

export function DashboardContent() {
  return (
    <ModernAppLayout>
      <FinancialDashboard />
    </ModernAppLayout>
  );
}
