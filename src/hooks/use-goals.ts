'use client';

import { useState, useEffect } from 'react';

// Interface para Goal
interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  category?: string;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

// Hook para buscar metas reais da API
export function useGoals() {
  const [isLoading, setIsLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/goals');
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar metas: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Mapear dados da API para o formato esperado
        const mappedGoals = (data.goals || []).map((goal: any) => ({
          id: goal.id.toString(),
          title: goal.name || goal.title,
          targetAmount: goal.target || goal.targetAmount || 0,
          currentAmount: goal.current || goal.currentAmount || 0,
          status: goal.status || 'active',
          progress: goal.progress || 0,
          category: goal.category,
          deadline: goal.deadline,
          createdAt: goal.createdAt,
          updatedAt: goal.updatedAt
        }));
        
        setGoals(mappedGoals);
      } catch (err) {
        console.error('Erro ao buscar metas:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setGoals([]); // Retornar array vazio em caso de erro
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, []);

  return {
    goals,
    isLoading,
    error
  };
}
