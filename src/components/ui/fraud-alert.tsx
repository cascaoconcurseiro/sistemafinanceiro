/**
 * FraudAlert - Alerta para transações suspeitas ou fraudulentas
 */

'use client';

import { Alert, AlertDescription, AlertTitle } from './alert';
import { AlertTriangle, XCircle } from 'lucide-react';
import { Button } from './button';

interface FraudAlertProps {
  isSuspicious?: boolean;
  isFraudulent?: boolean;
  transactionId: string;
  onMarkAsFraud?: (transactionId: string) => void;
  onDismiss?: (transactionId: string) => void;
}

export function FraudAlert({
  isSuspicious,
  isFraudulent,
  transactionId,
  onMarkAsFraud,
  onDismiss,
}: FraudAlertProps) {
  if (isFraudulent) {
    return (
      <Alert variant="destructive" className="border-red-600">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Transação Fraudulenta</AlertTitle>
        <AlertDescription>
          Esta transação foi marcada como fraudulenta e não está sendo contabilizada nos saldos.
        </AlertDescription>
      </Alert>
    );
  }

  if (isSuspicious) {
    return (
      <Alert variant="destructive" className="border-yellow-600 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-900">Transação Suspeita</AlertTitle>
        <AlertDescription className="text-yellow-800">
          Esta transação foi detectada como suspeita devido ao valor anormal ou padrão incomum.
          <div className="flex gap-2 mt-3">
            {onMarkAsFraud && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onMarkAsFraud(transactionId)}
              >
                Marcar como Fraude
              </Button>
            )}
            {onDismiss && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDismiss(transactionId)}
              >
                Ignorar Alerta
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
