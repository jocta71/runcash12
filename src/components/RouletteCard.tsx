import { TrendingUp, ChartBar, ArrowUp, ArrowDown, Eye, EyeOff, BarChart3, PlayCircle, PieChart, History, Clock, Target, Percent, Heart, Star, AlertTriangle, BarChart } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { strategies, numberGroups } from './roulette/constants';
import LastNumbers from './roulette/LastNumbers';
import WinRateDisplay from './roulette/WinRateDisplay';
import RouletteTrendChart from './roulette/RouletteTrendChart';
import SuggestionDisplay from './roulette/SuggestionDisplay';
import RouletteActionButtons from './roulette/RouletteActionButtons';
import { Button } from '@/components/ui/button';
import RouletteStatsModal from './roulette/RouletteStatsModal';
import { fetchRouletteLatestNumbersByName } from '@/integrations/api/rouletteService';
import { useRoletaAnalytics } from '@/hooks/useRoletaAnalytics';
import EventService from '@/services/EventService';
import type { RouletteNumberEvent, StrategyUpdateEvent } from '@/services/EventService';
import SocketService from '@/services/SocketService';

// Debug flag - set to false to disable logs in production
const DEBUG_ENABLED = true;  // Temporariamente habilitar para depuração

// Helper function for controlled logging
const debugLog = (...args: any[]) => {
  if (DEBUG_ENABLED) {
    console.log(...args);
  }
};

interface RouletteCardProps {
  name?: string;
  roleta_nome?: string;
  lastNumbers: number[];
  wins: number;
  losses: number;
  trend: { value: number }[];
}

// Objeto global para armazenar estado persistente entre remontagens
const persistentState: Record<string, {
  lastNumbers: number[],
  lastUpdated: number,
  hasLoaded: boolean
}> = {};

// Sistema de eventos mock para simular o Supabase Realtime
interface MockEventSystem {
  callbacks: Record<string, ((data: any) => void)[]>;
  subscribe: (channel: string, callback: (data: any) => void) => { unsubscribe: () => void };
  publish: (channel: string, data: any) => void;
}

// Criar sistema de eventos global
const mockEventSystem: MockEventSystem = {
  callbacks: {},
  subscribe: (channel: string, callback: (data: any) => void) => {
    if (!mockEventSystem.callbacks[channel]) {
      mockEventSystem.callbacks[channel] = [];
    }
    mockEventSystem.callbacks[channel].push(callback);
    
    // Retornar objeto com método para cancelar a inscrição
    return {
      unsubscribe: () => {
        mockEventSystem.callbacks[channel] = mockEventSystem.callbacks[channel]
          .filter(cb => cb !== callback);
      }
    };
  },
  publish: (channel: string, data: any) => {
    if (mockEventSystem.callbacks[channel]) {
      mockEventSystem.callbacks[channel].forEach(callback => callback(data));
    }
  }
};

// Anexar ao objeto window para debugging
(window as any).__mockEventSystem = mockEventSystem;

