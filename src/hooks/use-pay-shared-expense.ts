import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PaySharedExpenseParams {
  transactionIds: string[];
  accountId: string;
  paymentDate?: string;
  notes?: string;
}

interface PaySharedExpenseResponse {
  success: boolean;
  data?: {
    paymentTransactions: any[];
    updatedTrips: any[];
    totalPaid: number;
    newAccountBalance: number;
  };
  error?: string;
}

export function usePaySharedExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: PaySharedExpenseParams): Promise<PaySharedExpenseResponse> => {
      console.log('💳 [usePaySharedExpense] Enviando pagamento:', params);
      
      const response = await fetch('/api/shared-expenses/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      
      console.log('📥 [usePaySharedExpense] Resposta recebida:', {
        status: response.status,
        ok: response.ok,
        data
      });

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidar queries relevantes para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['shared-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['unified-financial'] });

      toast.success(
        `Pagamento de ${data.data?.totalPaid.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })} realizado com sucesso!`
      );
    },
    onError: (error: Error) => {
      console.error('❌ [usePaySharedExpense] Erro:', error);
      toast.error(`Erro ao processar pagamento: ${error.message}`);
    },
  });
}
