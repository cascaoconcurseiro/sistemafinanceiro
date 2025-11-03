'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { usePeriod } from '@/contexts/period-context';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState } from 'react';

export function PeriodSelector() {
  const {
    selectedMonth,
    selectedYear,
    setMonthYear,
    getMonthYearLabel,
  } = usePeriod();

  const [isOpen, setIsOpen] = useState(false);

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setMonthYear(11, selectedYear - 1);
    } else {
      setMonthYear(selectedMonth - 1, selectedYear);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setMonthYear(0, selectedYear + 1);
    } else {
      setMonthYear(selectedMonth + 1, selectedYear);
    }
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setMonthYear(now.getMonth(), now.getFullYear());
    setIsOpen(false);
  };

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={goToPreviousMonth}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 font-semibold min-w-[100px]"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {getMonthYearLabel()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Selecionar Período</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentMonth}
              >
                Hoje
              </Button>
            </div>

            {/* Seletor de Ano */}
            <div>
              <label className="text-sm font-medium mb-2 block">Ano</label>
              <div className="grid grid-cols-5 gap-2">
                {years.map((year) => (
                  <Button
                    key={year}
                    variant={year === selectedYear ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setMonthYear(selectedMonth, year);
                    }}
                    className="h-8"
                  >
                    {year}
                  </Button>
                ))}
              </div>
            </div>

            {/* Seletor de Mês */}
            <div>
              <label className="text-sm font-medium mb-2 block">Mês</label>
              <div className="grid grid-cols-3 gap-2">
                {months.map((month, index) => (
                  <Button
                    key={month}
                    variant={index === selectedMonth ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setMonthYear(index, selectedYear);
                      setIsOpen(false);
                    }}
                    className="h-8 text-xs"
                  >
                    {month.substring(0, 3)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="sm"
        onClick={goToNextMonth}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
