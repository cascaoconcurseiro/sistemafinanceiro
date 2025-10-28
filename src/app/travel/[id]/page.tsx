'use client';

import { ModernAppLayout } from '@/components/modern-app-layout';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccounts, useTransactions } from '@/contexts/unified-financial-context';

import type { Trip } from '@/lib/storage';
import { TripDetails } from '@/components/trip-details';

export default function TripPage() {
  const {
    accounts,
    create: createAccount,
    update: updateAccount,
    delete: deleteAccount,
  } = useAccounts();
  const {
    transactions,
    create: createTransaction,
    update: updateTransaction,
    delete: deleteTransaction,
  } = useTransactions();
  const params = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Listener para atualizar orçamento quando gastos compartilhados forem pagos
  useEffect(() => {
    const handleTripBudgetUpdate = (event: CustomEvent) => {
      const { tripId: updatedTripId, amountReturned } = event.detail;
      
      if (trip && trip.id === updatedTripId) {
        console.log('🔄 [TripPage] Atualizando orçamento da viagem:', {
          tripId: updatedTripId,
          valorDevolvido: amountReturned,
          gastoAnterior: trip.spent
        });
        
        // Atualizar o gasto da viagem (diminuir)
        const newSpent = Math.max(0, (trip.spent || 0) - amountReturned);
        
        setTrip(prevTrip => prevTrip ? {
          ...prevTrip,
          spent: newSpent
        } : null);
        
        // Também atualizar via API para persistir
        fetch(`/api/trips/${trip.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            spent: newSpent
          })
        }).catch(error => {
          console.error('Erro ao atualizar viagem na API:', error);
        });
      }
    };

    window.addEventListener('tripBudgetUpdated', handleTripBudgetUpdate as EventListener);
    
    return () => {
      window.removeEventListener('tripBudgetUpdated', handleTripBudgetUpdate as EventListener);
    };
  }, [trip]);

  useEffect(() => {
    if (isMounted && params.id) {
      console.log('Carregando viagem com ID:', params.id);
      
      // Primeiro tenta carregar da API
      fetch('/api/trips', { credentials: 'include' })
        .then(response => response.json())
        .then(responseData => {
          // Extrair o array de trips da resposta da API
          const trips = responseData.data?.trips || [];
          console.log('Viagens encontradas na API:', trips.length, trips);
          const foundTrip = trips.find((t) => t.id === params.id);
          
          if (foundTrip) {
            console.log('Viagem encontrada na API:', foundTrip);
            setTrip(foundTrip);
          } else {
            // localStorage foi removido - dados agora vêm apenas do banco de dados
            console.warn('Viagem não encontrada na API - localStorage removido, use apenas banco de dados');
            setTrip(null);
          }
          setLoading(false);
        })
        .catch(error => {
          console.error('Erro ao carregar viagens da API:', error);
          // localStorage foi removido - dados agora vêm apenas do banco de dados
          console.warn('Erro na API - localStorage removido, use apenas banco de dados');
          setTrip(null);
          setLoading(false);
        });
    }
  }, [isMounted, params.id]);

  if (!isMounted || loading) {
    return (
      <ModernAppLayout
        title="Detalhes da Viagem"
      >
        <div className="p-4 md:p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </ModernAppLayout>
    );
  }

  if (!trip) {
    return (
      <ModernAppLayout
        title="Viagem não encontrada"
      >
        <div className="p-4 md:p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Viagem não encontrada
            </h1>
            <p className="text-gray-600">
              A viagem que você está procurando não existe.
            </p>
          </div>
        </div>
      </ModernAppLayout>
    );
  }

  return (
    <ModernAppLayout
      title={`Viagem: ${trip.name}`}
    >
      <div className="p-4 md:p-6">
        <TripDetails
          trip={trip}
          onUpdate={(updatedTrip) => {
            setTrip(updatedTrip);
            // Update via API
            fetch('/api/trips', {
              method: 'PUT',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updatedTrip),
            }).catch(error => {
              console.error('Erro ao atualizar viagem:', error);
            });
          }}
        />
      </div>
    </ModernAppLayout>
  );
}
