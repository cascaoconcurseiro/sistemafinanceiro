'use client';

import React, { useState } from 'react';
import { DatePicker } from '../../components/ui/date-picker';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function TestDatePickerPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Teste do DatePicker</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Teste Básico do DatePicker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Início</label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Selecionar data de início"
                  maxDate={endDate ? new Date(endDate) : undefined}
                />
                <p className="text-xs text-gray-500">Valor: {startDate || 'Nenhum'}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Fim</label>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Selecionar data de fim"
                  minDate={startDate ? new Date(startDate) : undefined}
                />
                <p className="text-xs text-gray-500">Valor: {endDate || 'Nenhum'}</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button 
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                variant="outline"
              >
                Limpar Tudo
              </Button>
              
              <Button 
                onClick={() => {
                  const today = new Date();
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  
                  setStartDate(today.toISOString().split('T')[0]);
                  setEndDate(tomorrow.toISOString().split('T')[0]);
                }}
              >
                Definir Hoje/Amanhã
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teste com Modo Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">DatePicker com Input Direto</label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Digite a data"
                showInput={true}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações de Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Data de Início:</strong> {startDate || 'Não definida'}</p>
              <p><strong>Data de Fim:</strong> {endDate || 'Não definida'}</p>
              <p><strong>Diferença em dias:</strong> {
                startDate && endDate 
                  ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
                  : 'N/A'
              }</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
