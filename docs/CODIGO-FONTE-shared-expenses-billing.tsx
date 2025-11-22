'use client';

import { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';
import { usePeriod } from '@/contexts/period-context';
import { toast } from 'sonner';
import {
  Receipt,
  CheckCircle,
  Download,
  Plane,
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
  const [transactions, setTransactions] = useState<any[]>([]); // ✅ NOVO: Armazenar transações
  const [categories, setCategories] = useState<any[]>([]); // ✅ NOVO: Armazenar categorias

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
        const transactionsData = transactionsResult.transactions || [];
        
        // ✅ NOVO: Salvar transações e categorias no estado
        setTransactions(transactionsData);
        if (transactionsResult.categories) {
          setCategories(transactionsResult.categories);
        }

        console.log(`📊 [${mode}] Total de transações: ${transactionsData.length}`);

        // 2. Buscar dívidas (pago por outra pessoa) - incluir pagas e ativas
        const timestamp = new Date().getTime();
        const debtsResponse = await fetch(`/api/debts?status=all&_t=${timestamp}`, {
          credentials: 'include',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        let debts: any[] = [];
        if (debtsResponse.ok) {
          const debtsResult = await debtsResponse.json();
          debts = debtsResult.debts || [];
          console.log(`💰 [${mode}] Total de dívidas retornadas pela API: ${debts.length}`);
          console.log(`💰 [${mode}] Dívidas:`, debts.map(d => ({
            id: d.id,
            description: d.description,
            status: d.status,
            amount: d.currentAmount,
            creditorId: d.creditorId,
            debtorId: d.debtorId,
            tripId: d.tripId
          })));
        } else {
          console.error(`❌ [${mode}] Erro ao buscar dívidas:`, debtsResponse.status);
        }

        // ✅ NOVO: Obter período atual para filtrar transações
        const { startDate, endDate } = getPeriodDates();
        const periodStart = new Date(startDate);
        const periodEnd = new Date(endDate);

        // Filtrar transações compartilhadas (EU paguei)
        const sharedTransactions = transactionsData.filter((t: any) => {
          // Verificar se tem sharedWith
          const hasSharedWith = t.sharedWith &&
            (Array.isArray(t.sharedWith) ? t.sharedWith.length > 0 :
              typeof t.sharedWith === 'string' && t.sharedWith.length > 0);

          if (!hasSharedWith) {
            return false;
          }

          // ✅ NOVO: Filtrar por período (apenas transações do mês atual)
          const transactionDate = new Date(t.date);
          if (transactionDate < periodStart || transactionDate > periodEnd) {
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
        // ✅ CORREÇÃO: Incluir dívidas ativas E pagas (para histórico completo)
        console.log(`🔍 [${mode}] Processando ${debts.length} dívidas...`);
        debts.forEach((debt: any) => {
          console.log(`🔍 [${mode}] Processando dívida ${debt.id}:`, {
            description: debt.description,
            status: debt.status,
            amount: debt.currentAmount,
            tripId: debt.tripId,
            creditorId: debt.creditorId,
            debtorId: debt.debtorId
          });
          
          // ✅ CORREÇÃO: Incluir dívidas ativas E pagas (para histórico)
          if (debt.status === 'cancelled') {
            console.log(`⏭️ [${mode}] Pulando dívida ${debt.id} - status: ${debt.status}`);
            return;
          }
          
          if (debt.status === 'paid') {
            console.log(`✅ [${mode}] Dívida PAGA encontrada: ${debt.id} - ${debt.description}`);
          }

          // ✅ CORREÇÃO COMPLEXA: Lógica de quando incluir dívidas com transactionId
          // 
          // CENÁRIOS:
          // 1. Dívida ATIVA com transactionId → Verificar se a transação existe nas compartilhadas
          //    - Se existe: PULAR (evita duplicação)
          //    - Se não existe: INCLUIR (dívida válida, transação foi deletada ou é de outro contexto)
          // 
          // 2. Dívida PAGA com transactionId → SEMPRE INCLUIR (histórico de pagamento)
          
          if (debt.transactionId) {
            if (debt.status === 'paid') {
              // Dívida paga: sempre incluir para histórico
              console.log(`✅ [${mode}] Dívida PAGA com transação vinculada - INCLUINDO: ${debt.id}`);
            } else {
              // Dívida ativa: verificar se a transação existe
              const transactionExists = transactionsData.some((t: any) => t.id === debt.transactionId);
              
              if (transactionExists) {
                // Transação existe: pular para evitar duplicação
                console.log(`⏭️ [${mode}] Pulando dívida ${debt.id} - transação ${debt.transactionId} existe nas compartilhadas`);
                return;
              } else {
                // Transação não existe: incluir dívida
                console.log(`✅ [${mode}] Dívida ATIVA com transação vinculada mas transação não existe - INCLUINDO: ${debt.id}`);
              }
            }
          }
          
          // ✅ CORREÇÃO: Não mostrar dívidas com valor zero (já foram totalmente quitadas)
          if (Number(debt.currentAmount) === 0) {
            console.log(`⏭️ [${mode}] Pulando dívida ${debt.id} - valor zero (totalmente quitada)`);
            return;
          }

          // ✅ CORREÇÃO CRÍTICA: Filtrar dívidas por modo (trip vs regular)
          // Dívidas de viagem têm tripId, dívidas regulares não têm
          if (mode === 'trip' && !debt.tripId) {
            console.log(`⏭️ [${mode}] Pulando dívida ${debt.id} - não é de viagem`);
            return;
          }
          if (mode === 'regular' && debt.tripId) {
            console.log(`⏭️ [${mode}] Pulando dívida ${debt.id} - é de viagem`);
            return;
          }

          // ✅ CORREÇÃO CRÍTICA: Usar o userId das transações para identificar o usuário logado
          // Pegar o userId da primeira transação (todas têm o mesmo userId do usuário logado)
          const loggedUserId = transactionsData.length > 0 ? transactionsData[0].userId : null;
          
          if (!loggedUserId) {
            console.log(`⏭️ [${mode}] Pulando dívida ${debt.id} - não foi possível identificar o usuário logado`);
            return;
          }
          
          // Verificar se EU sou o devedor ou o credor
          const isIAmDebtor = debt.debtorId === loggedUserId;
          const isIAmCreditor = debt.creditorId === loggedUserId;
          
          console.log(`🔍 [${mode}] Verificando dívida ${debt.id}:`, {
            loggedUserId,
            debtorId: debt.debtorId,
            creditorId: debt.creditorId,
            isIAmDebtor,
            isIAmCreditor,
            amount: debt.currentAmount,
            status: debt.status
          });
          
          if (isIAmDebtor) {
            // ✅ CORREÇÃO CRÍTICA: EU DEVO para o credor
            // O item deve aparecer na fatura do CREDOR (quem vai receber de mim)
            // userEmail = creditorId (para agrupar na fatura dele)
            const creditor = activeContacts.find((c: any) => c.id === debt.creditorId);
            if (creditor) {
              const creditorId = creditor.id || debt.creditorId;
              const creditorName = creditor.name || creditor.email || creditorId;

              console.log(`🔴 [${mode}] Dívida: EU devo R$ ${debt.currentAmount} para ${creditorName} - Status: ${debt.status} - ID: ${debt.id} - isPaid: ${debt.status === 'paid'}`);

              allItems.push({
                id: `debt-${debt.id}`,
                transactionId: debt.id,
                userEmail: creditorId, // ✅ Agrupar na fatura do credor
                amount: Number(debt.currentAmount),
                description: debt.description,
                date: debt.createdAt,
                category: 'Dívida',
                isPaid: debt.status === 'paid',
                dueDate: createSafeDueDate(debt.createdAt),
                type: 'DEBIT', // ✅ EU DEVO (débito para mim)
                paidBy: creditorId,
              });
            }
          } else if (isIAmCreditor) {
            // Alguém ME DEVE
            const debtor = activeContacts.find((c: any) => c.id === debt.debtorId);
            if (debtor) {
              const debtorId = debtor.id || debt.debtorId;
              const debtorName = debtor.name || debtor.email || debtorId;

              console.log(`🟢 [${mode}] Crédito: ${debtorName} me deve R$ ${debt.currentAmount} - Status: ${debt.status} - ID: ${debt.id}`);

              allItems.push({
                id: `credit-${debt.id}`,
                transactionId: debt.id,
                userEmail: debtorId,
                amount: Number(debt.currentAmount),
                description: debt.description,
                date: debt.createdAt,
                category: 'Crédito',
                isPaid: debt.status === 'paid', // ✅ CORREÇÃO: Créditos pagos também ficam marcados
                dueDate: createSafeDueDate(debt.createdAt),
                type: 'CREDIT',
                paidBy: debtorId,
              });
            }
          } else {
            console.log(`⏭️ [${mode}] Pulando dívida ${debt.id} - não envolve o usuário logado (${loggedUserId})`);
          }
        });

        // ✅ NOVO: Buscar transações de pagamento de fatura para determinar quais itens estão realmente pagos
        try {
          // ✅ CORREÇÃO: Buscar TODOS os pagamentos diretamente (sem filtro de período)
          const timestamp = new Date().getTime();
          const paymentResponse = await fetch(`/api/transactions?_t=${timestamp}`, {
            credentials: 'include',
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });

          if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json();
            // ✅ CORREÇÃO: Filtrar apenas transações de pagamento/recebimento
            const allTransactions = Array.isArray(paymentData) ? paymentData : (paymentData.transactions || []);
            const paymentTransactions = allTransactions.filter((tx: any) =>
              (tx.description?.includes('Recebimento -') || tx.description?.includes('Pagamento -')) &&
              tx.metadata
            );

            // Criar mapa de transações pagas (que têm pagamento de fatura vinculado)
            const paidTransactionsMap = new Map<string, boolean>();

            console.log(`💳 [${mode}] Total de transações de pagamento encontradas: ${paymentTransactions.length}`);

            paymentTransactions.forEach((tx: any) => {
                // Extrair billingItemId do metadata
                try {
                  const metadata = tx.metadata ? JSON.parse(tx.metadata) : {};
                  if (metadata.type === 'shared_expense_payment' && metadata.billingItemId) {
                    paidTransactionsMap.set(metadata.billingItemId, true);
                    console.log(`💳 [${mode}] Pagamento encontrado para: ${metadata.billingItemId}`);
                  }
                } catch (e) {
                  // Ignorar erros de parse
                }
              });

            console.log(`💳 [${mode}] Transações pagas encontradas:`, paidTransactionsMap.size);
            console.log(`💳 [${mode}] IDs de itens pagos:`, Array.from(paidTransactionsMap.keys()));

            // ✅ CORREÇÃO: Atualizar isPaid APENAS para transações compartilhadas (não dívidas)
            // Dívidas já têm isPaid correto baseado no status da API
            allItems.forEach(item => {
              const isDebt = item.id.startsWith('debt-') || item.id.startsWith('credit-');
              
              if (isDebt) {
                // ✅ DÍVIDAS: Manter isPaid original (vem do status da API)
                console.log(`💰 [${mode}] Dívida ${item.id} (${item.description}) - isPaid: ${item.isPaid} (mantido do status da API)`);
              } else {
                // ✅ TRANSAÇÕES COMPARTILHADAS: Atualizar baseado no mapa de pagamentos
                const wasPaid = item.isPaid;
                if (paidTransactionsMap.has(item.id)) {
                  item.isPaid = true;
                  console.log(`✅ [${mode}] Transação ${item.id} (${item.description}) marcada como paga`);
                } else if (wasPaid) {
                  console.log(`⚠️ [${mode}] Transação ${item.id} (${item.description}) estava marcada como paga mas não tem transação vinculada - mantendo como não paga`);
                  item.isPaid = false;
                }
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
        
        // ✅ CORREÇÃO: Dívidas pagas sempre aparecem (histórico completo)
        const isPaidDebt = item.isPaid && (item.id.startsWith('debt-') || item.id.startsWith('credit-'));
        
        // Incluir se: (está no período E não é viagem) OU (é dívida paga)
        return (isInPeriod && isNotTrip) || isPaidDebt;
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

                                    
      // ✅ VERIFICAR: Se é uma dívida (ID começa com "debt-" ou "credit-")
      const isDebt = selectedItem.id.startsWith('debt-') || selectedItem.id.startsWith('credit-');
      const debtId = isDebt ? selectedItem.id.replace('debt-', '').replace('credit-', '') : null;

      
      if (isDebt && debtId && selectedItem.type === 'DEBIT') {
        // ✅ CASO ESPECIAL: Pagar dívida via API de dívidas
        
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

        await response.json();
        
        alert('✅ Dívida paga com sucesso!');
      } else {
        // ✅ NOVO: Verificar se é pagamento de fatura total (consolidado)
        const isPayAllBill = selectedItem.id.startsWith('consolidated-');

        console.log('🔍 [DEBUG] Verificando tipo de pagamento:', {
          id: selectedItem.id,
          description: selectedItem.description,
          isPayAllBill,
          userEmail: selectedItem.userEmail
        });

        if (isPayAllBill) {
          // ✅ CORREÇÃO: CRIAR LANÇAMENTOS INDIVIDUAIS (não consolidado)
          // Buscar todos os itens pendentes deste usuário
          const userPendingItems = billingItems.filter(
            item => item.userEmail === selectedItem.userEmail && !item.isPaid
          );

          console.log(`📋 [confirmPayment] Encontrados ${userPendingItems.length} itens pendentes para criar lançamentos individuais`);
          console.log(`📋 [confirmPayment] Itens:`, userPendingItems.map(i => ({
            id: i.id,
            description: i.description,
            amount: i.amount,
            type: i.type
          })));

          const createdTransactions: string[] = [];
          const errors: string[] = [];
          
          // ✅ CRIAR UMA TRANSAÇÃO PARA CADA ITEM DA FATURA
          for (const item of userPendingItems) {
            try {
              console.log(`💰 [confirmPayment] Criando lançamento individual:`, {
                description: item.description,
                amount: item.amount,
                type: item.type,
                id: item.id
              });

              const transactionType = item.type === 'CREDIT' ? 'RECEITA' : 'DESPESA';
              const contactName = contact?.name || selectedItem.userEmail || 'Desconhecido';
              const transactionDescription = item.type === 'CREDIT'
                ? `💰 Recebimento - ${item.description} (${contactName})`.substring(0, 500) // ✅ Limitar a 500 caracteres
                : `💸 Pagamento - ${item.description} (para ${contactName})`.substring(0, 500);

              // ✅ CORREÇÃO: Buscar categoryId da transação original
              let categoryId = null;
              
              console.log(`🔍 [confirmPayment] Buscando categoria para item:`, {
                transactionId: item.transactionId,
                category: item.category,
                totalTransactions: transactions.length,
                totalCategories: categories.length
              });
              
              // Se tem transactionId, buscar a categoria da transação original
              if (item.transactionId) {
                const originalTransaction = transactions.find((t: any) => t.id === item.transactionId);
                console.log(`🔍 [confirmPayment] Transação original encontrada:`, originalTransaction ? {
                  id: originalTransaction.id,
                  categoryId: originalTransaction.categoryId,
                  category: originalTransaction.category
                } : 'NÃO ENCONTRADA');
                
                if (originalTransaction?.categoryId) {
                  categoryId = originalTransaction.categoryId;
                  console.log(`✅ [confirmPayment] Categoria encontrada: ${categoryId} (${originalTransaction.category})`);
                } else {
                  console.warn(`⚠️ [confirmPayment] Transação original sem categoryId`);
                }
              } else {
                console.warn(`⚠️ [confirmPayment] Item sem transactionId`);
              }
              
              // Se não encontrou e não é dívida, tentar usar uma categoria padrão
              if (!categoryId && item.category && item.category !== 'Compartilhado' && item.category !== 'Dívida') {
                console.log(`🔍 [confirmPayment] Tentando buscar categoria por nome: ${item.category}`);
                // Buscar categoria por nome (fallback)
                const categoryByName = categories?.find((c: any) => c.name === item.category);
                if (categoryByName) {
                  categoryId = categoryByName.id;
                  console.log(`✅ [confirmPayment] Categoria encontrada por nome: ${categoryId} (${item.category})`);
                } else {
                  console.warn(`⚠️ [confirmPayment] Categoria não encontrada por nome: ${item.category}`);
                }
              }
              
              if (!categoryId) {
                console.warn(`⚠️ [confirmPayment] Nenhuma categoria encontrada - transação será criada sem categoria`);
              }

              // ✅ CORREÇÃO: Montar objeto sem campos undefined
              const transactionData: any = {
                description: transactionDescription,
                amount: Number(item.amount), // ✅ GARANTIR que é número
                type: transactionType,
                accountId: selectedAccount,
                date: paymentDate, // ✅ CORREÇÃO: Enviar apenas a data (YYYY-MM-DD)
                status: 'cleared',
                metadata: JSON.stringify({
                  type: 'shared_expense_payment',
                  originalTransactionId: item.transactionId,
                  billingItemId: item.id,
                  paidBy: contact?.name || selectedItem.userEmail,
                  notes: `${item.type === 'CREDIT' ? 'Recebimento' : 'Pagamento'} de despesa compartilhada${item.tripId ? ' da viagem' : ''}`,
                }),
              };

              // Adicionar campos opcionais apenas se tiverem valor
              if (categoryId) transactionData.categoryId = categoryId;
              if (item.tripId) transactionData.tripId = item.tripId;
              
              // ✅ DEBUG: Validar dados antes de enviar
              console.log(`🔍 [confirmPayment] Validando dados:`, {
                description: typeof transactionData.description,
                amount: typeof transactionData.amount,
                type: transactionData.type,
                accountId: typeof transactionData.accountId,
                date: typeof transactionData.date,
                status: transactionData.status,
                categoryId: transactionData.categoryId,
                tripId: transactionData.tripId,
              });

              console.log(`📤 [confirmPayment] Enviando transação:`, transactionData);

              // Criar transação individual
              const createResponse = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(transactionData),
              });

              if (!createResponse.ok) {
                const errorData = await createResponse.json();
                const errorMsg = errorData.error || `Erro ao criar transação para ${item.description}`;
                console.error(`❌ [confirmPayment] Erro na API:`, errorMsg, errorData);
                console.error(`❌ [confirmPayment] Dados enviados:`, transactionData);
                errors.push(`${item.description}: ${errorMsg}${errorData.details ? ' - ' + errorData.details.join(', ') : ''}`);
                throw new Error(errorMsg);
              }

              const createdTransaction = await createResponse.json();
              createdTransactions.push(createdTransaction.id);
              console.log(`✅ [confirmPayment] Transação criada com sucesso:`, {
                id: createdTransaction.id,
                description: item.description,
                amount: item.amount,
                type: item.type
              });

              // ✅ CORREÇÃO: Marcar item como pago
              // Verificar se é dívida pelo billingItemId no metadata
              const metadata = JSON.parse(transactionData.metadata);
              const billingItemId = metadata.billingItemId;
              
              if (billingItemId?.startsWith('debt-')) {
                // É uma dívida
                const debtId = billingItemId.replace('debt-', '');
                console.log(`🔄 [confirmPayment] Marcando dívida ${debtId} como paga...`);
                
                const debtResponse = await fetch(`/api/debts/${debtId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    status: 'paid',
                    paidAt: new Date().toISOString(),
                  }),
                });
                
                if (debtResponse.ok) {
                  console.log(`✅ [confirmPayment] Dívida ${debtId} marcada como paga`);
                } else {
                  console.error(`❌ [confirmPayment] Erro ao marcar dívida como paga:`, await debtResponse.text());
                }
              } else if (item.transactionId) {
                // É uma transação compartilhada
                console.log(`🔄 [confirmPayment] Marcando transação ${item.transactionId} como paga...`);
                
                // Não precisamos atualizar a transação original, apenas criar o registro de pagamento
                // A transação original continua existindo e o pagamento é registrado separadamente
                console.log(`✅ [confirmPayment] Pagamento registrado para transação ${item.transactionId}`);
              }
            } catch (error) {
              console.error(`❌ [confirmPayment] Erro ao processar item ${item.id}:`, error);
              errors.push(`${item.description}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
              // Continuar com os outros itens mesmo se um falhar
            }
          }

          console.log(`📊 [confirmPayment] Resumo:`, {
            total: userPendingItems.length,
            sucesso: createdTransactions.length,
            erros: errors.length
          });

          if (errors.length > 0) {
            alert(`⚠️ Fatura processada com avisos:\n\n✅ ${createdTransactions.length} lançamentos criados\n❌ ${errors.length} erros:\n\n${errors.join('\n')}`);
          } else {
            alert(`✅ Fatura paga com sucesso!\n\n${createdTransactions.length} lançamentos individuais criados.\n\nCada despesa aparecerá separadamente nas transações com sua categoria correta.`);
          }
        } else {
          // ✅ PAGAMENTO INDIVIDUAL (não é fatura consolidada)
          const transactionType = selectedItem.type === 'CREDIT' ? 'RECEITA' : 'DESPESA';
          const transactionDescription = selectedItem.type === 'CREDIT'
            ? `💰 Recebimento - ${selectedItem.description} (${contact?.name || selectedItem.userEmail})`
            : `💸 Pagamento - ${selectedItem.description} (para ${contact?.name || selectedItem.userEmail})`;

          // ✅ CORREÇÃO: Buscar categoryId da transação original
          let categoryId = null;
          if (selectedItem.transactionId) {
            const originalTransaction = transactions.find((t: any) => t.id === selectedItem.transactionId);
            if (originalTransaction?.categoryId) {
              categoryId = originalTransaction.categoryId;
            }
          }

          const transactionData: any = {
            description: transactionDescription,
            amount: selectedItem.amount,
            type: transactionType,
            accountId: selectedAccount,
            date: new Date(paymentDate + 'T12:00:00.000Z').toISOString(), // ✅ CORREÇÃO: Converter para ISO completo
            notes: `${selectedItem.type === 'CREDIT' ? 'Recebimento' : 'Pagamento'} de despesa compartilhada${selectedItem.tripId ? ' da viagem' : ''}`,
            status: 'cleared', // ✅ CORREÇÃO: 'cleared' em vez de 'completed'
            metadata: JSON.stringify({
              type: 'shared_expense_payment',
              originalTransactionId: selectedItem.transactionId,
              billingItemId: selectedItem.id,
              paidBy: contact?.name || selectedItem.userEmail,
            }),
          };

          // ✅ Adicionar campos opcionais apenas se tiverem valor
          if (categoryId) transactionData.categoryId = categoryId;
          if (selectedItem.tripId) transactionData.tripId = selectedItem.tripId;

          // Criar transação
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

          // Atualizar a transação original como paga
          if (selectedItem.transactionId && !isDebt) {
            try {
              await fetch(`/api/transactions/${selectedItem.transactionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  status: 'completed',
                  metadata: JSON.stringify({ paidByTransactionId: createdTransaction.id }),
                }),
              });
            } catch (error) {
              console.warn('⚠️ Erro ao atualizar transação original:', error);
            }
          }

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
  const [, setUserDebts] = useState<Record<string, { owes: number; owed: number }>>({});

  useEffect(() => {
    const loadDebts = async () => {
      try {
        const response = await fetch('/api/debts', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const debts = data.debts || [];

          
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

                    setUserDebts(debtsByPerson);
        }
      } catch (error) {
        console.error('❌ [Billing] Erro ao carregar dívidas:', error);
      }
    };

    loadDebts();
  }, [activeContacts]);

  // ✅ FUNÇÃO CORRIGIDA: Desmarcar item como pago com efeito cascata completo
  const handleUnmarkAsPaid = async (item: BillingItem) => {
    const confirmMessage = `⚠️ ATENÇÃO!\n\nAo desmarcar "${item.description}", o sistema irá:\n\n1. Excluir TODAS as transações de pagamento relacionadas\n2. Voltar TODOS os itens desta fatura para pendente\n3. Restaurar os saldos das contas\n\nDeseja continuar?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      toast.loading('Desmarcando pagamento...');
      
      // ✅ PASSO 1: Buscar TODAS as transações relacionadas a esta fatura
      const response = await fetch('/api/transactions', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar transações');
      }

      const data = await response.json();
      const allTransactions = data.transactions || [];

      // ✅ PASSO 2: Encontrar transações de pagamento de fatura
      // Buscar por: "Recebimento - Fatura" ou "Pagamento - Fatura" ou metadata com tipo de pagamento
      const paymentTransactions = allTransactions.filter((tx: any) => {
        const desc = tx.description?.toLowerCase() || '';
        const hasPaymentKeyword = desc.includes('recebimento') || desc.includes('pagamento');
        const hasFaturaKeyword = desc.includes('fatura');
        const hasMetadata = tx.metadata && (
          tx.metadata.includes('billing') || 
          tx.metadata.includes('fatura') ||
          tx.metadata.includes('shared_expense_payment')
        );
        
        return (hasPaymentKeyword && hasFaturaKeyword) || hasMetadata;
      });

      console.log('🔍 [Unmark] Transações de pagamento encontradas:', paymentTransactions.length);

      // ✅ PASSO 3: Deletar TODAS as transações de pagamento
      const deletePromises = paymentTransactions.map((tx: any) => 
        fetch(`/api/transactions/${tx.id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
      );

      await Promise.all(deletePromises);
      console.log('✅ [Unmark] Transações de pagamento deletadas:', paymentTransactions.length);

      // ✅ PASSO 4: Buscar TODOS os itens da mesma fatura (mesmo userEmail)
      const sameUserItems = billingItems.filter(i => i.userEmail === item.userEmail);
      
      // ✅ PASSO 5: Voltar TODOS os itens para pendente
      const updatePromises = sameUserItems.map(async (billingItem) => {
        if (billingItem.id.startsWith('debt-') || billingItem.id.startsWith('credit-')) {
          // É uma dívida
          const debtId = billingItem.id.replace('debt-', '').replace('credit-', '');
          return fetch(`/api/debts/${debtId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
              status: 'active', 
              paidAt: null 
            }),
          });
        } else if (billingItem.transactionId) {
          // É uma transação
          return fetch(`/api/transactions/${billingItem.transactionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
              status: 'pending' 
            }),
          });
        }
        
        return Promise.resolve();
      });

      await Promise.all(updatePromises.filter(Boolean));
      console.log('✅ [Unmark] Itens voltaram para pendente:', sameUserItems.length);

      toast.dismiss();
      toast.success('Pagamento desmarcado com sucesso!');
      
      // ✅ PASSO 6: Forçar refresh completo
      await actions.forceRefresh();
      
      // Recarregar página após 500ms
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error) {
      console.error('❌ [Unmark] Erro ao desmarcar:', error);
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : 'Erro ao desmarcar pagamento');
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

    
    const items = billingItems.filter(item => item.userEmail === userEmail);
    const pendingItems = items.filter(item => !item.isPaid);

    console.log('🎯 [handlePayAllBill] Items encontrados:', {
      total: items.length,
      pendentes: pendingItems.length,
      items: items.map(i => ({ 
        id: i.id, 
        description: i.description, 
        isPaid: i.isPaid, 
        type: i.type,
        amount: i.amount 
      }))
    });

    console.log('🔍 [handlePayAllBill] TODOS OS ITENS (incluindo pagos):', {
      items: items.map(i => ({
        description: i.description,
        amount: i.amount,
        type: i.type,
        isPaid: i.isPaid,
        transactionId: i.transactionId
      }))
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

    const creditsArray = pendingItems.filter(i => i.type === 'CREDIT');
    const debitsArray = pendingItems.filter(i => i.type === 'DEBIT');

    console.log('🎯 [handlePayAllBill] Cálculo DETALHADO:', {
      totalItems: items.length,
      pendingItems: pendingItems.length,
      allItems: items.map(i => ({ 
        id: i.id,
        desc: i.description, 
        amount: i.amount, 
        type: i.type,
        isPaid: i.isPaid 
      })),
      creditsCount: creditsArray.length,
      credits: creditsArray.map(i => ({ 
        id: i.id,
        desc: i.description, 
        amount: i.amount, 
        isPaid: i.isPaid 
      })),
      debitsCount: debitsArray.length,
      debits: debitsArray.map(i => ({ 
        id: i.id,
        desc: i.description, 
        amount: i.amount, 
        isPaid: i.isPaid 
      })),
      totalCredits,
      totalDebits,
      netValue,
      theyOweMe,
      userEmail
    });

    console.log('💰 [handlePayAllBill] SOMA DOS CRÉDITOS:');
    creditsArray.forEach(c => {
      console.log(`   + R$ ${c.amount.toFixed(2)} (${c.description})`);
    });
    console.log(`   = R$ ${totalCredits.toFixed(2)}`);

    console.log('💰 [handlePayAllBill] SOMA DOS DÉBITOS:');
    debitsArray.forEach(d => {
      console.log(`   - R$ ${d.amount.toFixed(2)} (${d.description})`);
    });
    console.log(`   = R$ ${totalDebits.toFixed(2)}`);

    console.log(`💰 [handlePayAllBill] VALOR LÍQUIDO: R$ ${totalCredits.toFixed(2)} - R$ ${totalDebits.toFixed(2)} = R$ ${netValue.toFixed(2)}`);

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

    
    setSelectedItem(consolidatedItem);
    setPaymentModalOpen(true);
  };

  const renderBillingContent = () => {
    const billingByUser = getBillingByUser();

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

          // ✅ CORREÇÃO: Calcular valores apenas dos itens PENDENTES (não pagos)
          const totalCredits = pendingItems
            .filter(item => item.type === 'CREDIT')
            .reduce((sum, item) => sum + item.amount, 0);

          const totalDebits = pendingItems
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
                netValue === 0
                  ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950'
                  : theyOweMe
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950'
                    : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      netValue === 0 ? 'bg-blue-600' : theyOweMe ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {(contact?.name || userEmail).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg uppercase">
                        FATURA DE {contact?.name || userEmail}
                      </CardTitle>
                      <p className={`text-lg font-bold ${
                        netValue === 0
                          ? 'text-blue-700 dark:text-blue-300'
                          : theyOweMe 
                            ? 'text-green-700 dark:text-green-300' 
                            : 'text-red-700 dark:text-red-300'
                      }`}>
                        Valor Líquido: R$ {netValue.toFixed(2)} {
                          netValue === 0 
                            ? 'a compensar' 
                            : theyOweMe 
                              ? 'a receber' 
                              : 'a pagar'
                        }
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

                {/* ✅ BOTÃO: Pagar/Receber/Compensar fatura (só aparece se houver itens pendentes) */}
                {pendingItems.length > 0 && (
                  <div className="mb-6">
                    <Button
                      onClick={() => handlePayAllBill(userEmail)}
                      disabled={isProcessing}
                      className={`w-full ${
                        netValue === 0 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : theyOweMe 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-red-600 hover:bg-red-700'
                      }`}
                      size="lg"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {isProcessing 
                        ? 'Processando...' 
                        : netValue === 0
                          ? 'Compensar Itens'
                          : `${theyOweMe ? 'Receber Fatura' : 'Pagar Fatura'} - R$ ${netValue.toFixed(2)}`
                      }
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
                      <div className="text-right flex items-center gap-2">
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
                        
                        {/* Botões de ação */}
                        <div className="flex gap-1">
                          {/* Botão Editar */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              console.log('🔍 Editando item:', item);
                              
                              // Verificar se é dívida ou transação
                              const isDebt = item.type === 'DEBIT' || (item.id && item.id.startsWith('debt-'));
                              
                              console.log('🔍 Editando - Detectando tipo:', {
                                isDebt,
                                type: item.type,
                                id: item.id,
                                transactionId: item.transactionId
                              });
                              
                              if (isDebt) {
                                toast.info('Edição de dívidas ainda não implementada. Use "Marcar como Pago" para resolver.');
                                return;
                              }
                              
                              try {
                                toast.loading('Carregando transação...');
                                const response = await fetch(`/api/transactions/${item.transactionId}`, {
                                  credentials: 'include',
                                });
                                
                                if (!response.ok) {
                                  const error = await response.json();
                                  throw new Error(error.error || 'Erro ao buscar transação');
                                }
                                
                                const transaction = await response.json();
                                console.log('✅ Transação carregada:', transaction);
                                
                                toast.dismiss();
                                toast.success('Abrindo editor...');
                                
                                // Disparar evento para abrir modal
                                window.dispatchEvent(new CustomEvent('edit-transaction', {
                                  detail: { transaction }
                                }));
                              } catch (error) {
                                console.error('❌ Erro ao buscar transação:', error);
                                toast.dismiss();
                                toast.error(error instanceof Error ? error.message : 'Erro ao carregar transação');
                              }
                            }}
                            className="h-8 w-8 p-0"
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </Button>
                          
                          {/* Botão Excluir */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              console.log('🗑️ Excluindo item:', item);
                              
                              // Verificar se é dívida ou transação
                              // Dívidas têm type 'DEBIT' e não têm transactionId válido
                              const isDebt = item.type === 'DEBIT' || (item.id && item.id.startsWith('debt-'));
                              const itemId = item.transactionId || item.id;
                              const endpoint = isDebt 
                                ? `/api/debts/${itemId}` 
                                : `/api/transactions/${itemId}`;
                              
                              console.log('🔍 Detectando tipo:', {
                                isDebt,
                                type: item.type,
                                id: item.id,
                                transactionId: item.transactionId,
                                endpoint
                              });
                              
                              const confirmMessage = isDebt
                                ? `Tem certeza que deseja excluir a dívida "${item.description}"?\n\nIsso irá:\n- Remover a dívida\n- Atualizar os saldos`
                                : `Tem certeza que deseja excluir "${item.description}"?\n\nIsso irá:\n- Remover a transação\n- Cancelar a dívida\n- Atualizar os saldos`;
                              
                              if (confirm(confirmMessage)) {
                                try {
                                  toast.loading('Excluindo...');
                                  console.log(`🔍 Excluindo via: ${endpoint}`);
                                  
                                  const response = await fetch(endpoint, {
                                    method: 'DELETE',
                                    credentials: 'include',
                                  });
                                  
                                  if (!response.ok) {
                                    const error = await response.json();
                                    throw new Error(error.error || 'Erro ao excluir');
                                  }
                                  
                                  toast.dismiss();
                                  toast.success('Excluído com sucesso!');
                                  
                                  // Recarregar após 500ms
                                  setTimeout(() => {
                                    window.location.reload();
                                  }, 500);
                                } catch (error) {
                                  console.error('❌ Erro ao excluir:', error);
                                  toast.dismiss();
                                  toast.error(error instanceof Error ? error.message : 'Erro ao excluir');
                                }
                              }
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                            title="Excluir"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </Button>
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
              <CardTitle>
                {selectedItem.amount === 0 ? 'Registrar Compensação' : 'Registrar Pagamento'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {selectedItem.amount === 0 
                    ? 'Valor líquido:' 
                    : selectedItem.type === 'CREDIT' 
                      ? 'Valor a receber:' 
                      : 'Valor a pagar:'
                  }
                </p>
                <p className={`text-2xl font-bold ${
                  selectedItem.amount === 0 
                    ? 'text-blue-600' 
                    : selectedItem.type === 'CREDIT' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                }`}>
                  {selectedItem.amount === 0 
                    ? 'R$ 0,00' 
                    : `${selectedItem.type === 'CREDIT' ? '+' : '-'}R$ ${selectedItem.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedItem.amount === 0
                    ? `Com: ${getContactByEmail(selectedItem.userEmail)?.name || selectedItem.userEmail}`
                    : selectedItem.type === 'CREDIT'
                      ? `De: ${getContactByEmail(selectedItem.userEmail)?.name || selectedItem.userEmail}`
                      : `Para: ${getContactByEmail(selectedItem.userEmail)?.name || selectedItem.userEmail}`
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {selectedItem.amount === 0 
                    ? 'Conta para Lançamento *' 
                    : selectedItem.type === 'CREDIT' 
                      ? 'Conta de Destino *' 
                      : 'Conta para Débito *'
                  }
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
                  {selectedItem.amount === 0
                    ? 'Os itens serão lançados individualmente nesta conta'
                    : selectedItem.type === 'CREDIT'
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
                selectedItem.amount === 0
                  ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                  : selectedItem.type === 'CREDIT'
                    ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
              }`}>
                <p className={`text-sm ${
                  selectedItem.amount === 0
                    ? 'text-blue-800 dark:text-blue-200'
                    : selectedItem.type === 'CREDIT'
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                }`}>
                  {selectedItem.amount === 0 
                    ? 'ℹ️ Serão criadas transações individuais de RECEITA e DESPESA que se compensam (saldo final R$ 0,00)'
                    : `ℹ️ Será criada uma transação de ${selectedItem.type === 'CREDIT' ? 'RECEITA' : 'DESPESA'} na conta selecionada`
                  }
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
                    selectedItem.amount === 0
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : selectedItem.type === 'CREDIT'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isProcessing 
                    ? 'Processando...' 
                    : selectedItem.amount === 0 
                      ? 'Confirmar Compensação' 
                      : selectedItem.type === 'CREDIT' 
                        ? 'Confirmar Recebimento' 
                        : 'Confirmar Pagamento'
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
});
