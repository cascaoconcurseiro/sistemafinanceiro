'use client';

import { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';
import { usePeriod } from '@/contexts/period-context';
import { simplifyDebts, getTotalCredit, getTotalDebit, getNetBalance } from '@/lib/utils/debt-simplification';
import {
  Receipt,
  CheckCircle,
  Download,
  Plane,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react';

interface SharedExpensesBillingProps {
  mode: 'regular' | 'trip';
}

interface BillingItem {
  id: string;
  transactionId: string;
  userEmail: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  isPaid: boolean;
  dueDate?: string;
  tripId?: string;
  type: 'CREDIT' | 'DEBIT'; // ✅ NOVO: Tipo de item (crédito ou débito)
  paidBy?: string; // ✅ NOVO: ID de quem pagou a despesa
}

// Função auxiliar para criar data de vencimento
const createSafeDueDate = (transactionDate: string): string => {
  try {
    const date = new Date(transactionDate);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().substring(0, 10);
    }
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 10);
    return nextMonth.toISOString().substring(0, 10);
  } catch {
    return new Date().toISOString().substring(0, 10);
  }
};

export const SharedExpensesBilling = memo(function SharedExpensesBilling({ mode }: SharedExpensesBillingProps) {
  const { contacts: unifiedContacts, trips, actions } = useUnifiedFinancial();
  const { getPeriodDates } = usePeriod();

  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  
  // Estados do modal de pagamento
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BillingItem | null>(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10));
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<any[]>([]);

  // Função para exportar faturas
  const handleExportBilling = () => {
    const filtered = billingItems;
    const csvContent = [
      [
        'Nome',
        'Email',
        'Descrição',
        'Categoria',
        'Valor',
        'Data',
        'Status',
        'Data Pagamento',
      ].join(','),
      ...filtered.map((item) => {
        const contact = activeContacts.find(c => c.email === item.userEmail);
        return [
          contact?.name || item.userEmail,
          item.userEmail,
          item.description,
          item.category,
          `R$ ${item.amount.toFixed(2)}`,
          new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR'),
          item.isPaid ? 'Pago' : 'Pendente',
          item.isPaid && item.dueDate
            ? new Date(item.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')
            : '',
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `faturas-${mode}-${new Date().toISOString().substring(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Carregar contatos da API
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const response = await fetch('/api/family', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setContacts(data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar contatos:', error);
      }
    };

    loadContacts();
  }, []);
  
  // Carregar contas disponíveis
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const response = await fetch('/api/accounts', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setAvailableAccounts(data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar contas:', error);
      }
    };

    loadAccounts();
  }, []);

  // Usar contatos do unified se disponíveis
  const activeContacts = Array.isArray(unifiedContacts) && unifiedContacts.length > 0 
    ? unifiedContacts 
    : Array.isArray(contacts) && contacts.length > 0 
      ? contacts 
      : [];

  // Carregar transações compartilhadas E dívidas
  useEffect(() => {
    const loadSharedTransactions = async () => {
      try {
        console.log(`🔧 [${mode}] Carregando transações compartilhadas e dívidas...`);

        // 1. Buscar transações compartilhadas
        const transactionsResponse = await fetch('/api/unified-financial', {
          credentials: 'include',
          cache: 'no-cache',
        });

        if (!transactionsResponse.ok) {
          console.error(`❌ [${mode}] Erro ao buscar transações:`, transactionsResponse.status);
          setBillingItems([]);
          return;
        }

        const transactionsResult = await transactionsResponse.json();
        const transactions = transactionsResult.transactions || [];

        console.log(`📊 [${mode}] Total de transações: ${transactions.length}`);

        // 2. Buscar dívidas (pago por outra pessoa) - incluir pagas e ativas
        const debtsResponse = await fetch('/api/debts?status=all', {
          credentials: 'include',
        });

        let debts: any[] = [];
        if (debtsResponse.ok) {
          const debtsResult = await debtsResponse.json();
          debts = debtsResult.debts || [];
          console.log(`💰 [${mode}] Total de dívidas: ${debts.length}`);
        }

        // Filtrar transações compartilhadas (EU paguei)
        const sharedTransactions = transactions.filter((t: any) => {
          // Verificar se tem sharedWith
          const hasSharedWith = t.sharedWith &&
            (Array.isArray(t.sharedWith) ? t.sharedWith.length > 0 :
              typeof t.sharedWith === 'string' && t.sharedWith.length > 0);

          if (!hasSharedWith) {
            return false;
          }

          // Filtrar por modo
          if (mode === 'trip') return t.tripId;
          return !t.tripId;
        });

        console.log(`✅ [${mode}] Transações compartilhadas filtradas: ${sharedTransactions.length}`);

        // Converter transações em itens de fatura
        const allItems: BillingItem[] = [];

        sharedTransactions.forEach((transaction: any) => {
          let sharedWith: string[] = [];

          if (transaction.sharedWith) {
            if (Array.isArray(transaction.sharedWith)) {
              sharedWith = transaction.sharedWith;
            } else if (typeof transaction.sharedWith === 'string') {
              try {
                const parsed = JSON.parse(transaction.sharedWith);
                sharedWith = Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                console.warn(`⚠️ [${mode}] Erro ao parsear sharedWith:`, e);
                sharedWith = [];
              }
            }
          }

          if (sharedWith.length === 0) {
            console.warn(`⚠️ [${mode}] Transação ${transaction.id} sem sharedWith válido`);
            return;
          }

          const totalParticipants = sharedWith.length + 1;
          const amountPerPerson = Math.abs(transaction.amount) / totalParticipants;

          // ✅ NOVO: Identificar quem pagou a despesa
          const paidBy = transaction.paidBy; // ID de quem pagou
          const accountId = transaction.accountId; // Conta usada
          
          // ✅ COMPATIBILIDADE: Verificar metadata para transações antigas
          let metadata = null;
          try {
            metadata = transaction.metadata ? JSON.parse(transaction.metadata) : null;
          } catch (e) {
            metadata = transaction.metadata;
          }
          
          const isPaidByOther = paidBy || (metadata && metadata.paidByName);

          // ✅ LÓGICA CORRETA:
          // Se a transação tem paidBy OU metadata.paidByName, significa que OUTRA PESSOA pagou
          // Se não tem, significa que EU paguei (usei minha conta)
          
          console.log(`🔍 [${mode}] Transação ${transaction.id}:`, {
            description: transaction.description,
            amount: transaction.amount,
            paidBy: paidBy,
            metadata: metadata,
            isPaidByOther: isPaidByOther,
            accountId: accountId,
            sharedWith: sharedWith
          });
          
          if (isPaidByOther) {
            // ✅ OUTRA PESSOA PAGOU → EU DEVO (DÉBITO)
            // Verificar se EU estou no sharedWith (se sim, eu devo para quem pagou)
            const payer = activeContacts.find((c: any) => c.id === paidBy) || 
                         (metadata?.paidByName ? { name: metadata.paidByName, email: metadata.paidByName } : null);
            
            if (payer) {
              // ✅ USAR ID como chave única para agrupar
              const payerId = payer.id || paidBy || 'unknown';
              const payerName = payer.name || payer.email || payerId;

              console.log(`🔴 [${mode}] EU DEVO para ${payerName}: R$ ${amountPerPerson.toFixed(2)}`);

              allItems.push({
                id: `${transaction.id}-debit`,
                transactionId: transaction.id,
                userEmail: payerId, // ✅ USAR ID para agrupar
                amount: Number(amountPerPerson.toFixed(2)),
                description: transaction.description,
                date: transaction.date,
                category: transaction.category || 'Compartilhado',
                isPaid: false, // ✅ CORREÇÃO: Sempre false inicialmente, será atualizado depois
                dueDate: createSafeDueDate(transaction.date),
                tripId: transaction.tripId,
                type: 'DEBIT', // ✅ EU DEVO
                paidBy: payerId,
              });
            }
          } else {
            // ✅ EU PAGUEI → OUTROS ME DEVEM (CRÉDITO)
            sharedWith.forEach((memberId: string) => {
              if (!memberId) return;

              const member = activeContacts.find((c: any) => c.id === memberId);
              // ✅ USAR ID como chave única para agrupar
              const memberIdKey = member?.id || memberId;
              const memberName = member?.name || member?.email || memberId;

              console.log(`🟢 [${mode}] ${memberName} ME DEVE: R$ ${amountPerPerson.toFixed(2)}`);

              allItems.push({
                id: `${transaction.id}-${memberId}`,
                transactionId: transaction.id,
                userEmail: memberIdKey, // ✅ USAR ID para agrupar
                amount: Number(amountPerPerson.toFixed(2)),
                description: transaction.description,
                date: transaction.date,
                category: transaction.category || 'Compartilhado',
                isPaid: false, // ✅ CORREÇÃO: Sempre false inicialmente, será atualizado depois
                dueDate: createSafeDueDate(transaction.date),
                tripId: transaction.tripId,
                type: 'CREDIT', // ✅ ME DEVEM
                paidBy: accountId, // Quem pagou fui eu (minha conta)
              });
            });
          }
        });

        // ✅ NOVO: Processar dívidas (pago por outra pessoa)
        // ✅ CORREÇÃO: Incluir APENAS dívidas ativas (não pagas)
        // Dívidas pagas devem aparecer apenas se tiverem transação vinculada
        debts.forEach((debt: any) => {
          // ✅ CORREÇÃO: Incluir apenas dívidas ativas
          if (debt.status !== 'active') {
            console.log(`⏭️ [${mode}] Pulando dívida ${debt.id} - status: ${debt.status}`);
            return;
          }
          
          // ✅ CORREÇÃO: Só adicionar se NÃO tiver transactionId (evita duplicação com transações compartilhadas)
          if (debt.transactionId) {
            console.log(`⏭️ [${mode}] Pulando dívida ${debt.id} - já tem transação vinculada`);
            return;
          }
          
          // Se EU devo para alguém
          const creditor = activeContacts.find((c: any) => c.id === debt.creditorId);
          if (creditor) {
            // ✅ USAR ID como chave única para agrupar
            const creditorId = creditor.id || debt.creditorId;
            const creditorName = creditor.name || creditor.email || creditorId;
            
            console.log(`🔴 [${mode}] Dívida: EU devo R$ ${debt.currentAmount} para ${creditorName} - Status: ${debt.status} - ID: ${debt.id}`);
            
            allItems.push({
              id: `debt-${debt.id}`,
              transactionId: debt.id,
              userEmail: creditorId, // ✅ USAR ID para agrupar
              amount: Number(debt.currentAmount),
              description: debt.description,
              date: debt.createdAt,
              category: 'Dívida',
              isPaid: false, // ✅ CORREÇÃO: Sempre false para dívidas ativas
              dueDate: createSafeDueDate(debt.createdAt),
              type: 'DEBIT',
              paidBy: creditorId,
            });
          }
          
          // Se alguém me deve
          const debtor = activeContacts.find((c: any) => c.id === debt.debtorId);
          if (debtor) {
            // ✅ USAR ID como chave única para agrupar
            const debtorId = debtor.id || debt.debtorId;
            const debtorName = debtor.name || debtor.email || debtorId;
            
            console.log(`🟢 [${mode}] Crédito: ${debtorName} me deve R$ ${debt.currentAmount} - Status: ${debt.status}`);
            
            allItems.push({
              id: `credit-${debt.id}`,
              transactionId: debt.id,
              userEmail: debtorId, // ✅ USAR ID para agrupar
              amount: Number(debt.currentAmount),
              description: debt.description,
              date: debt.createdAt,
              category: 'Crédito',
              isPaid: false, // ✅ CORREÇÃO: Sempre false para dívidas ativas
              dueDate: createSafeDueDate(debt.createdAt),
              type: 'CREDIT',
              paidBy: debtorId,
            });
          }
        });

        // ✅ NOVO: Buscar transações de pagamento de fatura para determinar quais itens estão realmente pagos
        try {
          const paymentResponse = await fetch('/api/transactions', {
            credentials: 'include',
          });
          
          if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json();
            const paymentTransactions = paymentData.transactions || [];
            
            // Criar mapa de transações pagas (que têm pagamento de fatura vinculado)
            const paidTransactionsMap = new Map<string, boolean>();
            
            paymentTransactions
              .filter((tx: any) => 
                tx.description.toLowerCase().includes('fatura') &&
                (tx.description.toLowerCase().includes('recebimento') || tx.description.toLowerCase().includes('pagamento'))
              )
              .forEach((tx: any) => {
                // Extrair ID da transação original da descrição ou metadata
                try {
                  const metadata = tx.metadata ? JSON.parse(tx.metadata) : {};
                  if (metadata.paidByTransactionId) {
                    paidTransactionsMap.set(metadata.paidByTransactionId, true);
                  }
                } catch (e) {
                  // Ignorar erros de parse
                }
              });
            
            console.log(`💳 [${mode}] Transações pagas encontradas:`, paidTransactionsMap.size);
            
            // Atualizar isPaid dos itens baseado no mapa
            allItems.forEach(item => {
              if (paidTransactionsMap.has(item.transactionId)) {
                item.isPaid = true;
                console.log(`✅ [${mode}] Item ${item.id} marcado como pago (tem transação de pagamento vinculada)`);
              }
            });
          }
        } catch (error) {
          console.warn('⚠️ [${mode}] Erro ao buscar transações de pagamento:', error);
          // Continuar mesmo se falhar, itens ficarão como não pagos
        }

        console.log(`📋 [${mode}] Total de itens de fatura gerados: ${allItems.length}`);
        setBillingItems(allItems);
      } catch (error) {
        console.error(`❌ [${mode}] Erro ao carregar transações:`, error);
        setBillingItems([]);
      }
    };

    loadSharedTransactions();
  }, [mode, activeContacts]);

  const getContactByEmail = (identifier: string) => {
    // ✅ Buscar por ID primeiro, depois por email ou nome
    return activeContacts.find((c) => c.id === identifier || c.email === identifier || c.name === identifier);
  };

  const getTripInfo = (tripId: string) => {
    return trips?.find((trip) => trip.id === tripId);
  };

  const getFilteredBillingItems = () => {
    let filtered = billingItems;

    if (mode === 'regular') {
      const periodDates = getPeriodDates();
      const { startDate, endDate } = periodDates;

      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.date);
        const isInPeriod = itemDate >= startDate && itemDate <= endDate;
        const isNotTrip = !item.tripId;
        return isInPeriod && isNotTrip;
      });
    } else {
      filtered = filtered.filter((item) => item.tripId);
    }

    return filtered;
  };

  const getBillingByUser = () => {
    const filtered = getFilteredBillingItems();
    const grouped: Record<string, BillingItem[]> = {};

    filtered.forEach((item) => {
      const userEmail = item.userEmail || '';
      if (!grouped[userEmail]) {
        grouped[userEmail] = [];
      }
      grouped[userEmail]?.push(item);
    });

    return grouped;
  };

  const handleMarkAsPaid = async (item: BillingItem) => {
    setSelectedItem(item);
    setPaymentModalOpen(true);
  };



  const confirmPayment = async () => {
    if (!selectedItem || !selectedAccount) {
      alert('Selecione uma conta para receber o pagamento');
      return;
    }

    setIsProcessing(true);
    try {
      const contact = getContactByEmail(selectedItem.userEmail);

      console.log('🔍 [DEBUG] ===== INICIANDO PAGAMENTO =====');
      console.log('🔍 [DEBUG] selectedItem completo:', selectedItem);
      console.log('🔍 [DEBUG] selectedItem.type:', selectedItem.type);
      console.log('🔍 [DEBUG] selectedItem.id:', selectedItem.id);
      console.log('🔍 [DEBUG] selectedItem.description:', selectedItem.description);
      console.log('🔍 [DEBUG] selectedItem.userEmail:', selectedItem.userEmail);

      // ✅ VERIFICAR: Se é uma dívida (ID começa com "debt-" ou "credit-")
      const isDebt = selectedItem.id.startsWith('debt-') || selectedItem.id.startsWith('credit-');
      const debtId = isDebt ? selectedItem.id.replace('debt-', '').replace('credit-', '') : null;

      console.log('🔍 [DEBUG] isDebt:', isDebt, 'debtId:', debtId);

      if (isDebt && debtId && selectedItem.type === 'DEBIT') {
        // ✅ CASO ESPECIAL: Pagar dívida via API de dívidas
        console.log('💳 [DEBUG] Pagando dívida via API:', debtId);
        
        const response = await fetch('/api/debts/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            debtId: debtId,
            accountId: selectedAccount,
            amount: selectedItem.amount,
            paymentDate: paymentDate,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao pagar dívida');
        }

        const result = await response.json();
        console.log('✅ [DEBUG] Dívida paga:', result);

        alert('✅ Dívida paga com sucesso!');
      } else {
        // ✅ FLUXO NORMAL: Transação compartilhada
        const transactionType = selectedItem.type === 'CREDIT' ? 'RECEITA' : 'DESPESA';
        const transactionDescription = selectedItem.type === 'CREDIT'
          ? `Recebimento - ${selectedItem.description} (${contact?.name || selectedItem.userEmail})`
          : `Pagamento - ${selectedItem.description} (para ${contact?.name || selectedItem.userEmail})`;
        
        const transactionData = {
          description: transactionDescription,
          amount: selectedItem.amount,
          type: transactionType,
          categoryId: selectedItem.category || 'outros',
          accountId: selectedAccount,
          date: paymentDate,
          tripId: selectedItem.tripId || null,
          notes: `${selectedItem.type === 'CREDIT' ? 'Recebimento' : 'Pagamento'} de despesa compartilhada${selectedItem.tripId ? ' da viagem' : ''}`,
          status: 'completed',
        };
        
        console.log('📤 Criando transação via API:', transactionData);
        
        // ✅ CORREÇÃO: Usar API diretamente
        const createResponse = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(transactionData),
        });
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.error || 'Erro ao criar transação');
        }
        
        const createdTransaction = await createResponse.json();
        const paymentTransactionId = createdTransaction.id;
        
        console.log('✅ Transação criada com sucesso, ID:', paymentTransactionId);

        // ✅ NOVO: Se é pagamento de fatura total, atualizar todas as transações/dívidas relacionadas
        const isPayAllBill = selectedItem.id.startsWith('consolidated-');
        
        console.log('🔍 [DEBUG] Verificando se é pagamento de fatura total:', {
          id: selectedItem.id,
          description: selectedItem.description,
          isPayAllBill,
          userEmail: selectedItem.userEmail
        });
        
        if (isPayAllBill) {
          console.log('💰 Pagamento de fatura total detectado, atualizando itens individuais...');
          console.log('🔍 selectedItem.userEmail:', selectedItem.userEmail);
          console.log('🔍 billingItems total:', billingItems.length);
          
          // Buscar todos os itens pendentes deste usuário
          const userPendingItems = billingItems.filter(
            item => item.userEmail === selectedItem.userEmail && !item.isPaid
          );
          
          console.log(`📋 Encontrados ${userPendingItems.length} itens pendentes para atualizar`);
          console.log('📋 Itens completos:', userPendingItems);
          
          // Atualizar cada item
          for (const item of userPendingItems) {
            try {
              console.log(`🔄 Processando item: ${item.id} - ${item.description}`);
              
              // Se é uma dívida (ID começa com "debt-" ou "credit-")
              if (item.id.startsWith('debt-') || item.id.startsWith('credit-')) {
                const debtId = item.id.replace('debt-', '').replace('credit-', '');
                console.log(`🔄 Atualizando dívida ${debtId}...`);
                console.log(`🔄 URL: /api/debts/${debtId}`);
                console.log(`🔄 Body:`, { 
                  status: 'paid', 
                  paidAt: new Date().toISOString(),
                  metadata: { paidByTransactionId: paymentTransactionId }
                });
                
                const response = await fetch(`/api/debts/${debtId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ 
                    status: 'paid',
                    paidAt: new Date().toISOString()
                  }),
                });
                
                console.log(`📡 Response status: ${response.status}`);
                
                if (response.ok) {
                  const result = await response.json();
                  console.log(`✅ Dívida ${debtId} marcada como paga:`, result);
                  alert(`✅ Dívida ${debtId} marcada como paga!`);
                } else {
                  const errorText = await response.text();
                  console.error(`❌ Erro ao atualizar dívida ${debtId}:`, response.status, errorText);
                  alert(`❌ ERRO ao atualizar dívida ${debtId}:\nStatus: ${response.status}\nErro: ${errorText}`);
                  // NÃO lançar erro, continuar com os outros itens
                }
              } 
              // Se é uma transação compartilhada
              else if (item.transactionId) {
                console.log(`🔄 Atualizando transação ${item.transactionId}...`);
                
                await fetch(`/api/transactions/${item.transactionId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ 
                    status: 'completed',
                    metadata: { paidByTransactionId: paymentTransactionId }
                  }),
                });
                
                console.log(`✅ Transação ${item.transactionId} marcada como completed`);
              }
            } catch (error) {
              console.warn(`⚠️ Erro ao atualizar item ${item.id}:`, error);
              // Continuar mesmo se um item falhar
            }
          }
          
          console.log('✅ Todos os itens da fatura foram atualizados');
          
          // ✅ ALERTA para confirmar que atualizou
          alert(`✅ Fatura paga com sucesso!\n\n${userPendingItems.length} itens foram marcados como pagos.`);
        }
        // Atualizar a transação original como paga (pagamento individual)
        else if (selectedItem.transactionId && !isDebt) {
          try {
            const updateResponse = await fetch(`/api/transactions/${selectedItem.transactionId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ status: 'completed' }), // ✅ CORREÇÃO: Usar 'completed' em vez de 'cleared'
            });
            
            if (updateResponse.ok) {
              console.log('✅ Transação original atualizada para completed');
            }
          } catch (error) {
            console.warn('⚠️ Erro ao atualizar transação original:', error);
          }
        }

        // ✅ NOVO: Verificar se a fatura foi totalmente paga
        if (isPayAllBill) {
          const contact = getContactByEmail(selectedItem.userEmail);
          alert(`✅ Fatura de ${contact?.name || selectedItem.userEmail} totalmente paga!\n\nTodos os itens foram marcados como pagos.`);
        } else {
          alert('✅ Pagamento registrado com sucesso!');
        }
      }

      setPaymentModalOpen(false);
      setSelectedItem(null);
      setSelectedAccount('');

      // Recarregar dados após um delay maior para garantir que todas as atualizações foram concluídas
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
      alert(`❌ Erro ao processar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Buscar dívidas para compensação
  const [userDebts, setUserDebts] = useState<Record<string, { owes: number; owed: number }>>({});

  useEffect(() => {
    const loadDebts = async () => {
      try {
        const response = await fetch('/api/debts', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          const debts = data.debts || [];
          
          console.log('💰 [Billing] Dívidas carregadas:', debts.length);
          
          // Mapear dívidas por pessoa
          const debtsByPerson: Record<string, { owes: number; owed: number }> = {};
          
          debts.forEach((debt: any) => {
            if (debt.status === 'active') {
              // Buscar contato
              const creditorContact = activeContacts.find(c => c.id === debt.creditorId);
              const debtorContact = activeContacts.find(c => c.id === debt.debtorId);
              
              // Se EU devo para alguém
              if (debtorContact) {
                const key = creditorContact?.email || creditorContact?.name || debt.creditorId;
                if (!debtsByPerson[key]) {
                  debtsByPerson[key] = { owes: 0, owed: 0 };
                }
                debtsByPerson[key].owes += Number(debt.currentAmount);
                console.log('🔴 [Billing] EU devo:', key, Number(debt.currentAmount));
              }
              
              // Se alguém me deve
              if (creditorContact) {
                const key = debtorContact?.email || debtorContact?.name || debt.debtorId;
                if (!debtsByPerson[key]) {
                  debtsByPerson[key] = { owes: 0, owed: 0 };
                }
                debtsByPerson[key].owed += Number(debt.currentAmount);
                console.log('🟢 [Billing] ME devem:', key, Number(debt.currentAmount));
              }
            }
          });
          
          console.log('💰 [Billing] Dívidas por pessoa:', debtsByPerson);
          setUserDebts(debtsByPerson);
        }
      } catch (error) {
        console.error('❌ [Billing] Erro ao carregar dívidas:', error);
      }
    };
    
    loadDebts();
  }, [activeContacts]);

  // Função para desmarcar item como pago
  const handleUnmarkAsPaid = async (item: BillingItem) => {
    // ⚠️ AVISO IMPORTANTE: Desmarcar um item deleta TODO o pagamento de fatura
    const confirmMessage = `⚠️ ATENÇÃO!\n\nAo desmarcar "${item.description}", TODO o pagamento de fatura será EXCLUÍDO da página de Transações.\n\nTODOS os itens desta fatura voltarão a ficar pendentes.\n\nVocê precisará refazer os pagamentos individuais se desejar.\n\nDeseja continuar?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      console.log('🔄 [Unmark] Desmarcando item e deletando pagamento de fatura:', item.id, item.description);
      
      // 1. Buscar a transação de pagamento de fatura (criada recentemente)
      const dateStart = new Date();
      dateStart.setHours(0, 0, 0, 0); // Início do dia
      
      const response = await fetch('/api/transactions', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        const transactions = data.transactions || [];
        
        // Buscar transação de pagamento de fatura (contém "fatura" na descrição)
        const paymentTransaction = transactions.find((tx: any) => 
          tx.description.toLowerCase().includes('fatura') &&
          tx.description.toLowerCase().includes('recebimento') &&
          new Date(tx.date) >= dateStart
        );
        
        if (paymentTransaction) {
          console.log('🗑️ [Unmark] Deletando transação de pagamento:', paymentTransaction.id);
          
          // Deletar a transação de pagamento
          const deleteResponse = await fetch(`/api/transactions/${paymentTransaction.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          
          if (deleteResponse.ok) {
            console.log('✅ [Unmark] Transação de pagamento deletada com sucesso');
            
            // ✅ CORREÇÃO: Atualizar status da transação original para pending
            if (item.transactionId && !item.id.startsWith('debt-') && !item.id.startsWith('credit-')) {
              console.log('🔄 [Unmark] Atualizando status da transação original para pending:', item.transactionId);
              await fetch(`/api/transactions/${item.transactionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: 'pending' }),
              });
            }
            
            // ✅ CORREÇÃO: Se for dívida, atualizar status para active
            if (item.id.startsWith('debt-') || item.id.startsWith('credit-')) {
              const debtId = item.id.replace('debt-', '').replace('credit-', '');
              console.log('🔄 [Unmark] Atualizando status da dívida para active:', debtId);
              await fetch(`/api/debts/${debtId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: 'active', paidAt: null }),
              });
            }
            
            alert(`✅ Pagamento de fatura excluído com sucesso!\n\nTodos os itens voltaram a ficar pendentes.\n\nVocê pode agora fazer pagamentos individuais.`);
            
            // Recarregar dados
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            throw new Error('Erro ao deletar transação de pagamento');
          }
        } else {
          // Se não encontrou transação de pagamento, apenas desmarcar o item
          console.warn('⚠️ [Unmark] Transação de pagamento não encontrada, desmarcando apenas o item');
          
          if (item.id.startsWith('debt-') || item.id.startsWith('credit-')) {
            const debtId = item.id.replace('debt-', '').replace('credit-', '');
            await fetch(`/api/debts/${debtId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ status: 'active', paidAt: null }),
            });
          } else if (item.transactionId) {
            await fetch(`/api/transactions/${item.transactionId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ status: 'pending' }),
            });
          }
          
          alert(`✅ Item desmarcado!\n\nNão foi encontrada uma transação de pagamento de fatura recente.`);
          setTimeout(() => window.location.reload(), 500);
        }
      }
    } catch (error) {
      console.error('❌ [Unmark] Erro ao desmarcar:', error);
      alert(`❌ Erro ao desmarcar item: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // Função para pagar/receber fatura completa
  const handlePayAllBill = (userEmail: string) => {
    // ✅ PROTEÇÃO 1: Evitar cliques duplos
    if (isProcessing) {
      console.warn('⚠️ [handlePayAllBill] Já há um pagamento em processamento');
      alert('⚠️ Aguarde! Já há um pagamento sendo processado.');
      return;
    }
    
    console.log('🎯 [handlePayAllBill] Iniciando pagamento de fatura para:', userEmail);
    
    const items = billingItems.filter(item => item.userEmail === userEmail);
    const pendingItems = items.filter(item => !item.isPaid);
    
    console.log('🎯 [handlePayAllBill] Items encontrados:', {
      total: items.length,
      pendentes: pendingItems.length,
      items: items.map(i => ({ id: i.id, description: i.description, isPaid: i.isPaid, type: i.type }))
    });
    
    // ✅ PROTEÇÃO 2: Verificar se há itens pendentes
    if (pendingItems.length === 0) {
      alert('⚠️ Esta fatura já está totalmente paga!\n\nNão há itens pendentes para pagar.\n\nSe deseja refazer o pagamento, primeiro desmarque os itens.');
      return;
    }
    
    // ✅ PROTEÇÃO 3: Verificar se todos os itens estão pagos (segurança extra)
    const allPaid = items.every(item => item.isPaid);
    if (allPaid) {
      alert('⚠️ Todos os itens desta fatura já estão pagos!\n\nPara refazer o pagamento, primeiro desmarque os itens.');
      return;
    }
    
    // Calcular valor líquido
    const totalCredits = pendingItems
      .filter(item => item.type === 'CREDIT')
      .reduce((sum, item) => sum + item.amount, 0);
    
    const totalDebits = pendingItems
      .filter(item => item.type === 'DEBIT')
      .reduce((sum, item) => sum + item.amount, 0);
    
    const netValue = totalCredits - totalDebits;
    const theyOweMe = netValue > 0;
    
    console.log('🎯 [handlePayAllBill] Cálculo:', {
      totalCredits,
      totalDebits,
      netValue,
      theyOweMe
    });
    
    const contact = getContactByEmail(userEmail);
    const contactName = contact?.name || userEmail;
    
    // Criar item consolidado para o modal
    const consolidatedItem: BillingItem = {
      id: `consolidated-${userEmail}`,
      transactionId: '',
      userEmail: userEmail,
      amount: Math.abs(netValue),
      description: `${theyOweMe ? 'Recebimento' : 'Pagamento'} de fatura - ${pendingItems.length} itens`,
      date: new Date().toISOString().substring(0, 10),
      category: 'Fatura',
      isPaid: false,
      type: theyOweMe ? 'CREDIT' : 'DEBIT',
    };
    
    console.log('🎯 [handlePayAllBill] Item consolidado criado:', consolidatedItem);
    
    setSelectedItem(consolidatedItem);
    setPaymentModalOpen(true);
  };

  const renderBillingContent = () => {
    const billingByUser = getBillingByUser();
    
    console.log('🔍 [DEBUG] billingByUser:', billingByUser);
    console.log('🔍 [DEBUG] Número de pessoas:', Object.keys(billingByUser).length);

    return (
      <div className="space-y-4">
        {Object.entries(billingByUser).map(([userEmail, items]) => {
          const contact = getContactByEmail(userEmail);
          
          console.log(`🔍 [DEBUG] Renderizando fatura para: ${userEmail}`, {
            contactName: contact?.name,
            totalItems: items.length,
            items: items.map(i => ({ id: i.id, type: i.type, amount: i.amount, description: i.description }))
          });
          
          // ✅ NOVA LÓGICA: Consolidar TUDO em uma única fatura (como cartão de crédito)
          const allItems = items; // Todos os itens (pagos e não pagos)
          const pendingItems = items.filter(item => !item.isPaid);
          
          console.log(`🔍 [renderBillingContent] ${contact?.name || userEmail}:`, {
            totalItems: allItems.length,
            pendingItems: pendingItems.length,
            items: allItems.map(i => ({ id: i.id, description: i.description, isPaid: i.isPaid, type: i.type }))
          });
          
          // Calcular valores
          const totalCredits = allItems
            .filter(item => item.type === 'CREDIT')
            .reduce((sum, item) => sum + item.amount, 0);
          
          const totalDebits = allItems
            .filter(item => item.type === 'DEBIT')
            .reduce((sum, item) => sum + item.amount, 0);
          
          // ✅ NOVA LÓGICA: Valor líquido simples (como cartão de crédito)
          const netAmount = totalCredits - totalDebits;
          const netValue = Math.abs(netAmount);
          const theyOweMe = netAmount > 0; // Se positivo, pessoa me deve
          
          // Se não há itens, não mostrar fatura
          if (allItems.length === 0) return null;
          
          const tripInfo = items[0]?.tripId ? getTripInfo(items[0].tripId) : null;

          return (
            <Card key={userEmail} className="overflow-hidden">
              <CardHeader className={`${
                theyOweMe
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950' 
                  : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      theyOweMe ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {(contact?.name || userEmail).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg uppercase">
                        FATURA DE {contact?.name || userEmail}
                      </CardTitle>
                      <p className={`text-lg font-bold ${
                        theyOweMe ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                      }`}>
                        Valor Líquido: R$ {netValue.toFixed(2)} {theyOweMe ? 'a receber' : 'a pagar'}
                      </p>
                    </div>
                  </div>
                </div>

                {mode === 'trip' && tripInfo && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Plane className="w-4 h-4" />
                    <span className="font-medium">{tripInfo.name}</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-6">
                {/* ✅ AVISO: Fatura totalmente paga */}
                {pendingItems.length === 0 && allItems.length > 0 && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div className="flex-1">
                        <p className="font-bold text-green-800 dark:text-green-200">
                          ✅ Fatura Totalmente Paga
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Todos os itens desta fatura foram pagos. Para refazer o pagamento, primeiro desmarque os itens abaixo.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ✅ BOTÃO: Pagar/Receber fatura (só aparece se houver itens pendentes) */}
                {pendingItems.length > 0 && (
                  <div className="mb-6">
                    <Button
                      onClick={() => handlePayAllBill(userEmail)}
                      disabled={isProcessing}
                      className={`w-full ${theyOweMe ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                      size="lg"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {isProcessing ? 'Processando...' : `${theyOweMe ? 'Receber Fatura' : 'Pagar Fatura'} - R$ ${netValue.toFixed(2)}`}
                    </Button>
                  </div>
                )}
                
                {/* ✅ NOVO: Lista simplificada de itens */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-foreground flex items-center justify-between">
                    Itens da Fatura ({allItems.length})
                    {items.some(item => item.isPaid) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!confirm('Desmarcar TODOS os pagamentos desta fatura?')) return;

                          for (const item of items.filter(i => i.isPaid)) {
                            await handleUnmarkAsPaid(item);
                          }
                        }}
                      >
                        Desmarcar Todos
                      </Button>
                    )}
                  </h4>

                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        item.isPaid
                          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                          : item.type === 'CREDIT'
                            ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                            : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {item.type === 'CREDIT' ? '+ ' : '- '}
                          {item.description}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.category} • {new Date(item.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className={`font-bold ${
                            item.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.type === 'CREDIT' ? '+' : '-'}R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <Badge
                            variant={item.isPaid ? 'default' : 'secondary'}
                            className={
                              item.isPaid
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            }
                          >
                            {item.isPaid ? 'Pago' : 'Pendente'}
                          </Badge>
                        </div>
                        {!item.isPaid ? (
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsPaid(item)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Marcar como Pago
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnmarkAsPaid(item)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Desmarcar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {Object.keys(billingByUser).length === 0 && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 font-medium">
                  Nenhuma despesa {mode === 'trip' ? 'de viagem' : 'regular'} encontrada
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {mode === 'regular'
                    ? 'Adicione despesas compartilhadas regulares para ver as faturas aqui'
                    : 'Adicione despesas compartilhadas em viagens para ver as faturas aqui'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com botão de exportar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mode === 'trip' ? (
            <>
              <Plane className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Faturas de Viagem</h3>
            </>
          ) : (
            <>
              <Receipt className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Faturas Regulares</h3>
            </>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleExportBilling}>
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Card de Simplificação de Dívidas */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                💡 Simplificação Automática de Dívidas
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Os valores mostrados já estão compensados automaticamente. Se você deve R$ 5 para alguém que te deve R$ 50, mostramos apenas R$ 45 a receber.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Faturas por Pessoa */}
      {renderBillingContent()}

      {/* Modal de Pagamento */}
      {paymentModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Registrar Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {selectedItem.type === 'CREDIT' ? 'Valor a receber:' : 'Valor a pagar:'}
                </p>
                <p className={`text-2xl font-bold ${selectedItem.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedItem.type === 'CREDIT' ? '+' : '-'}R$ {selectedItem.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedItem.type === 'CREDIT' 
                    ? `De: ${getContactByEmail(selectedItem.userEmail)?.name || selectedItem.userEmail}`
                    : `Para: ${getContactByEmail(selectedItem.userEmail)?.name || selectedItem.userEmail}`
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {selectedItem.type === 'CREDIT' ? 'Conta de Destino *' : 'Conta para Débito *'}
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                  required
                >
                  <option value="">Selecione uma conta...</option>
                  {availableAccounts
                    .filter(acc => 
                      acc.isActive !== false && 
                      !acc.deletedAt && 
                      ['ATIVO', 'PASSIVO', 'checking', 'savings', 'investment'].includes(acc.type)
                    )
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </option>
                    ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedItem.type === 'CREDIT' 
                    ? 'O dinheiro será creditado nesta conta'
                    : 'O dinheiro será debitado desta conta'
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Data do Pagamento *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                  required
                />
              </div>

              <div className={`p-3 rounded-md border ${
                selectedItem.type === 'CREDIT'
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
              }`}>
                <p className={`text-sm ${
                  selectedItem.type === 'CREDIT'
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  ℹ️ Será criada uma transação de <strong>{selectedItem.type === 'CREDIT' ? 'RECEITA' : 'DESPESA'}</strong> na conta selecionada
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPaymentModalOpen(false);
                    setSelectedItem(null);
                  }}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmPayment}
                  disabled={isProcessing || !selectedAccount}
                  className={`flex-1 ${
                    selectedItem.type === 'CREDIT'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isProcessing ? 'Processando...' : selectedItem.type === 'CREDIT' ? 'Confirmar Recebimento' : 'Confirmar Pagamento'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
});
