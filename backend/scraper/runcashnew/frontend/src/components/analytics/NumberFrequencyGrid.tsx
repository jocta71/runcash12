import React from 'react';
import { NumberFrequency } from '@/hooks/useRoletaAnalytics';
import { getRouletteNumberColor } from '@/utils/rouletteUtils';

interface NumberFrequencyGridProps {
  data: NumberFrequency[];
}

export const NumberFrequencyGrid: React.FC<NumberFrequencyGridProps> = ({ data }) => {
  // Se não houver dados, exibir mensagem
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-24 bg-[#1a1922] rounded-lg">
        <p className="text-gray-400">Sem dados disponíveis</p>
      </div>
    );
  }

  // Criar um mapa de frequência para fácil acesso
  const frequencyMap = data.reduce((acc, item) => {
    acc[item.numero] = item;
    return acc;
  }, {} as Record<number, NumberFrequency>);

  // Criar array com todos os números da roleta (0-36)
  const allNumbers = Array.from({ length: 37 }, (_, i) => i);

  // Função para determinar a intensidade da cor com base na frequência
  const getOpacity = (numero: number) => {
    const item = frequencyMap[numero];
    if (!item) return '0.3'; // Número não apareceu
    
    // Normalizar a porcentagem para um valor entre 0.4 e 1
    // Maior porcentagem = mais opaco
    return Math.max(0.4, Math.min(item.porcentagem / 10, 1)).toFixed(1);
  };

  return (
    <div className="space-y-3">
      {/* Grid de números */}
      <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
        {allNumbers.map(numero => {
          const item = frequencyMap[numero];
          const opacity = getOpacity(numero);
          const count = item ? item.total : 0;
          
          return (
            <div 
              key={numero}
              className={`relative flex flex-col items-center justify-center rounded-lg p-2 ${getRouletteNumberColor(numero).replace('text-white', 'text-white/90')}`}
              style={{ opacity }}
            >
              <span className="text-lg font-bold">{numero}</span>
              <span className="text-xs mt-1">{count}x</span>
              {item && (
                <span className="absolute top-0 right-0 text-[10px] px-1 bg-black/30 rounded-bl rounded-tr-lg">
                  {item.porcentagem}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex justify-center items-center space-x-4 pt-2">
        <div className="flex items-center">
          <div className="w-4 h-3 bg-gradient-to-r from-gray-600/40 to-gray-600 rounded mr-1" />
          <span className="text-xs text-gray-300">Menos frequente</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-3 bg-gradient-to-r from-gray-300/80 to-gray-300 rounded mr-1" />
          <span className="text-xs text-gray-300">Mais frequente</span>
        </div>
      </div>
    </div>
  );
}; 