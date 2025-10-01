/**
 * PÁGINA PRINCIPAL DO DASHBOARD
 * 
 * Dashboard principal do sistema financeiro
 */

'use client';

import FinancialDashboard from '@/components/dashboards/financial/financial-dashboard';
import { ModernAppLayout } from '@/components/modern-app-layout';


export default function HomePage() {
  return (
    <ModernAppLayout title="Dashboard" subtitle="Visão geral das suas finanças">
      <div className="container mx-auto px-4 py-6">
        <FinancialDashboard />
      </div>
    </ModernAppLayout>
  );
}
