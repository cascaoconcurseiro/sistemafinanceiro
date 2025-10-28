'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ShoppingCart,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingDown,
} from 'lucide-react';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';
import { formatCurrency } from '@/lib/utils/format-currency';

interface ImprovedInstallmentsReportProps {
  startDate?: Date;
  endDate?: Date;
}

export const ImprovedInstallmentsReport: React.FC<ImprovedInstallmentsReportProps> = ({
  startDate,
  endDate,
}) => {
  const { data } = useUnifiedFinancial();
  const transactions = data?.transactions || [];
  const contacts = data?.contacts || [];

  // Processar dados de parcelamentos
  const installmentsData = useMemo(() => {
    // Filtrar apenas transações parceladas e não deletadas
    const installmentTransactions = transactions.filter(
      (t) => t.installmentNumber && 
             t.totalInstallments && 
             t.totalInstallments > 1 &&
             !(t as any).deletedAt
    );

    // Agrupar por installmentGroupId
    const groups = new Map<string, any>();

    installmentTransactions.forEach((t) => {
      const groupKey = (t as any).installmentGroupId || t.parentTransactionId || t.description;
      
      if (!groups.has(groupKey)) {
        const isShared = (t as any).isShared || false;
        const sharedWith = (t as any).sharedWith ? JSON.parse((t as any).sharedWith) : [];
        const myShare = (t as any).myShare || Math.abs(t.amount);
        const totalAmount = Math.abs(t.amount) * (t.totalInstallments || 1);
        
        // Extrair nome de quem pagou
        let paidByName = 'Você';
        let sharedWithName = null;
        try {
          const metadata = (t as any).metadata ? JSON.parse((t as any).metadata) : null;
          paidByName = metadata?.paidByName || 'Você';
          
          // Se é compartilhada, pegar nome da outra pessoa
          if (isShared && sharedWith.length > 0) {
            const contactId = sharedWith[0];
            const contact = contacts.find(c => c.id === contactId);
            sharedWithName = contact?.name || 'Outra pessoa';
          }
        } catch (e) {
          // Ignorar erro
        }
        
        groups.set(groupKey, {
          id: groupKey,
          description: t.description.replace(/\s*\(\d+\/\d+\)$/, ''), // Remover (X/Y) do nome
          totalAmount,
          installmentAmount: Math.abs(t.amount),
          totalInstallments: t.totalInstallments,
          installments: [],
          isShared,
          sharedWith,
          sharedWithName,
          myShare,
          paidByName,
          category: t.category,
        });
      }

      groups.get(groupKey)!.installments.push({
        number: t.installmentNumber,
        date: new Date(t.date),
        amount: Math.abs(t.amount),
        myShare: (t as any).myShare || Math.abs(t.amount),
        isPaid: t.status === 'completed' || t.status === 'cleared',
      });
    });

    // Processar cada grupo
    const processedGroups = Array.from(groups.values()).map((group) => {
      // Ordenar parcelas por número
      group.installments.sort((a: any, b: any) => a.number - b.number);
      
      // ✅ CORREÇÃO: Calcular parcelas pagas e pendentes corretamente
      const paidInstallments = group.installments.filter((i: any) => i.isPaid);
      const pendingInstallments = group.installments.filter((i: any) => !i.isPaid);
      
      const paidCount = paidInstallments.length;
      const remainingCount = pendingInstallments.length;
      
      // ✅ CORREÇÃO: Somar valores reais das parcelas pagas
      const paidAmount = paidInstallments.reduce((sum: number, i: any) => sum + i.amount, 0);
      const remainingAmount = pendingInstallments.reduce((sum: number, i: any) => sum + i.amount, 0);
      
      // Para compartilhadas, calcular minha parte
      const myPaidAmount = group.isShared 
        ? paidInstallments.reduce((sum: number, i: any) => sum + i.myShare, 0)
        : paidAmount;
      const myRemainingAmount = group.isShared 
        ? pendingInstallments.reduce((sum: number, i: any) => sum + i.myShare, 0)
        : remainingAmount;
      
      const progress = (paidCount / group.totalInstallments) * 100;
      
      return {
        ...group,
        paidCount,
        remainingCount,
        paidAmount,
        remainingAmount,
        myPaidAmount,
        myRemainingAmount,
        progress,
      };
    });

    // Separar por tipo
    const myInstallments = processedGroups.filter(g => !g.isShared);
    const sharedInstallments = processedGroups.filter(g => g.isShared);
    
    // Agrupar compartilhadas por pessoa
    const byPerson = new Map<string, any[]>();
    sharedInstallments.forEach(g => {
      const person = g.sharedWithName || 'Outra pessoa';
      if (!byPerson.has(person)) {
        byPerson.set(person, []);
      }
      byPerson.get(person)!.push(g);
    });

    // Calcular totais
    const totalMyInstallments = myInstallments.length;
    const totalMyRemaining = myInstallments.reduce((sum, g) => sum + g.remainingAmount, 0);
    const totalMyPaid = myInstallments.reduce((sum, g) => sum + g.paidAmount, 0);
    
    const totalSharedInstallments = sharedInstallments.length;
    const totalSharedRemaining = sharedInstallments.reduce((sum, g) => sum + g.myRemainingAmount, 0);
    const totalSharedPaid = sharedInstallments.reduce((sum, g) => sum + g.myPaidAmount, 0);

    return {
      myInstallments,
      sharedInstallments,
      byPerson: Array.from(byPerson.entries()).map(([person, groups]) => ({
        person,
        groups,
        totalRemaining: groups.reduce((sum, g) => sum + g.myRemainingAmount, 0),
        totalPaid: groups.reduce((sum, g) => sum + g.myPaidAmount, 0),
        count: groups.length,
      })),
      totals: {
        myInstallments: totalMyInstallments,
        myRemaining: totalMyRemaining,
        myPaid: totalMyPaid,
        sharedInstallments: totalSharedInstallments,
        sharedRemaining: totalSharedRemaining,
        sharedPaid: totalSharedPaid,
        totalRemaining: totalMyRemaining + totalSharedRemaining,
        totalPaid: totalMyPaid + totalSharedPaid,
      }
    };
  }, [transactions, contacts]);

  const { myInstallments, byPerson, totals } = installmentsData;

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Resumo de Parcelamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {totals.myInstallments + totals.sharedInstallments}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Compras Parceladas Ativas
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totals.totalPaid)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Já Pago
              </div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(totals.totalRemaining)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Saldo Devedor
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Minhas Compras Parceladas */}
      {myInstallments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Minhas Compras ({myInstallments.length})
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Saldo devedor: {formatCurrency(totals.myRemaining)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myInstallments.map((purchase) => (
                <Card key={purchase.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {/* Cabeçalho */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{purchase.description}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{purchase.category}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {purchase.paidCount}/{purchase.totalInstallments} parcelas pagas
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {formatCurrency(purchase.totalAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {purchase.totalInstallments}x de {formatCurrency(purchase.installmentAmount)}
                          </div>
                        </div>
                      </div>

                      {/* Progresso */}
                      <div className="space-y-2">
                        <Progress value={purchase.progress} className="h-2" />
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Pago: {formatCurrency(purchase.paidAmount)}
                          </span>
                          <span className="text-orange-600 flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Faltam: {formatCurrency(purchase.remainingAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Parcelas Restantes */}
                      {purchase.remainingCount > 0 && (
                        <div className="text-sm text-muted-foreground">
                          <TrendingDown className="h-4 w-4 inline mr-1" />
                          {purchase.remainingCount} parcela{purchase.remainingCount > 1 ? 's' : ''} restante{purchase.remainingCount > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compras Compartilhadas por Pessoa */}
      {byPerson.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Compras Compartilhadas
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Saldo devedor total: {formatCurrency(totals.sharedRemaining)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {byPerson.map(({ person, groups, totalRemaining, totalPaid, count }) => (
                <div key={person} className="space-y-4">
                  {/* Cabeçalho da Pessoa */}
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-lg">{person}</h3>
                      <p className="text-sm text-muted-foreground">
                        {count} compra{count > 1 ? 's' : ''} compartilhada{count > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-purple-600">
                        {formatCurrency(totalRemaining)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Você deve
                      </div>
                    </div>
                  </div>

                  {/* Compras da Pessoa */}
                  <div className="space-y-3 pl-4">
                    {groups.map((purchase: any) => (
                      <Card key={purchase.id} className="border-l-4 border-l-purple-500">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            {/* Cabeçalho */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium">{purchase.description}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary">Compartilhado</Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {purchase.paidCount}/{purchase.totalInstallments} pagas
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">
                                  {formatCurrency(purchase.totalAmount)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Sua parte: {formatCurrency(purchase.myShare)} por parcela
                                </div>
                              </div>
                            </div>

                            {/* Progresso */}
                            <div className="space-y-2">
                              <Progress value={purchase.progress} className="h-2" />
                              <div className="flex justify-between text-sm">
                                <span className="text-green-600">
                                  Você pagou: {formatCurrency(purchase.myPaidAmount)}
                                </span>
                                <span className="text-orange-600">
                                  Você deve: {formatCurrency(purchase.myRemainingAmount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Separator />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há parcelamentos */}
      {myInstallments.length === 0 && byPerson.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma compra parcelada</h3>
            <p className="text-muted-foreground">
              Você não tem compras parceladas ativas no momento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
