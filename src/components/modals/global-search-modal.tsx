'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, Target, Plane, Receipt, CreditCard, Wallet } from 'lucide-react';
import { useGlobalModal } from '@/contexts/ui/global-modal-context';

interface SearchResult {
  id: string;
  type: 'transaction' | 'goal' | 'trip' | 'account' | 'card';
  title: string;
  subtitle?: string;
  amount?: number;
  date?: string;
  icon: React.ReactNode;
  path: string;
}

export function GlobalSearchModal() {
  const { globalSearchModalOpen, closeAllModals } = useGlobalModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Buscar resultados
  const performSearch = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      // Buscar transações
      const transactionsRes = await fetch(`/api/transactions?search=${encodeURIComponent(term)}`, {
        credentials: 'include'
      });
      
      const mockResults: SearchResult[] = [];

      // Se a API retornar dados, processar
      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        if (data.success && data.transactions) {
          data.transactions.slice(0, 5).forEach((t: any) => {
            mockResults.push({
              id: t.id,
              type: 'transaction',
              title: t.description,
              subtitle: new Date(t.date).toLocaleDateString('pt-BR'),
              amount: t.amount,
              icon: <Receipt className="w-4 h-4" />,
              path: `/transactions?id=${t.id}`
            });
          });
        }
      }

      // Adicionar atalhos rápidos se não houver resultados
      if (mockResults.length === 0) {
        mockResults.push(
          {
            id: 'new-transaction',
            type: 'transaction',
            title: 'Nova Transação',
            subtitle: 'Criar nova transação',
            icon: <Receipt className="w-4 h-4" />,
            path: '/transactions'
          },
          {
            id: 'accounts',
            type: 'account',
            title: 'Contas',
            subtitle: 'Gerenciar contas bancárias',
            icon: <Wallet className="w-4 h-4" />,
            path: '/accounts'
          },
          {
            id: 'cards',
            type: 'card',
            title: 'Cartões de Crédito',
            subtitle: 'Ver faturas e limites',
            icon: <CreditCard className="w-4 h-4" />,
            path: '/credit-cards'
          },
          {
            id: 'goals',
            type: 'goal',
            title: 'Metas',
            subtitle: 'Acompanhar objetivos financeiros',
            icon: <Target className="w-4 h-4" />,
            path: '/goals'
          },
          {
            id: 'trips',
            type: 'trip',
            title: 'Viagens',
            subtitle: 'Planejar e controlar viagens',
            icon: <Plane className="w-4 h-4" />,
            path: '/trips'
          }
        );
      }

      setResults(mockResults);
    } catch (error) {
      console.error('Erro na busca:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, performSearch]);

  // Limpar ao fechar
  useEffect(() => {
    if (!globalSearchModalOpen) {
      setSearchTerm('');
      setResults([]);
    }
  }, [globalSearchModalOpen]);

  const handleSelectResult = (result: SearchResult) => {
    closeAllModals();
    router.push(result.path);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'transaction': return 'bg-blue-100 text-blue-800';
      case 'goal': return 'bg-green-100 text-green-800';
      case 'trip': return 'bg-purple-100 text-purple-800';
      case 'account': return 'bg-yellow-100 text-yellow-800';
      case 'card': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'transaction': return 'Transação';
      case 'goal': return 'Meta';
      case 'trip': return 'Viagem';
      case 'account': return 'Conta';
      case 'card': return 'Cartão';
      default: return type;
    }
  };

  return (
    <Dialog open={globalSearchModalOpen} onOpenChange={closeAllModals}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Busca Global
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transações, metas, viagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Resultados */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                Buscando...
              </div>
            ) : results.length === 0 && searchTerm.length >= 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum resultado encontrado</p>
                <p className="text-sm">Tente buscar por outro termo</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Digite para buscar</p>
                <p className="text-sm">Transações, metas, viagens e mais...</p>
              </div>
            ) : (
              results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className="w-full p-3 rounded-lg border hover:bg-accent hover:border-primary transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {result.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{result.title}</p>
                        <Badge variant="outline" className={`text-xs ${getTypeColor(result.type)}`}>
                          {getTypeLabel(result.type)}
                        </Badge>
                      </div>
                      {result.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    {result.amount !== undefined && (
                      <div className="flex-shrink-0 text-right">
                        <p className={`font-semibold ${result.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(result.amount)}
                        </p>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Dica de atalho */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Pressione <kbd className="px-2 py-1 bg-muted rounded">Esc</kbd> para fechar
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
