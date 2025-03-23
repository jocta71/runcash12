import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Wallet, Menu, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import RouletteCard from '@/components/RouletteCard';
import { Input } from '@/components/ui/input';
import ChatUI from '@/components/ChatUI';
import { Button } from '@/components/ui/button';
import AnimatedInsights from '@/components/AnimatedInsights';
import ProfileDropdown from '@/components/ProfileDropdown';
import { 
  fetchAllRoulettes, 
  fetchRouletteLatestNumbers, 
  fetchRouletteLatestNumbersByName,
  fetchAvailableRoulettesFromNumbers
} from '@/integrations/api/rouletteService';
import { filterAllowedRoulettes } from '@/config/allowedRoulettes';
import { toast } from '@/components/ui/use-toast';
import EventService from '@/services/EventService';

interface ChatMessage {
  id: string;
  user: {
    name: string;
    avatar?: string;
    role?: string;
    isAdmin?: boolean;
    isModerator?: boolean;
  };
  message: string;
  timestamp: Date;
}

interface Roulette {
  name: string;
  roleta_nome?: string;
  lastNumbers: number[];
  wins: number;
  losses: number;
  trend: { value: number }[];
  suggestion: string;
  status: string;
}

// Gera dados de tendência baseados na taxa de vitória e derrota
const generateTrendFromWinRate = (wins: number, losses: number) => {
  const total = wins + losses;
  if (total === 0) {
    // Se não houver dados, gerar tendência aleatória
    return Array.from({ length: 20 }, () => ({ value: Math.random() * 100 }));
  }
  
  // Calcula taxa de vitória
  const winRate = wins / total;
  
  // Gera pontos de dados de tendência baseados na taxa de vitória
  return Array.from({ length: 20 }, (_, i) => {
    // Variação aleatória para simular flutuação, mas tendendo para a taxa de vitória real
    const randomVariation = (Math.random() - 0.5) * 30;
    return { value: winRate * 100 + randomVariation };
  });
};

