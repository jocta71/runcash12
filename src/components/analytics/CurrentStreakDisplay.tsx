import React from 'react';
import { CurrentStreak } from '@/hooks/useRoletaAnalytics';

interface CurrentStreakDisplayProps {
  streak: CurrentStreak;
}

export const CurrentStreakDisplay: React.FC<CurrentStreakDisplayProps> = ({ streak }) => {
  if (!streak.type || !streak.value || streak.count <= 1) {
    return (
      <div className="p-3 bg-[#1a1922] rounded-lg border border-gray-700 w-full">
        <h3 className="text-sm font-medium text-gray-300 mb-1">Sequência atual</h3>
        <p className="text-white text-sm">Nenhuma sequência detectada</p>
      </div>
    );
  }

  // Determinar se a sequência é significativa
  const isSignificant = streak.count >= 4;
  
  // Estilo baseado na significância
  const borderClass = isSignificant 
    ? 'border-yellow-500/50 animate-pulse' 
    : 'border-gray-700';

  // Determinar cor do texto baseado no tipo de sequência
  const getValueColor = () => {
    if (streak.type === 'cor') {
      switch (streak.value.toLowerCase()) {
        case 'vermelho': return 'text-red-500';
        case 'preto': return 'text-white';
        case 'verde': return 'text-green-500';
        default: return 'text-white';
      }
    }
    
    return 'text-white';
  };

  // Gerar texto descritivo
  const getMessage = () => {
    if (isSignificant) {
      return `Sequência significativa de ${streak.count}x ${streak.value}`;
    }
    return `Sequência de ${streak.count}x ${streak.value}`;
  };

  return (
    <div className={`p-3 bg-[#1a1922] rounded-lg border ${borderClass} w-full`}>
      <h3 className="text-sm font-medium text-gray-300 mb-1">Sequência atual</h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm">
            Tipo: <span className="font-medium capitalize">{streak.type}</span>
          </p>
          <p className={`text-sm font-medium capitalize ${getValueColor()}`}>
            {streak.value} × {streak.count}
          </p>
        </div>
        
        {isSignificant && (
          <div className="bg-yellow-500/20 rounded-full px-3 py-1">
            <span className="text-yellow-400 text-xs font-medium">Alerta</span>
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-400 mt-2">{getMessage()}</p>
    </div>
  );
}; 