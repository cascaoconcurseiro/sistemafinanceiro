'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Investment } from '@/types';
import { useInvestments } from '@/contexts/unified-financial-context';
import { toast } from '@/hooks/use-toast';
import { Merge, AlertTriangle, TrendingUp } from 'lucide-react';

interface DuplicateConsolidationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsolidationComplete: () => void;
}

interface DuplicateGroup {
  symbol: string;
  investments: Investment[];
  totalQuantity: number;
  totalInvested: number;
  averagePrice: number;
}

export function DuplicateConsolidation({
  open,
  onOpenChange,
  onConsolidationComplete,
}: DuplicateConsolidationProps) {
  const { investments: investmentsData, update: updateInvestment, delete: deleteInvestment } = useInvestments();
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [isConsolidating, setIsConsolidating] = useState(false);

  useEffect(() => {
    if (open && investmentsData) {
      findDuplicates();
    }
  }, [open, investmentsData]);

  const findDuplicates = () => {
    if (!investmentsData) return;

    const groupedBySymbol = investmentsData.reduce((acc, investment) => {
      const symbol = investment.symbol.toUpperCase();
      if (!acc[symbol]) {
        acc[symbol] = [];
      }
      acc[symbol].push(investment);
      return acc;
    }, {} as Record<string, Investment[]>);

    const duplicates = Object.entries(groupedBySymbol)
      .filter(([_, investments]) => investments.length > 1)
      .map(([symbol, investments]) => {
        const totalQuantity = investments.reduce((sum, inv) => sum + inv.quantity, 0);
        const totalInvested = investments.reduce((sum, inv) => sum + (inv.quantity * inv.averagePrice), 0);
        const averagePrice = totalInvested / totalQuantity;

        return {
          symbol,
          investments,
          totalQuantity,
          totalInvested,
          averagePrice,
        };
      });

    setDuplicateGroups(duplicates);
  };

  const toggleGroupSelection = (symbol: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(symbol)) {
      newSelected.delete(symbol);
    } else {
      newSelected.add(symbol);
    }
    setSelectedGroups(newSelected);
  };

  const consolidateSelected = async () => {
    if (selectedGroups.size === 0) {
      toast({
        title: "Nenhum grupo selecionado",
        description: "Selecione pelo menos um grupo para consolidar.",
        variant: "destructive",
      });
      return;
    }

    setIsConsolidating(true);

    try {
      for (const symbol of selectedGroups) {
        const group = duplicateGroups.find(g => g.symbol === symbol);
        if (!group) continue;

        // Manter o primeiro investimento e atualizar suas informações
        const [mainInvestment, ...duplicates] = group.investments;
        
        // Atualizar o investimento principal com os valores consolidados
        await updateInvestment(mainInvestment.id, {
          ...mainInvestment,
          quantity: group.totalQuantity,
          averagePrice: group.averagePrice,
        });

        // Deletar os investimentos duplicados
        for (const duplicate of duplicates) {
          await deleteInvestment(duplicate.id);
        }
      }

      toast({
        title: "Consolidação concluída",
        description: `${selectedGroups.size} grupo(s) consolidado(s) com sucesso.`,
      });

      onConsolidationComplete();
    } catch (error) {
      console.error('Erro ao consolidar investimentos:', error);
      toast({
        title: "Erro na consolidação",
        description: "Ocorreu um erro ao consolidar os investimentos.",
        variant: "destructive",
      });
    } finally {
      setIsConsolidating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="w-5 h-5" />
            Consolidar Investimentos Duplicados
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {duplicateGroups.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma duplicata encontrada</h3>
                  <p className="text-muted-foreground">
                    Todos os seus investimentos estão organizados corretamente.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    {duplicateGroups.length} grupo(s) de investimentos duplicados encontrado(s)
                  </p>
                  <p className="text-sm text-yellow-700">
                    A consolidação irá manter o primeiro investimento e somar as quantidades.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {duplicateGroups.map((group) => (
                  <Card key={group.symbol} className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedGroups.has(group.symbol)}
                            onCheckedChange={() => toggleGroupSelection(group.symbol)}
                          />
                          <CardTitle className="text-lg">{group.symbol}</CardTitle>
                          <Badge variant="secondary">
                            {group.investments.length} duplicatas
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Após consolidação:</p>
                          <p className="font-semibold">
                            {group.totalQuantity} cotas • R$ {group.averagePrice.toFixed(2)} (preço médio)
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {group.investments.map((investment, index) => (
                          <div
                            key={investment.id}
                            className={`flex justify-between items-center p-3 rounded-lg ${
                              index === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {index === 0 && (
                                <Badge variant="default" className="bg-green-600">
                                  Principal
                                </Badge>
                              )}
                              <span className="font-medium">{investment.name}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {investment.quantity} cotas • R$ {investment.averagePrice.toFixed(2)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Total: R$ {(investment.quantity * investment.averagePrice).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={consolidateSelected}
                  disabled={selectedGroups.size === 0 || isConsolidating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isConsolidating ? (
                    "Consolidando..."
                  ) : (
                    `Consolidar ${selectedGroups.size} grupo(s)`
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
