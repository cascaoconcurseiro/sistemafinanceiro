'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calculator, CreditCard } from 'lucide-react';
import { parseNumber } from '@/lib/utils/number-utils';

interface InstallmentSummaryProps {
  amount: string;
  installments: number;
  isShared: boolean;
  myPercentage: number;
  creditCardName?: string;
}

export function InstallmentSummary({
  amount,
  installments,
  isShared,
  myPercentage,
  creditCardName,
}: InstallmentSummaryProps) {
  const totalAmount = parseNumber(amount);
  const myTotalAmount = isShared ? (totalAmount * myPercentage) / 100 : totalAmount;
  const installmentAmount = totalAmount / installments;
  const myInstallmentAmount = myTotalAmount / installments;

  if (installments <= 1) return null;

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          Resumo do Parcelamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Valor Total:</span>
            <div className="font-bold text-lg">
              R$ {totalAmount.toFixed(2)}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Número de Parcelas:</span>
            <div className="font-bold text-lg">
              {installments}x
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Valor por Parcela:</span>
            <div className="font-bold text-lg text-blue-600">
              R$ {installmentAmount.toFixed(2)}
            </div>
          </div>

          {isShared && (
            <div>
              <span className="text-sm text-gray-600">Minha Parte (Mensal):</span>
              <div className="font-bold text-lg text-green-600">
                R$ {myInstallmentAmount.toFixed(2)}
              </div>
              <span className="text-xs text-gray-500">
                ({myPercentage}% do total)
              </span>
            </div>
          )}
        </div>

        {isShared && (
          <>
            <Separator />
            <div className="p-2 bg-green-50 rounded border border-green-200">
              <div className="text-sm font-medium text-green-700">
                Minha Parte Total: R$ {myTotalAmount.toFixed(2)}
              </div>
              <div className="text-xs text-gray-600">
                Dividido em {installments}x de R$ {myInstallmentAmount.toFixed(2)}
              </div>
            </div>
          </>
        )}

        {creditCardName && (
          <div className="mt-2 p-2 bg-white rounded border">
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4" />
              <span>
                Será lançado na fatura do <strong>{creditCardName}</strong> nos próximos {installments} meses
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
