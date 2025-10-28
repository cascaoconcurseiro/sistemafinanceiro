'use client';

import React from 'react';
import { ModernAppLayout } from '@/components/modern-app-layout';
import { CreditCardBills } from '@/components/credit-card-bills';

export default function CreditCardBillsPage() {
  return (
    <ModernAppLayout
      title="Faturas de Cartão"
      subtitle="Acompanhe e gerencie suas faturas de cartão de crédito"
    >
      <CreditCardBills />
    </ModernAppLayout>
  );
}