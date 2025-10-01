'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './button';
import { Calendar } from './calendar';
import { CalendarIcon, X } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: (date: Date) => boolean;
  id?: string;
  name?: string;
  clearable?: boolean;
  format?: 'BR' | 'ISO';
  showInput?: boolean;
}

export function DatePicker({
  value = '',
  onChange,
  selected,
  onSelect,
  placeholder = 'Selecionar data',
  disabled = false,
  className,
  required = false,
  minDate,
  maxDate,
  disabledDates,
  id,
  name,
  clearable = true,
  format: dateFormat = 'BR',
  showInput = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isInputMode, setIsInputMode] = useState(showInput);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sincroniza o valor do input com o valor externo
  useEffect(() => {
    if (value && value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  // Fecha o dropdown quando clica fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Converte string para Date
  const parseStringToDate = (dateString: string): Date | null => {
    if (!dateString) return null;

    try {
      // Formato BR: dd/mm/yyyy
      if (dateString.includes('/')) {
        const parsed = parse(dateString, 'dd/MM/yyyy', new Date());
        return isValid(parsed) ? parsed : null;
      }
      
      // Formato ISO: yyyy-mm-dd
      if (dateString.includes('-') && dateString.length === 10) {
        const parsed = new Date(dateString + 'T00:00:00');
        return isValid(parsed) ? parsed : null;
      }

      return null;
    } catch {
      return null;
    }
  };

  // Converte Date para string no formato especificado
  const formatDateToString = (date: Date): string => {
    if (!date || !isValid(date)) return '';
    
    if (dateFormat === 'ISO') {
      return format(date, 'yyyy-MM-dd');
    }
    
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  // Obtém o valor atual como Date
  const getCurrentDate = (): Date | undefined => {
    if (selected !== undefined) {
      return selected;
    }

    if (value) {
      const parsed = parseStringToDate(value);
      return parsed || undefined;
    }

    if (inputValue) {
      const parsed = parseStringToDate(inputValue);
      return parsed || undefined;
    }

    return undefined;
  };

  // Obtém o valor para exibição
  const getDisplayValue = (): string => {
    const currentDate = getCurrentDate();
    if (!currentDate) return placeholder;
    
    return formatDateToString(currentDate);
  };

  // Manipula seleção de data no calendário
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      handleClear();
      return;
    }

    // Verificar se a data está desabilitada
    if (isDateDisabled(date)) {
      return;
    }

    const formattedDate = formatDateToString(date);
    
    // Nova interface
    if (onSelect) {
      onSelect(date);
    }
    
    // Interface legacy
    if (onChange) {
      onChange(formattedDate);
    }

    setInputValue(formattedDate);
    setIsOpen(false);
  };

  // Limpa o valor
  const handleClear = () => {
    if (onSelect) {
      onSelect(undefined);
    }
    
    if (onChange) {
      onChange('');
    }

    setInputValue('');
    setIsOpen(false);
  };

  // Manipula mudança no input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Formatação automática para formato BR
    if (dateFormat === 'BR') {
      // Remove caracteres não numéricos
      newValue = newValue.replace(/\D/g, '');
      
      // Aplica máscara dd/mm/yyyy
      if (newValue.length >= 2) {
        newValue = newValue.substring(0, 2) + '/' + newValue.substring(2);
      }
      if (newValue.length >= 5) {
        newValue = newValue.substring(0, 5) + '/' + newValue.substring(5, 9);
      }
    }

    setInputValue(newValue);

    // Valida e propaga mudança se a data estiver completa
    if (newValue.length === 10) {
      const parsed = parseStringToDate(newValue);
      if (parsed && isValid(parsed)) {
        if (onSelect) {
          onSelect(parsed);
        }
        if (onChange) {
          onChange(newValue);
        }
      }
    } else if (newValue === '') {
      handleClear();
    }
  };

  // Manipula blur do input
  const handleInputBlur = () => {
    if (inputValue && inputValue.length === 10) {
      const parsed = parseStringToDate(inputValue);
      if (parsed && isValid(parsed)) {
        const formatted = formatDateToString(parsed);
        setInputValue(formatted);
        
        if (onSelect) {
          onSelect(parsed);
        }
        if (onChange) {
          onChange(formatted);
        }
      } else {
        // Se a data é inválida, limpa o campo
        setInputValue('');
        if (onChange) {
          onChange('');
        }
        if (onSelect) {
          onSelect(undefined);
        }
      }
    }
  };

  // Função para determinar datas desabilitadas
  const isDateDisabled = (date: Date): boolean => {
    if (disabled) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (disabledDates) return disabledDates(date);
    return false;
  };

  // Manipula teclas no input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setIsInputMode(false);
      setInputValue(value || '');
    }
  };

  if (!isMounted) {
    return (
      <Button
        variant="outline"
        className={cn(
          'w-full justify-start text-left font-normal',
          'text-muted-foreground',
          className
        )}
        disabled={true}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {placeholder}
      </Button>
    );
  }

  // Modo input direto
  if (isInputMode) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          placeholder={dateFormat === 'BR' ? 'dd/mm/aaaa' : 'yyyy-mm-dd'}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          maxLength={10}
          disabled={disabled}
          required={required}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'pr-20', // Espaço para os botões
            className
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsInputMode(false)}
            disabled={disabled}
          >
            <CalendarIcon className="h-3 w-3" />
          </Button>
          {clearable && inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleClear}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Modo calendário com dropdown customizado
  return (
    <div ref={containerRef} className="relative">
      <Button
        id={id}
        name={name}
        variant="outline"
        className={cn(
          'w-full justify-start text-left font-normal',
          !getCurrentDate() && 'text-muted-foreground',
          className
        )}
        disabled={disabled}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {getDisplayValue()}
        {clearable && getCurrentDate() && (
          <span
            className="ml-auto h-4 w-4 p-0 hover:bg-transparent cursor-pointer inline-flex items-center justify-center rounded-sm opacity-70 hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleClear();
            }}
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </Button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 z-[99999] mt-1 w-auto min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg"
          style={{ zIndex: 99999 }}
        >
          <div className="p-3">
            <Calendar
              mode="single"
              selected={getCurrentDate()}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              initialFocus
              locale={ptBR}
            />
            <div className="flex justify-between items-center mt-2 pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsInputMode(true);
                  setIsOpen(false);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="text-xs"
              >
                Digitar data
              </Button>
              {clearable && getCurrentDate() && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="text-xs"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de compatibilidade
export function DateInput(props: DatePickerProps & { showCalendar?: boolean }) {
  const { showCalendar = true, ...datePickerProps } = props;
  
  return (
    <DatePicker
      {...datePickerProps}
      showInput={!showCalendar}
    />
  );
}
