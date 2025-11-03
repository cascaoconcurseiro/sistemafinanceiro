'use client';

import React from 'react';
import { getBankByCode, getBankByName, GENERIC_BANK, type BankData } from '@/lib/banks-data';
import { Building2 } from 'lucide-react';

interface BankLogoProps {
  bankCode?: string;
  bankName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export function BankLogo({
  bankCode,
  bankName,
  size = 'md',
  showName = false,
  className = '',
}: BankLogoProps) {
  // Buscar banco por código ou nome
  let bank: BankData | undefined;
  
  if (bankCode) {
    bank = getBankByCode(bankCode);
  } else if (bankName) {
    bank = getBankByName(bankName);
  }

  // Se não encontrou, usar banco genérico
  if (!bank) {
    bank = GENERIC_BANK;
  }

  const sizeClass = sizeClasses[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {bank.logoUrl ? (
        <div 
          className={`${sizeClass} relative flex items-center justify-center rounded-lg overflow-hidden bg-white border border-gray-200 p-1`}
          style={{ backgroundColor: `${bank.color}10` }}
        >
          {/* Usando img nativo para melhor compatibilidade com SVGs externos */}
          <img
            src={bank.logoUrl}
            alt={bank.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback para ícone genérico se a imagem falhar
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<svg class="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>`;
              }
            }}
          />
        </div>
      ) : (
        <div 
          className={`${sizeClass} flex items-center justify-center rounded-lg bg-gray-100 border border-gray-200`}
        >
          <Building2 className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : size === 'lg' ? 'w-7 h-7' : 'w-9 h-9'} text-gray-400`} />
        </div>
      )}
      
      {showName && (
        <div className="flex flex-col">
          <span className={`font-medium ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}`}>
            {bank.name}
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-gray-500">
              {bank.code !== '000' ? `Código: ${bank.code}` : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Componente para seletor de banco
interface BankSelectorProps {
  value?: string; // Código do banco
  onChange: (bankCode: string, bankName: string) => void;
  className?: string;
}

export function BankSelector({ value, onChange, className = '' }: BankSelectorProps) {
  const [search, setSearch] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  
  const banks = React.useMemo(() => {
    const allBanks = getAllBanks();
    if (!search) return allBanks;
    
    const searchLower = search.toLowerCase();
    return allBanks.filter(bank => 
      bank.name.toLowerCase().includes(searchLower) ||
      bank.fullName.toLowerCase().includes(searchLower) ||
      bank.code.includes(searchLower)
    );
  }, [search]);

  const selectedBank = value ? getBankByCode(value) : undefined;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {selectedBank ? (
          <BankLogo bankCode={selectedBank.code} showName size="sm" />
        ) : (
          <span className="text-gray-500">Selecione um banco</span>
        )}
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="sticky top-0 bg-white p-2 border-b">
              <input
                type="text"
                placeholder="Buscar banco..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="py-1">
              {banks.map((bank) => (
                <button
                  key={bank.code}
                  type="button"
                  onClick={() => {
                    onChange(bank.code, bank.name);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className="w-full px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-left"
                >
                  <BankLogo bankCode={bank.code} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{bank.name}</div>
                    <div className="text-xs text-gray-500">Código: {bank.code}</div>
                  </div>
                </button>
              ))}
              {banks.length === 0 && (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  Nenhum banco encontrado
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Exportar função auxiliar
import { getAllBanks } from '@/lib/banks-data';
