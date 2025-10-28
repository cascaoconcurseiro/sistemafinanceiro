/**
 * ReconciliationBadge - Badge para transações reconciliadas
 */

'use client';

import { Badge } from './badge';
import { CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

interface ReconciliationBadgeProps {
  isReconciled: boolean;
  reconciledAt?: Date | string;
  onReconcile?: () => void;
}

export function ReconciliationBadge({
  isReconciled,
  reconciledAt,
  onReconcile,
}: ReconciliationBadgeProps) {
  if (!isReconciled && onReconcile) {
    return (
      <button
        onClick={onReconcile}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Reconciliar
      </button>
    );
  }

  if (!isReconciled) {
    return null;
  }

  const date = reconciledAt ? new Date(reconciledAt) : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1 cursor-help bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3" />
            Reconciliada
          </Badge>
        </TooltipTrigger>
        {date && (
          <TooltipContent>
            <p className="text-sm">
              Reconciliada em {format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
