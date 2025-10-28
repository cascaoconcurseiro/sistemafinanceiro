'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PeriodContextType {
  selectedMonth: number; // 0-11 (Janeiro = 0)
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  setMonthYear: (month: number, year: number) => void;
  getMonthName: () => string;
  getMonthYearLabel: () => string;
  getPeriodDates: () => { startDate: Date; endDate: Date };
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const setMonthYear = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const getMonthName = () => {
    const date = new Date(selectedYear, selectedMonth);
    return date.toLocaleDateString('pt-BR', { month: 'long' });
  };

  const getMonthYearLabel = () => {
    const date = new Date(selectedYear, selectedMonth);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  };

  const getPeriodDates = () => {
    const startDate = new Date(selectedYear, selectedMonth, 1);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(selectedYear, selectedMonth + 1, 0);
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
  };

  return (
    <PeriodContext.Provider
      value={{
        selectedMonth,
        selectedYear,
        setSelectedMonth,
        setSelectedYear,
        setMonthYear,
        getMonthName,
        getMonthYearLabel,
        getPeriodDates,
      }}
    >
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriod deve ser usado dentro de PeriodProvider');
  }
  return context;
}
