import React, { useMemo } from 'react';
import { getRouletteNumberColor } from '@/utils/rouletteUtils';

export function NumberFrequencyGrid({ data }) {
  // Verificar se temos dados para exibir
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-32 text-gray-400">
        Sem dados disponíveis
      </div>
    );
  }

  // Preparar mapa de frequência para acesso rápido
  const frequencyMap = useMemo(() => {
    return data.reduce((acc, item) => {
      acc[item.numero] = item;
      return acc;
    }, {});
  }, [data]);

  // Encontrar o número mais frequente para escala visual
  const maxFrequency = useMemo(() => {
    return Math.max(...data.map(item => item.total));
  }, [data]);

  // Função para calcular a opacidade com base na frequência
  const getOpacity = (frequency) => {
    return 0.3 + ((frequency / maxFrequency) * 0.7);
  };

  // Array de todos os números da roleta (0-36)
  const allNumbers = Array.from({ length: 37 }, (_, i) => i);

  // Organizar números em linhas de 3 (como em uma mesa de roleta)
  const rows = [];
  for (let i = 0; i < 12; i++) {
    rows.push([3*i + 1, 3*i + 2, 3*i + 3]);
  }

  return (
    <div className="space-y-4">
      {/* Zero no topo */}
      <div className="flex justify-center">
        <NumberCell 
          number={0} 
          frequency={frequencyMap[0]?.total || 0} 
          percentage={frequencyMap[0]?.porcentagem || 0}
          opacity={getOpacity(frequencyMap[0]?.total || 0)}
          maxFrequency={maxFrequency}
        />
      </div>

      {/* Grade principal de números */}
      <div className="grid grid-cols-3 gap-1">
        {rows.map((row, rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            {row.map(number => (
              <NumberCell 
                key={number}
                number={number} 
                frequency={frequencyMap[number]?.total || 0} 
                percentage={frequencyMap[number]?.porcentagem || 0}
                opacity={getOpacity(frequencyMap[number]?.total || 0)}
                maxFrequency={maxFrequency}
              />
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Legenda no rodapé */}
      <div className="flex justify-between text-xs text-gray-400 px-2">
        <div>Menos frequente</div>
        <div>Mais frequente</div>
      </div>
    </div>
  );
}

// Componente para célula individual do número
function NumberCell({ number, frequency, percentage, opacity, maxFrequency }) {
  // Determinar se é um "número quente" (alta frequência)
  const isHot = frequency >= (maxFrequency * 0.8);
  const isMedium = frequency >= (maxFrequency * 0.5) && !isHot;

  return (
    <div 
      className={`relative aspect-square rounded-full flex flex-col items-center justify-center ${getRouletteNumberColor(number)}`}
      style={{ opacity: Math.max(0.4, opacity) }}
    >
      <span className="text-sm font-bold">{number}</span>
      <span className="text-xs mt-0.5">{frequency}x</span>
      {(isHot || isMedium) && (
        <span 
          className={`absolute -top-1 -right-1 px-1 text-xs rounded-full ${isHot ? 'bg-red-500' : 'bg-yellow-500'} text-white`}
        >
          {isHot ? '🔥' : '⬆️'}
        </span>
      )}
    </div>
  );
} 