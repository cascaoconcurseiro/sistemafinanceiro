import { useState, useEffect, useMemo } from 'react';

// Hook para filtros otimizados
export function useOptimizedFilters<T>(
  data: T[],
  filterFn: (item: T, filters: any) => boolean,
  initialFilters: any = {}
) {
  const [filters, setFilters] = useState(initialFilters);
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce do termo de busca
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Dados filtrados memoizados
  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter((item) => {
      // Aplicar filtros personalizados
      const passesCustomFilter = filterFn(item, filters);

      // Aplicar busca por texto se houver
      if (debouncedSearchTerm) {
        const searchableText = JSON.stringify(item).toLowerCase();
        const passesSearch = searchableText.includes(
          debouncedSearchTerm.toLowerCase()
        );
        return passesCustomFilter && passesSearch;
      }

      return passesCustomFilter;
    });
  }, [data, filters, debouncedSearchTerm, filterFn]);

  return {
    filteredData,
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
    totalCount: data?.length || 0,
    filteredCount: filteredData.length,
  };
}
