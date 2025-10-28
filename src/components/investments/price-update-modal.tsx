'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Investment } from '@/types/investment';
import { formatCurrency, formatDate } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

interface PriceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  investments: Investment[];
}

export function PriceUpdateModal({ isOpen, onClose, investments }: PriceUpdateModalProps) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const queryClient = useQueryClient();
  
  const updateMutation = useMutation({
    mutationFn: async (updates: Array<{ investmentId: string; newPrice: number }>) => {
      const res = await fetch('/api/investments/prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      if (!res.ok) throw new Error('Failed to update prices');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investment-portfolio'] });
      toast.success('Cotações atualizadas com sucesso!');
      onClose();
      setPrices({});
    },
    onError: () => {
      toast.error('Erro ao atualizar cotações');
    }
  });
  
  const handleUpdateAll = () => {
    const updates = Object.entries(prices)
      .filter(([_, price]) => price > 0)
      .map(([investmentId, newPrice]) => ({ investmentId, newPrice }));
    
    if (updates.length === 0) {
      toast.error('Nenhuma cotação para atualizar');
      return;
    }
    
    updateMutation.mutate(updates);
  };
  
  const lastUpdate = investments[0]?.updatedAt 
    ? formatDate(investments[0].updatedAt)
    : 'Nunca';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🔄 Atualizar Cotações</DialogTitle>
          <DialogDescription>
            Última atualização: {lastUpdate}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {investments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum investimento para atualizar
            </p>
          ) : (
            investments.map(inv => {
              const currentPrice = Number(inv.currentPrice || inv.averagePrice);
              const newPrice = prices[inv.id] || 0;
              const variation = newPrice > 0 
                ? ((newPrice - currentPrice) / currentPrice) * 100 
                : 0;
              
              return (
                <div key={inv.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{inv.ticker}</p>
                    <p className="text-sm text-muted-foreground">
                      Última: {formatCurrency(currentPrice)}
                      {newPrice > 0 && (
                        <span className={variation >= 0 ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                          ({variation >= 0 ? '+' : ''}{variation.toFixed(2)}%)
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="w-40">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Nova cotação"
                      value={prices[inv.id] || ''}
                      onChange={(e) => setPrices({
                        ...prices,
                        [inv.id]: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>
              );
            })
          )}
          
          {investments.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Dica:</strong> Você pode copiar cotações de sites como Status Invest, 
                Google Finance ou sua corretora
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdateAll}
            disabled={updateMutation.isPending || Object.keys(prices).length === 0}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Atualizando...' : 'Atualizar Todos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
