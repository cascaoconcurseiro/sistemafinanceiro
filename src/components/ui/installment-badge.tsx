/**
 * InstallmentBadge - Badge para mostrar número da parcela
 * Ex: "3/12" para terceira parcela de 12
 */

'use client';

import { Badge } from './badge';
import { CreditCard } from 'lucide-react';

interface InstallmentBadgeProps {
  installmentNumber: number;
  totalInstallments: number;
  variant?: 'default' | 'secondary' | 'outline';
}

export function InstallmentBadge({
  installmentNumber,
  totalInstallments,
  variant = 'outline',
}: InstallmentBadgeProps) {
  return (
    <Badge variant={variant} className="gap-1">
      <CreditCard className="w-3 h-3" />
      {installmentNumber}/{totalInstallments}
    </Badge>
  );
}
