import React from 'react';
import { useRoletaAnalytics } from '@/hooks/useRoletaAnalytics';
import { ColorDistributionChart } from './analytics/ColorDistributionChart';
import { NumberFrequencyGrid } from './analytics/NumberFrequencyGrid';
import { CurrentStreakDisplay } from './analytics/CurrentStreakDisplay';
import { MissingDozensAlert } from './analytics/MissingDozensAlert';

interface RoletaAnalyticsDashboardProps {
  roletaNome: string;
}

export const RoletaAnalyticsDashboard: React.FC<RoletaAnalyticsDashboardProps> = ({ roletaNome }) => {
  const { 
    colorDistribution, 
    numberFrequency, 
    currentStreak,
    missingDozens,
    loading, 
    error 
  } = useRoletaAnalytics(roletaNome);

  // Estado de carregamento
  if (loading) {
    return (
      <div className="p-6 bg-[#1a1922] rounded-xl border border-white/10 animate-pulse space-y-6">
        <div className="h-6 bg-gray-700 rounded w-1/3"></div>
        <div className="space-y-4">
          <div className="h-28 bg-gray-700 rounded"></div>
          <div className="h-40 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="p-6 bg-[#1a1922] rounded-xl border border-red-500/20 space-y-4">
        <h2 className="text-xl font-bold text-white">Erro ao carregar análises</h2>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  // Função para sugerir estratégia com base nos dados
  const getSuggestedStrategy = () => {
    // Verificar sequência de cores
    if (currentStreak.type === 'cor' && currentStreak.count >= 4) {
      const nextColor = currentStreak.value === 'vermelho' ? 'preto' : 'vermelho';
      return {
        description: `Sequência de ${currentStreak.count} ${currentStreak.value}. Considere apostar na reversão para ${nextColor}.`,
        bets: [nextColor === 'vermelho' ? 'Vermelho' : 'Preto']
      };
    }
    
    // Verificar dúzias ausentes
    const longMissingDozen = missingDozens.find(d => d.ausencia > 25);
    if (longMissingDozen) {
      return {
        description: `A dúzia ${longMissingDozen.dezena} está ausente há ${longMissingDozen.ausencia} rodadas. Considere apostar nessa dúzia.`,
        bets: [`Dúzia ${longMissingDozen.dezena}`]
      };
    }
    
    // Verificar distribuição de cores desequilibrada
    const redItem = colorDistribution.find(c => c.cor === 'vermelho');
    const blackItem = colorDistribution.find(c => c.cor === 'preto');
    
    if (redItem && blackItem && Math.abs(redItem.porcentagem - blackItem.porcentagem) > 15) {
      const lessFrequentColor = redItem.porcentagem < blackItem.porcentagem ? 'vermelho' : 'preto';
      return {
        description: `Desequilíbrio significativo entre cores: ${Math.round(Math.abs(redItem.porcentagem - blackItem.porcentagem))}% de diferença. Considere apostar na cor menos frequente (${lessFrequentColor}).`,
        bets: [lessFrequentColor === 'vermelho' ? 'Vermelho' : 'Preto']
      };
    }
    
    return null;
  };

  const suggestedStrategy = getSuggestedStrategy();

  return (
    <div className="p-6 bg-[#1a1922] rounded-xl border border-[#00ff00]/10 space-y-6">
      <h2 className="text-2xl font-bold text-[#00ff00]">Análise da Roleta: {roletaNome}</h2>
      
      {/* Alertas e Sequências */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CurrentStreakDisplay streak={currentStreak} />
        <MissingDozensAlert dozens={missingDozens} />
      </div>
      
      {/* Distribuição de cores */}
      <div className="p-4 bg-[#17161e] rounded-lg border border-white/5">
        <h3 className="text-lg font-semibold text-white mb-3">Distribuição de Cores</h3>
        <ColorDistributionChart data={colorDistribution} />
      </div>
      
      {/* Frequência de números */}
      <div className="p-4 bg-[#17161e] rounded-lg border border-white/5">
        <h3 className="text-lg font-semibold text-white mb-3">Frequência de Números</h3>
        <NumberFrequencyGrid data={numberFrequency} />
      </div>
      
      {/* Recomendação de estratégia */}
      {suggestedStrategy && (
        <div className="p-4 bg-[#17161e] rounded-lg border border-[#00ff00]/20">
          <h3 className="text-lg font-semibold text-[#00ff00] mb-2">Estratégia Sugerida</h3>
          <p className="text-white">{suggestedStrategy.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedStrategy.bets.map((bet, index) => (
              <span 
                key={index}
                className="px-3 py-1 rounded-full bg-[#00ff00]/10 text-[#00ff00] text-sm"
              >
                {bet}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Nota de aviso */}
      <div className="p-3 bg-[#17161e] rounded-lg border border-yellow-500/20">
        <p className="text-xs text-gray-400">
          <span className="text-yellow-500 font-medium">Importante: </span>
          Estas análises são baseadas em dados históricos e não garantem resultados futuros. 
          Jogue com responsabilidade e lembre-se que jogos de azar envolvem riscos.
        </p>
      </div>
    </div>
  );
}; 