/**
 * SharedExpenseBadge - Badge para despesas compartilhadas
 * Mostra ícone de pessoas e tooltip com participantes
 */

'use client';

import { Badge } from './badge';
import { Users } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

interface SharedExpenseBadgeProps {
  participants: string[];
  myShare?: number;
  totalAmount?: number;
  variant?: 'default' | 'secondary' | 'outline';
}

export function SharedExpenseBadge({
  participants,
  myShare,
  totalAmount,
  variant = 'secondary',
}: SharedExpenseBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="gap-1 cursor-help">
            <Users className="w-3 h-3" />
            Compartilhada ({participants.length + 1})
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Participantes:</p>
            <ul className="text-sm space-y-1">
              <li>• Você{myShare && ` (R$ ${myShare.toFixed(2)})`}</li>
              {participants.map((name, index) => (
                <li key={index}>• {name}</li>
              ))}
            </ul>
            {totalAmount && (
              <p className="text-sm font-medium mt-2">
                Total: R$ {totalAmount.toFixed(2)}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
