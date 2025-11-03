'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebouncedCallback } from '../../../hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePicker } from '@/components/ui/date-picker';
import {
  DollarSign,
  Users,
  Plus,
  Plane,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  X,
  Calculator,
  Percent,
  Equal,
  MapPin,
  CreditCard,
} from 'lucide-react';
// Fixed imports to prevent 500 errors
import { toast } from 'sonner';
import { FamilySelector } from '../../features/travel/family-selector';
import { useUnifiedFinancial } from '../../../contexts/unified-financial-context';
import {
  formatDateInput,
  convertBRDateToISO,
  convertISODateToBR,
  validateBRDate,
  getCurrentDateBR,
} from '@/lib/utils/date-utils';
import { useSafeTheme } from '../../../hooks/use-safe-theme';
// Logger removed to prevent errors
import { parseNumber, isValidNumber } from '@/lib/utils/number-utils';
import { storage } from '@/lib/config/storage';
import { SharedDebt, Trip, Transaction } from '@prisma/client';

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
  editingTransaction?: Transaction;
  tripId?: string;
}

export function AddTransactionModal({
  open,
  onOpenChange,
  onSave,
  editingTransaction,
  tripId,
}: AddTransactionModalProps) {
  // ✅ CORREÇÃO: Usar apenas o contexto unificado (incluindo trips calculados)
  const { accounts, actions, loading, trips: contextTrips } = useUnifiedFinancial();

  // Ensure accounts is always an array to prevent undefined errors
  const safeAccounts = accounts || [];

  // Função para renderizar as opções de contas separadas por tipo
  // ✅ CORREÇÃO: Renderizar opções de contas de forma otimizada
  const renderAccountOptions = () => {
    if (loading) {
      return (
        <SelectItem value="loading" disabled>
          Carregando contas...
        </SelectItem>
      );
    }

    if (safeAccounts.length === 0) {
      return (
        <SelectItem value="no-accounts" disabled>
          Nenhuma conta cadastrada. Crie uma conta primeiro.
        </SelectItem>
      );
    }

    // ✅ CORREÇÃO: Filtrar cartões de crédito considerando diferentes formatos
    const bankAccounts = safeAccounts.filter(account =>
      account.type !== 'credit_card' &&
      account.type !== 'PASSIVO' &&
      !account.id.startsWith('card-')
    );

    // ✅ NOVO: Receitas não podem ir para cartão de crédito
    const isIncome = formData.type === 'income' || formData.type === 'RECEITA';
    const creditCards = isIncome ? [] : safeAccounts.filter(account =>
      account.type === 'credit_card' ||
      account.type === 'PASSIVO' ||
      account.id.startsWith('card-')
    );

    return (
      <>
        {/* Seção de Contas Bancárias */}
        {bankAccounts.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 border-b">
              💰 Contas Bancárias
            </div>
            {bankAccounts.map((account) => (
              <SelectItem
                key={account.id}
                value={String(account.id)}
              >
                {account.name} - R$ {(Number(account.balance) || 0).toFixed(2)}
              </SelectItem>
            ))}
          </>
        )}

        {/* Seção de Cartões de Crédito */}
        {creditCards.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 border-b">
              💳 Cartões de Crédito
            </div>
            {creditCards.map((account) => {
              // Para cartões de crédito, calcular limite disponível
              // @ts-ignore - Account pode ter limit quando é cartão de crédito
              const limit = Number(account.limit) || 0;
              const currentBalance = Math.abs(Number(account.balance) || 0);
              const available = limit - currentBalance;
              
              return (
                <SelectItem
                  key={account.id}
                  value={String(account.id)}
                >
                  {account.name} - Disponível: R$ {available.toFixed(2)} (Limite: R$ {limit.toFixed(2)})
                </SelectItem>
              );
            })}
          </>
        )}
      </>
    );
  };

  const { settings } = useSafeTheme();
  // Simplified without auto-fill for now
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    subcategory: '', // Adicionado campo subcategory
    account: '',
    creditCard: '', // Campo creditCard já presente
    date: getCurrentDateBR(),
    notes: '',
    isShared: false,
    selectedContacts: [] as string[],
    sharedWith: [] as string[], // Adicionado campo sharedWith
    sharedPercentages: {} as Record<string, number>,
    divisionMethod: 'equal' as 'equal' | 'percentage' | 'amount',
    tripId: '',
    isLinkedToTrip: false,
    installments: 1,
    recurring: false,
    recurringFrequency: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    recurringType: 'indefinite' as 'indefinite' | 'specific',
    recurringEndDate: '',
    recurringOccurrences: '',
    originalCurrency: 'BRL' as string,
    exchangeRate: 1,
    convertedAmount: '',
    isPaidBy: false,
    paidByPerson: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showContactManager, setShowContactManager] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);
  const [loadedCategories, setLoadedCategories] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [availableCurrencies] = useState([
    { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$' },
    { code: 'USD', name: 'Dólar Americano', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'Libra Esterlina', symbol: '£' },
    { code: 'JPY', name: 'Iene Japonês', symbol: '¥' },
    { code: 'CAD', name: 'Dólar Canadense', symbol: 'C$' },
    { code: 'AUD', name: 'Dólar Australiano', symbol: 'A$' },
    { code: 'CHF', name: 'Franco Suíço', symbol: 'CHF' },
  ]);

  const [pendingSync, setPendingSync] = useState(false);
  // Load family members from database API
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; email?: string }>>([]);

  // Verificar se a conta selecionada é um cartão de crédito
  const selectedAccount = safeAccounts.find(acc => acc.id === formData.account);
  const isSelectedAccountCreditCard = selectedAccount?.type === 'credit_card';

  // ✅ CORREÇÃO: Carregar categorias
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setLoadedCategories(data);
                  }
      } catch (error) {
        console.error('❌ [TransactionModal] Erro ao carregar categorias:', error);
        setLoadedCategories([]);
      }
    };

    if (open) {
      loadCategories();
    }
  }, [open]);

  useEffect(() => {
    const loadFamilyMembers = async () => {
      try {
                const response = await fetch('/api/family-members', {
          credentials: 'include',
          cache: 'no-cache'
        });

        if (response.ok) {
          const members = await response.json();
          
          // Verificar se é um array
          if (Array.isArray(members)) {
            const formattedMembers = members.map((member: { id: string; name: string; email?: string }) => ({
              id: member.id,
              name: member.name,
              email: member.email || undefined
            }));
            setContacts(formattedMembers);
                      } else {
            console.warn('⚠️ [TransactionModal] API retornou objeto em vez de array:', members);
            setContacts([]);
          }
        } else {
          console.error('❌ [TransactionModal] Erro ao carregar membros:', response.status);
          setContacts([]);
        }
      } catch (error) {
        console.error('❌ [TransactionModal] Erro ao carregar membros:', error);
        setContacts([]);
      }
    };

    // ✅ CORREÇÃO: Carregar quando o modal abrir
    if (open) {
      loadFamilyMembers();
    }
  }, [open]);
  // ✅ CORREÇÃO: Usar trips do contexto (já calculados com spent correto)
  const trips = contextTrips || [];

  // ✅ CORREÇÃO: Não precisa mais carregar trips - vem do contexto com spent calculado

  // Initialize form data with editing transaction or trip data
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        description: editingTransaction.description || '',
        amount: editingTransaction.amount
          ? Math.abs(editingTransaction.amount).toString()
          : '',
        type: editingTransaction.amount && editingTransaction.amount < 0 ? 'expense' : 'income',
        category: editingTransaction.categoryId || '',
        account: editingTransaction.accountId || '',
        date: editingTransaction.date
          ? convertISODateToBR(editingTransaction.date)
          : getCurrentDateBR(),
        notes: editingTransaction.description || '', // Usar description como notes
        isShared: editingTransaction.isShared || false,
        selectedContacts: [], // Inicializar vazio
        sharedPercentages: {},
        divisionMethod: 'equal' as 'equal' | 'percentage' | 'amount',
        tripId: editingTransaction.tripId || tripId || '',
        isLinkedToTrip: !!(editingTransaction.tripId || tripId),
        installments: editingTransaction.totalInstallments || 1,
        recurring: editingTransaction.isRecurring || false,
        recurringFrequency: 'monthly' as 'weekly' | 'monthly' | 'yearly',
        recurringType: 'indefinite' as 'indefinite' | 'specific',
        recurringEndDate: '',
        recurringOccurrences: '',
        originalCurrency: editingTransaction.metadata?.originalCurrency || 'BRL',
        exchangeRate: editingTransaction.metadata?.exchangeRate || 1,
        convertedAmount: editingTransaction.metadata?.convertedAmount || '',
        isPaidBy: editingTransaction.metadata?.isPaidBy || false,
        paidByPerson: editingTransaction.metadata?.paidByPerson || '',
      });
    } else if (tripId && !editingTransaction) {
      // Auto-link to trip for new transactions and set trip currency
      const selectedTrip = trips.find((trip: Trip) => trip.id === tripId);
      setFormData((prev) => ({
        ...prev,
        tripId,
        isLinkedToTrip: true,
        originalCurrency: selectedTrip?.currency || 'BRL',
      }));
    }
  }, [editingTransaction, tripId]);

  // Update currency when trip is selected
  useEffect(() => {
    if (formData.isLinkedToTrip && formData.tripId && trips.length > 0) {
      const selectedTrip = trips.find((trip: Trip) => trip.id === formData.tripId);
      if (
        selectedTrip &&
        selectedTrip.currency &&
        selectedTrip.currency !== formData.originalCurrency
      ) {
        setFormData((prev) => ({
          ...prev,
          originalCurrency: selectedTrip.currency,
        }));
      }
    }
  }, [formData.tripId, formData.isLinkedToTrip, trips]);

  // ✅ REMOVIDO: Não auto-selecionar conta - usuário deve escolher manualmente
  // useEffect(() => {
  //   if (open && !editingTransaction && !formData.account && safeAccounts.length > 0) {
  //     const firstAccount = safeAccounts[0];
  //     console.log('🏦 [TransactionModal] Auto-selecionando primeira conta:', {
  //       id: firstAccount.id,
  //       name: firstAccount.name
  //     });
  //     setFormData((prev) => ({
  //       ...prev,
  //       account: firstAccount.id
  //     }));
  //   }
  // }, [open, editingTransaction, safeAccounts, formData.account]);

  // Reset form function
  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      type: 'expense',
      category: '',
      subcategory: '', // Adicionado
      account: '',
      creditCard: '', // Adicionado
      date: getCurrentDateBR(),
      notes: '',
      isShared: false,
      selectedContacts: [],
      sharedWith: [], // Adicionado
      sharedPercentages: {},
      divisionMethod: 'equal',
      tripId: tripId || '',
      isLinkedToTrip: !!tripId,
      installments: 1,
      recurring: false,
      recurringFrequency: 'monthly',
      recurringType: 'indefinite',
      recurringEndDate: '',
      recurringOccurrences: '',
      originalCurrency: 'BRL',
      exchangeRate: 1,
      convertedAmount: '',
      isPaidBy: false,
      paidByPerson: '',
    });
  };

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   * Dados agora vêm do banco via DataService
   */
  // Load custom categories
  useEffect(() => {
    // TODO: Implementar carregamento via DataService
    // const loadCustomCategories = async () => {
    //   try {
    //     const customCategoriesData = await DataService.getCustomCategories();
    //     setCustomCategories(customCategoriesData);
    //   } catch (error) {
    //     logError.ui("Error loading custom categories:", error);
    //   }
    // };
    // loadCustomCategories();
  }, []);

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   * Dados agora vêm do banco via DataService
   */
  // Load custom tags from advanced dashboard
  useEffect(() => {
    // TODO: Implementar carregamento via DataService
    // const loadCustomTags = async () => {
    //   try {
    //     const tagsData = await DataService.getActiveTags();
    //     setAvailableTags(tagsData.map(tag => tag.name));
    //   } catch (error) {
    //     logError.ui("Error loading tags:", error);
    //     // Fallback to default tags on error
    //     setAvailableTags([
    //       "Essencial",
    //       "Lazer",
    //       "Trabalho",
    //       "Emergência",
    //       "Investimento",
    //       "Educação",
    //       "Saúde",
    //       "Outros",
    //     ]);
    //   }
    // };
    // loadCustomTags();

  }, []);

  // Memoize static categories to prevent re-creation
  const categories = useMemo(
    () => ({
      income: [
        'Salário',
        'Freelance',
        'Investimentos',
        'Vendas',
        'Prêmios',
        'Restituição',
        'Aluguel Recebido',
        'Dividendos',
        'Outros',
      ],
      expense: [
        'Alimentação',
        'Supermercado',
        'Restaurante',
        'Lanches',
        'Bebidas',
        'Transporte',
        'Combustível',
        'Uber/Taxi',
        'Transporte Público',
        'Moradia',
        'Aluguel',
        'Condomínio',
        'Energia Elétrica',
        'Água',
        'Internet',
        'Saúde',
        'Médico',
        'Farmácia',
        'Plano de Saúde',
        'Educação',
        'Curso',
        'Livros',
        'Material Escolar',
        'Lazer',
        'Cinema',
        'Viagem',
        'Esportes',
        'Streaming',
        'Compras',
        'Roupas',
        'Eletrônicos',
        'Casa',
        'Serviços',
        'Cabeleireiro',
        'Limpeza',
        'Manutenção',
        'Seguros',
        'Impostos',
        'Pets',
        'Presentes',
        'Doações',
        'Outros',
      ],
    }),
    []
  );

  // Memoize derived data to prevent unnecessary recalculations
  const selectedContactsData = useMemo(
    () => contacts.filter((c) => formData.selectedContacts.includes(c.id)),
    [contacts, formData.selectedContacts]
  );

  const activeTrip = useMemo(() => {
    const trip = trips.find((t) => t.id === formData.tripId);
    if (trip) {
      // ✅ CORREÇÃO: Garantir que spent seja número
      const spent = typeof trip.spent === 'number' ? trip.spent : Number(trip.spent) || 0;
      const budget = typeof trip.budget === 'number' ? trip.budget : Number(trip.budget) || 0;
      
      console.log('🔍 [Modal] Viagem selecionada:', {
        id: trip.id,
        name: trip.name,
        budget,
        spent,
        available: budget - spent,
        originalSpent: trip.spent,
        spentType: typeof trip.spent
      });
      
      // Retornar trip com valores convertidos
      return {
        ...trip,
        spent,
        budget
      };
    }
    return trip;
  }, [trips, formData.tripId]);

  // Debounced handlers otimizados para melhor responsividade
  const handleDescriptionChange = useDebouncedCallback((value: string) => {
    setFormData((prev) => ({ ...prev, description: value }));
  }, 100); // Reduzido para melhor responsividade

  const handleAmountChange = useDebouncedCallback((value: string) => {
    setFormData((prev) => ({ ...prev, amount: value }));
  }, 200); // Reduzido para melhor responsividade

  const handleNotesChange = useDebouncedCallback((value: string) => {
    setFormData((prev) => ({ ...prev, notes: value }));
  }, 300); // Reduzido de 500ms

  // Initialize percentages when contacts are selected - FIXED: Removed circular dependency
  useEffect(() => {
    if (formData.isShared && formData.selectedContacts.length > 0) {
      const newPercentages = { ...formData.sharedPercentages };
      const totalParticipants = formData.selectedContacts.length + 1; // +1 for user

      // Only update if percentages are not already set or if contacts changed
      const hasExistingPercentages = Object.keys(newPercentages).length > 0;
      const hasAllContactPercentages = formData.selectedContacts.every(
        contactId => newPercentages[contactId] !== undefined
      );

      if (!hasExistingPercentages || !hasAllContactPercentages) {
        if (formData.divisionMethod === 'equal') {
          const equalPercentage = Math.floor(100 / totalParticipants);
          const remainder = 100 - equalPercentage * totalParticipants;

          // Set equal percentage for all
          newPercentages['user'] = equalPercentage + remainder; // Give remainder to user
          formData.selectedContacts.forEach((contactId) => {
            newPercentages[contactId] = equalPercentage;
          });
        } else {
          // For percentage/amount methods, set default if not exists
          if (!newPercentages['user']) {
            newPercentages['user'] =
              totalParticipants === 2 ? 50 : Math.floor(100 / totalParticipants);
          }
          formData.selectedContacts.forEach((contactId) => {
            if (!newPercentages[contactId]) {
              newPercentages[contactId] =
                totalParticipants === 2
                  ? 50
                  : Math.floor(100 / totalParticipants);
            }
          });
        }

        setFormData((prev) => ({ ...prev, sharedPercentages: newPercentages }));
      }
    }
  }, [formData.selectedContacts, formData.isShared]); // Removed formData.divisionMethod to prevent loop

  // Currency conversion function
  const handleCurrencyConversion = useCallback(
    async (amount: string, fromCurrency: string, toCurrency: string) => {
      if (!amount || fromCurrency === toCurrency) {
        setFormData((prev) => ({
          ...prev,
          exchangeRate: 1,
          convertedAmount: amount,
        }));
        return;
      }

      try {
        // Simplified exchange rate calculation (in a real app, you'd use an API)
        const exchangeRates: Record<string, Record<string, number>> = {
          USD: { BRL: 5.2, EUR: 0.85, GBP: 0.73, JPY: 110 },
          EUR: { BRL: 6.12, USD: 1.18, GBP: 0.86, JPY: 130 },
          BRL: { USD: 0.19, EUR: 0.16, GBP: 0.14, JPY: 21 },
          GBP: { BRL: 7.11, USD: 1.37, EUR: 1.16, JPY: 151 },
          JPY: { BRL: 0.047, USD: 0.009, EUR: 0.0077, GBP: 0.0066 },
        };

        const rate = exchangeRates[fromCurrency]?.[toCurrency] || 1;
        const convertedValue = (parseNumber(amount) * rate).toFixed(2);

        setFormData((prev) => ({
          ...prev,
          exchangeRate: rate,
          convertedAmount: convertedValue,
        }));

        toast.success(
          `Convertido: ${amount} ${fromCurrency} = ${convertedValue} ${toCurrency}`
        );
      } catch (error) {
        console.error('Erro na conversão de moeda:', error);
        toast.error('Erro ao converter moeda');
      }
    },
    []
  );

  // Handle currency conversion when amount or currency changes
  useEffect(() => {
    if (formData.amount && formData.tripId && showCurrencyConverter) {
      const trip = trips.find((t) => t.id === formData.tripId);
      if (trip && trip.currency !== 'BRL') {
        handleCurrencyConversion(
          formData.amount,
          formData.originalCurrency,
          'BRL'
        );
      }
    }
  }, [
    formData.amount,
    formData.originalCurrency,
    formData.tripId,
    showCurrencyConverter,
    trips,
    handleCurrencyConversion,
  ]);

  // Memoize callback functions to prevent unnecessary re-renders
  const handleContactSelectionChange = useCallback((contactIds: string[]) => {
    setFormData((prev) => ({ ...prev, selectedContacts: contactIds }));
  }, []);

  const handlePercentageChange = useCallback(
    (contactId: string, percentage: number) => {
      setFormData((prev) => ({
        ...prev,
        sharedPercentages: {
          ...prev.sharedPercentages,
          [contactId]: percentage,
        },
      }));
    },
    []
  );

  const handleDivisionMethodChange = useCallback((method: string) => {
    setFormData((prev) => ({ ...prev, divisionMethod: method as 'equal' | 'percentage' | 'amount' }));
  }, []);

  // Memoize expensive calculations
  const getTotalPercentage = useMemo(() => {
    return Object.values(formData.sharedPercentages).reduce(
      (sum, percentage) => sum + percentage,
      0
    );
  }, [formData.sharedPercentages]);

  const getMyAmount = useMemo(() => {
    const amount = parseNumber(formData.amount) || 0;
    if (!formData.isShared) return amount;

    const myPercentage = formData.sharedPercentages['user'] || 0;
    return (amount * myPercentage) / 100;
  }, [formData.amount, formData.isShared, formData.sharedPercentages]);

  const handleQuickSplit = useCallback(() => {
    if (formData.selectedContacts.length === 1) {
      setFormData((prev) => ({
        ...prev,
        divisionMethod: 'percentage',
        sharedPercentages: {
          user: 50,
          [formData.selectedContacts[0]]: 50,
        },
      }));
    }
  }, [formData.selectedContacts]);

  const handleEqualSplit = useCallback(() => {
    const totalParticipants = formData.selectedContacts.length + 1;
    const equalPercentage = Math.floor(100 / totalParticipants);
    const remainder = 100 - equalPercentage * totalParticipants;

    const newPercentages: Record<string, number> = {
      user: equalPercentage + remainder,
    };

    formData.selectedContacts.forEach((contactId) => {
      newPercentages[contactId] = equalPercentage;
    });

    setFormData((prev) => ({
      ...prev,
      divisionMethod: 'equal',
      sharedPercentages: newPercentages,
    }));
  }, [formData.selectedContacts]);

  const removeContact = useCallback((contactId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedContacts: prev.selectedContacts.filter((id) => id !== contactId),
      sharedPercentages: Object.fromEntries(
        Object.entries(prev.sharedPercentages).filter(
          ([key]) => key !== contactId
        )
      ),
    }));
  }, []);

  const handleLinkToActiveTrip = () => {
    if (trips.length > 0) {
      const trip = trips[0];
      setFormData((prev) => ({
        ...prev,
        isLinkedToTrip: true,
        tripId: trip.id,
        originalCurrency: trip.currency || 'BRL',
      }));
      setShowCurrencyConverter(trip.currency !== 'BRL');
      toast.success(`Vinculado à viagem: ${trip.name}`);
    }
  };



  const handleSmartSplit = useCallback(
    (method: 'by_income' | 'by_expense_history' | 'custom') => {
      if (formData.selectedContacts.length === 0) return;

      const newPercentages: Record<string, number> = {};
      const totalParticipants = formData.selectedContacts.length + 1;

      switch (method) {
        case 'by_income':
          // Simulate income-based splitting (in real app, you'd have user income data)
          const basePercentage = Math.floor(100 / totalParticipants);
          newPercentages['user'] =
            basePercentage + (100 - basePercentage * totalParticipants);
          formData.selectedContacts.forEach((contactId) => {
            newPercentages[contactId] = basePercentage;
          });
          break;

        case 'by_expense_history':
          // Simulate history-based splitting
          const equalSplit = Math.floor(100 / totalParticipants);
          newPercentages['user'] =
            equalSplit + (100 - equalSplit * totalParticipants);
          formData.selectedContacts.forEach((contactId) => {
            newPercentages[contactId] = equalSplit;
          });
          break;

        case 'custom':
          // Allow manual adjustment
          newPercentages['user'] = 50;
          formData.selectedContacts.forEach((contactId, index) => {
            newPercentages[contactId] = Math.floor(
              50 / formData.selectedContacts.length
            );
          });
          break;
      }

      setFormData((prev) => ({
        ...prev,
        sharedPercentages: newPercentages,
        divisionMethod: 'percentage',
      }));

      toast.success('Divisão inteligente aplicada!');
    },
    [formData.selectedContacts]
  );

  const handleAddCustomCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Digite o nome da categoria');
      return;
    }

    const allCategories = [...categories.expense, ...customCategories];
    if (allCategories.includes(newCategoryName.trim())) {
      toast.error('Esta categoria já existe');
      return;
    }

    const updatedCustomCategories = [
      ...customCategories,
      newCategoryName.trim(),
    ];
    setCustomCategories(updatedCustomCategories);
    /**
     * @deprecated localStorage não é mais usado - dados ficam no banco
     * Dados agora são salvos via DataService no backend
     */
    // TODO: Implementar salvamento via DataService
    // await DataService.createCustomCategory(newCategoryName.trim());

    // Set the new category as selected
    setFormData((prev) => ({ ...prev, category: newCategoryName.trim() }));

    setNewCategoryName('');
    setShowNewCategoryInput(false);
    toast.success('Categoria personalizada criada com sucesso!');
  };

  const handleDeleteCustomCategory = (categoryName: string) => {
    const updatedCustomCategories = customCategories.filter(
      (cat) => cat !== categoryName
    );
    setCustomCategories(updatedCustomCategories);
    /**
     * @deprecated localStorage não é mais usado - dados ficam no banco
     * Dados agora são salvos via DataService no backend
     */
    // TODO: Implementar remoção via DataService
    // await DataService.deleteCustomCategory(categoryName);
    toast.success('Categoria personalizada removida');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validação crítica: verificar se há contas disponíveis
      if (safeAccounts.length === 0) {
        toast.error('Não é possível criar transações sem contas cadastradas. Cadastre uma conta primeiro.');
        setIsLoading(false);
        return;
      }

      // Validação de data
      if (!validateBRDate(formData.date)) {
        toast.error('Por favor, insira uma data válida no formato dd/mm/aaaa');
        setIsLoading(false);
        return;
      }

      if (
        formData.recurringEndDate &&
        !validateBRDate(formData.recurringEndDate)
      ) {
        toast.error(
          'Por favor, insira uma data de término válida no formato dd/mm/aaaa'
        );
        setIsLoading(false);
        return;
      }

      // Usar função que entende formato brasileiro
      const amount = parseNumber(formData.amount);
      if (!isValidNumber(formData.amount) || amount <= 0) {
        toast.error(
          'Por favor, insira um valor válido. Use vírgula para decimais (ex: 100,50)'
        );
        setIsLoading(false);
        return;
      }

      // ✅ CORREÇÃO: Validação de conta obrigatória (exceto quando "Pago por outra pessoa")
      if (!formData.isPaidBy) {
        if (!formData.account || formData.account === 'Dinheiro') {
          toast.error('Por favor, selecione uma conta válida para a transação');
          setIsLoading(false);
          return;
        }

        // Verificar se a conta selecionada existe na lista de contas disponíveis
        const selectedAccount = safeAccounts.find(acc => acc.id === formData.account);
        if (!selectedAccount) {
          toast.error('A conta selecionada não é válida. Por favor, selecione uma conta existente');
          setIsLoading(false);
          return;
        }
      } else {
        console.log('ℹ️ [TransactionModal] Pago por outra pessoa - pulando validação de conta');
      }

      // ✅ CORREÇÃO: Validação para "Pago por outra pessoa" (mesmo sem compartilhamento)
      if (formData.isPaidBy && !formData.paidByPerson) {
        toast.error('Selecione quem pagou a despesa');
        setIsLoading(false);
        return;
      }

      if (formData.isShared && formData.type === 'expense') {
        if (formData.selectedContacts.length === 0) {
          toast.error('Selecione pelo menos um membro para compartilhar');
          setIsLoading(false);
          return;
        }

        if (Math.abs(getTotalPercentage - 100) > 0.01) {
          toast.error(
            `A soma dos percentuais deve ser 100%. Atual: ${getTotalPercentage.toFixed(1)}%`
          );
          setIsLoading(false);
          return;
        }
      }

      const finalAmount = formData.type === 'expense' ? -amount : amount;

      const finalConvertedAmount = formData.convertedAmount
        ? parseNumber(formData.convertedAmount)
        : amount;
      const adjustedFinalAmount =
        formData.type === 'expense'
          ? -finalConvertedAmount
          : finalConvertedAmount;
      const myShare =
        formData.isShared && formData.type === 'expense'
          ? -getMyAmount
          : adjustedFinalAmount;

      // ✅ CORREÇÃO: Garantir que a data seja salva corretamente sem problemas de timezone
      const isoDate = convertBRDateToISO(formData.date);
      console.log('📅 [TransactionModal] Convertendo data:', {
        dataBR: formData.date,
        dataISO: isoDate,
        dataAtual: new Date().toISOString()
      });

      const transactionData = {
        description: formData.description,
        amount: adjustedFinalAmount,
        originalAmount: amount,
        originalCurrency: formData.originalCurrency,
        exchangeRate: formData.exchangeRate,
        type:
          formData.isShared && formData.type === 'expense'
            ? ('shared' as const)
            : formData.type,
        category: formData.category,
        account: formData.account,
        date: isoDate,
        notes: formData.notes,
        installments:
          formData.installments > 1 ? formData.installments : undefined,
        recurring: formData.recurring || undefined,
        isOffline: false,
        syncStatus: 'synced',
        ...(formData.isShared &&
          formData.type === 'expense' && {
            // Para membros da família, persistimos o identificador legível (nome)
            sharedWith: formData.selectedContacts.map((contactId) => {
              const contact = contacts.find((c) => c.id === contactId);
              return contact ? contact.name : contactId;
            }),
            myShare,
            sharedPercentages: formData.sharedPercentages,
          }),
        ...(formData.tripId && { tripId: formData.tripId }),
      };

      if (editingTransaction) {
        // Update existing transaction using the financial engine
        const updatedTransaction = {
          ...editingTransaction,
          description: formData.description,
          amount: adjustedFinalAmount,
          type: formData.isShared && formData.type === 'expense' ? 'shared' : formData.type,
          category: formData.category, // Corrigido: usar 'category' em vez de 'categoryId'
          accountId: formData.account, // Mantido correto
          date: convertBRDateToISO(formData.date),
          notes: formData.notes,
          ...(formData.isShared &&
            formData.type === 'expense' && {
              sharedWith: formData.selectedContacts.map((contactId) => {
                const contact = contacts.find((c) => c.id === contactId);
                return contact ? contact.name : contactId;
              }),
              myShare,
              sharedPercentages: formData.sharedPercentages,
            }),
          ...(formData.tripId && { tripId: formData.tripId }),
        };

        // Use the updateTransaction from useUnified
        await actions.updateTransaction(editingTransaction.id, updatedTransaction);
        toast.success('Transação atualizada com sucesso!');
      } else {
        // Check if it's an installment transaction - use /api/transactions (not optimized)
        if (formData.installments > 1) {
          // ✅ CORREÇÃO: formData.category já é o categoryId
          const categoryId = formData.category;

          if (!categoryId) {
            toast.error('Por favor, selecione uma categoria');
            return;
          }

          // ✅ CORREÇÃO: Preparar dados corretamente para parcelamento
          const transactionData: any = {
            description: formData.description,
            amount: Math.abs(adjustedFinalAmount),
            type: formData.type === 'expense' ? 'DESPESA' : 'RECEITA',
            categoryId: categoryId,
            date: convertBRDateToISO(formData.date),
            isInstallment: true, // ✅ CRÍTICO: Marcar como parcelamento
            installmentNumber: 1, // ✅ CRÍTICO: Primeira parcela
            totalInstallments: formData.installments,
            notes: formData.isPaidBy
              ? `${formData.notes || ''}\n[Pago por: ${contacts.find(c => c.id === formData.paidByPerson)?.name || 'Outra pessoa'}]`.trim()
              : formData.notes,
            tripId: formData.tripId || undefined,
            isShared: formData.isShared || false,
            paidBy: formData.isPaidBy ? formData.paidByPerson : undefined,
            status: formData.isPaidBy ? 'pending' : 'cleared',
          };

          // ✅ Adicionar accountId/creditCardId apenas se NÃO for "pago por outra pessoa"
          if (!formData.isPaidBy) {
            // ✅ CORREÇÃO: Remover prefixo 'card-' se for cartão de crédito
            // A API unificada adiciona esse prefixo para diferenciar cartões de contas
            let accountValue = formData.account;
            
            if (isSelectedAccountCreditCard && accountValue.startsWith('card-')) {
              accountValue = accountValue.replace(/^card-/, '');
            }

            console.log('🏦 [TransactionModal] Adicionando conta:', {
              original: formData.account,
              cleaned: accountValue,
              isCreditCard: isSelectedAccountCreditCard,
              selectedAccount: {
                id: selectedAccount?.id,
                name: selectedAccount?.name,
                type: selectedAccount?.type
              }
            });

            if (isSelectedAccountCreditCard) {
              transactionData.creditCardId = accountValue;
            } else {
              transactionData.accountId = accountValue;
            }
          } else {
            console.log('👤 [TransactionModal] Pago por outra pessoa:', formData.paidByPerson);
          }

          // ✅ Adicionar sharedWith se for compartilhado
          if (formData.isShared && formData.selectedContacts.length > 0) {
            transactionData.sharedWith = formData.selectedContacts; // Enviar como array
            transactionData.myShare = Math.abs(myShare); // ✅ CRÍTICO: Enviar minha parte!
            transactionData.sharedPercentages = formData.sharedPercentages;
          }

          // ✅ DEBUG: Log do payload antes de enviar
          console.log('📤 [TransactionModal] Enviando dados para API:', JSON.stringify(transactionData, null, 2));
          
          // ✅ CORREÇÃO: Usar API /transactions para parceladas (não a otimizada)
          const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(transactionData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ [TransactionModal] Erro da API:', errorData);
            
            // ✅ CORREÇÃO: Melhor tratamento de erros
            let errorMsg = 'Erro ao criar transação parcelada';
            
            if (errorData.error) {
              errorMsg = errorData.error;
              
              // Se tiver detalhes, adicionar
              if (errorData.details) {
                if (Array.isArray(errorData.details)) {
                  errorMsg += ': ' + errorData.details.join(', ');
                } else if (typeof errorData.details === 'string') {
                  errorMsg += ': ' + errorData.details;
                } else if (typeof errorData.details === 'object') {
                  errorMsg += ': ' + JSON.stringify(errorData.details);
                }
              }
            } else if (errorData.message) {
              errorMsg = errorData.message;
            }
            
            throw new Error(errorMsg);
          }

          
          // ✅ NOVO: Se parcelado E pago por outra pessoa, criar dívida para cada parcela
          if (formData.isPaidBy && formData.paidByPerson) {
            const paidByContact = contacts.find(c => c.id === formData.paidByPerson);
            if (paidByContact) {
              const installmentAmount = Math.abs(adjustedFinalAmount) / formData.installments;
              const totalDebt = Math.abs(adjustedFinalAmount);

              console.log('💰 Criando dívida para parcelamento:', {
                pessoa: paidByContact.name,
                valorTotal: totalDebt,
                parcelas: formData.installments,
                valorPorParcela: installmentAmount
              });

              try {
                // Criar dívida total (não por parcela)
                await fetch('/api/shared-debts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    creditorId: paidByContact.id,
                    creditorName: paidByContact.name,
                    originalAmount: totalDebt,
                    currentAmount: totalDebt,
                    description: `Parcelamento: ${formData.description} (${formData.installments}x de R$ ${installmentAmount.toFixed(2)})`,
                    status: 'active',
                  }),
                });

                toast.info(
                  `Dívida Parcelada Registrada: Você deve ${formData.installments}x de R$ ${installmentAmount.toFixed(2)} = R$ ${totalDebt.toFixed(2)} para ${paidByContact.name}`
                );
              } catch (error) {
                console.error('❌ Erro ao criar dívida parcelada:', error);
              }
            }
          }

          // Refresh data
          await actions.forceRefresh();
        }
        // Check if it's a recurring transaction
        else if (formData.recurring) {
          const baseTransaction = {
            description: formData.description,
            amount: Math.abs(adjustedFinalAmount),
            type: formData.isShared && formData.type === 'expense' ? 'shared' : formData.type,
            account: formData.account,
            category: formData.category,
            subcategory: formData.subcategory || undefined,
            date: convertBRDateToISO(formData.date),
            notes: formData.notes,
          };

          const recurringConfig = {
            frequency: formData.recurringFrequency || 'monthly',
            type: formData.recurringType || 'fixed',
            endDate: formData.recurringEndDate ? convertBRDateToISO(formData.recurringEndDate) : undefined,
            occurrences: formData.recurringOccurrences || undefined,
            enabled: true,
          };

          // Create recurring transaction using API /transactions (not optimized)
          const recurringData = {
            description: baseTransaction.description,
            amount: Math.abs(baseTransaction.amount),
            type: baseTransaction.type === 'expense' ? 'DESPESA' : 'RECEITA', // API /transactions usa português
            category: baseTransaction.category,
            accountId: baseTransaction.account,
            creditCardId: isSelectedAccountCreditCard ? formData.account : undefined,
            date: convertBRDateToISO(formData.date),
            notes: baseTransaction.notes,
            recurring: recurringConfig,
          };

          // ✅ CORREÇÃO: Usar API /transactions para recorrentes (não a otimizada)
          const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(recurringData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao criar transação recorrente');
          }

          
          // Refresh data
          await actions.forceRefresh();
        }
        // Regular transaction
        else {
          // ✅ CORREÇÃO: Buscar categoria pelo ID ou nome
          console.log('🔍 [TransactionModal] Buscando categoria:', {
            formDataCategory: formData.category,
            loadedCategories: loadedCategories.length,
            categoriesNames: loadedCategories.map(c => ({ id: c.id, name: c.name }))
          });

          // Tentar buscar por ID primeiro, depois por nome
          let selectedCategory = loadedCategories.find(c => c.id === formData.category) 
            || loadedCategories.find(c => c.name === formData.category);

          // Se não encontrou, tentar buscar por tipo (RECEITA ou DESPESA)
          if (!selectedCategory) {
            const categoryType = formData.type === 'expense' ? 'DESPESA' : 'RECEITA';
            const categoriesOfType = loadedCategories.filter(c => c.type === categoryType);

            if (categoriesOfType.length > 0) {
              // Usar a primeira categoria do tipo correto
              selectedCategory = categoriesOfType[0];
              console.warn(`⚠️ [TransactionModal] Categoria "${formData.category}" não encontrada. Usando "${selectedCategory.name}" como fallback.`);
              toast.warning(`Categoria "${formData.category}" não encontrada. Usando "${selectedCategory.name}".`);
            } else {
              console.error('❌ [TransactionModal] Nenhuma categoria disponível do tipo:', categoryType);
              throw new Error(`Nenhuma categoria de ${categoryType} disponível. Por favor, crie categorias primeiro.`);
            }
          }
          
          console.log('✅ [TransactionModal] Categoria selecionada:', {
            id: selectedCategory?.id,
            name: selectedCategory?.name,
            type: selectedCategory?.type
          });

          // ✅ VALIDAÇÃO CRÍTICA: Verificar se a conta selecionada existe (exceto quando "Pago por outra pessoa")
          let selectedAccountForTransaction = null;

          if (!formData.isPaidBy) {
            // Apenas validar conta se NÃO for "Pago por outra pessoa"
            selectedAccountForTransaction = safeAccounts.find(acc => acc.id === formData.account);

            if (!selectedAccountForTransaction) {
              console.error('❌ [TransactionModal] Conta não encontrada:', {
                formDataAccount: formData.account,
                availableAccounts: safeAccounts.map(a => ({ id: a.id, name: a.name }))
              });
              throw new Error('A conta selecionada não existe. Por favor, selecione uma conta válida.');
            }

            console.log('✅ [TransactionModal] Conta validada:', {
              id: selectedAccountForTransaction.id,
              name: selectedAccountForTransaction.name,
              type: selectedAccountForTransaction.type
            });
          } else {
            // ✅ CORREÇÃO: Quando "Pago por outra pessoa", usar primeira conta disponível como placeholder
            selectedAccountForTransaction = safeAccounts[0];
            console.log('ℹ️ [TransactionModal] Pago por outra pessoa - usando conta placeholder:', selectedAccountForTransaction?.name);
          }

          // Save new transaction using API
          const paidByContact = formData.isPaidBy && formData.paidByPerson
            ? contacts.find(c => c.id === formData.paidByPerson)
            : null;

          // ✅ CORREÇÃO: Remover prefixo 'card-' se for cartão de crédito
          let finalAccountId = selectedAccountForTransaction?.id;
          if (isSelectedAccountCreditCard && finalAccountId?.startsWith('card-')) {
            finalAccountId = finalAccountId.replace(/^card-/, '');
          }

          const transactionData = {
            description: formData.description,
            amount: Math.abs(adjustedFinalAmount), // API espera valor positivo
            type: formData.type, // 'income' ou 'expense' (API fará o mapeamento)
            category: formData.category, // Nome da categoria (para compatibilidade)
            categoryId: selectedCategory?.id, // ✅ ID da categoria (obrigatório)
            // ✅ CORREÇÃO: Enviar apenas accountId OU creditCardId, nunca ambos
            ...(isSelectedAccountCreditCard 
              ? { creditCardId: finalAccountId }
              : { accountId: finalAccountId }
            ),
            date: convertBRDateToISO(formData.date),
            notes: formData.notes,
            tripId: formData.tripId || undefined,
            isShared: formData.isShared || formData.isPaidBy || false,
            // ✅ CORREÇÃO CRÍTICA: Enviar array, não string JSON
            sharedWith: formData.isShared && formData.selectedContacts.length > 0
              ? formData.selectedContacts
              : formData.isPaidBy && formData.paidByPerson
                ? [formData.paidByPerson]
                : undefined,
            paidBy: formData.isPaidBy ? formData.paidByPerson : undefined,
            status: formData.isPaidBy ? 'pending' : 'cleared',
            metadata: formData.isPaidBy && paidByContact
              ? JSON.stringify({ paidByName: paidByContact.name })
              : undefined,
          };

          
          // ✅ CORREÇÃO: Usar actions.createTransaction() do contexto unificado
          const savedTransaction = await actions.createTransaction(transactionData);

          
          // Se for transação compartilhada, criar billing payments
          if (formData.isShared && formData.sharedWith && formData.sharedWith.length > 0) {
            const transactionForBilling = {
              ...savedTransaction,
              sharedWith: formData.sharedWith,
              amount: adjustedFinalAmount // Usar o valor original com sinal
            };
            // Remover createBillingPayments que não existe
            // await storage.createSharedExpense(transactionForBilling);
          }
        }
      }

      // ✅ CORREÇÃO: Process debt logic if "Pago por outra pessoa" is enabled
      if (
        formData.type === 'expense' &&
        formData.isPaidBy &&
        formData.paidByPerson
      ) {
        
        const paidByContact = contacts.find(
          (c) => c.id === formData.paidByPerson
        );

        if (paidByContact) {
          const userShare = formData.isShared ? getMyAmount : adjustedFinalAmount;

                    
          try {
            // ✅ CORREÇÃO: Criar ou atualizar dívida via API
            const debtsResponse = await fetch('/api/shared-debts', {
              credentials: 'include',
            });

            if (debtsResponse.ok) {
              const debtsData = await debtsResponse.json();
              const existingDebts = debtsData.debts || [];

              // Procurar dívida existente com esta pessoa
              const existingDebt = existingDebts.find((d: any) =>
                (d.creditorId === paidByContact.id || d.debtorId === paidByContact.id) &&
                d.status === 'active'
              );

              if (existingDebt) {
                // Atualizar dívida existente
                const currentAmount = Number(existingDebt.currentAmount);
                const newAmount = currentAmount + userShare;

                await fetch(`/api/shared-debts/${existingDebt.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    currentAmount: newAmount,
                    description: `${existingDebt.description} + ${formData.description}`,
                  }),
                });

                toast.info(
                  `Dívida Atualizada: Você deve R$ ${newAmount.toFixed(2)} para ${paidByContact.name}.`
                );
              } else {
                // Criar nova dívida
                await fetch('/api/shared-debts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    creditorId: paidByContact.id,
                    creditorName: paidByContact.name,
                    originalAmount: userShare,
                    currentAmount: userShare,
                    description: `Despesa: ${formData.description}`,
                    status: 'active',
                  }),
                });

                toast.info(
                  `Dívida Registrada: Você deve R$ ${userShare.toFixed(2)} para ${paidByContact.name}.`
                );
              }
            }
          } catch (error) {
            console.error('❌ Erro ao processar dívida:', error);
            toast.error('Erro ao registrar dívida');
          }
        }
      }

      const isEditMode = !!editingTransaction;
      toast.success(
        isEditMode
          ? `${formData.type === 'income' ? 'Receita' : 'Despesa'} atualizada com sucesso!`
          : formData.isShared && formData.type === 'expense'
            ? formData.isPaidBy
              ? 'Despesa compartilhada e dívida processada com sucesso!'
              : 'Despesa compartilhada criada com sucesso!'
            : `${formData.type === 'income' ? 'Receita' : 'Despesa'} adicionada com sucesso!`
      );

      // ✅ NOVO: Atualizar despesas de viagem
      if (formData.tripId && formData.type === 'expense') {
        try {
          
          // Buscar viagem atual
          const tripResponse = await fetch(`/api/trips/${formData.tripId}`, {
            credentials: 'include',
          });

          if (tripResponse.ok) {
            const tripData = await tripResponse.json();
            const currentSpent = Number(tripData.spent || 0);

            // ✅ IMPORTANTE: Se "Pago por outra pessoa", não adicionar ao spent da viagem
            // porque você não gastou, outra pessoa gastou
            if (!formData.isPaidBy) {
              const tripAmount = adjustedFinalAmount;
              const newSpent = currentSpent + Math.abs(tripAmount);

              await fetch(`/api/trips/${formData.tripId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ spent: newSpent }),
              });

              console.log('✅ Despesas da viagem atualizadas:', {
                anterior: currentSpent,
                adicionado: Math.abs(tripAmount),
                novo: newSpent
              });
            } else {
              console.log('ℹ️ Pago por outra pessoa - não atualizar spent da viagem');
            }
          }
        } catch (error) {
          console.error('❌ Erro ao atualizar viagem:', error);
          // Não falhar a transação se houver erro na viagem
        }
      }

      // ✅ CRÍTICO: Disparar evento para atualizar componentes (trip-overview, etc.)
      window.dispatchEvent(new CustomEvent('transactionCreated', {
        detail: { tripId: formData.tripId }
      }));
      window.dispatchEvent(new Event('TRANSACTION_UPDATED'));

      // Call onSave callback if provided
      onSave?.();

      // Reset form only if not editing
      if (!editingTransaction) {
        resetForm();
      }

      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar transação');
      console.error('Transaction save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign
                  className={`w-5 h-5 ${settings.colorfulIcons ? 'text-green-600' : 'text-muted-foreground'}`}
                />
                {editingTransaction
                  ? 'Editar Transação'
                  : 'Nova Transação AVANÇADA'}{' '}
                ⚡
              </div>
              <div className="flex items-center gap-4">
                {pendingSync && (
                  <Badge
                    variant="outline"
                    className="text-orange-600 border-orange-600"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Pendente Sync
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as 'income' | 'expense' })
              }
            >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="income" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Receita
              </TabsTrigger>
              <TabsTrigger value="expense" className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Despesa
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-6">
              <TabsContent value="income" className="space-y-6 mt-6">
                {/* Income Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp
                        className={`w-5 h-5 ${settings.colorfulIcons ? 'text-green-600' : 'text-muted-foreground'}`}
                      />
                      Informações da Receita
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="description">Descrição *</Label>
                      <Input
                        id="description"
                        placeholder="Ex: Salário, Freelance, Venda..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amount">Valor *</Label>
                        <div className="space-y-2">
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={formData.amount}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                amount: e.target.value,
                              })
                            }
                            required
                            className="text-right"
                          />

                          {/* Currency Converter */}
                          {showCurrencyConverter && formData.tripId && (
                            <div className="p-3 bg-blue-50 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-blue-700">
                                  Conversão de Moeda
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setShowCurrencyConverter(false)
                                  }
                                >
                                  ×
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-600">
                                    Original:
                                  </span>
                                  <div className="font-medium">
                                    {formData.originalCurrency}{' '}
                                    {formData.amount || '0,00'}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">
                                    Convertido:
                                  </span>
                                  <div className="font-medium text-green-600">
                                    BRL {formData.convertedAmount || '0,00'}
                                  </div>
                                </div>
                              </div>
                              {formData.exchangeRate !== 1 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Taxa: 1 {formData.originalCurrency} ={' '}
                                  {formData.exchangeRate} BRL
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="date">Data *</Label>
                        <DatePicker
                          id="date"
                          value={convertBRDateToISO(formData.date)}
                          onChange={(value) =>
                            setFormData({
                              ...formData,
                              date: convertISODateToBR(value),
                            })
                          }
                          placeholder="Selecionar data"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Categoria *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            setFormData({ ...formData, category: value })
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {loadedCategories
                              .filter((cat) => cat.type === 'RECEITA')
                              .map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="account">Conta de Destino *</Label>
                        <Select
                          value={formData.account}
                          onValueChange={(value) => {
                            console.log('🏦 [TransactionModal] Conta selecionada:', {
                              value,
                              accountExists: safeAccounts.some(a => a.id === value),
                              availableAccounts: safeAccounts.map(a => ({ id: a.id, name: a.name }))
                            });
                            setFormData({ ...formData, account: value });
                          }}
                          required
                          disabled={loading || safeAccounts.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              loading
                                ? "Carregando contas..."
                                : safeAccounts.length === 0
                                  ? "Nenhuma conta cadastrada"
                                  : "Selecione..."
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {loading ? (
                              <SelectItem value="loading" disabled>
                                Carregando contas...
                              </SelectItem>
                            ) : safeAccounts.length === 0 ? (
                              <SelectItem value="no-accounts" disabled>
                                Nenhuma conta cadastrada. Crie uma conta primeiro.
                              </SelectItem>
                            ) : (
                              safeAccounts
                                .filter(
                                  (account) =>
                                    account.id && String(account.id).trim() !== ''
                                )
                                .map((account) => (
                                  <SelectItem
                                    key={account.id}
                                    value={String(account.id)}
                                  >
                                    {account.name}
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Recurring Income */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="recurring">Receita Recorrente</Label>
                      <Switch
                        id="recurring"
                        checked={formData.recurring}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, recurring: checked })
                        }
                      />
                    </div>

                    {formData.recurring && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <Label htmlFor="frequency">Frequência</Label>
                          <Select
                            value={formData.recurringFrequency}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                recurringFrequency: value as 'weekly' | 'monthly' | 'yearly',
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="monthly">Mensal</SelectItem>
                              <SelectItem value="yearly">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Duração</Label>
                          <Select
                            value={formData.recurringType}
                            onValueChange={(value: 'indefinite' | 'specific') =>
                              setFormData({ ...formData, recurringType: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="indefinite">
                                Até cancelar
                              </SelectItem>
                              <SelectItem value="specific">
                                Período específico
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.recurringType === 'specific' && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="recurring-end-date">
                                Data de término
                              </Label>
                              <Input
                                id="recurring-end-date"
                                type="text"
                                placeholder="dd/mm/aaaa"
                                value={formData.recurringEndDate}
                                onChange={(e) => {
                                  const formatted = formatDateInput(
                                    e.target.value
                                  );
                                  setFormData({
                                    ...formData,
                                    recurringEndDate: formatted,
                                  });
                                }}
                                maxLength={10}
                              />
                            </div>
                            <div>
                              <Label htmlFor="recurring-occurrences">
                                Número de ocorrências
                              </Label>
                              <Input
                                id="recurring-occurrences"
                                type="number"
                                min="1"
                                value={formData.recurringOccurrences}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    recurringOccurrences: e.target.value,
                                  })
                                }
                                placeholder="Ex: 12"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="expense" className="space-y-6 mt-6">
                {/* Expense Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingDown
                        className={`w-5 h-5 ${settings.colorfulIcons ? 'text-red-600' : 'text-muted-foreground'}`}
                      />
                      Informações da Despesa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="description">Descrição *</Label>
                      <Input
                        id="description"
                        placeholder="Ex: Almoço, Combustível, Compras..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        required
                      />
                    </div>



                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amount">Valor *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={formData.amount}
                          onChange={(e) =>
                            setFormData({ ...formData, amount: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="date">Data *</Label>
                        <DatePicker
                          id="date"
                          value={convertBRDateToISO(formData.date)}
                          onChange={(value) =>
                            setFormData({
                              ...formData,
                              date: convertISODateToBR(value),
                            })
                          }
                          placeholder="Selecionar data"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="category">Categoria *</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setShowNewCategoryInput(!showNewCategoryInput)
                            }
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Nova Categoria
                          </Button>
                        </div>

                        {showNewCategoryInput && (
                          <div className="flex gap-2 mb-2">
                            <Input
                              placeholder="Nome da nova categoria"
                              value={newCategoryName}
                              onChange={(e) =>
                                setNewCategoryName(e.target.value)
                              }
                              onKeyPress={(e) =>
                                e.key === 'Enter' && handleAddCustomCategory()
                              }
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddCustomCategory}
                            >
                              Adicionar
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowNewCategoryInput(false);
                                setNewCategoryName('');
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}

                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            setFormData({ ...formData, category: value })
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {loadedCategories
                              .filter((cat) => cat.type === 'DESPESA')
                              .map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}

                            {/* Custom categories */}
                            {customCategories.length > 0 && (
                              <>
                                <div className="px-2 py-1 text-xs font-medium text-gray-500 border-t">
                                  Categorias Personalizadas
                                </div>
                                {customCategories
                                  .filter(
                                    (category) =>
                                      category && category.trim() !== ''
                                  )
                                  .map((category) => (
                                    <SelectItem key={category} value={category}>
                                      <div className="flex items-center justify-between w-full">
                                        <span>{category}</span>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteCustomCategory(
                                              category
                                            );
                                          }}
                                          className="ml-2 h-4 w-4 p-0 text-red-500 hover:text-red-700"
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </SelectItem>
                                  ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="account">Pago com *</Label>
                        <Select
                          value={formData.account}
                          onValueChange={(value) => {
                            setFormData({ ...formData, account: value });
                          }}
                          required={!formData.isPaidBy}
                          disabled={loading || safeAccounts.length === 0 || formData.isPaidBy}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              formData.isPaidBy
                                ? "Não aplicável (pago por outra pessoa)"
                                : loading
                                  ? "Carregando contas..."
                                  : safeAccounts.length === 0
                                    ? "Nenhuma conta cadastrada"
                                    : "Selecione..."
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {renderAccountOptions()}
                          </SelectContent>
                        </Select>
                        {formData.isPaidBy && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                Conta não necessária
                              </span>
                            </div>
                            <p className="text-sm text-blue-700 mt-1">
                              Como outra pessoa pagou, não é necessário selecionar conta ou cartão.
                            </p>
                          </div>
                        )}
                        {!formData.isPaidBy && safeAccounts.length === 0 && (
                          <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                              <span className="text-sm font-medium text-orange-800">
                                Nenhuma conta cadastrada
                              </span>
                            </div>
                            <p className="text-sm text-orange-700 mt-1">
                              É necessário cadastrar pelo menos uma conta ou cartão antes de criar transações.
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2 text-orange-700 border-orange-300 hover:bg-orange-100"
                              onClick={() => {
                                onOpenChange(false);
                                // Redirecionar para página de contas
                                window.location.href = '/accounts';
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Cadastrar Conta
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Installments - Apenas para Cartões de Crédito */}
                    {isSelectedAccountCreditCard && (
                      <div>
                        <Label htmlFor="installments">Parcelas 💳</Label>
                        <Input
                          id="installments"
                          type="number"
                          min="1"
                          max="60"
                          value={formData.installments}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              installments: Number.parseInt(e.target.value) || 1,
                            })
                          }
                        />
                        {formData.installments > 1 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.installments}x de R${' '}
                            {(
                              parseNumber(formData.amount) /
                                formData.installments || 0
                            ).toFixed(2)}
                          </p>
                        )}
                        <p className="text-xs text-blue-600 mt-1">
                          💡 Parcelas disponíveis apenas para cartões de crédito
                        </p>
                      </div>
                    )}

                    {/* Recurring Expense */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="recurring-expense">
                        Despesa Recorrente
                      </Label>
                      <Switch
                        id="recurring-expense"
                        checked={formData.recurring}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, recurring: checked })
                        }
                      />
                    </div>

                    {formData.recurring && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <Label htmlFor="frequency-expense">Frequência</Label>
                          <Select
                            value={formData.recurringFrequency}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                recurringFrequency: value as 'weekly' | 'monthly' | 'yearly',
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="monthly">Mensal</SelectItem>
                              <SelectItem value="yearly">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Duração</Label>
                          <Select
                            value={formData.recurringType}
                            onValueChange={(value: 'indefinite' | 'specific') =>
                              setFormData({ ...formData, recurringType: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="indefinite">
                                Até cancelar
                              </SelectItem>
                              <SelectItem value="specific">
                                Período específico
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.recurringType === 'specific' && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="recurring-end-date-expense">
                                Data de término
                              </Label>
                              <Input
                                id="recurring-end-date-expense"
                                type="text"
                                placeholder="dd/mm/aaaa"
                                value={formData.recurringEndDate}
                                onChange={(e) => {
                                  const formatted = formatDateInput(
                                    e.target.value
                                  );
                                  setFormData({
                                    ...formData,
                                    recurringEndDate: formatted,
                                  });
                                }}
                                maxLength={10}
                              />
                            </div>
                            <div>
                              <Label htmlFor="recurring-occurrences-expense">
                                Número de ocorrências
                              </Label>
                              <Input
                                id="recurring-occurrences-expense"
                                type="number"
                                min="1"
                                value={formData.recurringOccurrences}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    recurringOccurrences: e.target.value,
                                  })
                                }
                                placeholder="Ex: 12"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Trip Linking Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Plane
                          className={`w-5 h-5 ${settings.colorfulIcons ? 'text-blue-600' : 'text-muted-foreground'}`}
                        />
                        Vincular à Viagem
                      </div>
                      <Switch
                        checked={formData.isLinkedToTrip}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            isLinkedToTrip: checked,
                            tripId:
                              checked && trips.length > 0 ? trips[0].id : '',
                          })
                        }
                      />
                    </CardTitle>
                  </CardHeader>

                  {formData.isLinkedToTrip && (
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Selecionar Viagem</Label>
                        <Select
                          value={formData.tripId}
                          onValueChange={(value) => {
                            const selectedTrip = trips.find(t => t.id === value);
                            setFormData({
                              ...formData,
                              tripId: value,
                              originalCurrency: selectedTrip?.currency || 'BRL'
                            });
                            if (selectedTrip && selectedTrip.currency !== 'BRL') {
                              setShowCurrencyConverter(true);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma viagem" />
                          </SelectTrigger>
                          <SelectContent>
                            {trips.map((trip) => (
                              <SelectItem key={trip.id} value={trip.id}>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  {trip.name} - {trip.destination}
                                  {trip.currency && trip.currency !== 'BRL' && (
                                    <Badge variant="outline" className="ml-2">
                                      {trip.currency}
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Aviso sobre moeda da viagem */}
                      {formData.tripId && (() => {
                        const selectedTrip = trips.find(t => t.id === formData.tripId);
                        if (selectedTrip && selectedTrip.currency && selectedTrip.currency !== 'BRL') {
                          return (
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-amber-800">
                                <p className="font-medium mb-1">Moeda da Viagem: {selectedTrip.currency}</p>
                                <p>
                                  Esta transação será registrada em <strong>{selectedTrip.currency}</strong>.
                                  {selectedTrip.currency !== 'BRL' && ' Use o conversor de moedas abaixo se necessário.'}
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {activeTrip && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-blue-900">
                              {activeTrip.name}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Orçamento:</span>
                              <span className="font-medium">
                                R$ {Number(activeTrip.budget).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Já gasto:</span>
                              <span className="font-medium text-red-600">
                                R$ {Number(activeTrip.spent).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Disponível:</span>
                              <span
                                className={`font-medium ${
                                  Number(activeTrip.budget) - Number(activeTrip.spent) >= 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                R${' '}
                                {(
                                  Number(activeTrip.budget) - Number(activeTrip.spent)
                                ).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {trips.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleLinkToActiveTrip}
                          className="w-full"
                        >
                          <Plane className="w-4 h-4 mr-2" />
                          Vincular à Primeira Viagem Ativa
                        </Button>
                      )}
                    </CardContent>
                  )}
                </Card>

                {/* Shared Expense Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users
                          className={`w-5 h-5 ${settings.colorfulIcons ? 'text-purple-600' : 'text-muted-foreground'}`}
                        />
                        Despesa Compartilhada
                      </div>
                      <Switch
                        checked={formData.isShared}
                        disabled={formData.isPaidBy} // ✅ Desabilitar se "Pago por outra pessoa"
                        onCheckedChange={(checked) => {
                          // ✅ Só permitir se não for "Pago por outra pessoa"
                          if (!formData.isPaidBy) {
                            setFormData({
                              ...formData,
                              isShared: checked,
                              selectedContacts: checked
                                ? formData.selectedContacts
                                : [],
                              sharedPercentages: checked
                                ? formData.sharedPercentages
                                : {},
                            });
                          }
                        }}
                      />
                    </CardTitle>
                  </CardHeader>

                  {formData.isShared && (
                    <CardContent className="space-y-6">
                      {/* Contact Selection */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label>Membros da Família</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowContactManager(true)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Membros
                          </Button>
                        </div>

                        {/* Quick Family Selection */}
                        <div className="flex flex-wrap gap-2">
                          {contacts.slice(0, 6).map((contact) => (
                            <Button
                              key={contact.id}
                              type="button"
                              variant={
                                formData.selectedContacts.includes(contact.id)
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() => {
                                if (
                                  formData.selectedContacts.includes(contact.id)
                                ) {
                                  removeContact(contact.id);
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    selectedContacts: [
                                      ...prev.selectedContacts,
                                      contact.id,
                                    ],
                                  }));
                                }
                              }}
                            >
                              {contact.name}
                            </Button>
                          ))}
                        </div>

                        {/* Selected Participants */}
                        {formData.selectedContacts.length > 0 && (
                          <div className="space-y-3">
                            <Label>Participantes Selecionados</Label>

                            {/* User */}
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback>EU</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">Você</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={
                                    formData.sharedPercentages['user'] || 0
                                  }
                                  onChange={(e) =>
                                    handlePercentageChange(
                                      'user',
                                      Number.parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-20 text-center"
                                  disabled={formData.divisionMethod === 'equal'}
                                />
                                <span className="text-sm text-gray-500">%</span>
                              </div>
                            </div>

                            {/* Selected Family Members */}
                            {selectedContactsData.map((contact) => (
                              <div
                                key={contact.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback>
                                      {contact.name
                                        .split(' ')
                                        .map((n: string) => n[0])
                                        .join('')
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <span className="font-medium">
                                      {contact.name}
                                    </span>
                                    <p className="text-xs text-gray-500">
                                      {contact.email}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={
                                      formData.sharedPercentages[contact.id] ||
                                      0
                                    }
                                    onChange={(e) =>
                                      handlePercentageChange(
                                        contact.id,
                                        Number.parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-20 text-center"
                                    disabled={
                                      formData.divisionMethod === 'equal'
                                    }
                                  />
                                  <span className="text-sm text-gray-500">
                                    %
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeContact(contact.id)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Division Method */}
                      {formData.selectedContacts.length > 0 && (
                        <div className="space-y-4">
                          <Label>Método de Divisão</Label>
                          <RadioGroup
                            value={formData.divisionMethod}
                            onValueChange={handleDivisionMethodChange}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="equal" id="equal" />
                              <Label
                                htmlFor="equal"
                                className="flex items-center gap-2"
                              >
                                <Equal className="w-4 h-4" />
                                Dividir igualmente
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="percentage"
                                id="percentage"
                              />
                              <Label
                                htmlFor="percentage"
                                className="flex items-center gap-2"
                              >
                                <Percent className="w-4 h-4" />
                                Por porcentagem
                              </Label>
                            </div>
                          </RadioGroup>

                          {/* Quick Actions */}
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleEqualSplit}
                            >
                              <Equal className="w-4 h-4 mr-2" />
                              Dividir Igualmente
                            </Button>
                            {formData.selectedContacts.length === 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleQuickSplit}
                              >
                                <Calculator className="w-4 h-4 mr-2" />
                                50/50
                              </Button>
                            )}

                            {/* Smart Splitting Options */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleSmartSplit('by_income')}
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Por Renda
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleSmartSplit('by_expense_history')
                              }
                            >
                              <TrendingDown className="w-4 h-4 mr-2" />
                              Por Histórico
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleSmartSplit('custom')}
                            >
                              <Calculator className="w-4 h-4 mr-2" />
                              Personalizado
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Division Summary */}
                      {formData.amount &&
                        formData.selectedContacts.length > 0 && (
                          <>
                            <Separator />
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">
                                  Total dos percentuais:
                                </span>
                                <Badge
                                  variant={
                                    getTotalPercentage === 100
                                      ? 'default'
                                      : 'destructive'
                                  }
                                >
                                  {getTotalPercentage.toFixed(1)}%
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">
                                  Sua parte:
                                </span>
                                <span className="font-medium text-blue-600">
                                  R$ {getMyAmount.toFixed(2)}
                                </span>
                              </div>
                              {getTotalPercentage !== 100 && (
                                <div className="flex items-center gap-2 text-sm text-amber-600">
                                  <AlertCircle className="w-4 h-4" />
                                  Ajuste os percentuais para totalizar 100%
                                </div>
                              )}
                            </div>
                          </>
                        )}
                    </CardContent>
                  )}
                </Card>

                {/* Paid By Section - Available for all expenses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-green-600" />
                        Pago por outra pessoa
                      </div>
                      <Switch
                        checked={formData.isPaidBy}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            isPaidBy: checked,
                            paidByPerson: checked ? formData.paidByPerson : '',
                          })
                        }
                      />
                    </CardTitle>
                  </CardHeader>

                  {formData.isPaidBy && (
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Quem pagou esta despesa?</Label>
                        <Select
                          value={formData.paidByPerson}
                          onValueChange={(value) =>
                            setFormData({ ...formData, paidByPerson: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione quem pagou" />
                          </SelectTrigger>
                          <SelectContent>
                            {contacts.map((contact) => (
                              <SelectItem key={contact.id} value={contact.id}>
                                {contact.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.paidByPerson && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              Informação sobre Dívida
                            </span>
                          </div>
                          <p className="text-sm text-blue-700">
                            O valor será registrado como dívida com{' '}
                            <strong>
                              {
                                contacts.find(
                                  (c) => c.id === formData.paidByPerson
                                )?.name
                              }
                            </strong>
                            . Se houver dívidas anteriores, o valor será
                            descontado automaticamente.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </TabsContent>

              {/* Notes Section */}
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Observações sobre a transação..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>



              {/* Currency Conversion Section */}
              {showCurrencyConverter && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Conversão de Moeda
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Moeda Original</Label>
                        <Select
                          value={formData.originalCurrency}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              originalCurrency: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCurrencies.map((currency) => (
                              <SelectItem
                                key={currency.code}
                                value={currency.code}
                              >
                                {currency.code} - {currency.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Taxa de Câmbio</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={formData.exchangeRate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              exchangeRate:
                                Number.parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="Ex: 5.2500"
                        />
                      </div>
                    </div>

                    {formData.originalCurrency &&
                      formData.exchangeRate > 0 &&
                      formData.amount && (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">
                                Valor Original:
                              </span>
                              <span className="font-medium">
                                {formData.originalCurrency}{' '}
                                {(
                                  Number.parseFloat(formData.amount) /
                                  formData.exchangeRate
                                ).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">
                                Taxa de Câmbio:
                              </span>
                              <span className="font-medium">
                                1 {formData.originalCurrency} = R${' '}
                                {formData.exchangeRate.toFixed(4)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">
                                Valor Convertido:
                              </span>
                              <span className="font-medium text-green-600">
                                R${' '}
                                {Number.parseFloat(formData.amount).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    loading ||
                    (safeAccounts.length === 0 && !formData.isPaidBy) // ✅ Permitir salvar se "Pago por outra pessoa"
                  }
                >
                  {isLoading ? 'Salvando...' : loading ? 'Carregando...' : 'Salvar Transação'}
                </Button>
              </div>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {showContactManager && (
        <Dialog open={showContactManager} onOpenChange={setShowContactManager}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gerenciar Membros da Família</DialogTitle>
            </DialogHeader>
            <FamilySelector
              selectedMembers={formData.selectedContacts}
              onSelectionChange={handleContactSelectionChange}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default AddTransactionModal;

