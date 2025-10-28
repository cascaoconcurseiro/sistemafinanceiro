'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EvolutionPoint } from '@/types/investment';
import { formatCurrency, formatDate } from '@/lib/utils';

interface EvolutionChartProps {
  data?: EvolutionPoint[];
}

export function EvolutionChart({ data }: EvolutionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Sem dados para exibir</p>
      </div>
    );
  }
  
  const chartData = data.map(point => ({
    date: formatDate(point.date, 'MMM/yy'),
    'Patrimônio': point.value,
    'Investido': point.invested,
    'Lucro': point.profit
  }));
  
  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="Patrimônio" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="Investido" 
            stroke="#6b7280" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="Lucro" 
            stroke="#22c55e" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Insights */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-muted-foreground">Patrimônio Atual</p>
          <p className="text-lg font-bold text-blue-600">
            {formatCurrency(data[data.length - 1]?.value || 0)}
          </p>
        </div>
        
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-muted-foreground">Total Investido</p>
          <p className="text-lg font-bold">
            {formatCurrency(data[data.length - 1]?.invested || 0)}
          </p>
        </div>
        
        <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
          <p className="text-muted-foreground">Rentabilidade</p>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(data[data.length - 1]?.profit || 0)}
          </p>
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-medium mb-2">{payload[0].payload.date}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}
