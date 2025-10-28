'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { getDebts } from '@/lib/utils/debt-helpers';
import { formatCurrency } from '@/lib/utils/currency';

interface Debt {
    id: string;
    creditor: string;
    debtor: string;
    currentAmount: number;
    description: string;
    createdAt: string;
}

interface DebtsSummary {
    all: Debt[];
    iOwe: Debt[];
    oweMe: Debt[];
    summary: {
        totalIOwe: number;
        totalOweMe: number;
    };
}

export function DebtsCreditsSection() {
    const [debts, setDebts] = useState<DebtsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDebts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getDebts();
            setDebts(data);
        } catch (err) {
            console.error('Erro ao carregar dívidas:', err);
            setError('Não foi possível carregar os dados');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDebts();
    }, [loadDebts]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Créditos e Débitos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-pulse text-gray-500">Carregando...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Créditos e Débitos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-red-500">{error}</p>
                        <button
                            onClick={loadDebts}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Tentar novamente
                        </button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!debts) {
        return null;
    }

    const hasDebts = debts.summary.totalIOwe > 0 || debts.summary.totalOweMe > 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Créditos e Débitos
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Resumo */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Créditos (Me devem) */}
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">
                                Créditos (Me devem)
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">
                            {formatCurrency(debts.summary.totalOweMe)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                            {debts.oweMe.length} pessoa(s)
                        </p>
                    </div>

                    {/* Débitos (Eu devo) */}
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-700">
                                Débitos (Eu devo)
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-red-700">
                            {formatCurrency(debts.summary.totalIOwe)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                            {debts.iOwe.length} pessoa(s)
                        </p>
                    </div>
                </div>

                {/* Saldo Líquido */}
                {hasDebts && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">
                                    Saldo Líquido
                                </span>
                            </div>
                            <p className={`text-xl font-bold ${debts.summary.totalOweMe - debts.summary.totalIOwe >= 0
                                ? 'text-green-700'
                                : 'text-red-700'
                                }`}>
                                {formatCurrency(debts.summary.totalOweMe - debts.summary.totalIOwe)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Lista de Créditos */}
                {debts.oweMe.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm text-green-700">
                            Pessoas que me devem:
                        </h4>
                        {debts.oweMe.map(debt => (
                            <div key={debt.id} className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200">
                                <div>
                                    <p className="font-medium">{debt.creditor === 'user' ? debt.debtor : debt.creditor}</p>
                                    <p className="text-xs text-gray-600">{debt.description}</p>
                                </div>
                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                    {formatCurrency(debt.currentAmount)}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}

                {/* Lista de Débitos */}
                {debts.iOwe.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm text-red-700">
                            Pessoas para quem eu devo:
                        </h4>
                        {debts.iOwe.map(debt => (
                            <div key={debt.id} className="flex justify-between items-center p-3 bg-red-50 rounded border border-red-200">
                                <div>
                                    <p className="font-medium">{debt.creditor}</p>
                                    <p className="text-xs text-gray-600">{debt.description}</p>
                                </div>
                                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                                    {formatCurrency(debt.currentAmount)}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}

                {/* Mensagem quando não há dívidas */}
                {!hasDebts && (
                    <div className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-500 font-medium">
                            Nenhum crédito ou débito pendente
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            Suas contas estão em dia! 🎉
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
