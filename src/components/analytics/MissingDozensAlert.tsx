import React from 'react';
import { MissingDozen } from '@/hooks/useRoletaAnalytics';

interface MissingDozensAlertProps {
  dozens: MissingDozen[];
}

export const MissingDozensAlert: React.FC<MissingDozensAlertProps> = ({ dozens }) => {
  if (!dozens || dozens.length === 0) {
    return null;
  }

  // Encontrar a dúzia com maior ausência
  const mostMissingDozen = dozens.reduce((prev, current) => 
    prev.ausencia > current.ausencia ? prev : current
  );

  // Verificar se a ausência é significativa
  const isSignificant = mostMissingDozen.ausencia >= 25;
  
  // Formatar o nome da dúzia
  const formatDozenaName = (name: string) => {
    switch (name) {
      case 'primeira': return '1-12';
      case 'segunda': return '13-24';
      case 'terceira': return '25-36';
      default: return name;
    }
  };

  // Determinar nível de alerta
  const getAlertLevel = (ausencia: number) => {
    if (ausencia >= 30) return 'high';
    if (ausencia >= 20) return 'medium';
    if (ausencia >= 15) return 'low';
    return 'none';
  };

  const alertLevel = getAlertLevel(mostMissingDozen.ausencia);

  // Classes e textos baseados no nível de alerta
  const alertConfig = {
    high: {
      borderClass: 'border-red-500/50 animate-pulse',
      bgClass: 'bg-red-500/20',
      textClass: 'text-red-400',
      message: 'Dúzia fortemente ausente!',
      alert: 'ALTO'
    },
    medium: {
      borderClass: 'border-yellow-500/50',
      bgClass: 'bg-yellow-500/20',
      textClass: 'text-yellow-400',
      message: 'Dúzia significativamente ausente',
      alert: 'MÉDIO'
    },
    low: {
      borderClass: 'border-blue-500/50',
      bgClass: 'bg-blue-500/20',
      textClass: 'text-blue-400',
      message: 'Dúzia ausente por um tempo',
      alert: 'BAIXO'
    },
    none: {
      borderClass: 'border-gray-700',
      bgClass: 'bg-gray-700/20',
      textClass: 'text-gray-400',
      message: 'Sem alertas significativos',
      alert: 'NENHUM'
    }
  };

  const config = alertConfig[alertLevel];

  return (
    <div className={`p-3 bg-[#1a1922] rounded-lg border ${config.borderClass} w-full`}>
      <h3 className="text-sm font-medium text-gray-300 mb-1">Dúzias ausentes</h3>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm">
            Dúzia: <span className="font-medium">{formatDozenaName(mostMissingDozen.dezena)}</span>
          </p>
          <p className="text-white text-sm">
            Ausente há: <span className="font-medium">{mostMissingDozen.ausencia} rodadas</span>
          </p>
        </div>
        
        {isSignificant && (
          <div className={`${config.bgClass} rounded-full px-3 py-1`}>
            <span className={`${config.textClass} text-xs font-medium`}>{config.alert}</span>
          </div>
        )}
      </div>
      
      <p className={`text-xs ${config.textClass} mt-2`}>{config.message}</p>
    </div>
  );
}; 