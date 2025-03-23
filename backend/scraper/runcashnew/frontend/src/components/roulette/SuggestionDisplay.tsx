import React from 'react';
import { WandSparkles, Eye, EyeOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import RouletteNumber from './RouletteNumber';

interface SuggestionDisplayProps {
  suggestion: number[];
  selectedGroup: string;
  isBlurred: boolean;
  toggleVisibility: (e: React.MouseEvent) => void;
  numberGroups: Record<string, { name: string; numbers: number[]; color: string }>;
}

const SuggestionDisplay = ({ 
  suggestion, 
  selectedGroup, 
  isBlurred, 
  toggleVisibility,
  numberGroups 
}: SuggestionDisplayProps) => {
  
  const getSuggestionColor = (num: number) => {
    const groupKey = selectedGroup as keyof typeof numberGroups;
    return numberGroups[groupKey].color;
  };

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          <WandSparkles size={10} className="text-[#00ff00]" />
          <span className="text-[8px] text-[#00ff00] font-medium">Sugestão</span>
          <span className="text-[7px] text-[#00ff00]/70">({numberGroups[selectedGroup as keyof typeof numberGroups].name})</span>
        </div>
        <button 
          onClick={toggleVisibility} 
          className="text-[#00ff00] hover:text-[#00ff00]/80 transition-colors"
        >
          {isBlurred ? <EyeOff size={10} /> : <Eye size={10} />}
        </button>
      </div>
      <div className="flex gap-0.5">
        {suggestion.map((num, i) => (
          <RouletteNumber
            key={i}
            number={num}
            className={`w-4 h-4 text-[7px] border border-[#00ff00] ${getSuggestionColor(num)} ${isBlurred ? 'blur-sm' : 'animate-pulse'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default SuggestionDisplay;
