/**
 * BudgetIndicator - Indicador visual de uso de orçamento
 * Mostra barra de progresso com cores baseadas no percentual usado
 */

'use client';

import { Progress } from './progress';
import { Badge } from './badge';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface BudgetIndicatorProps {
  spent: number;
  budget: number;
  categoryName: string;
  showDetails?: boolean;
}

export function BudgetIndicator({
  spent,
  budget,
  categoryName,
  showDetails = true,
}: BudgetIndicatorProps) {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const remaining = budget - spent;

  // Determinar cor e ícone baseado no percentual
  const getVariant = () => {
    if (percentage >= 100) return 'destructive';
    if (percentage >= 80) return 'warning';
    return 'default';
  };

  const getIcon = () => {
    if (percentage >= 100) return <AlertCircle className="w-4 h-4" />;
    if (percentage >= 80) return <AlertTriangle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getColor = () => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-2 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <span className="font-medium">{categoryName}</span>
        <div className="flex items-center gap-2">
          <span className={getIcon() ? getColor() : ''}>
            {getIcon()}
          </span>
          <Badge variant={getVariant() as any}>
            {percentage.toFixed(0)}%
          </Badge>
        </div>
      </div>

      <Progress
        value={Math.min(percentage, 100)}
        className="h-2"
      />

      {showDetails && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Gasto: <span className="font-medium text-foreground">
              R$ {spent.toFixed(2)}
            </span>
          </span>
          <span>
            Orçamento: <span className="font-medium text-foreground">
              R$ {budget.toFixed(2)}
            </span>
          </span>
        </div>
      )}

      {remaining < 0 && (
        <div className="text-sm text-red-600 font-medium">
          Excedido em R$ {Math.abs(remaining).toFixed(2)}
        </div>
      )}

      {remaining > 0 && remaining < budget * 0.2 && (
        <div className="text-sm text-yellow-600 font-medium">
          Restam apenas R$ {remaining.toFixed(2)}
        </div>
      )}
    </div>
  );
}
