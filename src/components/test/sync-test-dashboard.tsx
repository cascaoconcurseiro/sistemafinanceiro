'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  RefreshCw,
  Database,
  Zap,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useUnified } from '@/contexts/unified-context-simple';

/**
 * Componente de teste para verificar a sincronização de dados
 * Este componente demonstra como os dados são sincronizados automaticamente
 */
export function SyncTestDashboard() {
  const [testResults, setTestResults] = useState<string[]>([]);

  // Hook do Financial Engine
  const { 
    transactions = [], 
    accounts = [], 
    isLoading, 
    addTransaction, 
    addAccount 
  } = useUnified();

  const addTestResult = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testCreateTransaction = async () => {
    try {
      addTestResult('🔄 Testando criação de transação...');

      const accountId = accounts.length > 0 ? accounts[0]?.id : 'default';

      await addTransaction({
        description: `Teste de Sincronização - ${Date.now()}`,
        amount: Math.floor(Math.random() * 1000) + 100,
        type: 'expense',
        category: 'teste',
        accountId,
        date: new Date().toISOString(),
      });

      addTestResult('✅ Transação criada - sincronização automática ativada');
    } catch (error) {
      addTestResult(`❌ Erro ao criar transação: ${error}`);
    }
  };

  const testCreateAccount = async () => {
    try {
      addTestResult('🔄 Testando criação de conta...');

      await addAccount({
        name: `Conta Teste - ${Date.now()}`,
        type: 'checking',
        balance: Math.floor(Math.random() * 5000) + 1000,
        color: '#3B82F6',
      });

      addTestResult('✅ Conta criada - sincronização automática ativada');
    } catch (error) {
      addTestResult(`❌ Erro ao criar conta: ${error}`);
    }
  };

  const testGlobalSync = async () => {
    try {
      addTestResult('🔄 Testando sincronização global...');
      // Simular sincronização já que não temos mais os hooks de sync
      addTestResult('✅ Sincronização global concluída (simulada)');
    } catch (error) {
      addTestResult(`❌ Erro na sincronização global: ${error}`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teste de Sincronização de Dados</h1>
        <Badge variant={isLoading ? 'destructive' : 'default'}>
          {isLoading ? 'Carregando...' : 'Carregado'}
        </Badge>
      </div>

      {/* Status de Sincronização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Status dos Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {transactions.length}
              </div>
              <div className="text-sm text-muted-foreground">Transações</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {accounts.length}
              </div>
              <div className="text-sm text-muted-foreground">Contas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Carregados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              Transações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              {isLoading ? 'Carregando...' : 'Carregadas'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              Contas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts?.length || 0}</div>
            <div className="text-sm text-muted-foreground">
              {isLoading ? 'Carregando...' : 'Carregadas'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0).toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              {isLoading ? 'Carregando...' : 'Saldo Total'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Teste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Testes de Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={testCreateTransaction}
              disabled={isLoading || accounts.length === 0}
              variant="outline"
            >
              Criar Transação
            </Button>

            <Button
              onClick={testCreateAccount}
              disabled={isLoading}
              variant="outline"
            >
              Criar Conta
            </Button>

            <Button onClick={testGlobalSync} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronização Global
            </Button>

            <Button onClick={() => setTestResults([])} variant="secondary">
              Limpar Log
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log de Testes */}
      <Card>
        <CardHeader>
          <CardTitle>Log de Testes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg max-h-60 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-muted-foreground text-center py-4">
                Nenhum teste executado ainda
              </div>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
