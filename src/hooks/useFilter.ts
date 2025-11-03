import { useState, useMemo, useCallback } from 'react';

type FilterFunction<T> = (item: T) => boolean;

interface UseFilterResult<T> {
  filteredData: T[];
  filters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  hasFilters: boolean;
}

/**
 * Hook para gerenciar filtros de dados
 *
 * @template T - Tipo dos itens
 * @param data - Array de dados para filtrar
 * @param filterFn - Função que aplica os filtros
 * @returns Objeto com dados filtrados e controles
 *
 * @example
 * const { filteredData, setFilter, clearFilters } = useFilter(
 *   transactions,
 *   (item, filters) => {
 *     if (filters.category && item.category !== filters.category) return false;
 *     if (filters.minAmount && item.amount < filters.minAmount) return false;
 *     return true;
 *   }
 * );
 *
 * setFilter('category', 'Food');
 * setFilter('minAmount', 100);
 */
export function useFilter<T>(
  data: T[],
  filterFn: (item: T, filters: Record<string, any>) => boolean
): UseFilterResult<T> {
  const [filters, setFilters] = useState<Record<string, any>>({});

  const filteredData = useMemo(() => {
    if (Object.keys(filters).length === 0) {
      return data;
    }
    return data.filter((item) => filterFn(item, filters));
  }, [data, filters, filterFn]);

  const setFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasFilters = Object.keys(filters).length > 0;

  return {
    filteredData,
    filters,
    setFilter,
    removeFilter,
    clearFilters,
    hasFilters,
  };
}
