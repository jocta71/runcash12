import React from 'react';
import { useRoletaAnalytics } from '@/hooks/useRoletaAnalytics';
import { ColorDistributionChart } from './analytics/ColorDistributionChart';
import { NumberFrequencyGrid } from './analytics/NumberFrequencyGrid';
import { CurrentStreakDisplay } from './analytics/CurrentStreakDisplay';
import { MissingDozensAlert } from './analytics/MissingDozensAlert';

export function RoletaAnalyticsDashboard({ roletaNome }) {
  const { 
    colorDistribution, 
    numberFrequency, 
    currentStreak,
    missingDozens,
    loading, 
    error 
  } = useRoletaAnalytics(roletaNome);
  
  if (loading) {
    return (
      <div className="p-8 bg-[#17161e] rounded-xl border border-white/10 animate-pulse">
        <div className="h-6 w-48 bg-gray-700 rounded mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-40 bg-gray-800 rounded"></div>
          <div className="h-40 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 bg-[#17161e] rounded-xl border border-red-500/40 text-center">
        <h2 className="text-xl font-bold text-red-500 mb-2">Erro ao carregar análises</h2>
        <p className="text-white/70">{error}</p>
      </div>
    );
  }
  
  // Calcular indicadores e insights
  const getSuggestedStrategy = () => {
    // Se não há dados suficientes, não sugerir estratégia
    if (!colorDistribution?.length || !numberFrequency?.length) {
      return null;
    }
    
    // Verificar sequência significativa
    if (currentStreak?.count >= 5) {
      if (currentStreak.type === 'cor') {
        const oppositeColor = currentStreak.value === 'vermelho' ? 'preto' : 'vermelho';
        return {
          title: `Sequência longa de ${currentStreak.value}`,
          description: `Detectada sequência de ${currentStreak.count} números ${currentStreak.value}s seguidos.`,
          suggestion: `Considere apostar no ${oppositeColor} para reversão da tendência.`,
          confidence: currentStreak.count >= 7 ? 'alta' : 'média',
          bets: [oppositeColor === 'vermelho' ? 'Vermelho' : 'Preto']
        };
      } else if (currentStreak.type === 'paridade') {
        const oppositeParity = currentStreak.value === 'par' ? 'ímpar' : 'par';
        return {
          title: `Sequência longa de ${currentStreak.value}es`,
          description: `Detectada sequência de ${currentStreak.count} números ${currentStreak.value}es seguidos.`,
          suggestion: `Considere apostar em números ${oppositeParity}es para reversão da tendência.`,
          confidence: currentStreak.count >= 7 ? 'alta' : 'média',
          bets: [oppositeParity === 'par' ? 'Par' : 'Ímpar']
        };
      }
    }
    
    // Verificar dúzias ausentes
    const longMissingDozen = missingDozens.find(d => d.ausencia >= 30);
    if (longMissingDozen) {
      const dozenMap = {
        'primeira': '1-12',
        'segunda': '13-24',
        'terceira': '25-36'
      };
      
      return {
        title: `Dúzia ausente por muito tempo`,
        description: `A dúzia ${dozenMap[longMissingDozen.dezena]} está ausente há ${longMissingDozen.ausencia} rodadas.`,
        suggestion: `Considere apostar na dúzia ${dozenMap[longMissingDozen.dezena]}.`,
        confidence: longMissingDozen.ausencia >= 40 ? 'alta' : 'média',
        bets: [`Dúzia ${dozenMap[longMissingDozen.dezena]}`]
      };
    }
    
    // Verificar desequilíbrio significativo entre cores
    const redData = colorDistribution.find(c => c.cor === 'vermelho');
    const blackData = colorDistribution.find(c => c.cor === 'preto');
    
    if (redData && blackData) {
      const redPercentage = redData.porcentagem;
      const blackPercentage = blackData.porcentagem;
      
      if (Math.abs(redPercentage - blackPercentage) > 15) {
        const lessFrequentColor = redPercentage < blackPercentage ? 'vermelho' : 'preto';
        return {
          title: `Desequilíbrio entre cores`,
          description: `Diferença de ${Math.abs(redPercentage - blackPercentage).toFixed(1)}% entre vermelho e preto.`,
          suggestion: `Considere apostar na cor menos frequente (${lessFrequentColor}).`,
          confidence: Math.abs(redPercentage - blackPercentage) > 20 ? 'alta' : 'média',
          bets: [lessFrequentColor === 'vermelho' ? 'Vermelho' : 'Preto']
        };
      }
    }
    
    return null;
  };
  
  const strategy = getSuggestedStrategy();
  
  return (
    <div className="p-4 sm:p-6 bg-[#17161e] rounded-xl border border-[#00ff00]/10">
      <h2 className="text-xl sm:text-2xl font-bold text-[#00ff00] mb-4">Análise da Roleta: {roletaNome}</h2>
      
      {/* Sequências e alertas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <CurrentStreakDisplay streak={currentStreak} />
        </div>
        <div>
          <MissingDozensAlert dozens={missingDozens} />
        </div>
      </div>
      
      {/* Gráficos e dados principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Distribuição de cores */}
        <div className="p-4 bg-[#1a1922] rounded-lg border border-[#00ff00]/10">
          <h3 className="text-lg font-semibold text-white mb-3">Distribuição de Cores</h3>
          <ColorDistributionChart data={colorDistribution} />
        </div>
        
        {/* Frequência de números */}
        <div className="p-4 bg-[#1a1922] rounded-lg border border-[#00ff00]/10">
          <h3 className="text-lg font-semibold text-white mb-3">Frequência de Números</h3>
          <NumberFrequencyGrid data={numberFrequency} />
        </div>
      </div>
      
      {/* Estratégia sugerida */}
      {strategy && (
        <div className="p-4 bg-[#1a1922] rounded-lg border border-[#00ff00]/20">
          <div className="flex items-center mb-3">
            <span className="w-2 h-2 rounded-full bg-[#00ff00] mr-2"></span>
            <h3 className="text-lg font-semibold text-[#00ff00]">Estratégia Sugerida</h3>
            <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${
              strategy.confidence === 'alta' 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              Confiança {strategy.confidence}
            </span>
          </div>
          
          <h4 className="text-sm font-bold text-white mb-1">{strategy.title}</h4>
          <p className="text-sm text-gray-300 mb-2">{strategy.description}</p>
          <p className="text-sm font-medium text-[#00ff00] mb-3">{strategy.suggestion}</p>
          
          <div className="flex flex-wrap gap-2">
            {strategy.bets.map((bet, index) => (
              <div 
                key={index}
                className="px-3 py-1 rounded-full bg-[#00ff00]/10 text-[#00ff00] text-sm font-medium"
              >
                {bet}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 