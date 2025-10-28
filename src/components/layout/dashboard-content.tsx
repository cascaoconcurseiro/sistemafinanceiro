'use client';

import { DashboardSections } from '@/components/cards/dashboard-sections';
import { GranularCards } from '@/components/cards/granular-cards';

export function DashboardContent() {
  return (
    <div className="p-6 space-y-6">
      <GranularCards />
      <DashboardSections />
    </div>
  );
}
