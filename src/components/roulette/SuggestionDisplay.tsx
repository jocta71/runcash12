import React from 'react';
import { WandSparkles, Eye, EyeOff, Target, AlertTriangle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import RouletteNumber from './RouletteNumber';

interface SuggestionDisplayProps {
  suggestion: number[];
  selectedGroup: string;
  isBlurred: boolean;
  toggleVisibility: (e: React.MouseEvent) => void;
  numberGroups: Record<string, { name: string; numbers: number[]; color: string }>;
  strategyState?: string;
  strategyDisplay?: string;
  strategyTerminals?: number[];
}

const SuggestionDisplay = ({ 
  suggestion, 
  selectedGroup, 
  isBlurred, 
  toggleVisibility,
  numberGroups,
  strategyState,
  strategyDisplay,
  strategyTerminals
}: SuggestionDisplayProps) => {
  
  const getSuggestionColor = (num: number) => {
    const groupKey = selectedGroup as keyof typeof numberGroups;
    return numberGroups[groupKey].color;
  };

  // Ajustar a verificação useStrategyData para sempre usar os dados de estratégia quando estratégia estiver disponível
  const useStrategyData = strategyState !== undefined && strategyState !== null && strategyState !== "";
  
  // Determinar a sugestão a ser exibida
  const displaySuggestion = (useStrategyData && strategyTerminals && strategyTerminals.length > 0) 
    ? strategyTerminals 
    : suggestion;
    
  const displayLabel = useStrategyData ? 'Estratégia' : 'Sugestão';
  
  // Cores para diferentes estados
  const getStateColor = () => {
    if (!strategyState) return 'text-[#00ff00]';
    
    switch (strategyState) {
      case 'TRIGGER': 
        return 'text-green-500';
      case 'POST_GALE_NEUTRAL': 
        return 'text-yellow-500';
      case 'MORTO': 
        return 'text-red-400';
      default: 
        return 'text-blue-400';
    }
  };
  
  const displayColor = useStrategyData ? getStateColor() : 'text-[#00ff00]';
  
  // Estado específico para TRIGGER ou POST_GALE_NEUTRAL
  const isActiveState = strategyState === 'TRIGGER' || strategyState === 'POST_GALE_NEUTRAL';
  
  return (
    <div className="space-y-0.5">
      {/* Exibir o estado da estratégia de forma mais proeminente */}
      {useStrategyData && (
        <div className={`mb-2 p-2 rounded-md ${
          strategyState === 'TRIGGER' ? 'bg-green-500/30 border border-green-400' : 
          strategyState === 'POST_GALE_NEUTRAL' ? 'bg-yellow-500/30 border border-yellow-400' : 
          strategyState === 'MORTO' ? 'bg-red-500/30 border border-red-400' : 
          'bg-blue-500/30 border border-blue-400'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`text-[12px] font-semibold ${displayColor} flex items-center gap-1.5`}>
              <Target size={12} />
              <span>Estado: {strategyState || "DESCONHECIDO"}</span>
            </div>
            {strategyDisplay && (
              <div className={`text-[10px] ${displayColor}/90 font-medium`}>
                {strategyDisplay}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {useStrategyData ? (
            <>
              <Target size={10} className={displayColor} />
              <span className={`text-[8px] ${displayColor} font-medium`}>{displayLabel}</span>
              {!isActiveState && strategyState === 'NEUTRAL' && (
                <span className={`text-[7px] text-blue-400/70`}>
                  (Aguardando gatilho)
                </span>
              )}
            </>
          ) : (
            <>
              <WandSparkles size={10} className="text-[#00ff00]" />
              <span className="text-[8px] text-[#00ff00] font-medium">Sugestão</span>
              <span className="text-[7px] text-[#00ff00]/70">({numberGroups[selectedGroup as keyof typeof numberGroups].name})</span>
            </>
          )}
        </div>
        <button 
          onClick={toggleVisibility} 
          className="text-[#00ff00] hover:text-[#00ff00]/80 transition-colors"
        >
          {isBlurred ? <EyeOff size={10} /> : <Eye size={10} />}
        </button>
      </div>
      
      {/* Exibir terminais mais claramente para estados TRIGGER ou POST_GALE_NEUTRAL */}
      {useStrategyData && isActiveState && (
        <div className="mb-2 mt-2">
          <div className={`text-[11px] ${displayColor} font-medium flex items-center gap-1.5 bg-black/40 p-1.5 rounded-sm`}>
            <AlertTriangle size={11} />
            <span>
              {strategyState === 'TRIGGER' 
                ? 'APOSTAR NOS TERMINAIS:'
                : 'ACOMPANHE OS TERMINAIS:'}
            </span>
          </div>
        </div>
      )}
      
      {/* Exibir mensagem caso não haja terminais em estado ativo */}
      {useStrategyData && !isActiveState && strategyState === 'NEUTRAL' && (
        <div className="mb-1">
          <div className="text-[9px] text-blue-400 font-medium mt-1 mb-0.5 flex items-center gap-1">
            <Info size={9} />
            <span>Sugestão padrão (sem gatilho ativo)</span>
          </div>
        </div>
      )}
      
      <div className="flex gap-0.5">
        {displaySuggestion.map((num, i) => (
          <TooltipProvider key={i}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <RouletteNumber
                    number={num}
                    className={`w-4 h-4 text-[7px] border ${useStrategyData ? `border-${displayColor.replace('text-', '')}` : 'border-[#00ff00]'} ${
                      useStrategyData 
                        ? (strategyState === 'TRIGGER' ? 'bg-green-500/10' : 
                           strategyState === 'POST_GALE_NEUTRAL' ? 'bg-yellow-500/10' :
                           'bg-blue-500/10') 
                        : getSuggestionColor(num)
                    } ${isBlurred ? 'blur-sm' : 'animate-pulse'}`}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{useStrategyData && isActiveState ? `Terminal ${num}` : `Número ${num}`}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      
      {/* Texto adicional para estados ativos */}
      {useStrategyData && isActiveState && (
        <div className="mt-1">
          <p className={`text-[7px] ${displayColor}/80`}>
            {strategyState === 'TRIGGER' 
              ? 'Números com terminais acima estão em alerta' 
              : 'Continue observando estes terminais'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SuggestionDisplay;
