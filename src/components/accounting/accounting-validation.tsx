'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Calculator,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';

interface AccountingValidationProps {
  className?: string;
}

interface ValidationResult {
  systemBalance: {
    isBalanced: boolean;
    totalDebits: number;
    totalCredits: number;
    difference: number;
  };
  trialBalance: Array<{
    accountId: string;
    accountName: string;
    accountType: string;
    totalDebits: number;
    totalCredits: number;
    balance: number;
    currentBalance: number;
  }>;
  reconciliation: Array<{
    accountId: string;
    accountName: string;
    storedBalance: number;
    calculatedBalance: number;
    difference: number;
    isReconciled: boolean;
    error?: string;
  }>;
  summary: {
    totalAccounts: number;
    reconciledAccounts: number;
    unreconciledAccounts: number;
    accountsWithErrors: number;
    systemIsBalanced: boolean;
  };
}

export function AccountingValidation({ className }: AccountingValidationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const validateAccounting = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 [AccountingValidation] Iniciando validação contábil...');
      
      const response = await fetch('/api/accounting/validate', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao validar contabilidade');
      }

      const result = await response.json();
      setValidationResult(result);

      if (result.summary.systemIsBalanced) {
        toast.success('✅ Sistema contábil está balanceado!');
      } else {
        toast.error('❌ Sistema contábil não está balanceado!');
      }

      console.log('✅ [AccountingValidation] Validação concluída:', result.summary);
    } catch (error) {
      console.error('❌ [AccountingValidation] Erro na validação:', error);
      toast.error('Erro ao validar contabilidade');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Validação Contábil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={validateAccounting}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Validar Contabilidade
              </>
            )}
          </Button>

          {validationResult && (
            <div className="space-y-4">
              {/* Status Geral */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {validationResult.summary.systemIsBalanced ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    Status do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Sistema Balanceado:</span>
                    <Badge variant={validationResult.summary.systemIsBalanced ? "default" : "destructive"}>
                      {validationResult.summary.systemIsBalanced ? "✅ SIM" : "❌ NÃO"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total de Contas:</span>
                    <span>{validationResult.summary.totalAccounts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Contas Reconciliadas:</span>
                    <span className="text-green-600">{validationResult.summary.reconciledAccounts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Contas Não Reconciliadas:</span>
                    <span className="text-yellow-600">{validationResult.summary.unreconciledAccounts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Contas com Erro:</span>
                    <span className="text-red-600">{validationResult.summary.accountsWithErrors}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Balanceamento Geral */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Balanceamento Geral</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      Total Débitos:
                    </span>
                    <span className="font-mono">{formatCurrency(validationResult.systemBalance.totalDebits)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      Total Créditos:
                    </span>
                    <span className="font-mono">{formatCurrency(validationResult.systemBalance.totalCredits)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="font-semibold">Diferença:</span>
                    <span className={`font-mono font-semibold ${
                      validationResult.systemBalance.difference <= 0.01 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(validationResult.systemBalance.difference)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Reconciliação por Conta */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Reconciliação por Conta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {validationResult.reconciliation.map((account) => (
                      <div key={account.accountId} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {account.error ? (
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          ) : account.isReconciled ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-sm font-medium">{account.accountName}</span>
                        </div>
                        <div className="text-right text-xs">
                          {account.error ? (
                            <span className="text-yellow-600">Erro</span>
                          ) : (
                            <>
                              <div>Armazenado: {formatCurrency(account.storedBalance)}</div>
                              <div>Calculado: {formatCurrency(account.calculatedBalance)}</div>
                              {account.difference > 0.01 && (
                                <div className="text-red-600">
                                  Diferença: {formatCurrency(account.difference)}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Balancete Resumido */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Balancete (Resumido)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {validationResult.trialBalance.slice(0, 5).map((account) => (
                      <div key={account.accountId} className="flex justify-between items-center text-sm">
                        <span>{account.accountName}</span>
                        <span className="font-mono">{formatCurrency(account.balance)}</span>
                      </div>
                    ))}
                    {validationResult.trialBalance.length > 5 && (
                      <div className="text-center text-xs text-gray-500 pt-2">
                        ... e mais {validationResult.trialBalance.length - 5} contas
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}