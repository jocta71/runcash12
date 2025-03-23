import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Wallet, Menu, MessageSquare, Info, DatabaseZap, RefreshCw } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import RouletteCardRealtime from '@/components/RouletteCardRealtime';
import { Input } from '@/components/ui/input';
import ChatUI from '@/components/ChatUI';
import { Button } from '@/components/ui/button';
import AnimatedInsights from '@/components/AnimatedInsights';
import ProfileDropdown from '@/components/ProfileDropdown';
import { fetchAllRoulettes } from '@/integrations/api/rouletteService';
import { filterAllowedRoulettes } from '@/config/allowedRoulettes';
import { toast } from '@/components/ui/use-toast';
import SocketService from '@/services/SocketService';

interface Roulette {
  id: string;
  name: string;
  roleta_nome?: string;
  wins: number;
  losses: number;
}

const Index = () => {
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();
  
  const [roulettes, setRoulettes] = useState<Roulette[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Função para buscar roletas do banco de dados
  const fetchRoulettes = async () => {
    try {
      setIsLoading(true);
      
      console.log('[DEBUG] Iniciando busca de roletas disponíveis...');
      // Buscar roletas disponíveis para exibição
      const data = await fetchAllRoulettes();
      console.log('[DEBUG] Roletas recebidas:', data);
      
      // Filtrar apenas as roletas permitidas
      const allowedData = filterAllowedRoulettes(data);
      console.log('[DEBUG] Roletas após filtro:', allowedData);
      
      if (allowedData.length === 0) {
        console.warn('[DEBUG] ALERTA: O filtro de roletas permitidas removeu todas as roletas.');
        
        // Sem dados disponíveis
        setRoulettes([]);
        
        // Notificar usuário sobre a falta de dados
        toast({
          title: "Sem roletas disponíveis",
          description: "Não foi possível carregar roletas do servidor. Tente novamente mais tarde.",
          variant: "default",
          duration: 5000
        });
      } else {
        // Formatar dados das roletas para o formato que precisamos
        const formattedData = allowedData.map(item => ({
          id: item.id,
          name: item.nome,
          roleta_nome: item.roleta_nome || item.nome,
          wins: item.vitorias || 0,
          losses: item.derrotas || 0
        }));
        
        console.log('[DEBUG] Roletas formatadas:', formattedData);
        setRoulettes(formattedData);
      }
    } catch (error) {
      console.error('[ERROR] Erro ao buscar roletas:', error);
      
      // Sem dados disponíveis em caso de erro
      setRoulettes([]);
      
      toast({
        title: "Erro ao carregar roletas",
        description: "Não foi possível conectar ao servidor. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Inicializar o serviço de Socket no carregamento da página
  useEffect(() => {
    // Inicializar o serviço de Socket.IO
    const socketService = SocketService.getInstance();
    
    // Verificar se a conexão está ativa a cada 5 segundos
    const intervalId = setInterval(() => {
      setSocketConnected(socketService.isSocketConnected());
    }, 5000);
    
    // Forçar uma verificação inicial
    setSocketConnected(socketService.isSocketConnected());
    
    // Carregar roletas
    fetchRoulettes();
    
    // Limpeza ao desmontar o componente
    return () => {
      clearInterval(intervalId);
      // Não desconectamos o Socket.IO aqui para manter a conexão entre páginas
    };
  }, []);
  
  // Filtrar roletas com base na pesquisa
  const filteredRoulettes = useMemo(() => {
    return roulettes.filter(roulette => 
      (roulette.name || roulette.roleta_nome || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [roulettes, search]);

  // Adicionar logs para depuração
  useEffect(() => {
    console.log('[Index] Roletas disponíveis:', roulettes);
    console.log('[Index] Roletas filtradas:', filteredRoulettes);
  }, [roulettes, filteredRoulettes]);

  // Modificar a renderização das roletas para adicionar mais logs
  const renderRoulettes = useMemo(() => {
    console.log('[Index] Renderizando roletas:', filteredRoulettes);
    
    if (isLoading) {
      console.log('[Index] Exibindo estado de carregamento');
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={i} 
              className="bg-[#17161e]/50 rounded-xl p-4 h-72 animate-pulse"
            />
          ))}
        </div>
      );
    }
    
    if (filteredRoulettes.length > 0) {
      console.log('[Index] Exibindo roletas filtradas:', filteredRoulettes.length);
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRoulettes.map((roulette) => (
            <RouletteCardRealtime
              key={roulette.id}
              roletaId={roulette.id}
              name={roulette.name}
              roleta_nome={roulette.roleta_nome}
              wins={roulette.wins}
              losses={roulette.losses}
            />
          ))}
        </div>
      );
    }
    
    console.log('[Index] Nenhuma roleta encontrada');
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">
          Nenhuma roleta encontrada. Certifique-se de inserir dados no MongoDB.
        </p>
        <Button 
          variant="outline" 
          className="border-vegas-gold text-vegas-gold hover:bg-vegas-gold/10"
          onClick={fetchRoulettes}
        >
          Recarregar
        </Button>
      </div>
    );
  }, [isLoading, filteredRoulettes, fetchRoulettes]);

  return (
    <div className="h-screen grid grid-cols-1 md:grid-cols-[260px_1fr_345px] bg-vegas-black overflow-hidden">
      {/* Desktop Sidebar - Primeira coluna no grid */}
      <div className="hidden md:block h-screen overflow-hidden">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar (drawer) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={true} />
      
      {/* Conteúdo principal - Segunda coluna no grid */}
      <div className="relative h-screen flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="mobile-header md:hidden">
          <button 
            className="p-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} className="text-[#00ff00]" />
          </button>
          
          <span className="text-white text-xl font-bold">RunCash</span>
          
          <button 
            className="p-2"
            onClick={() => setChatOpen(true)}
          >
            <MessageSquare size={24} className="text-[#00ff00]" />
          </button>
        </div>
        
        {/* Desktop Header */}
        <div className="hidden md:flex z-40 h-[70px] items-center justify-between px-4 border-b border-[#33333359] bg-[#100f13]">
          <div className="flex items-center gap-2">
            <span className="text-white text-2xl font-bold">RunCash</span>
            <div className="relative flex items-center ml-4 max-w-[180px]">
              <Search size={14} className="absolute left-2 text-gray-400" />
              <Input 
                type="text" 
                placeholder="Pesquisar roleta..." 
                className="h-8 pl-7 py-1 pr-2 text-xs bg-[#1A191F] border-none rounded-full text-white focus-visible:ring-0 focus-visible:ring-offset-0" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
          </div>
          
          <AnimatedInsights />
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#1A191F] rounded-full py-1 px-3">
              <span className="h-5 w-5 bg-vegas-blue rounded-full flex items-center justify-center">
                <span className="text-[10px] text-white">R$</span>
              </span>
              <span className="text-white text-xs">1.346,34</span>
              <Wallet size={14} className="text-gray-400" />
            </div>
            
            <Button variant="default" size="sm" className="h-8 text-black font-medium bg-gradient-to-b from-[#00ff00] to-[#00ff00] hover:from-[#00ff00]/90 hover:to-[#00ff00]/90">
              <Wallet size={14} className="mr-1" /> Saldo
            </Button>
            
            <ProfileDropdown />
          </div>
        </div>
        
        {/* Status de conexão com WebSocket */}
        <div className={`px-4 py-1 text-sm flex items-center gap-2 ${socketConnected ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
          <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>
            {socketConnected 
              ? 'Conectado em tempo real - Recebendo atualizações instantâneas' 
              : 'Sem conexão WebSocket - Tentando reconectar...'}
          </span>
        </div>
        
        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pt-20 pb-2">
          <div className="relative flex items-center w-full">
            <Search size={16} className="absolute left-3 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Pesquisar roleta..." 
              className="w-full pl-9 py-2 pr-3 text-sm bg-[#1A191F] border-none rounded-full text-white focus-visible:ring-0 focus-visible:ring-offset-0" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>
        
        {/* Mobile User Info */}
        <div className="md:hidden flex justify-between items-center px-4 py-3">
          <ProfileDropdown />
          
          <Button variant="default" size="sm" className="h-8 text-black font-medium bg-gradient-to-b from-[#00ff00] to-[#00ff00] hover:from-[#00ff00]/90 hover:to-[#00ff00]/90">
            <Wallet size={14} className="mr-1" /> Saldo
          </Button>
        </div>
        
        {/* Mobile Insights */}
        <div className="md:hidden px-4 py-2">
          <div className="bg-[#1A191F]/50 rounded-lg p-3">
            <AnimatedInsights />
          </div>
        </div>
        
        <main className="flex-1 pt-4 md:pt-4 pb-8 px-4 bg-[#100f13] overflow-y-auto overflow-x-hidden">
          {/* Banner explicativo */}
          <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/20 border border-blue-700/30 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-blue-300 mb-2 flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Modo de Dados Reais
            </h3>
            <p className="text-blue-200 text-sm">
              Esta página agora mostra <span className="font-bold">apenas dados reais</span> do MongoDB. 
              Se não houver números, você verá uma mensagem "Sem Dados Disponíveis".
            </p>
            <div className="mt-3 flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-blue-900/50 border-blue-700 text-blue-300 hover:bg-blue-800/50 hover:text-blue-200"
                onClick={() => window.open('backend/insert_data.ps1')}
              >
                <DatabaseZap className="h-4 w-4 mr-1" />
                Inserir Dados de Exemplo
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-blue-900/50 border-blue-700 text-blue-300 hover:bg-blue-800/50 hover:text-blue-200"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar Dados
              </Button>
            </div>
          </div>
          
          <div className="mb-6 bg-gradient-to-r from-vegas-gold to-yellow-500 p-4 rounded-lg">
            <h3 className="text-black font-bold mb-2">Atualize para o Plano Premium</h3>
            <p className="text-black/80 mb-3">Acesse estatísticas em tempo real e muito mais!</p>
            <button 
              className="bg-black text-white px-4 py-2 rounded-md text-sm"
              onClick={() => navigate('/planos')}
            >
              Ver Planos
            </button>
          </div>
          
          {/* Roletas */}
          <div className="mt-6">
            <h2 className="text-lg md:text-xl font-semibold text-white mb-4">
              Roletas Ativas
            </h2>
            
            <div className="flex-1 overflow-auto p-4 md:p-6">
              {renderRoulettes}
            </div>
          </div>
          
          {/* Mobile Footer Space (to avoid content being hidden behind fixed elements) */}
          <div className="h-16 md:h-0"></div>
        </main>
      </div>
      
      {/* Chat - Terceira coluna no grid */}
      <div className="hidden md:block h-screen overflow-hidden">
        <ChatUI />
      </div>
      
      {/* Mobile Chat (drawer) */}
      <ChatUI isOpen={chatOpen} onClose={() => setChatOpen(false)} isMobile={true} />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed top-4 right-4 bg-[#00ff00]/10 text-[#00ff00] px-4 py-2 rounded-md border border-[#00ff00]/20 z-50">
          Atualizando dados do MongoDB...
        </div>
      )}
    </div>
  );
};

export default Index;
