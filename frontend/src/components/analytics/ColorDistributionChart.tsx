import React from 'react';
import { ColorDistribution } from '@/hooks/useRoletaAnalytics';

interface ColorDistributionChartProps {
  data: ColorDistribution[];
}

export const ColorDistributionChart: React.FC<ColorDistributionChartProps> = ({ data }) => {
  // Se não houver dados, exibir mensagem
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-24 bg-[#1a1922] rounded-lg">
        <p className="text-gray-400">Sem dados disponíveis</p>
      </div>
    );
  }

  // Cores para cada categoria
  const getColorClass = (cor: string) => {
    switch (cor.toLowerCase()) {
      case 'vermelho':
        return 'bg-red-600';
      case 'preto':
        return 'bg-black';
      case 'verde':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-3">
      {/* Barras de distribuição */}
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.cor} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white capitalize">{item.cor}</span>
              <span className="text-sm text-white">{item.porcentagem}% ({item.total})</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getColorClass(item.cor)}`} 
                style={{ width: `${item.porcentagem}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex justify-center space-x-4 pt-2">
        {data.map((item) => (
          <div key={item.cor} className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-1 ${getColorClass(item.cor)}`} />
            <span className="text-xs text-gray-300 capitalize">{item.cor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}; 