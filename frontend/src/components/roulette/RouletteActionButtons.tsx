import React from 'react';
import { Dices, Play, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RouletteActionButtonsProps {
  onDetailsClick?: (e: React.MouseEvent) => void;
  onPlayClick?: (e: React.MouseEvent) => void;
  isConnected?: boolean;
  hasData?: boolean;
}

const RouletteActionButtons = ({ 
  onDetailsClick = () => {}, 
  onPlayClick = () => {},
  isConnected = true,
  hasData = true
}: RouletteActionButtonsProps) => {
  // Adaptar a UI baseado no status da conexão e dados
  if (!hasData) {
    return (
      <div className="flex flex-row gap-2">
        <Button 
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium text-xs sm:text-sm h-12 py-3"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={16} className="mr-1 sm:mr-2" />
          <span className="truncate">Sem Dados Disponíveis</span>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-row gap-2">
      <Button 
        onClick={onDetailsClick}
        className="flex-1 bg-[#00baff] hover:bg-[#00baff]/80 text-black font-medium text-xs sm:text-sm h-12 py-3"
      >
        <Dices size={16} className="mr-1 sm:mr-2" />
        <span className="truncate">Ver Estatísticas</span>
      </Button>
      
      <Button 
        className={`flex-1 text-black font-medium ${isConnected ? 'animate-pulse-neon' : ''} 
          bg-gradient-to-b from-[#00ff00] to-[#8bff00] hover:from-[#00ff00]/90 hover:to-[#8bff00]/90 
          text-xs sm:text-sm truncate h-12 py-3`}
        onClick={onPlayClick}
      >
        <Play size={16} className="mr-1 sm:mr-2 shrink-0" />
        <span className="truncate">Ir para a Roleta</span>
      </Button>
    </div>
  );
};

export default RouletteActionButtons;
