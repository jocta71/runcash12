import React from 'react';
import { Trophy, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface WinRateDisplayProps {
  wins: number;
  losses: number;
}

const WinRateDisplay = ({ wins, losses }: WinRateDisplayProps) => {
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

  return (
    <div>
      <div className="mb-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[8px]">Taxa de Vitória</span>
          <span className="text-[#00ff00] font-medium text-[9px]">{winRate.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5 animate-slide-up">
          <div className="flex items-center bg-[#00ff00]/20 px-0.5 py-px rounded-sm transition-all duration-300 hover:bg-[#00ff00]/30">
            <Trophy size={10} className="text-[#00ff00]" />
            <span className="text-[#00ff00] font-medium text-[8px] ml-0.5">{wins}</span>
          </div>
          <div className="flex items-center bg-red-500/20 px-0.5 py-px rounded-sm transition-all duration-300 hover:bg-red-500/30">
            <XCircle size={10} className="text-red-500" />
            <span className="text-red-500 font-medium text-[8px] ml-0.5">{losses}</span>
          </div>
        </div>
      </div>
      <Progress
        value={winRate}
        className="h-0.5 bg-gray-800"
        indicatorClassName="bg-gradient-to-r from-[#00ff00] to-[#00ff00]"
      />
    </div>
  );
};

export default WinRateDisplay;
