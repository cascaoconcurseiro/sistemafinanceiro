'use client';

/**
 * Admin Performance Page
 * Administrative page for database performance monitoring
 */

import React from 'react';
import { ModernAppLayout } from '@/components/layout/modern-app-layout';
import PerformanceDashboard from '@/components/admin/performance-dashboard';

export default function AdminPerformancePage() {
  return (
    <ModernAppLayout
      title="Performance Monitor"
    >
      <div className="container mx-auto p-6">
        <PerformanceDashboard />
      </div>
    </ModernAppLayout>
  );
}
