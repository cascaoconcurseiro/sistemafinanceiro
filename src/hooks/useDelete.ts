import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UseDeleteOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

interface UseDeleteResult {
  deleteItem: (id: string) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook customizado para deletar itens
 * 
 * @param endpoint - Endpoint da API (ex: 'transactions', 'categories')
 * @param entityName - Nome da entidade para mensagens (ex: 'Transaction', 'Category')
 * @param options - Opções adicionais
 * @returns Objeto com deleteItem, loading e error
 * 
 * @example
 * const { deleteItem, loading } = useDelete('transactions', 'Transaction');
 * await deleteItem('123');
 */
export function useDelete(
  endpoint: string,
  entityName: string,
  options: UseDeleteOptions = {}
): UseDeleteResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  const deleteItem = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/${endpoint}/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Failed to delete ${entityName}`);
        }

        const successMsg = options.successMessage || `${entityName} deleted successfully`;
        toast.success(successMsg);

        if (options.onSuccess) {
          options.onSuccess();
        }

        router.refresh();
        return true;
      } catch (err) {
        const error = err as Error;
        setError(error);

        const errorMsg = options.errorMessage || `Error deleting ${entityName}`;
        toast.error(errorMsg);

        if (options.onError) {
          options.onError(error);
        }

        return false;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, entityName, options, router]
  );

  return { deleteItem, loading, error };
}
