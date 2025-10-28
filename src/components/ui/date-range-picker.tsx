'use client';

import React, { useState } from 'react';
import { Calendar } from './calendar';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onDateChange: (startDate: Date, endDate: Date) => void;
  className?: string;
}

export function DateRangePicker({ 
  startDate, 
  endDate, 
  onDateChange, 
  className 
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(endDate);
  const [selectingStart, setSelectingStart] = useState(true);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (selectingStart) {
      setTempStartDate(date);
      setTempEndDate(undefined);
      setSelectingStart(false);
    } else {
      if (tempStartDate && date < tempStartDate) {
        // Se a data final for anterior à inicial, trocar
        setTempStartDate(date);
        setTempEndDate(tempStartDate);
      } else {
        setTempEndDate(date);
      }
      
      // Aplicar as datas selecionadas
      if (tempStartDate) {
        const finalStartDate = date < tempStartDate ? date : tempStartDate;
        const finalEndDate = date < tempStartDate ? tempStartDate : date;
        onDateChange(finalStartDate, finalEndDate);
        setIsOpen(false);
        setSelectingStart(true);
      }
    }
  };

  const formatDateRange = () => {
    if (startDate && endDate) {
      return `${format(startDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(endDate, 'dd/MM/yyyy', { locale: ptBR })}`;
    }
    if (startDate) {
      return `A partir de ${format(startDate, 'dd/MM/yyyy', { locale: ptBR })}`;
    }
    return 'Selecionar período';
  };

  const resetSelection = () => {
    setTempStartDate(undefined);
    setTempEndDate(undefined);
    setSelectingStart(true);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !startDate && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="text-sm font-medium mb-2">
            {selectingStart ? 'Selecione a data inicial' : 'Selecione a data final'}
          </div>
          {tempStartDate && (
            <div className="text-xs text-muted-foreground">
              Início: {format(tempStartDate, 'dd/MM/yyyy', { locale: ptBR })}
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={resetSelection}>
              Limpar
            </Button>
            {tempStartDate && !selectingStart && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setSelectingStart(true)}
              >
                Alterar início
              </Button>
            )}
          </div>
        </div>
        <Calendar
          mode="single"
          selected={selectingStart ? tempStartDate : tempEndDate}
          onSelect={handleDateSelect}
          disabled={(date) => date > new Date()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}