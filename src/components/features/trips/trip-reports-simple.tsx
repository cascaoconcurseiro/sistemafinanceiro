'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, User, TrendingUp, PieChart, Download, AlertCircle, BarChart3 } from 'lucide-react';
import type { Trip } from '@/lib/config/storage';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface TripReportsSimpleProps {
  trip: Trip;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function TripReportsSimple({ trip }: TripReportsSimpleProps) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, [trip.id]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transactions?tripId=${trip.id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrar apenas DESPESAS
        const onlyExpenses = (data.transactions || []).filter((t: any) => t.type === 'DESPESA');
        setExpenses(onlyExpenses);
      }
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gastos por dia
  const expensesByDay = expenses.reduce((acc: any, expense) => {
    const date = new Date(expense.date).toLocaleDateString('pt-BR');
    if (!acc[date]) {
      acc[date] = { total: 0, count: 0, transactions: [] };
    }
    // Usar myShare para compartilhadas, amount para individuais
    const expenseAmount = expense.isShared && expense.myShare !== null && expense.myShare !== undefined
      ? Math.abs(Number(expense.myShare))
      : Math.abs(Number(expense.amount));
    acc[date].total += expenseAmount;
    acc[date].count += 1;
    acc[date].transactions.push(expense);
    return acc;
  }, {});

  // Gastos por categoria
  const expensesByCategory = expenses.reduce((acc: any, expense) => {
    const category = expense.category || 'Sem categoria';
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0 };
    }
    // Usar myShare para compartilhadas, amount para individuais
    const expenseAmount = expense.isShared && expense.myShare !== null && expense.myShare !== undefined
      ? Math.abs(Number(expense.myShare))
      : Math.abs(Number(expense.amount));
    acc[category].total += expenseAmount;
    acc[category].count += 1;
    return acc;
  }, {});

  // Gastos por pessoa (se houver participantes)
  const expensesByPerson = expenses.reduce((acc: any, expense) => {
    console.log('📊 [Reports] Processando despesa:', {
      description: expense.description,
      isShared: expense.isShared,
      sharedWith: expense.sharedWith,
      paidByPerson: expense.paidByPerson,
      myShare: expense.myShare,
      amount: expense.amount,
      allFields: expense
    });

    // Se for compartilhada, dividir entre participantes
    if (expense.isShared) {
      // Adicionar "Você" com sua parte (SEMPRE usar myShare para compartilhadas)
      if (!acc['Você']) {
        acc['Você'] = { total: 0, count: 0 };
      }

      // Para compartilhadas, SEMPRE usar myShare (nunca amount total)
      const myAmount = expense.myShare !== null && expense.myShare !== undefined
        ? Math.abs(Number(expense.myShare))
        : Math.abs(Number(expense.amount)) / 2; // Fallback: dividir por 2 se não tiver myShare

      console.log('💰 [Reports] Minha parte:', {
        description: expense.description,
        myShare: expense.myShare,
        amount: expense.amount,
        calculatedMyAmount: myAmount
      });

      acc['Você'].total += myAmount;
      acc['Você'].count += 1;

      // Buscar o nome da outra pessoa que participou
      // Pode estar em paidByPerson ou sharedWith
      let otherPersonName = null;
      let otherPersonAmount = 0;

      // Tentar pegar de paidByPerson (quando você paga por outra pessoa)
      if (expense.paidByPerson) {
        otherPersonName = expense.paidByPerson;
        // O valor da outra pessoa é o total menos sua parte
        otherPersonAmount = Math.abs(Number(expense.amount)) - myAmount;
      }

      // Tentar parsear sharedWith para adicionar outros participantes
      if (expense.sharedWith) {
        try {
          let shared;
          if (typeof expense.sharedWith === 'string') {
            shared = JSON.parse(expense.sharedWith);
          } else {
            shared = expense.sharedWith;
          }

          
          if (Array.isArray(shared)) {
            shared.forEach((person: any) => {
              const name = person.name || person.contactName || person.contact || null;
              const personAmount = person.amount || person.share || person.value || 0;

              console.log('👤 [Reports] Pessoa encontrada:', { name, personAmount });

              // Não adicionar "Você" novamente
              if (name && name !== 'Você' && name !== 'você') {
                if (!acc[name]) {
                  acc[name] = { total: 0, count: 0 };
                }
                acc[name].total += Math.abs(Number(personAmount));
                acc[name].count += 1;
              }
            });
          } else if (shared && typeof shared === 'object') {
            // Se for um objeto único
            const name = shared.name || shared.contactName || shared.contact || null;
            const personAmount = shared.amount || shared.share || shared.value || 0;

            if (name && name !== 'Você' && name !== 'você') {
              if (!acc[name]) {
                acc[name] = { total: 0, count: 0 };
              }
              acc[name].total += Math.abs(Number(personAmount));
              acc[name].count += 1;
            }
          }
        } catch (e) {
          console.error('❌ [Reports] Erro ao parsear sharedWith:', e);
        }
      }

      // Se encontrou nome em paidByPerson mas não em sharedWith
      if (otherPersonName && !expense.sharedWith) {
        if (!acc[otherPersonName]) {
          acc[otherPersonName] = { total: 0, count: 0 };
        }
        acc[otherPersonName].total += otherPersonAmount;
        acc[otherPersonName].count += 1;
      }
    } else {
      // Despesa individual - apenas "Você"
      if (!acc['Você']) {
        acc['Você'] = { total: 0, count: 0 };
      }
      acc['Você'].total += Math.abs(Number(expense.amount));
      acc['Você'].count += 1;
    }
    return acc;
  }, {});

  // Calcular total considerando myShare para compartilhadas
  const totalExpenses = expenses.reduce((sum, e) => {
    if (e.isShared && e.myShare !== null && e.myShare !== undefined) {
      // Para compartilhadas, usar myShare
      return sum + Math.abs(Number(e.myShare));
    } else {
      // Para individuais, usar amount total
      return sum + Math.abs(Number(e.amount));
    }
  }, 0);
  const averageDaily = Object.keys(expensesByDay).length > 0
    ? totalExpenses / Object.keys(expensesByDay).length
    : 0;

  // Preparar dados para gráficos
  const dailyChartData = Object.entries(expensesByDay)
    .sort(([a], [b]) => {
      const dateA = a.split('/').reverse().join('-');
      const dateB = b.split('/').reverse().join('-');
      return dateA.localeCompare(dateB);
    })
    .map(([date, data]: [string, any]) => ({
      date: date.split('/').slice(0, 2).join('/'),
      valor: data.total,
      transacoes: data.count,
    }));

  const categoryChartData = Object.entries(expensesByCategory)
    .sort(([, a]: [string, any], [, b]: [string, any]) => b.total - a.total)
    .map(([name, data]: [string, any]) => ({
      name,
      value: data.total,
      count: data.count,
    }));

  const personChartData = Object.entries(expensesByPerson)
    .filter(([name, data]: [string, any]) => {
      // Filtrar participantes com valor zero ou nome inválido
      return data.total > 0 && name && name !== 'Desconhecido';
    })
    .sort(([, a]: [string, any], [, b]: [string, any]) => b.total - a.total)
    .map(([name, data]: [string, any]) => ({
      name,
      value: data.total,
      count: data.count,
    }));

  const budgetUsed = trip.budget > 0 ? (totalExpenses / trip.budget) * 100 : 0;
  const budgetRemaining = trip.budget - totalExpenses;

  const exportReport = () => {
    const report = {
      viagem: {
        nome: trip.name,
        destino: trip.destination,
        inicio: trip.startDate,
        fim: trip.endDate,
        orcamento: trip.budget,
      },
      resumo: {
        totalGasto: totalExpenses,
        mediaDiaria: averageDaily,
        orcamentoUsado: budgetUsed,
        saldoRestante: budgetRemaining,
        totalTransacoes: expenses.length,
      },
      gastosPorDia: expensesByDay,
      gastosPorCategoria: expensesByCategory,
      gastosPorPessoa: expensesByPerson,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${trip.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-12 text-center">
          <BarChart3 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Nenhum gasto registrado
          </h3>
          <p className="text-gray-600">
            Adicione transações à viagem para visualizar relatórios detalhados
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios de Gastos</h2>
          <p className="text-gray-600">Análise detalhada dos gastos da viagem</p>
        </div>
        <Button onClick={exportReport} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </div>

      {/* Alerta de orçamento */}
      {budgetUsed >= 80 && (
        <Card className={`border-l-4 ${budgetUsed >= 100 ? 'border-l-red-500 bg-red-50' : 'border-l-yellow-500 bg-yellow-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className={`w-5 h-5 ${budgetUsed >= 100 ? 'text-red-600' : 'text-yellow-600'}`} />
              <p className="font-medium">
                {budgetUsed >= 100
                  ? `Orçamento excedido em ${(budgetUsed - 100).toFixed(1)}%`
                  : `Atenção: ${budgetUsed.toFixed(1)}% do orçamento utilizado`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Gasto</p>
                <p className="text-2xl font-bold text-red-600">
                  {trip.currency} {totalExpenses.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Média Diária</p>
                <p className="text-2xl font-bold text-blue-600">
                  {trip.currency} {averageDaily.toFixed(2)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Orçamento Usado</p>
                <p className="text-2xl font-bold text-purple-600">
                  {budgetUsed.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo Restante</p>
                <p className={`text-2xl font-bold ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trip.currency} {budgetRemaining.toFixed(2)}
                </p>
              </div>
              <DollarSign className={`h-8 w-8 ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Gastos por Dia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Evolução de Gastos por Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`${trip.currency} ${value.toFixed(2)}`, 'Valor']}
              />
              <Bar dataKey="valor" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gastos por Dia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gastos por Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(expensesByDay)
              .sort(([a], [b]) => {
                const dateA = a.split('/').reverse().join('-');
                const dateB = b.split('/').reverse().join('-');
                return dateA.localeCompare(dateB);
              })
              .map(([date, data]: [string, any]) => (
                <div key={date} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{date}</p>
                    <p className="text-sm text-gray-600">{data.count} transação(ões)</p>
                  </div>
                  <p className="font-bold text-red-600">
                    {trip.currency} {data.total.toFixed(2)}
                  </p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Gastos por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${trip.currency} ${value.toFixed(2)}`} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryChartData.map((item, index) => {
                const percentage = totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.count} transação(ões)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{trip.currency} {item.value.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gastos por Participante */}
      {personChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Gastos por Participante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={personChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip
                    formatter={(value: number) => [`${trip.currency} ${value.toFixed(2)}`, 'Valor']}
                  />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ranking de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {personChartData.map((person, index) => {
                  const percentage = totalExpenses > 0 ? (person.value / totalExpenses) * 100 : 0;
                  return (
                    <div key={person.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{person.name}</p>
                            <p className="text-sm text-gray-600">{person.count} transação(ões)</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">
                            {trip.currency} {person.value.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gastos Detalhados por Dia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Detalhamento Diário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(expensesByDay)
              .sort(([a], [b]) => {
                const dateA = a.split('/').reverse().join('-');
                const dateB = b.split('/').reverse().join('-');
                return dateB.localeCompare(dateA);
              })
              .map(([date, data]: [string, any]) => (
                <div key={date} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-bold text-lg">{date}</p>
                      <p className="text-sm text-gray-600">{data.count} transação(ões)</p>
                    </div>
                    <p className="text-xl font-bold text-red-600">
                      {trip.currency} {data.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all"
                      style={{ width: `${totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