const RouletteCard = ({ name, roleta_nome, lastNumbers: initialLastNumbers, wins, losses, trend }: RouletteCardProps) => {
  const navigate = useNavigate();
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestion, setSuggestion] = useState<number[]>([]);
  const [isBlurred, setIsBlurred] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState(strategies[0]);
  const [selectedGroup, setSelectedGroup] = useState<string>("grupo-123");
  
  // Adicionar estado para os dados de estratégia
  const [strategyState, setStrategyState] = useState<string>("");
  const [strategyDisplay, setStrategyDisplay] = useState<string>("");
  const [strategyTerminals, setStrategyTerminals] = useState<number[]>([]);
  const [strategyWins, setStrategyWins] = useState<number>(0);
  const [strategyLosses, setStrategyLosses] = useState<number>(0);
  
  // Verificar se o nome da roleta é válido, com fallback para roleta_nome
  const roletaNome = name || roleta_nome || "Roleta Desconhecida";
  
  // Log para depuração dos valores recebidos
  debugLog(`[RouletteCard] Props recebidas - name: ${name}, roleta_nome: ${roleta_nome}, nome final: ${roletaNome}`);
  
  // Inicializamos o estado a partir do estado persistente, se existir
  const [lastNumbers, setLastNumbers] = useState<number[]>(() => {
    if (persistentState[roletaNome]?.lastNumbers?.length > 0) {
      debugLog(`[PERSISTÊNCIA][${roletaNome}] Recuperando estado salvo:`, 
        persistentState[roletaNome].lastNumbers.length);
      return persistentState[roletaNome].lastNumbers;
    }
    return initialLastNumbers || [];
  });
  
  const [previousLastNumber, setPreviousLastNumber] = useState<number | null>(null);
  
  // Usar estado persistente para carregamento também
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (persistentState[roletaNome]?.hasLoaded) {
      return false;
    }
    return true;
  });
  
  const [dataSeeded, setDataSeeded] = useState<boolean>(() => {
    return !!persistentState[roletaNome]?.hasLoaded;
  });
  
  const [statsOpen, setStatsOpen] = useState(false);
  const [usingSupabaseData, setUsingSupabaseData] = useState(false);
  
  // Referência para o intervalo de polling
  const pollingIntervalRef = useRef<number | null>(null);
  
  // Referência para a assinatura de eventos mock
  const eventSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  
  // Registra o componente como montado
  const isMounted = useRef(true);
  
  // Controle para ativar/desativar o polling
  const ENABLE_POLLING = true; // Ativado por padrão para a versão mock
  const POLLING_INTERVAL = 15000; // 15 segundos

  // Função para verificar se a página está visível
  const isDocumentVisible = () => document.visibilityState === 'visible';
  
  // Verificar se os componentes estão congelados (bloqueados pelo sistema anti-recarregamento)
  const areComponentsFrozen = () => {
    return (window as any).__REACT_COMPONENTS_FROZEN === true;
  };
  
  // Persistir o estado sempre que lastNumbers mudar
  useEffect(() => {
    if (lastNumbers.length > 0) {
      persistentState[roletaNome] = {
        lastNumbers,
        lastUpdated: Date.now(),
        hasLoaded: true
      };
    }
  }, [lastNumbers, roletaNome]);

  // Tratamento para eventos de retorno à página
  useEffect(() => {
    const handleReturnToPage = (event: any) => {
      debugLog(`[EVENTO][${roletaNome}] Retorno à página detectado, tempo fora:`, 
        Math.round(event.detail.timeAway / 1000), 'segundos');
        
      // Se os componentes estão congelados, não fazer nada
      if (areComponentsFrozen()) {
        debugLog(`[EVENTO][${roletaNome}] Componentes congelados, mantendo estado atual`);
        return;
      }
      
      // Verificar se precisamos atualizar dados
      const lastUpdated = persistentState[roletaNome]?.lastUpdated || 0;
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;
      
      // Só atualizar se ficar mais de 30 minutos fora
      if (event.detail.timeAway > thirtyMinutes) {
        debugLog(`[EVENTO][${roletaNome}] Tempo fora maior que 30 minutos, atualizando dados`);
    
        // Atualização silenciosa em segundo plano, sem alterar UI imediatamente
        fetchRouletteLatestNumbersByName(roletaNome, 20)
          .then(numbers => {
            if (!isMounted.current) return;
            
            if (numbers && numbers.length > 0) {
              const processedNumbers = numbers.map(n => Number(n));
              
              // Comparar com os dados atuais para verificar se há novidades
              if (JSON.stringify(processedNumbers) !== JSON.stringify(lastNumbers)) {
                debugLog(`[EVENTO][${roletaNome}] Novos dados disponíveis, atualizando silenciosamente`);
                setLastNumbers(processedNumbers);
              } else {
                debugLog(`[EVENTO][${roletaNome}] Dados iguais, mantendo estado atual`);
              }
              
              // Atualizar estado persistente de qualquer forma
              persistentState[roletaNome] = {
                lastNumbers: processedNumbers,
                lastUpdated: Date.now(),
                hasLoaded: true
              };
            }
          })
          .catch(error => {
            debugLog(`[ERRO][${roletaNome}] Erro ao atualizar dados:`, error);
          });
      }
    };
    
    // Registrar manipulador para o evento personalizado
    window.addEventListener('app:returned-to-page', handleReturnToPage);
    
    // Limpar quando o componente desmontar
    return () => {
      window.removeEventListener('app:returned-to-page', handleReturnToPage);
    };
  }, [roletaNome, lastNumbers]);

  // Função para atualizar apenas o último número, sem recarregar todo o componente
  const updateLastNumber = useCallback((novoNumero: number) => {
    if (!lastNumbers.includes(novoNumero)) {
      debugLog(`[UPDATE][${roletaNome}] Atualizando apenas o último número: ${novoNumero}`);
      
      // Salvar o número anterior para referência
      if (lastNumbers.length > 0) {
        setPreviousLastNumber(lastNumbers[0]);
      }
      
      // Verificar estratégia para o novo número
      verificarEstrategia(novoNumero);
      
      // Atualizar o array de números
      const updatedNumbers = [novoNumero, ...lastNumbers.slice(0, 19)];
      
      // Atualizar estado persistente
      persistentState[roletaNome] = {
        lastNumbers: updatedNumbers,
        lastUpdated: Date.now(),
        hasLoaded: true
      };
      
      // Atualizar o estado
      setLastNumbers(updatedNumbers);
      
      // Notificar sobre o novo número (apenas se o documento estiver visível)
      if (isDocumentVisible()) {
        toast({
          title: "Novo Número",
          description: `${novoNumero} (${roletaNome})`,
          variant: "default",
        });
      }
      
      return true;
    }
    
    return false;
  }, [lastNumbers, roletaNome]);

  // Inicialização - Carrega dados apenas se necessário
  useEffect(() => {
    debugLog(`[CICLO][${roletaNome}] Componente montado`);
    
    // Se os componentes estão congelados, não fazer nada além de carregar do estado persistente
    if (areComponentsFrozen()) {
      debugLog(`[CICLO][${roletaNome}] Componentes congelados, usando apenas estado persistente`);
      
      if (persistentState[roletaNome]?.lastNumbers?.length > 0) {
        setLastNumbers(persistentState[roletaNome].lastNumbers);
        setIsLoading(false);
        setDataSeeded(true);
        return;
      }
    }
    
    const needsUpdate = () => {
      // Se estamos congelados, não atualizar
      if (areComponentsFrozen()) {
        return false;
      }
      
      // Se já temos estado persistente e foi atualizado recentemente, não precisamos atualizar
      if (persistentState[roletaNome]?.hasLoaded) {
        const lastUpdated = persistentState[roletaNome].lastUpdated;
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        // Se foi atualizado há menos de 5 minutos, não precisamos atualizar
        if (now - lastUpdated < fiveMinutes) {
          debugLog(`[CICLO][${roletaNome}] Dados ainda recentes (${Math.round((now - lastUpdated)/1000)}s), pulando busca`);
          return false;
        }
      }
      
      // Se não estiver visível, não precisamos atualizar agora
      if (!isDocumentVisible()) {
        debugLog(`[CICLO][${roletaNome}] Documento não visível, adiando atualização`);
        return false;
      }
      
      return true;
    };
    
    if (needsUpdate()) {
      // Buscar dados iniciais
      debugLog(`[CICLO][${roletaNome}] Buscando dados iniciais...`);
      
      fetchRouletteLatestNumbersByName(roletaNome, 20)
        .then(numbers => {
          if (!isMounted.current) return;
          
          if (numbers && numbers.length > 0) {
            debugLog(`[CICLO][${roletaNome}] Recebidos ${numbers.length} números`);
            const processedNumbers = numbers.map(n => Number(n));
            setLastNumbers(processedNumbers);
            
            // Atualizar estado persistente
            persistentState[roletaNome] = {
              lastNumbers: processedNumbers,
              lastUpdated: Date.now(),
              hasLoaded: true
            };
          } else if (initialLastNumbers && initialLastNumbers.length > 0) {
            debugLog(`[CICLO][${roletaNome}] Sem dados da API, usando iniciais`);
            setLastNumbers(initialLastNumbers);
          }
          
          setIsLoading(false);
          setDataSeeded(true);
        })
        .catch(error => {
          if (!isMounted.current) return;
          
          debugLog(`[ERRO][${roletaNome}] Erro ao buscar dados:`, error);
          if (initialLastNumbers && initialLastNumbers.length > 0) {
            setLastNumbers(initialLastNumbers);
          }
          setIsLoading(false);
          setDataSeeded(true);
        });
    } else {
      // Já temos dados recentes, apenas confirmar que está carregado
      setIsLoading(false);
      setDataSeeded(true);
    }
    
    // Configurar assinatura para receber novas atualizações em tempo real
    if (isDocumentVisible()) {
      try {
        debugLog(`[REALTIME][${roletaNome}] Configurando sistema de eventos...`);
        
        // Obter a instância do serviço de eventos
        const eventService = EventService.getInstance();
        
        // Define o callback que será chamado quando um novo número for recebido
        const handleNewNumber = (event: RouletteNumberEvent) => {
          if (!isMounted.current) return;
          
          debugLog(`[REALTIME][${roletaNome}] Recebido evento:`, event);
          
          if (event.roleta_nome === roletaNome) {
            const novoNumero = Number(event.numero);
            debugLog(`[REALTIME][${roletaNome}] Novo número: ${novoNumero}`);
            
            // Validar número antes de atualizar
            if (!isNaN(novoNumero) && novoNumero >= 0 && novoNumero <= 36) {
              // Usar a função updateLastNumber para atualizar apenas o último número
              updateLastNumber(novoNumero);
            }
          }
        };
        
        // Assinar o evento para esta roleta específica
        eventService.subscribe(roletaNome, handleNewNumber);
        
        // Limpar a assinatura quando o componente for desmontado
        return () => {
          debugLog(`[REALTIME][${roletaNome}] Limpando assinaturas de eventos`);
          eventService.unsubscribe(roletaNome, handleNewNumber);
        };
      } catch (error) {
        debugLog(`[ERRO][${roletaNome}] Erro ao configurar eventos em tempo real:`, error);
      }
    }
  }, [roletaNome, updateLastNumber]);

  const verificarEstrategia = (numero: number) => {
    // Placeholder para verificação de estratégia
    debugLog(`[${roletaNome}] Verificando estratégia para número: ${numero}`);
  };

  useEffect(() => {
    generateSuggestion();
  }, []);

  const generateSuggestion = () => {
    const groupKeys = Object.keys(numberGroups);
    const randomGroupKey = groupKeys[Math.floor(Math.random() * groupKeys.length)];
    const selectedGroup = numberGroups[randomGroupKey as keyof typeof numberGroups];
    
    const relatedStrategy = strategies.find(s => s.name.includes(selectedGroup.numbers.join(',')));
    setCurrentStrategy(relatedStrategy || strategies[0]);
    
    setSuggestion([...selectedGroup.numbers]);
    setSelectedGroup(randomGroupKey);
    
    toast({
      title: "Sugestão Gerada",
      description: `Grupo: ${selectedGroup.name}`,
      variant: "default"
    });
  };

  const toggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBlurred(!isBlurred);
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStatsOpen(true);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Roleta Aberta",
      description: "Redirecionando para o jogo...",
      variant: "default"
    });
  };

  // Efeito para subscrever eventos de estratégia
  useEffect(() => {
    // Obter o serviço de eventos
    const eventService = EventService.getInstance();
    
    // Callback para processar eventos de estratégia
    const handleStrategyUpdate = (event: StrategyUpdateEvent) => {
      if (event.type !== 'strategy_update' || event.roleta_nome !== roletaNome) return;
      
      debugLog(`[RouletteCard] ⚠️ Atualização do BACKEND para ${roletaNome}: ${event.estado}`);
      debugLog(`[RouletteCard] Detalhes: Estado=${event.estado}, Terminais=${event.terminais_gatilho}, Vitórias=${event.vitorias}, Derrotas=${event.derrotas}`);
      
      // Atualizar os estados da estratégia com prioridade maior que a lógica local
      setStrategyState(event.estado);
      setStrategyDisplay(event.sugestao_display || "");
      setStrategyTerminals(event.terminais_gatilho || []);
      
      // Atualizar contadores apenas se existirem no evento
      if (typeof event.vitorias === 'number') {
        setStrategyWins(event.vitorias);
      }
      
      if (typeof event.derrotas === 'number') {
        setStrategyLosses(event.derrotas);
      }
      
      // Notificar o usuário sobre mudanças importantes na estratégia
      if (event.estado === 'TRIGGER' && event.terminais_gatilho?.length > 0) {
        toast({
          title: `Estratégia Atualizada: ${roletaNome}`,
          description: `${event.sugestao_display || `Apostar em: ${event.terminais_gatilho.join(', ')}`}`,
          variant: "default"
        });
      }
    };
    
    // Inscrever-se para eventos desta roleta específica
    debugLog(`[RouletteCard] Inscrevendo para eventos de estratégia: ${roletaNome}`);
    eventService.subscribe(roletaNome, handleStrategyUpdate as any);
    
    // Também inscrever-se para o evento global
    const globalHandler = (event: any) => {
      if (event.type === 'strategy_update' && event.roleta_nome === roletaNome) {
        debugLog(`[RouletteCard] Recebido evento global para ${roletaNome}`);
        handleStrategyUpdate(event as StrategyUpdateEvent);
      }
    };
    
    eventService.subscribe('*', globalHandler);
    
    // Criar também subscrição com o Socket Service diretamente, por segurança
    let socketHandler: any = null;
    try {
      const socketService = SocketService.getInstance();
      if (socketService) {
        debugLog(`[RouletteCard] Inscrevendo também no Socket Service: ${roletaNome}`);
        
        socketHandler = (socketEvent: any) => {
          // Verificar se é um evento de estratégia
          if (socketEvent.type === 'strategy_update' && socketEvent.roleta_nome === roletaNome) {
            debugLog(`[RouletteCard] Evento de estratégia via Socket para ${roletaNome}: ${socketEvent.estado}`);
            handleStrategyUpdate(socketEvent as any);
          }
        };
        
        socketService.subscribe(roletaNome, socketHandler);
      }
    } catch (e) {
      debugLog(`[RouletteCard] Erro ao se inscrever no Socket Service: ${e}`);
    }
    
    // Limpar ao desmontar
    return () => {
      debugLog(`[RouletteCard] Limpando assinaturas de eventos para ${roletaNome}`);
      eventService.unsubscribe(roletaNome, handleStrategyUpdate as any);
      eventService.unsubscribe('*', globalHandler);
      
      // Tentar limpar também do socketService, se disponível
      if (socketHandler) {
        try {
          const socketService = SocketService.getInstance();
          if (socketService) {
            socketService.unsubscribe(roletaNome, socketHandler);
          }
        } catch (e) {
          // Silenciar erros na limpeza
        }
      }
    };
  }, [roletaNome]);

  // Memorize components to prevent unnecessary re-renders
  const memoizedNumbers = useMemo(() => (
    <LastNumbers numbers={lastNumbers} isLoading={isLoading} />
  ), [lastNumbers, isLoading]);

  const memoizedSuggestion = useMemo(() => (
    <SuggestionDisplay 
      suggestion={suggestion}
      selectedGroup={selectedGroup}
      isBlurred={isBlurred}
      toggleVisibility={toggleVisibility}
      numberGroups={numberGroups}
      strategyState={strategyState}
      strategyDisplay={strategyDisplay}
      strategyTerminals={strategyTerminals}
    />
  ), [suggestion, selectedGroup, isBlurred, strategyState, strategyDisplay, strategyTerminals]);

  const memoizedWinRate = useMemo(() => (
    <WinRateDisplay wins={strategyWins || wins} losses={strategyLosses || losses} />
  ), [wins, losses, strategyWins, strategyLosses]);

  const memoizedTrendChart = useMemo(() => (
    <RouletteTrendChart trend={trend} />
  ), [trend]);

  const memoizedActionButtons = useMemo(() => (
    <RouletteActionButtons 
      onDetailsClick={handleDetailsClick}
      onPlayClick={handlePlayClick}
    />
  ), []);

  // Função para determinar a cor do número da roleta
  const getRouletteNumberColor = (num: number) => {
    num = Number(num); // Garantir que o número está no formato correto
    if (num === 0) {
      return 'bg-green-600 text-white'; // Verde para o zero
    } else if ([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num)) {
      return 'bg-red-600 text-white'; // Vermelho para números específicos
    } else {
      return 'bg-black text-white'; // Preto para os demais números
    }
  };

  // Adicionar uso do hook useRoletaAnalytics para estatísticas simplificadas
  const { 
    colorDistribution, 
    currentStreak,
    missingDozens,
    loading: analyticsLoading 
  } = useRoletaAnalytics(roletaNome, 30000); // Atualiza a cada 30 segundos

  return (
    <div 
      className="bg-[#17161e]/90 backdrop-filter backdrop-blur-sm border border-white/10 rounded-xl p-3 md:p-4 space-y-2 md:space-y-3 animate-fade-in hover-scale cursor-pointer h-auto w-full overflow-hidden"
      onClick={handleDetailsClick}
    >
      {/* Header com Nome da Roleta */}
      <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="text-lg font-bold text-white truncate max-w-[180px]">
            {roletaNome}
          </div>
          
          {/* Indicador de estado da estratégia - versão mais visível */}
          {strategyState && (
            <div className={`text-xs px-2 py-1 rounded-md font-semibold flex items-center gap-1.5 min-w-20 justify-center ${
              strategyState === 'TRIGGER' ? 'bg-green-500/30 text-green-300 border border-green-500/50' : 
              strategyState === 'POST_GALE_NEUTRAL' ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' : 
              strategyState === 'MORTO' ? 'bg-red-500/30 text-red-300 border border-red-500/50' : 
              'bg-blue-500/30 text-blue-300 border border-blue-500/50'
            }`