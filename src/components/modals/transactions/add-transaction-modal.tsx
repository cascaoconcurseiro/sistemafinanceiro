'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebouncedCallback } from '../../../hooks/use-debounce';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Switch } from '../../ui/switch';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Separator } from '../../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { DatePicker } from '../../ui/date-picker';
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
// Removed UnifiedFinancialSystem import - using direct storage access
import type { Trip, SharedDebt, Transaction } from '../../../lib/storage';
import { transactionManager } from '../../../lib/transaction-manager';
import { toast } from 'sonner';
import { FamilySelector } from '../../features/travel/family-selector';
import { SmartSuggestionsComponent } from '../../ui/smart-suggestions';
import { useCreateUnifiedTransaction } from '../../../hooks/use-unified-transactions';
import { useUnified } from '../../../contexts/unified-context-simple';
import {
  formatDateInput,
  convertBRDateToISO,
  convertISODateToBR,
  validateBRDate,
  getCurrentDateBR,
} from '../../../lib/utils/date-utils';
import { useSafeTheme } from '../../../hooks/use-safe-theme';
import { logComponents, logError } from '../../../lib/logger';
import { parseNumber, isValidNumber } from '../../../lib/utils/number-utils';

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
  const { accounts, actions, isLoading: engineLoading } = useUnified();
  const createTransactionMutation = useCreateUnifiedTransaction();
  const { settings } = useSafeTheme();
  // Simplified without auto-fill for now
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    account: '',
    date: getCurrentDateBR(),
    notes: '',
    isShared: false,
    selectedContacts: [] as string[],
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
    tags: [] as string[],
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
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
  const [expenseLocation, setExpenseLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  // Load family members from database API
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; email?: string }>>([]);
  
  useEffect(() => {
    const loadFamilyMembers = async () => {
      try {
        const response = await fetch('/api/family');
        if (response.ok) {
          const members = await response.json();
          const formattedMembers = members.map((member: { id: string; name: string; email?: string }) => ({
            id: member.id,
            name: member.name,
            email: member.email || undefined
          }));
          setContacts(formattedMembers);
        }
      } catch (error) {
        logError.ui('Error loading family members:', error);
        setContacts([]);
      }
    };
    
    loadFamilyMembers();
  }, []);
  const [trips, setTrips] = useState<Trip[]>([]);

  // Load trips from storage
  useEffect(() => {
    const loadData = () => {
      try {
        /**
         * @deprecated localStorage não é mais usado - dados ficam no banco
         * Dados agora vêm do banco via DataService
         */
        // TODO: Implementar carregamento via DataService
        // const tripsData = await DataService.getActiveTrips();
        // setTrips(tripsData);

        // Accounts are already loaded from useUnified hook
        // No need to set local state as accounts come from the hook
      } catch (error) {
        logError.ui('Error loading data:', error);
        setTrips([]);
      }
    };
    loadData();
  }, [accounts]);

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
        notes: editingTransaction.notes || '',
        isShared: !!(editingTransaction.metadata?.sharedWith && editingTransaction.metadata.sharedWith.length > 0),
        selectedContacts: editingTransaction.metadata?.sharedWith || [],
        sharedPercentages: editingTransaction.metadata?.sharedPercentages || {},
        divisionMethod: 'equal' as 'equal' | 'percentage' | 'amount',
        tripId: editingTransaction.metadata?.tripId || tripId || '',
        isLinkedToTrip: !!(editingTransaction.metadata?.tripId || tripId),
        installments: editingTransaction.installmentInfo?.totalInstallments || 1,
        recurring: editingTransaction.recurringInfo?.isRecurring || false,
        recurringFrequency: 'monthly' as 'weekly' | 'monthly' | 'yearly',
        recurringType: 'indefinite' as 'indefinite' | 'specific',
        recurringEndDate: '',
        recurringOccurrences: '',
        tags: editingTransaction.tags || [],
        originalCurrency: editingTransaction.metadata?.originalCurrency || 'BRL',
        exchangeRate: editingTransaction.metadata?.exchangeRate || 1,
        convertedAmount: editingTransaction.metadata?.convertedAmount || '',
        isPaidBy: editingTransaction.metadata?.isPaidBy || false,
        paidByPerson: editingTransaction.metadata?.paidByPerson || '',
      });
      setSelectedTags(editingTransaction.tags || []);
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

  // Reset form function
  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      type: 'expense',
      category: '',
      account: '',
      date: getCurrentDateBR(),
      notes: '',
      isShared: false,
      selectedContacts: [],
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
      tags: [],
      originalCurrency: 'BRL',
      exchangeRate: 1,
      convertedAmount: '',
      isPaidBy: false,
      paidByPerson: '',
    });
    setSelectedTags([]);
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

    // Fallback to default tags for now
    setAvailableTags([
      'Essencial',
      'Lazer',
      'Trabalho',
      'Emergência',
      'Investimento',
      'Educação',
      'Saúde',
      'Outros',
    ]);
  }, []);

  // Auto-suggest tags based on description
  useEffect(() => {
    if (formData.description.length > 2) {
      const description = formData.description.toLowerCase();
      const suggestions: string[] = [];

      if (
        description.includes('supermercado') ||
        description.includes('mercado') ||
        description.includes('compra')
      ) {
        suggestions.push('alimentação');
      }
      if (
        description.includes('uber') ||
        description.includes('taxi') ||
        description.includes('ônibus') ||
        description.includes('gasolina')
      ) {
        suggestions.push('transporte');
      }
      if (
        description.includes('médico') ||
        description.includes('farmácia') ||
        description.includes('hospital')
      ) {
        suggestions.push('saúde');
      }
      if (
        description.includes('escola') ||
        description.includes('curso') ||
        description.includes('livro')
      ) {
        suggestions.push('educação');
      }
      if (
        description.includes('cinema') ||
        description.includes('restaurante') ||
        description.includes('bar')
      ) {
        suggestions.push('lazer');
      }
      if (
        description.includes('aluguel') ||
        description.includes('conta') ||
        description.includes('luz') ||
        description.includes('água')
      ) {
        suggestions.push('casa');
      }

      setSuggestedTags(
        suggestions.filter((tag) => !selectedTags.includes(tag))
      );
    } else {
      setSuggestedTags([]);
    }
  }, [formData.description, selectedTags]);

  // Sync selectedTags with formData.tags
  useEffect(() => {
    setFormData((prev) => ({ ...prev, tags: selectedTags }));
  }, [selectedTags]);

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

  const activeTrip = useMemo(
    () => trips.find((t) => t.id === formData.tripId),
    [trips, formData.tripId]
  );

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
        logError.ui('Erro na conversão de moeda:', error);
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

  const handleTagToggle = (tagName: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagName)) {
        return prev.filter((t) => t !== tagName);
      } else {
        return [...prev, tagName];
      }
    });

    setFormData((prev) => ({
      ...prev,
      tags: selectedTags.includes(tagName)
        ? selectedTags.filter((t) => t !== tagName)
        : [...selectedTags, tagName],
    }));
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
      if (!accounts || accounts.length === 0) {
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

      // Validação de conta obrigatória
      if (!formData.account || formData.account === 'Dinheiro') {
        toast.error('Por favor, selecione uma conta válida para a transação');
        setIsLoading(false);
        return;
      }

      // Verificar se a conta selecionada existe na lista de contas disponíveis
      const selectedAccount = accounts.find(acc => acc.id === formData.account);
      if (!selectedAccount) {
        toast.error('A conta selecionada não é válida. Por favor, selecione uma conta existente');
        setIsLoading(false);
        return;
      }

      if (formData.isShared && formData.type === 'expense') {
        if (formData.selectedContacts.length === 0) {
          toast.error('Selecione pelo menos um membro para compartilhar');
          return;
        }

        if (Math.abs(getTotalPercentage - 100) > 0.01) {
          toast.error(
            `A soma dos percentuais deve ser 100%. Atual: ${getTotalPercentage.toFixed(1)}%`
          );
          return;
        }

        // Validação para "Pago por"
        if (formData.isPaidBy && !formData.paidByPerson) {
          toast.error('Selecione quem pagou a despesa');
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
        date: convertBRDateToISO(formData.date),
        notes: formData.notes,
        installments:
          formData.installments > 1 ? formData.installments : undefined,
        recurring: formData.recurring || undefined,
        location: expenseLocation,
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
        // Check if it's an installment transaction
        if (formData.installments > 1) {
          const baseTransaction = {
            description: formData.description,
            amount: Math.abs(adjustedFinalAmount),
            type: formData.isShared && formData.type === 'expense' ? 'shared' : formData.type,
            account: formData.account,
            category: formData.category,
            subcategory: formData.subcategory || undefined,
            date: convertBRDateToISO(formData.date),
            notes: formData.notes,
            tags: selectedTags,
          };

          // Create installment transactions using transactionManager
          await transactionManager.createInstallmentTransaction(
            baseTransaction,
            formData.installments,
            convertBRDateToISO(formData.date)
          );
        }
        // Check if it's a recurring transaction
        else if (formData.recurring?.enabled) {
          const baseTransaction = {
            description: formData.description,
            amount: Math.abs(adjustedFinalAmount),
            type: formData.isShared && formData.type === 'expense' ? 'shared' : formData.type,
            account: formData.account,
            category: formData.category,
            subcategory: formData.subcategory || undefined,
            date: convertBRDateToISO(formData.date),
            notes: formData.notes,
            tags: selectedTags,
          };

          const recurringConfig = {
            frequency: formData.recurringFrequency || 'monthly',
            type: formData.recurringType || 'fixed',
            endDate: formData.recurringEndDate ? convertBRDateToISO(formData.recurringEndDate) : undefined,
            occurrences: formData.recurringOccurrences || undefined,
            enabled: true,
          };

          // Create recurring transaction using transactionManager
          transactionManager.createRecurringTransaction(baseTransaction, recurringConfig);
        }
        // Regular transaction
        else {
          // Save new transaction using API
          const transactionData = {
            description: formData.description,
            amount: Math.abs(adjustedFinalAmount), // API espera valor positivo
            type: formData.type === 'expense' ? 'debit' : 'credit', // Converter para tipos da API
            category: formData.category,
            accountId: formData.account,
            date: convertBRDateToISO(formData.date),
            status: 'cleared',
          };

          const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(transactionData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro da API:', errorData);
            throw new Error(errorData.error || 'Erro ao salvar transação');
          }

          const savedTransaction = await response.json();

          // Se for transação compartilhada, criar billing payments
          if (formData.isShared && formData.sharedWith && formData.sharedWith.length > 0) {
            const transactionForBilling = {
              ...savedTransaction,
              sharedWith: formData.sharedWith,
              amount: adjustedFinalAmount // Usar o valor original com sinal
            };
            storage.createBillingPayments(transactionForBilling);
          }
        }
      }

      // Process debt logic if "Pago por" is enabled
      if (
        formData.isShared &&
        formData.type === 'expense' &&
        formData.isPaidBy &&
        formData.paidByPerson
      ) {
        const paidByContact = contacts.find(
          (c) => c.id === formData.paidByPerson
        );
        if (paidByContact) {
          const userShare = getMyAmount; // Valor que o usuário deve

          // Processar pagamento de dívida
          const result = storage.processDebtPayment(
            'user',
            paidByContact.name,
            userShare
          );

          if (result.debtPaid > 0) {
            toast.success(
              `Dívida Quitada! R$ ${result.debtPaid.toFixed(2)} de dívida anterior foi quitada com ${paidByContact.name}.`
            );
          }

          if (result.newDebtCreated) {
            toast.info(
              `Nova Dívida Criada: Você deve R$ ${result.remainingAmount.toFixed(2)} para ${paidByContact.name}.`
            );
          }

          if (result.debtPaid === 0 && !result.newDebtCreated) {
            // Criar nova dívida se não havia dívidas anteriores
            const newDebt: SharedDebt = {
              id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              creditor: paidByContact.name,
              debtor: 'user',
              originalAmount: userShare,
              currentAmount: userShare,
              description: `Despesa: ${formData.description}`,
              transactionId: transactionData.id || `trans_${Date.now()}`,
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            const financialSystem = UnifiedFinancialSystem.getInstance();
            await financialSystem.createSharedDebt(newDebt);

            toast.info(
              `Dívida Registrada: Você deve R$ ${userShare.toFixed(2)} para ${paidByContact.name}.`
            );
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

      // If linked to a trip, update trip expenses
      if (formData.tripId && formData.type === 'expense') {
        const tripAmount = finalConvertedAmount || amount;

        storage.addTripExpense(formData.tripId, tripAmount);
      }

      // Call onSave callback if provided
      onSave?.();

      // Reset form only if not editing
      if (!editingTransaction) {
        resetForm();
      }

      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar transação');
      logError.transaction('Transaction save error:', error);
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
                          handleDescriptionChange(e.target.value)
                        }
                        required
                      />
                    </div>

                    {/* Smart Suggestions */}
                    {formData.description.trim().length > 2 && (
                      <SmartSuggestionsComponent
                        description={formData.description}
                        onCategorySelect={(category) => {
                          setFormData((prev) => ({ ...prev, category }));
                        }}
                        onTagsSelect={(tags) => {
                          setSelectedTags(tags);
                        }}
                        onAutoNoteSelect={(note) => {
                          setFormData((prev) => ({ ...prev, notes: note }));
                        }}
                        currentCategory={formData.category}
                        currentTags={selectedTags}
                      />
                    )}

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
                            {categories.income
                              .filter(
                                (category) => category && category.trim() !== ''
                              )
                              .map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="account">Conta de Destino *</Label>
                        <Select
                          value={formData.account}
                          onValueChange={(value) =>
                            setFormData({ ...formData, account: value })
                          }
                          required
                          disabled={accounts.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={accounts.length === 0 ? "Nenhuma conta cadastrada" : "Selecione..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.length === 0 ? (
                              <SelectItem value="no-accounts" disabled>
                                Nenhuma conta cadastrada. Crie uma conta primeiro.
                              </SelectItem>
                            ) : (
                              accounts
                                .filter(
                                  (account) =>
                                    account.id && String(account.id).trim() !== ''
                                )
                                .map((account) => (
                                  <SelectItem
                                    key={account.id}
                                    value={String(account.id)}
                                  >
                                    {account.name} - {account.bank}
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

                    {/* Smart Suggestions */}
                    {formData.description.trim().length > 2 && (
                      <SmartSuggestionsComponent
                        description={formData.description}
                        onCategorySelect={(category) => {
                          setFormData((prev) => ({ ...prev, category }));
                        }}
                        onTagsSelect={(tags) => {
                          setSelectedTags(tags);
                        }}
                        onAutoNoteSelect={(note) => {
                          setFormData((prev) => ({ ...prev, notes: note }));
                        }}
                        currentCategory={formData.category}
                        currentTags={selectedTags}
                      />
                    )}

                    {/* Tags Section */}
                    <div>
                      <Label>Tags</Label>
                      <div className="space-y-2">
                        {suggestedTags.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              Sugestões automáticas:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {suggestedTags.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => handleTagToggle(tag)}
                                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                    selectedTags.includes(tag)
                                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {availableTags.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              Tags disponíveis:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {availableTags
                                .filter((tag) => !suggestedTags.includes(tag))
                                .map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleTagToggle(tag)}
                                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                      selectedTags.includes(tag)
                                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    {tag}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}

                        {selectedTags.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              Tags selecionadas:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-3 py-1 bg-blue-100 border border-blue-300 text-blue-700 rounded-full text-sm flex items-center gap-1"
                                >
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => handleTagToggle(tag)}
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
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
                            {/* Default categories */}
                            {categories.expense
                              .filter(
                                (category) => category && category.trim() !== ''
                              )
                              .map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
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
                          onValueChange={(value) =>
                            setFormData({ ...formData, account: value })
                          }
                          required
                          disabled={accounts.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={accounts.length === 0 ? "Nenhuma conta cadastrada" : "Selecione..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.length === 0 ? (
                              <SelectItem value="no-accounts" disabled>
                                Nenhuma conta cadastrada. Crie uma conta primeiro.
                              </SelectItem>
                            ) : (
                              accounts
                                .filter(
                                  (account) =>
                                    account.id && String(account.id).trim() !== ''
                                )
                                .map((account) => (
                                  <SelectItem
                                    key={account.id}
                                    value={String(account.id)}
                                  >
                                    {account.name} - {account.bank}
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                        {accounts.length === 0 && (
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

                    {/* Installments */}
                    <div>
                      <Label htmlFor="installments">Parcelas</Label>
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
                    </div>

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
                          onValueChange={(value) =>
                            setFormData({ ...formData, tripId: value })
                          }
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
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

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
                                R$ {activeTrip.budget.toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Já gasto:</span>
                              <span className="font-medium text-red-600">
                                R$ {activeTrip.spent.toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Disponível:</span>
                              <span
                                className={`font-medium ${
                                  activeTrip.budget - activeTrip.spent >= 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                R${' '}
                                {(
                                  activeTrip.budget - activeTrip.spent
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
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            isShared: checked,
                            selectedContacts: checked
                              ? formData.selectedContacts
                              : [],
                            sharedPercentages: checked
                              ? formData.sharedPercentages
                              : {},
                          })
                        }
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

              {/* Location Section */}
              <div className="space-y-3">
                <Label>Localização</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (
                        typeof navigator !== 'undefined' &&
                        navigator.geolocation
                      ) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            const location = {
                              lat: position.coords.latitude,
                              lng: position.coords.longitude,
                            };
                            setExpenseLocation(location);
                            toast.success('Localização capturada com sucesso!');
                          },
                          (error) => {
                            toast.error(
                              'Erro ao capturar localização: ' + error.message
                            );
                          }
                        );
                      } else {
                        toast.error(
                          'Geolocalização não suportada pelo navegador'
                        );
                      }
                    }}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Capturar Localização
                  </Button>
                  {expenseLocation && (
                    <>
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        {`${expenseLocation.lat.toFixed(6)}, ${expenseLocation.lng.toFixed(6)}`}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpenseLocation(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
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
                <Button type="submit" disabled={isLoading || accounts.length === 0}>
                  {isLoading ? 'Salvando...' : 'Salvar Transação'}
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

