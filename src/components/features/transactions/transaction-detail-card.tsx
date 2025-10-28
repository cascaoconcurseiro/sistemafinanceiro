'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  CreditCard, 
  Plane, 
  Split, 
  Calendar,
  DollarSign,
  Info
} from 'lucide-react';

interface TransactionDetailCardProps {
  transaction: any;
  accountName?: string;
  categoryName?: string;
  runningBalance?: number;
}

export function TransactionDetailCard({
  transaction,
  accountName,
  categoryName,
  runningBalance
}: TransactionDetailCardProps) {
  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  
  // Parse sharedWith se for string JSON
  let sharedWithParsed = [];
  if (transaction.sharedWith) {
    try {
      sharedWithParsed = typeof transaction.sharedWith === 'string' 
        ? JSON.parse(transaction.sharedWith) 
        : transaction.sharedWith;
    } catch (e) {
      sharedWithParsed = [];
    }
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* Lado Esquerdo - Informações Principais */}
        <div className="flex-1">
          {/* Descrição e Badges */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-lg">{transaction.description}</h3>
            
            {/* Badge de Parcelamento */}
            {transaction.isInstallment && transaction.totalInstallments > 1 && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                <Split className="w-3 h-3 mr-1" />
                {transaction.installmentNumber}/{transaction.totalInstallments}
              </Badge>
            )}
            
            {/* Badge de Compartilhamento */}
            {transaction.isShared && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                <Users className="w-3 h-3 mr-1" />
                Compartilhada
              </Badge>
            )}
            
            {/* Badge de Viagem */}
            {transaction.tripId && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                <Plane className="w-3 h-3 mr-1" />
                {transaction.tripExpenseType === 'shared' ? 'Viagem Compartilhada' :
                 transaction.tripExpenseType === 'regular' ? 'Viagem Regular' : 'Viagem'}
              </Badge>
            )}
            
            {/* Badge de Cartão */}
            {transaction.creditCardId && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                <CreditCard className="w-3 h-3 mr-1" />
                Cartão
              </Badge>
            )}
          </div>

          {/* Informações Secundárias */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(transaction.date).toLocaleDateString('pt-BR')}
            </span>
            
            <span>{accountName || 'Conta não informada'}</span>
            
            {categoryName && (
              <span>• {categoryName}</span>
            )}
            
            <Badge variant={transaction.status === 'cleared' ? 'default' : 'secondary'}>
              {transaction.status === 'cleared' ? 'Efetivada' : 
               transaction.status === 'pending' ? 'Pendente' : 'Concluída'}
            </Badge>
          </div>

          {/* Detalhes Adicionais */}
          {(transaction.isShared || transaction.isInstallment || transaction.tripId) && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
              {/* Informações de Compartilhamento */}
              {transaction.isShared && (
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-purple-700">Compartilhada com:</p>
                    <p className="text-gray-600">
                      {sharedWithParsed.length > 0 
                        ? sharedWithParsed.join(', ') 
                        : 'Não especificado'}
                    </p>
                    {transaction.myShare && (
                      <p className="text-purple-600 font-medium mt-1">
                        Minha parte: R$ {Math.abs(Number(transaction.myShare)).toFixed(2)}
                      </p>
                    )}
                    {transaction.totalSharedAmount && (
                      <p className="text-gray-500 text-xs">
                        Total compartilhado: R$ {Math.abs(Number(transaction.totalSharedAmount)).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Informações de Parcelamento */}
              {transaction.isInstallment && transaction.totalInstallments > 1 && (
                <div className="flex items-start gap-2">
                  <Split className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-700">Parcelamento:</p>
                    <p className="text-gray-600">
                      Parcela {transaction.installmentNumber} de {transaction.totalInstallments}
                    </p>
                    {transaction.installmentGroupId && (
                      <p className="text-gray-500 text-xs">
                        Grupo: {transaction.installmentGroupId.substring(0, 8)}...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Informações de Viagem */}
              {transaction.tripId && (
                <div className="flex items-start gap-2">
                  <Plane className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700">Viagem:</p>
                    <p className="text-gray-600">
                      Tipo: {transaction.tripExpenseType === 'shared' ? 'Compartilhada' :
                             transaction.tripExpenseType === 'regular' ? 'Regular' : 'Viagem'}
                    </p>
                    <p className="text-gray-500 text-xs">
                      ID: {transaction.tripId.substring(0, 8)}...
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lado Direito - Valores */}
        <div className="text-right ml-4">
          <div className={`text-2xl font-bold ${
            isIncome ? 'text-green-600' : 'text-red-600'
          }`}>
            {isIncome ? '+' : '-'}R$ {Math.abs(Number(transaction.amount)).toFixed(2)}
          </div>
          
          {runningBalance !== undefined && (
            <div className="text-sm text-gray-500 mt-1">
              Saldo: R$ {runningBalance.toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
