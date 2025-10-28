import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';

interface Investment {
  id: string;
  ticker: string;
  symbol: string;
  name: string;
  type: string;
  quantity: number;
  totalInvested: number;
  purchasePrice: number;
  currentPrice?: number;
  broker?: string;
  status: string;
  purchaseDate?: string;
  transactions: any[];
}

interface Portfolio {
  currentValue: number;
  totalInvested: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  totalAssets: number;
}

export function useOptimizedInvestments() {
  const { transactions, loading, error } = useUnifiedFinancial();
  const [lastCalculation, setLastCalculation] = useState<number>(0);
  const cacheRef = useRef<{ investments: Investment[]; portfolio: Portfolio } | null>(null);
  
  // Memoize investment calculations with cache invalidation
  const { investments, portfolio } = useMemo(() => {
    const now = Date.now();
    
    // Use cache if data hasn't changed and cache is less than 5 seconds old
    if (cacheRef.current && (now - lastCalculation) < 5000) {
      return cacheRef.current;
    }
    
    console.log('🔄 [useOptimizedInvestments] Recalculando investimentos...');
    
    const investmentMap = new Map<string, Investment>();
    
    // Process investment transactions
    (transactions || [])
      .filter(t => t.category === 'investment')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(transaction => {
        const metadata = transaction.metadata || {};
        const symbol = metadata.symbol || transaction.description?.split(' ')[0] || 'UNKNOWN';
        
        if (!investmentMap.has(symbol)) {
          investmentMap.set(symbol, {
            id: symbol,
            ticker: symbol,
            symbol: symbol,
            name: transaction.description || symbol,
            type: metadata.assetType || 'stock',
            quantity: 0,
            totalInvested: 0,
            purchasePrice: 0,
            currentPrice: 0,
            broker: metadata.brokerId || 'unknown',
            status: 'active',
            purchaseDate: transaction.date,
            transactions: []
          });
        }
        
        const investment = investmentMap.get(symbol)!;
        investment.transactions.push(transaction);
        
        if (transaction.type === 'expense' && metadata.operationType === 'buy') {
          const qty = metadata.quantity || 1;
          const price = metadata.unitPrice || (Math.abs(transaction.amount) / qty);
          
          const oldTotal = investment.quantity * investment.purchasePrice;
          const newTotal = qty * price;
          investment.quantity += qty;
          investment.totalInvested += Math.abs(transaction.amount);
          investment.purchasePrice = investment.quantity > 0 ? (oldTotal + newTotal) / investment.quantity : price;
          investment.currentPrice = price;
          
        } else if (transaction.type === 'income' && metadata.operationType === 'sell') {
          const qty = metadata.quantity || 1;
          investment.quantity -= qty;
          
          if (investment.quantity <= 0) {
            investment.status = 'sold';
            investment.quantity = 0;
          }
        }
      });
    
    const investmentsList = Array.from(investmentMap.values());
    const activeInvestments = investmentsList.filter(inv => inv.status === 'active' && inv.quantity > 0);
    
    const totalInvested = activeInvestments.reduce((sum, inv) => sum + inv.totalInvested, 0);
    const currentValue = activeInvestments.reduce((sum, inv) => {
      const price = inv.currentPrice || inv.purchasePrice;
      return sum + (price * inv.quantity);
    }, 0);
    
    const totalGainLoss = currentValue - totalInvested;
    const totalGainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
    
    const portfolioData: Portfolio = {
      currentValue,
      totalInvested,
      totalGainLoss,
      totalGainLossPercentage,
      totalAssets: activeInvestments.length,
    };
    
    const result = {
      investments: investmentsList,
      portfolio: portfolioData
    };
    
    // Cache the result
    cacheRef.current = result;
    setLastCalculation(now);
    
    console.log('✅ [useOptimizedInvestments] Investimentos calculados:', {
      total: investmentsList.length,
      active: activeInvestments.length,
      totalValue: currentValue
    });
    
    return result;
  }, [transactions, lastCalculation]);
  
  // Force recalculation when needed
  const invalidateCache = useCallback(() => {
    cacheRef.current = null;
    setLastCalculation(0);
  }, []);
  
  return {
    investments,
    portfolio,
    isLoading: loading,
    error,
    invalidateCache
  };
}
