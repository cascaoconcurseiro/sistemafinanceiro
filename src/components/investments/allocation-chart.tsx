'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { AllocationData, InvestmentType, INVESTMENT_TYPE_LABELS } from '@/types/investment';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface AllocationChartProps {
  data?: AllocationData;
}

const COLORS: Record<InvestmentType, string> = {
  [InvestmentType.FIXED_INCOME]: '#3b82f6',  // blue
  [InvestmentType.STOCK]: '#22c55e',         // green
  [InvestmentType.REIT]: '#eab308',          // yellow
  [InvestmentType.CRYPTO]: '#f97316',        // orange
  [InvestmentType.INTERNATIONAL]: '#a855f7', // purple
  [InvestmentType.PENSION]: '#8b5cf6',       // violet
  [InvestmentType.OTHER]: '#6b7280'          // gray
};

export function AllocationChart({ data }: AllocationChartProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Sem dados para exibir</p>
      </div>
    );
  }
  
  const chartData = Object.entries(data)
    .filter(([_, item]) => item.value > 0)
    .map(([type, item]) => ({
      name: INVESTMENT_TYPE_LABELS[type as InvestmentType],
      value: item.value,
      percent: item.percent,
      count: item.count,
      type: type as InvestmentType
    }));
  
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nenhum investimento cadastrado</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.type]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legenda Customizada */}
      <div className="space-y-2">
        {chartData.map((entry) => (
          <div key={entry.type} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[entry.type] }}
              />
              <span>{entry.name}</span>
              <span className="text-muted-foreground">({entry.count})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatCurrency(entry.value)}</span>
              <span className="text-muted-foreground">{formatPercent(entry.percent)}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Alertas */}
      {chartData.some(d => d.percent > 50) && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ <strong>Atenção:</strong> Você tem mais de 50% em um único tipo de ativo. 
            Considere diversificar para reduzir riscos.
          </p>
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          Valor: {formatCurrency(data.value)}
        </p>
        <p className="text-sm text-muted-foreground">
          Percentual: {formatPercent(data.percent)}
        </p>
        <p className="text-sm text-muted-foreground">
          Ativos: {data.count}
        </p>
      </div>
    );
  }
  return null;
}