const Index = () => {
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();
  
  // Inicializar o estado de roletas a partir do sessionStorage, se disponível
  const getInitialRoulettesState = () => {
    try {
      const savedState = sessionStorage.getItem('roulettes_state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        console.log('[PERSISTÊNCIA] Recuperando estado salvo de roletas:', parsedState.length);
        return parsedState;
      }
    } catch (error) {
      console.error('[PERSISTÊNCIA] Erro ao recuperar estado:', error);
    }
    return [];
  };
  
  const [roulettes, setRoulettes] = useState<Roulette[]>(getInitialRoulettesState());
  const [isLoading, setIsLoading] = useState(!roulettes.length);
  const [loaded, setLoaded] = useState(!!roulettes.length);
  
  // Função para salvar o estado no sessionStorage sempre que mudar
  useEffect(() => {
    if (roulettes.length > 0) {
      try {
        sessionStorage.setItem('roulettes_state', JSON.stringify(roulettes));
        console.log('[PERSISTÊNCIA] Estado salvo:', roulettes.length);
      } catch (error) {
        console.error('[PERSISTÊNCIA] Erro ao salvar estado:', error);
      }
    }
  }, [roulettes]);
  
  // Inicializar o serviço de eventos quando o componente montar
  useEffect(() => {
    // Não inicializar mais o EventService do Render
    
    // Limpar quando o componente desmontar
    return () => {
      // Nenhuma limpeza necessária
    };
  }, []);
  
  // Verificar se os componentes estão congelados (bloqueados pelo sistema anti-recarregamento)
  const areComponentsFrozen = () => {
    return (window as any).__REACT_COMPONENTS_FROZEN === true;
  };
  
  // Função para buscar roletas do banco de dados
  const fetchRoulettes = async () => {
    try {
      // Se os componentes estão congelados, usar apenas dados em cache
      if (areComponentsFrozen() && roulettes.length > 0) {
        console.log('[FREEZE] Componentes congelados, mantendo dados em cache');
        setIsLoading(false);
        setLoaded(true);
        return;
      }
      
      // Verificar se já temos dados em cache
      if (roulettes.length > 0) {
        console.log('[PERSISTÊNCIA] Usando dados em cache, roletas já carregadas:', roulettes.length);
        return;
      }
      
      setIsLoading(true);
      
      console.log('[DEBUG] Iniciando busca de roletas no Supabase...');
      // Primeiro buscar todas as roletas disponíveis na tabela roleta_numeros
      const availableRouletteNames = await fetchAvailableRoulettesFromNumbers();
      console.log('[DEBUG] Nomes de roletas encontrados no Supabase:', availableRouletteNames);
      
      if (availableRouletteNames.length > 0) {
        // Se temos roletas do Supabase, usamos elas
        console.log('[DEBUG] Buscando objetos completos de roletas no Supabase...');
        const data = await fetchAllRoulettes();
        console.log('[DEBUG] Objetos de roletas recebidos antes do filtro:', data);
        
        // Filtrar apenas as roletas permitidas
        const allowedData = filterAllowedRoulettes(data);
        console.log('[DEBUG] IDs das roletas após filtro:', allowedData.map(r => r.id));
        console.log('[DEBUG] Nomes das roletas após filtro:', allowedData.map(r => r.nome));
        
        if (allowedData.length === 0) {
          console.warn('[DEBUG] ALERTA: O filtro de roletas permitidas removeu todas as roletas. Verifique os IDs em allowedRoulettes.ts');
          setRoulettesWithFallback([]);
        } else {
          // Para cada roleta, buscar os últimos números
          const formattedDataPromises = allowedData.map(async (item) => {
            // Buscar os últimos 20 números para cada roleta
            console.log(`[DEBUG] Buscando números para roleta '${item.nome}' (ID: ${item.id})...`);
            const lastNumbers = await fetchRouletteLatestNumbersByName(item.nome, 20);
            console.log(`[DEBUG] Números obtidos para '${item.nome}':`, lastNumbers);
            
            return {
              name: item.nome,
              roleta_nome: item.roleta_nome,
              lastNumbers: lastNumbers.length > 0 ? lastNumbers : (Array.isArray(item.numeros) ? item.numeros : []),
              wins: item.vitorias || 0,
              losses: item.derrotas || 0,
              trend: generateTrendFromWinRate(item.vitorias, item.derrotas),
              suggestion: item.sugestao_display || '',
              status: item.estado_estrategia || 'NEUTRAL'
            };
          });
          
          const formattedData = await Promise.all(formattedDataPromises);
          console.log('[DEBUG] Roletas formatadas finais:', formattedData.map(r => r.name));
          
          setRoulettesWithFallback(formattedData);
        }
      } else {
        // Se não há roletas no Supabase, mostramos um array vazio
        console.log('Nenhuma roleta encontrada no Supabase.');
        setRoulettesWithFallback([]);
      }
    } catch (error) {
      console.error('Erro ao buscar roletas do Supabase:', error);
      // Em caso de erro, mostramos um array vazio
      setRoulettesWithFallback([]);
    } finally {
      setIsLoading(false);
      setLoaded(true);
    }
  };
  
  // Função para garantir que sempre temos roletas para exibir
  const setRoulettesWithFallback = (data: Roulette[]) => {
    if (data && data.length > 0) {
      setRoulettes(data);
      toast({
        title: 'Dados Carregados',
        description: `${data.length} roletas carregadas do Supabase`,
        variant: 'default',
      });
    } else {
      console.log('[FALLBACK] Usando roletas fictícias para evitar tela em branco');
      // Criar algumas roletas fictícias para evitar tela em branco
      const fallbackRoulettes: Roulette[] = [
        {
          name: 'Immersive Roulette',
          lastNumbers: [3, 17, 32, 0, 15, 19, 4, 21, 2, 25],
          wins: 150,
          losses: 70,
          trend: generateTrendFromWinRate(150, 70),
          suggestion: 'VERMELHO',
          status: 'NEUTRAL'
        },
        {
          name: 'Auto-Roulette',
          lastNumbers: [26, 3, 35, 12, 28, 6, 14, 31, 9, 20],
          wins: 120,
          losses: 60,
          trend: generateTrendFromWinRate(120, 60),
          suggestion: 'PRETO',
          status: 'NEUTRAL'
        },
        {
          name: 'Lightning Roulette',
          lastNumbers: [7, 11, 30, 18, 29, 22, 5, 16, 1, 20],
          wins: 180,
          losses: 90,
          trend: generateTrendFromWinRate(180, 90),
          suggestion: 'ÍMPARES',
          status: 'NEUTRAL'
        }
      ];
      
      setRoulettes(fallbackRoulettes);
      toast({
        title: 'Usando Dados Offline',
        description: 'Não foi possível carregar dados reais do servidor',
        variant: 'destructive',
      });
    }
  };
  
  // Efeito para carregar dados quando o componente montar
  useEffect(() => {
    // Se os componentes estão congelados, não fazer nada além de usar o estado atual
    if (areComponentsFrozen() && roulettes.length > 0) {
      console.log('[FREEZE] Index: Componentes congelados, mantendo estado atual com', roulettes.length, 'roletas');
      setIsLoading(false);
      setLoaded(true);
      return;
    }
  
    // Verificar se os dados já foram carregados anteriormente para evitar recarregamentos desnecessários
    const alreadyLoaded = localStorage.getItem('data_loaded_timestamp');
    const currentTime = Date.now();
    const cacheExpiration = 5 * 60 * 1000; // 5 minutos
    
    // Verificar se o componente está remontando após navegação ou perda de foco
    const isRevisit = sessionStorage.getItem('index_component_visited') === 'true';
    
    // Se os dados foram carregados recentemente e temos roletas disponíveis, não carrega novamente
    if (alreadyLoaded && 
        currentTime - parseInt(alreadyLoaded) < cacheExpiration && 
        safeRoulettes.length > 0) {
      console.log('[CACHE] Usando dados em cache, último carregamento há', 
        Math.round((currentTime - parseInt(alreadyLoaded)) / 1000), 'segundos');
      setIsLoading(false);
      setLoaded(true);
      
      // Registrar que a página já foi visitada
      sessionStorage.setItem('index_component_visited', 'true');
      return;
    }
    
    // Se estamos revisitando a página (após navegação) e temos dados
    if (isRevisit && safeRoulettes.length > 0) {
      console.log('[OTIMIZAÇÃO] Mantendo dados existentes após revisita da página');
      setIsLoading(false);
      setLoaded(true);
      return;
    }
    
    // Buscar dados iniciais das roletas apenas uma vez quando o componente montar
    console.log('[FETCH] Buscando dados do zero...');
    fetchRoulettes().then(() => {
      // Salvar timestamp do carregamento
      localStorage.setItem('data_loaded_timestamp', Date.now().toString());
      // Registrar que a página já foi visitada
      sessionStorage.setItem('index_component_visited', 'true');
    });
    
    // Adicionar manipulador para visibilidade da página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[VISIBILIDADE] Página visível novamente, verificando necessidade de atualização');
        
        // Verificar se faz muito tempo desde a última atualização
        const lastUpdate = localStorage.getItem('data_loaded_timestamp');
        if (lastUpdate) {
          const timeSinceUpdate = Date.now() - parseInt(lastUpdate);
          const updateThreshold = 10 * 60 * 1000; // 10 minutos
          
          // Se passou muito tempo, atualizar em segundo plano
          if (timeSinceUpdate > updateThreshold) {
            console.log('[ATUALIZAÇÃO] Dados muito antigos, atualizando em segundo plano');
            fetchRoulettes().then(() => {
              localStorage.setItem('data_loaded_timestamp', Date.now().toString());
            });
          }
        }
      }
    };
    
    // Registrar manipulador de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Remover manipulador ao desmontar
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Memoizar o valor de safeRoulettes para evitar recálculos
  // Verificar que roulettes existe e é um array
  const safeRoulettes = useMemo(() => {
    return Array.isArray(roulettes) ? roulettes : [];
  }, [roulettes]);
  
  // Reduzir logs para evitar poluição do console
  const shouldLog = useRef(true);
  
  if (shouldLog.current) {
    console.log("[DEBUG] Roletas após processamento:", {
      totalRoulettes: safeRoulettes.length,
      rouletteNames: safeRoulettes.map(r => r.name),
      isLoading: isLoading,
      filterQuery: search
    });
    shouldLog.current = false;
  }
  
  // Memoizar resultados filtrados para evitar recálculos
  const filteredRoulettes = useMemo(() => {
    return safeRoulettes.filter(roulette => 
      roulette.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [safeRoulettes, search]);
  
  const topRoulettes = useMemo(() => {
    if (safeRoulettes.length === 0) return [];
    
    return [...safeRoulettes].sort((a, b) => {
      const aWinRate = a.wins / (a.wins + a.losses) * 100;
      const bWinRate = b.wins / (b.wins + b.losses) * 100;
      return bWinRate - aWinRate;
    }).slice(0, 3);
  }, [safeRoulettes]);

  // Função para depurar diretamente os dados do Supabase
  const debugSupabaseData = async () => {
    console.log("[DEPURAÇÃO] Iniciando consulta direta ao Supabase...");
    
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_API_KEY;
    
    try {
      // Fazer uma consulta direta à tabela roleta_numeros
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/roleta_numeros?select=id,timestamp,roleta_id,roleta_nome,numero&order=timestamp.desc&limit=10`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ERRO] Falha na consulta direta ao Supabase: ${response.status} ${response.statusText}`, errorText);
        toast({
          title: "Erro ao acessar Supabase",
          description: `${response.status} ${response.statusText}`,
          variant: "destructive"
        });
        return;
      }
      
      const data = await response.json();
      console.log("[DEPURAÇÃO] Dados obtidos diretamente do Supabase:", data);
      
      if (Array.isArray(data) && data.length > 0) {
        toast({
          title: "Dados encontrados!",
          description: `Encontrados ${data.length} registros na tabela roleta_numeros`,
          variant: "default"
        });
        
        // Extrair nomes únicos de roletas
        const roletasUnicas = [...new Set(data.map(item => item.roleta_nome))];
        console.log("[DEPURAÇÃO] Roletas encontradas:", roletasUnicas);
        
        // Mostrar detalhes dos primeiros 5 registros
        console.log("[DEPURAÇÃO] Primeiros registros:");
        for (let i = 0; i < Math.min(5, data.length); i++) {
          console.log(`[${i+1}] ID: ${data[i].id}, Roleta: ${data[i].roleta_nome}, Número: ${data[i].numero}, Data: ${data[i].timestamp}`);
        }
      } else {
        toast({
          title: "Nenhum dado encontrado",
          description: "A tabela roleta_numeros parece estar vazia.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("[ERRO] Falha ao consultar diretamente o Supabase:", error);
      toast({
        title: "Erro na consulta",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    }
  };

  // Tratamento para eventos de retorno à página
  useEffect(() => {
    const handleReturnToPage = (event: any) => {
      console.log('[EVENTO] Index: Retorno à página detectado');
      
      // Se os componentes estão congelados, não fazer nada
      if (areComponentsFrozen()) {
        console.log('[EVENTO] Index: Componentes congelados, mantendo estado atual');
        
        // Garantir que a UI não mostre carregamento
        setIsLoading(false);
        setLoaded(true);
        return;
      }
      
      // Se já temos dados, apenas verificar idade
      if (roulettes.length > 0) {
        const lastUpdate = localStorage.getItem('data_loaded_timestamp');
        if (lastUpdate) {
          const timeSinceUpdate = Date.now() - parseInt(lastUpdate);
          const updateThreshold = 15 * 60 * 1000; // 15 minutos
          
          // Se passou muito tempo, atualizar silenciosamente em segundo plano
          if (timeSinceUpdate > updateThreshold) {
            console.log('[EVENTO] Index: Dados antigos, atualizando silenciosamente em segundo plano');
            fetchRoulettes().then(() => {
              localStorage.setItem('data_loaded_timestamp', Date.now().toString());
            });
          } else {
            console.log('[EVENTO] Index: Dados ainda recentes, mantendo estado');
          }
        }
      }
    };
    
    // Registrar manipulador para o evento personalizado
    window.addEventListener('app:returned-to-page', handleReturnToPage);
    
    // Limpar quando o componente desmontar
    return () => {
      window.removeEventListener('app:returned-to-page', handleReturnToPage);
    };
  }, [roulettes]);

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
          {isLoading ? (
            <div className="flex justify-center items-center h-[200px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-vegas-gold"></div>
            </div>
          ) : (
            <>
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
              
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-2 md:mt-4">
                {filteredRoulettes.map((roulette, index) => (
                  <RouletteCard 
                    key={index} 
                    {...roulette} 
                    name={roulette.name}
                    roleta_nome={roulette.roleta_nome || roulette.name}
                  />
                ))}
              </div>
            </>
          )}
          
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
          Atualizando dados do Supabase...
        </div>
      )}
      
      {/* Botão de depuração - posicione onde for mais conveniente */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={debugSupabaseData}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
        >
          Depurar Supabase
        </Button>
      </div>
    </div>
  );
};

export default Index;
