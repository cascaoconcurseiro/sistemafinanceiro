import { useMemo, useState, useCallback } from 'react';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';

interface UseTransactionsListOptions {
  pageSize?: number;
  initialPage?: number;
}

/**
 * Hook otimizado para lista de transações
 * Implementa paginação virtual para melhor performance
 */
export function useTransactionsList(options: UseTransactionsListOptions = {}) {
  const { pageSize = 50, initialPage = 1 } = options;
  const { data, loading } = useUnifiedFinancial();
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Filtrar e ordenar transações (memoizado)
  const filteredTransactions = useMemo(() => {
    if (!data?.transactions) return [];

    let filtered = [...data.transactions];

    // Aplicar filtro de busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((t: any) =>
        t.description?.toLowerCase().includes(search) ||
        t.category?.toLowerCase().includes(search)
      );
    }

    // Aplicar filtro de tipo
    if (filterType !== 'all') {
      filtered = filtered.filter((t: any) => t.type === filterType);
    }

    // Ordenar por data (mais recente primeiro)
    filtered.sort((a: any, b: any) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return filtered;
  }, [data?.transactions, searchTerm, filterType]);

  // Paginar resultados (memoizado)
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage, pageSize]);

  // Calcular total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(filteredTransactions.length / pageSize);
  }, [filteredTransactions.length, pageSize]);

  // Callbacks otimizados
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const previousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset para primeira página
  }, []);

  const handleFilterType = useCallback((type: string) => {
    setFilterType(type);
    setCurrentPage(1); // Reset para primeira página
  }, []);

  return {
    transactions: paginatedTransactions,
    totalTransactions: filteredTransactions.length,
    currentPage,
    totalPages,
    pageSize,
    loading,
    searchTerm,
    filterType,
    // Actions
    goToPage,
    nextPage,
    previousPage,
    handleSearch,
    handleFilterType,
    // Pagination info
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    startIndex: (currentPage - 1) * pageSize + 1,
    endIndex: Math.min(currentPage * pageSize, filteredTransactions.length),
  };
}
