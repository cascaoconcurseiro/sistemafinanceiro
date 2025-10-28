'use client';

import { ModernAppLayout } from '@/components/modern-app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTrialBalance } from '@/hooks/use-reports';
import { CheckCircle, XCircle, RefreshCw, FileText } from 'lucide-react';

export default function TrialBalancePage() {
  const { data: trialBalance, isLoading, error, refetch } = useTrialBalance();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <ModernAppLayout
      title="Balancete de Verificação"
    >
      <div className="container mx-auto p-6 space-y-6">
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Balancete de Verificação</h1>
          <Button onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span>Erro ao carregar balancete: {error.message}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Gerando balancete...</p>
              </div>
            </CardContent>
          </Card>
        ) : trialBalance ? (
          <>
            {/* Status do Balanceamento */}
            <Card className={trialBalance.isBalanced ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {trialBalance.isBalanced ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    <div>
                      <h3 className={`font-semibold ${trialBalance.isBalanced ? 'text-green-800' : 'text-red-800'}`}>
                        {trialBalance.isBalanced ? 'Balancete Correto' : 'Balancete Desbalanceado'}
                      </h3>
                      <p className={`text-sm ${trialBalance.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                        {trialBalance.isBalanced 
                          ? 'Débitos = Créditos - Sistema íntegro'
                          : 'Débitos ≠ Créditos - Verificar lançamentos'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Diferença</p>
                    <p className={`font-bold ${trialBalance.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(trialBalance.totalDebits - trialBalance.totalCredits))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Totais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700">Total de Débitos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(trialBalance.totalDebits)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-700">Total de Créditos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {formatCurrency(trialBalance.totalCredits)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detalhamento por Conta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Detalhamento por Conta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Conta</th>
                        <th className="text-right py-3 px-4">Débitos</th>
                        <th className="text-right py-3 px-4">Créditos</th>
                        <th className="text-right py-3 px-4">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trialBalance.accounts.map((account) => (
                        <tr key={account.accountId} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">
                            {account.accountId === 'REVENUE_ACCOUNT' ? 'Receitas' :
                             account.accountId === 'EXPENSE_ACCOUNT' ? 'Despesas' :
                             account.accountId}
                          </td>
                          <td className="py-3 px-4 text-right text-green-600">
                            {account.debits > 0 ? formatCurrency(account.debits) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right text-red-600">
                            {account.credits > 0 ? formatCurrency(account.credits) : '-'}
                          </td>
                          <td className={`py-3 px-4 text-right font-semibold ${
                            account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(account.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td className="py-3 px-4">TOTAIS</td>
                        <td className="py-3 px-4 text-right text-green-600">
                          {formatCurrency(trialBalance.totalDebits)}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600">
                          {formatCurrency(trialBalance.totalCredits)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {formatCurrency(trialBalance.totalDebits - trialBalance.totalCredits)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Informações Adicionais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Relatório</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Contas Analisadas</p>
                    <p className="font-semibold">{trialBalance.accounts.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Gerado em</p>
                    <p className="font-semibold">{new Date().toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className={`font-semibold ${trialBalance.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                      {trialBalance.isBalanced ? 'Íntegro' : 'Requer Atenção'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </ModernAppLayout>
  );
}