import React from 'react';
import { WandSparkles, Eye, EyeOff, Target, AlertTriangle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import RouletteNumber from './RouletteNumber';

interface SuggestionDisplayProps {
  suggestion: string | number[];
  isActive?: boolean;
  isTrigger?: boolean;
  terminals?: number[];
  selectedGroup?: string;
  isBlurred?: boolean;
  toggleVisibility?: (e: React.MouseEvent) => void;
  numberGroups?: Record<string, { name: string; numbers: number[]; color: string }>;
  strategyState?: string;
  strategyDisplay?: string;
  strategyTerminals?: number[];
}

const SuggestionDisplay = ({ 
  suggestion, 
  isActive = false,
  isTrigger = false,
  terminals = [],
  selectedGroup = "default", 
  isBlurred = false, 
  toggleVisibility = () => {},
  numberGroups = {},
  strategyState,
  strategyDisplay,
  strategyTerminals
}: SuggestionDisplayProps) => {
  
  // Verificar se suggestion é uma string
  const isStringMode = typeof suggestion === 'string';
  
  // Usar terminais como números para display quando disponíveis
  const displayNumbers = terminals.length > 0 ? terminals : 
                         (isStringMode ? [] : (suggestion as number[]));

  // Se não houver números e não for string, exibir mensagem padrão
  if (displayNumbers.length === 0 && !isStringMode) {
    return (
      <div className="p-3 border border-gray-600/20 rounded-lg bg-gray-800/10">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <Target size={14} className="text-gray-400" />
          <span>Aguardando padrão...</span>
        </div>
      </div>
    );
  }
  
  // Para modo string (texto de sugestão)
  if (isStringMode) {
    return (
      <div className={`p-3 border rounded-lg ${
        isTrigger ? 'border-green-500/50 bg-green-500/10' : 
        isActive ? 'border-blue-500/50 bg-blue-500/10' :
        'border-gray-600/20 bg-gray-800/10'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs flex items-center gap-1.5">
            <Target size={14} className={
              isTrigger ? 'text-green-500' : 
              isActive ? 'text-blue-500' : 
              'text-gray-400'
            } />
            <span className={
              isTrigger ? 'text-green-500 font-medium' : 
              isActive ? 'text-blue-500 font-medium' : 
              'text-gray-400'
            }>
              {isTrigger ? 'Gatilho Ativado' : isActive ? 'Estratégia Ativa' : 'Status'}
            </span>
          </div>
          
          {toggleVisibility && (
            <button 
              onClick={toggleVisibility} 
              className="text-gray-400 hover:text-white"
            >
              {isBlurred ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
        </div>
        
        <div className={`text-sm font-medium ${isTrigger ? 'text-green-400' : isActive ? 'text-blue-400' : 'text-white'} ${isBlurred ? 'blur-sm' : ''}`}>
          {suggestion as string}
        </div>
        
        {terminals.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {terminals.map((num, idx) => (
              <div 
                key={idx}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                  isTrigger ? 'border-green-500 bg-green-500/20 text-green-200' : 
                  'border-blue-500 bg-blue-500/20 text-blue-200'
                } ${isBlurred ? 'blur-sm' : ''}`}
              >
                {num}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Modo de números (original)
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          <Target size={10} className="text-[#00ff00]" />
          <span className="text-[8px] text-[#00ff00] font-medium">Sugestão</span>
          {selectedGroup && numberGroups[selectedGroup] && (
            <span className="text-[7px] text-[#00ff00]/70">({numberGroups[selectedGroup].name})</span>
          )}
        </div>
        {toggleVisibility && (
          <button 
            onClick={toggleVisibility} 
            className="text-[#00ff00] hover:text-[#00ff00]/80 transition-colors"
          >
            {isBlurred ? <EyeOff size={10} /> : <Eye size={10} />}
          </button>
        )}
      </div>
      
      <div className="flex gap-0.5">
        {displayNumbers.map((num, i) => (
          <div 
            key={i}
            className={`w-4 h-4 flex items-center justify-center rounded-full text-[7px] border border-[#00ff00] bg-[#00ff00]/10 text-[#00ff00] ${isBlurred ? 'blur-sm' : 'animate-pulse'}`}
          >
            {num}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestionDisplay;
