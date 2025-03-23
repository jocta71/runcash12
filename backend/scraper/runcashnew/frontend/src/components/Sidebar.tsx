import { useState } from 'react';
import { CircleDollarSign, Rocket, Heart, Gift, Ticket, Trophy, Users, BarChart3, Scale, LifeBuoy, ChevronDown, Gamepad2, Flame, Globe, Send, X, PieChart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const Sidebar = ({ isOpen = false, onClose, isMobile = false }: SidebarProps) => {
  const [otherExpanded, setOtherExpanded] = useState(false);
  
  const sidebarClasses = isMobile
    ? "h-full w-full mobile-sidebar-inner animate-slide-right"
    : "h-screen w-64 flex flex-col animate-slide-right z-40 bg-[#0B0A0F] border-r border-[#33333359]";
  
  const content = (
    <div className="p-3 flex flex-col h-full justify-between">
      {isMobile && (
        <div className="flex justify-end mb-4">
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
      )}
      
      <div className="space-y-6">
        <div>
          <h3 className="text-gray-500 text-xs font-medium px-4 mb-2">Jogos</h3>
          <div className="space-y-1">
            <div className="menu-item active">
              <div className="bg-[#1A191F] p-1.5 rounded-md">
                <Gamepad2 size={18} className="text-white" />
              </div>
              <span>Slots</span>
            </div>
            
            <div className="menu-item">
              <div className="bg-[#1A191F] p-1.5 rounded-md">
                <Flame size={18} className="text-white" />
              </div>
              <span>Cassino Ao Vivo</span>
            </div>
            
            <div className="menu-item">
              <div className="bg-[#1A191F] p-1.5 rounded-md">
                <Heart size={18} className="text-white" />
              </div>
              <span>Favoritos</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-gray-500 text-xs font-medium px-4 mb-2">Bônus</h3>
          <div className="space-y-1">
            <div className="menu-item">
              <div className="bg-[#1A191F] p-1.5 rounded-md">
                <Gift size={18} className="text-green-500" />
              </div>
              <span>Código Promocional</span>
            </div>
            
            <div className="menu-item">
              <div className="bg-[#1A191F] p-1.5 rounded-md">
                <Trophy size={18} className="text-white" />
              </div>
              <span>Programa de Fidelidade</span>
            </div>
            
            <div className="menu-item">
              <div className="bg-[#1A191F] p-1.5 rounded-md">
                <Users size={18} className="text-white" />
              </div>
              <span>Programa de Indicação</span>
            </div>
            
            <div className="menu-item">
              <div className="bg-[#1A191F] p-1.5 rounded-md">
                <CircleDollarSign size={18} className="text-white" />
              </div>
              <span>Loteria</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-gray-500 text-xs font-medium px-4 mb-2">Outros</h3>
          <div className="space-y-1">
            <div className="menu-item">
              <div className="bg-[#1A191F] p-1.5 rounded-md">
                <Rocket size={18} className="text-vegas-gold" />
              </div>
              <Link to="/planos" className="text-white hover:text-vegas-gold transition-colors">Planos Premium</Link>
            </div>
            
            <div className="menu-item">
              <div className="bg-[#1A191F] p-1.5 rounded-md">
                <Scale size={18} className="text-white" />
              </div>
              <span>Jogo Justo</span>
            </div>
            
            <div className="menu-item">
              <div className="bg-[#1A191F] p-1.5 rounded-md">
                <LifeBuoy size={18} className="text-white" />
              </div>
              <span>Suporte</span>
            </div>
          </div>
        </div>
        
        <div className="menu-item">
          <div className="bg-[#1A191F] p-1.5 rounded-md">
            <PieChart className="h-5 w-5" />
          </div>
          <Link to="/analise" className="text-white hover:text-vegas-gold transition-colors">Análise de Roletas</Link>
        </div>
      </div>
      
      <div className="space-y-2 mt-auto">
        <div className="bg-[#22202a] rounded-md p-2 flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
          <div className="bg-[#1A191F] p-1 rounded-md">
            <Send size={18} className="text-gray-400" />
          </div>
          <span className="text-gray-300">Telegram</span>
        </div>
        
        <div className="bg-[#22202a] rounded-md p-2 flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity">
          <div className="flex items-center gap-2">
            <div className="bg-[#1A191F] p-1 rounded-md">
              <Globe size={18} className="text-gray-400" />
            </div>
            <span className="text-gray-300">Português</span>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </div>
      </div>
    </div>
  );
  
  if (isMobile) {
    if (!isOpen) return null;
    
    return (
      <div className="mobile-sidebar" onClick={onClose}>
        <div className={sidebarClasses} onClick={e => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  }
  
  return (
    <div className={sidebarClasses}>
      {content}
    </div>
  );
};

export default Sidebar;
