'use client';

import { DashboardSections } from '@/components/cards/dashboard-sections';
import { OptimizedGranularCards } from '@/components/cards/optimized-granular-cards';

export function DashboardContent() {
  return (
    <div className="p-6 space-y-6">
      <OptimizedGranularCards />
      <DashboardSections />
    </div>
  );
}
