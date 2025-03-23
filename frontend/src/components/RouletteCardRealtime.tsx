import { TrendingUp, ChartBar, ArrowUp, Eye, EyeOff, History, Target, Percent, Star, AlertTriangle, RefreshCw } from 'lucide-react';
import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { strategies, numberGroups } from './roulette/constants';
import LastNumbers from './roulette/LastNumbers';
import WinRateDisplay from './roulette/WinRateDisplay';
import RouletteTrendChart from './roulette/RouletteTrendChart';
import SuggestionDisplay from './roulette/SuggestionDisplay';
import RouletteActionButtons from './roulette/RouletteActionButtons';
import RouletteStatsModal from './roulette/RouletteStatsModal';
import { useRouletteData } from '@/hooks/useRouletteData';
import { Button } from '@/components/ui/button';
import { StrategyUpdateEvent } from '@/services/EventService';
import EventService from '@/services/EventService';
import SocketService from '@/services/SocketService';

// Debug flag - set to false to disable logs in production
const DEBUG_ENABLED = false;  // Desabilitando logs para melhorar performance

// Helper function for controlled logging
const debugLog = (...args: any[]) => {
  if (DEBUG_ENABLED) {
    console.log(...args);
  }
};

// Tabela de terminais para cada número da roleta
// Importado do arquivo terminal_table.py
const TERMINAL_TABLE = {
  0: [0, 3, 6, 10, 13, 16, 20, 23, 26, 30, 33, 36],
  1: [1, 4, 7, 11, 14, 17, 21, 24, 27, 31, 34, 37],
  2: [0, 2, 5, 8, 12, 15, 18, 22, 25, 28, 32, 35],
  3: [0, 3, 6, 9, 10, 13, 16, 19, 20, 23, 26, 29, 30, 33, 36],
  4: [4, 7, 8, 10, 14, 17, 18, 20, 24, 27, 28, 30, 34, 0],
  5: [5, 6, 9, 10, 15, 16, 19, 20, 25, 26, 29, 30, 35, 36, 0],
  6: [3, 6, 9, 10, 13, 16, 19, 20, 23, 26, 29, 30, 33, 36, 0],
  7: [4, 7, 8, 10, 14, 17, 18, 20, 24, 27, 28, 30, 34, 0],
  8: [4, 7, 8, 10, 14, 17, 18, 20, 24, 27, 28, 30, 34, 0],
  9: [5, 6, 9, 10, 15, 16, 19, 20, 25, 26, 29, 30, 35, 36, 0],
  10: [1, 2, 3, 10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33, 0],
  11: [1, 2, 3, 10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33, 0],
  12: [1, 2, 3, 10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33, 0],
  13: [1, 2, 3, 10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33, 0],
  14: [4, 7, 8, 10, 14, 17, 18, 20, 24, 27, 28, 30, 34, 0],
  15: [5, 6, 9, 10, 15, 16, 19, 20, 25, 26, 29, 30, 35, 36, 0],
  16: [3, 6, 9, 10, 13, 16, 19, 20, 23, 26, 29, 30, 33, 36, 0],
  17: [4, 7, 8, 10, 14, 17, 18, 20, 24, 27, 28, 30, 34, 0],
  18: [4, 7, 8, 10, 14, 17, 18, 20, 24, 27, 28, 30, 34, 0],
  19: [5, 6, 9, 10, 15, 16, 19, 20, 25, 26, 29, 30, 35, 36, 0],
  20: [1, 2, 3, 10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33, 0],
  21: [1, 2, 3, 10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33, 0],
  22: [1, 2, 3, 10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33, 0],
  23: [1, 2, 3, 10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33, 0],
  24: [4, 7, 8, 10, 14, 17, 18, 20, 24, 27, 28, 30, 34, 0],
  25: [5, 6, 9, 10, 15, 16, 19, 20, 25, 26, 29, 30, 35, 36, 0],
  26: [3, 6, 9, 10, 13, 16, 19, 20, 23, 26, 29, 30, 33, 36, 0],
  27: [4, 7, 8, 10, 14, 17, 18, 20, 24, 27, 28, 30, 34, 0],
  28: [4, 7, 8, 10, 14, 17, 18, 20, 24, 27, 28, 30, 34, 0],
  29: [5, 6, 9, 10, 15, 16, 19, 20, 25, 26, 29, 30, 35, 36, 0],
  30: [1, 2, 3, 10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33, 0],
  31: [1, 2, 3, 10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33, 0],
  32: [1, 2, 3, 10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33, 0],
  33: [1, 2, 3, 10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33, 0],
  34: [4, 7, 8, 10, 14, 17, 18, 20, 24, 27, 28, 30, 34, 0],
  35: [5, 6, 9, 10, 15, 16, 19, 20, 25, 26, 29, 30, 35, 36, 0],
  36: [3, 6, 9, 10, 13, 16, 19, 20, 23, 26, 29, 30, 33, 36, 0]
};

// Função para obter os terminais de um número conforme a tabela (apenas os 3 primeiros)
const getTerminalsForNumber = (number: number): number[] => {
  const num = number % 37; // Garantir que está no intervalo de 0-36
  if (TERMINAL_TABLE[num]) {
    // Retornar apenas os 3 primeiros terminais da tabela
    return TERMINAL_TABLE[num].slice(0, 3);
  }
  // Fallback caso não exista o número na tabela
  return [0, 1, 2];
};

// Função para gerar insights com base nos números
const getInsightMessage = (numbers: number[], wins: number, losses: number) => {
  if (!numbers || numbers.length === 0) {
    return "Aguardando dados...";
  }
  
  // Verificar repetições de dúzias
  const lastFiveNumbers = numbers.slice(0, 5);
  const firstDozen = lastFiveNumbers.filter(n => n >= 1 && n <= 12).length;
  const secondDozen = lastFiveNumbers.filter(n => n >= 13 && n <= 24).length;
  const thirdDozen = lastFiveNumbers.filter(n => n >= 25 && n <= 36).length;
  
  if (firstDozen >= 3) {
    return "Primeira dúzia aparecendo com frequência";
  } else if (secondDozen >= 3) {
    return "Segunda dúzia aparecendo com frequência";
  } else if (thirdDozen >= 3) {
    return "Terceira dúzia aparecendo com frequência";
  }
  
  // Verificar números pares ou ímpares
  const oddCount = lastFiveNumbers.filter(n => n % 2 === 1).length;
  const evenCount = lastFiveNumbers.filter(n => n % 2 === 0 && n !== 0).length;
  
  if (oddCount >= 4) {
    return "Tendência para números ímpares";
  } else if (evenCount >= 4) {
    return "Tendência para números pares";
  }
  
  // Verificar números baixos ou altos
  const lowCount = lastFiveNumbers.filter(n => n >= 1 && n <= 18).length;
  const highCount = lastFiveNumbers.filter(n => n >= 19 && n <= 36).length;
  
  if (lowCount >= 4) {
    return "Tendência para números baixos (1-18)";
  } else if (highCount >= 4) {
    return "Tendência para números altos (19-36)";
  }
  
  // Baseado na taxa de vitória
  const winRate = wins / (wins + losses);
  if (winRate > 0.7) {
    return "Boa taxa de acerto! Continue com a estratégia";
  } else if (winRate < 0.3) {
    return "Taxa de acerto baixa, considere mudar a estratégia";
  }
  
  return "Padrão normal, observe mais alguns números";
};

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

interface RouletteCardRealtimeProps {
  roletaId: string;
  name?: string;
  roleta_nome?: string;
  wins?: number;
  losses?: number;
}

// Uso de React.memo para evitar re-renders desnecessários
const RouletteCardRealtime = memo(({ 
  roletaId,
  name, 
  roleta_nome, 
  wins = 0, 
  losses = 0
}: RouletteCardRealtimeProps) => {
  const navigate = useNavigate();
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestion, setSuggestion] = useState<number[]>([]);
  const [isBlurred, setIsBlurred] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState(strategies[0]);
  const [selectedGroup, setSelectedGroup] = useState<string>("grupo-123");
  const [statsOpen, setStatsOpen] = useState(false);
  
  // Adicionar estado para os dados de estratégia
  const [strategyState, setStrategyState] = useState<string>("");
  const [strategyDisplay, setStrategyDisplay] = useState<string>("");
  const [strategyTerminals, setStrategyTerminals] = useState<number[]>([]);
  const [strategyWins, setStrategyWins] = useState<number>(0);
  const [strategyLosses, setStrategyLosses] = useState<number>(0);
  
  // Manter apenas referência para o último número processado para controle
  const lastProcessedNumberRef = useRef<number | null>(null);
  
  // Adicionar variável de controle para verificação do topo
  const lastTopNumberRef = useRef<number | null>(null);
  const checkIntervalRef = useRef<number | null>(null);
  
  // Verificar se o nome da roleta é válido, com fallback para roleta_nome
  const roletaNome = name || roleta_nome || "Roleta Desconhecida";
  
  // Usar o hook personalizado para obter dados em tempo real
  const { numbers, loading: isLoading, error, isConnected, hasData, strategy, strategyLoading, refreshNumbers } = useRouletteData(roletaId, roletaNome);
  
  // Converter os objetos RouletteNumber para números simples para compatibilidade com componentes existentes
  // usando useMemo para evitar recalcular quando numbers não mudar
  const lastNumbers = useMemo(() => {
    // Garantir que numbers é um array válido e não undefined
    if (!Array.isArray(numbers)) {
      return [];
    }
    
    // Mapear números obtidos do hook, garantindo que sejam válidos
    const mappedNumbers = numbers.map(numObj => {
      // Verificar se o número é válido (números de roleta vão de 0 a 36)
      const num = typeof numObj.numero === 'number' ? numObj.numero : 
                 typeof numObj.numero === 'string' ? parseInt(numObj.numero, 10) : 0;
      return isNaN(num) ? 0 : num;
    });
    
    // Verificar o resultado e logar para debug
    if (DEBUG_ENABLED) {
      debugLog(`[RouletteCardRealtime] Números mapeados para ${roletaNome}:`, mappedNumbers.slice(0, 5));
    }
    
    return mappedNumbers;
  }, [numbers, roletaNome]);

  // Otimizar trend com useMemo para evitar recálculos desnecessários
  const trend = useMemo(() => {
    return generateTrendFromWinRate(strategyWins || wins, strategyLosses || losses);
  }, [wins, losses, strategyWins, strategyLosses]);

  // Callback memoizado para atualizar a estratégia (reduz re-renders)
  const updateStrategy = useCallback((event: StrategyUpdateEvent) => {
    debugLog(`[RouletteCardRealtime] ⚠️ Evento de estratégia recebido para ${roletaNome}: ${event.estado}`);
    
    // Importante: Como este evento vem do backend, vamos marcar que já processamos o último número 
    // para que a geração local não sobrescreva esta atualização
    if (lastNumbers.length > 0) {
      lastProcessedNumberRef.current = lastNumbers[0];
    }
    
    // Atualizar os estados da estratégia com os dados do evento
    setStrategyState(event.estado);
    setStrategyDisplay(event.sugestao_display || "");
    setStrategyTerminals(event.terminais_gatilho || []);
    setStrategyWins(event.vitorias);
    setStrategyLosses(event.derrotas);
  }, [lastNumbers, roletaNome]);

  // Efeito para inicializar os dados da estratégia a partir do hook
  useEffect(() => {
    if (strategy && !strategyLoading) {
      debugLog(`[RouletteCardRealtime] Inicializando estado da estratégia de ${roletaNome} com dados carregados:`, strategy);
      setStrategyState(strategy.estado);
      setStrategyDisplay(strategy.sugestao_display || "");
      setStrategyTerminals(strategy.terminais_gatilho || []);
      setStrategyWins(strategy.vitorias);
      setStrategyLosses(strategy.derrotas);
    }
  }, [strategy, strategyLoading, roletaNome]);

  // Efeito para subscrever eventos de estratégia do backend
  useEffect(() => {
    // Obter o serviço de eventos
    const eventService = EventService.getInstance();
    
    // Log para verificar se o hook está sendo montado
    debugLog(`[RouletteCardRealtime] Montando componente para ${roletaNome} (ID: ${roletaId})`);
    
    // Callback para processar eventos de estratégia
    const handleStrategyUpdate = (event: StrategyUpdateEvent) => {
      // Verificar se é um evento relevante para este componente
      if (event.type !== 'strategy_update' || 
          (event.roleta_id !== roletaId && event.roleta_nome !== roletaNome)) {
        return;
      }
      
      updateStrategy(event);
    };
    
    // Subscrever para eventos de estratégia
    debugLog(`[RouletteCardRealtime] Inscrevendo para eventos de estratégia: ${roletaNome}`);
    eventService.subscribeToEvent('strategy_update', handleStrategyUpdate);
    
    // Subscrever para eventos globais (apenas para debug)
    debugLog(`[RouletteCardRealtime] Inscrevendo para eventos globais: ${roletaNome}`);
    const globalHandler = (event: any) => {
      // Debug de todos os eventos para esta roleta
      if (event.roleta_id === roletaId || event.roleta_nome === roletaNome) {
        debugLog(`[RouletteCardRealtime] ⚠️ Evento global recebido para ${roletaNome}:`, event);
      }
    };
    
    eventService.subscribeToGlobalEvents(globalHandler);
    
    // Necessário solicitar o estado atual da estratégia para sincronização inicial
    const requestCurrentStrategy = () => {
      const socketService = SocketService.getInstance();
      
      if (!socketService.isSocketConnected()) {
        debugLog(`[RouletteCardRealtime] Socket.IO não conectado para ${roletaNome}`);
        return;
      }
      
      debugLog(`[RouletteCardRealtime] Solicitando estratégia atual para ${roletaNome}`);
      
      socketService.sendMessage({
        type: 'get_strategy',
        roleta_id: roletaId,
        roleta_nome: roletaNome
      });
    };
    
    // Solicitar estratégia após um delay para garantir que o socket já está conectado
    setTimeout(requestCurrentStrategy, 2000);
    
    // Limpeza: remover subscrições ao desmontar
    return () => {
      debugLog(`[RouletteCardRealtime] Desmontando componente para ${roletaNome}`);
      eventService.unsubscribeFromEvent('strategy_update', handleStrategyUpdate);
      eventService.unsubscribeFromGlobalEvents(globalHandler);
      
      // Limpar qualquer intervalo de verificação pendente
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [roletaId, roletaNome, updateStrategy]);

  // Efeito para verificar constantemente os números do topo
  useEffect(() => {
    // Função para verificar se há novos números no topo
    const checkTopNumber = () => {
      if (lastNumbers.length > 0) {
        const topNumber = lastNumbers[0];
        
        // Se o número do topo mudou desde a última verificação
        if (lastProcessedNumberRef.current !== topNumber) {
          debugLog(`[RouletteCardRealtime] Novo número do topo detectado: ${topNumber} (anterior: ${lastProcessedNumberRef.current})`);
          
          // Atualizar referência do último número processado
          lastProcessedNumberRef.current = topNumber;
        }
      }
    };
    
    // Verificar imediatamente ao montar
    checkTopNumber();
    
    // Configurar verificação periódica com intervalo maior para evitar refreshes constantes
    if (!checkIntervalRef.current) {
      debugLog(`[RouletteCardRealtime] Iniciando verificação periódica de números do topo para ${roletaNome}`);
      checkIntervalRef.current = window.setInterval(() => {
        // Verificar sem forçar atualização completa
        checkTopNumber();
      }, 15000); // Verificar a cada 15 segundos para não sobrecarregar a UI
    }
    
    // Limpar ao desmontar
    return () => {
      if (checkIntervalRef.current) {
        debugLog(`[RouletteCardRealtime] Encerrando verificação periódica para ${roletaNome}`);
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [lastNumbers, roletaNome]);

  // Adicionar um hook simples para depuração das estratégias recebidas do backend
  useEffect(() => {
    if (strategyState) {
      debugLog(`[${roletaNome}] Exibindo estratégia recebida do backend: Estado=${strategyState}, Terminais=[${strategyTerminals.join(',')}]`);
    }
  }, [strategyState, strategyTerminals, roletaNome]);

  // Adicionar efeito para verificar dados ao montar
  useEffect(() => {
    // Log somente uma vez ao montar para não sobrecarregar a console
    debugLog(`[RouletteCardRealtime] Montado para ${roletaNome} (ID: ${roletaId})`);
    debugLog(`[RouletteCardRealtime] Estado inicial: loading=${isLoading}, hasData=${hasData}, números=${lastNumbers.length}`);
    
    // Verificar se os dados estão sendo carregados corretamente
    if (!isLoading && lastNumbers.length === 0) {
      // Tentar fazer um refresh para recuperar dados
      debugLog(`[RouletteCardRealtime] Sem números para ${roletaNome}, tentando refresh...`);
      refreshNumbers();
    }
  }, [roletaId, roletaNome, isLoading, hasData, lastNumbers.length, refreshNumbers]);

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
  
  // Função para tentar recarregar os dados
  const reloadData = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.reload();
  };

  // Memoização do LastNumbers component para evitar re-renders
  const numbersDisplay = useMemo(() => (
    <LastNumbers 
      numbers={lastNumbers} 
      isLoading={isLoading && lastNumbers.length === 0} // Só mostrar loading se não tivermos números
    />
  ), [lastNumbers, isLoading]);

  // Memoização do renderizado do componente para evitar re-renders
  const cardContent = useMemo(() => {
    return (
      <div 
        className={`glass-card flex flex-col justify-between p-4 ${isBlurred ? 'blurred-content' : ''}`}
        data-roleta-id={roletaId}
        data-loading={isLoading ? 'true' : 'false'}
        data-connected={isConnected ? 'true' : 'false'}
      >
        {/* Header com nome da roleta e controles */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-white/90 font-bold">{roletaNome}</h2>
            <p className="text-[#00ff00] text-xs">{
              strategyState === 'WAITING' ? 'Aguardando Padrão' :
              strategyState === 'ACTIVE' ? (strategyDisplay || 'Padrão Ativo') :
              strategyState === 'TRIGGER' ? 'Padrão Identificado' :
              'Aguardando Padrão'
            }</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <TrendingUp
              size={16}
              className={`text-[#00ff00] ${isConnected ? 'animate-pulse' : 'text-opacity-30'}`}
              aria-label={isConnected ? 'Conectado' : 'Desconectado'}
            />
            <Star size={16} className="text-[#00ff00]" style={{opacity: 0.7}} />
            {showSuggestions && 
              <button 
                onClick={() => setIsBlurred(!isBlurred)}
                className="text-[#00ff00] hover:text-[#00ff00]/90 transition-colors"
              >
                {isBlurred ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          </div>
        </div>
        
        {/* Display de números - usando o componente memoizado */}
        <div className="flex flex-col py-2">
          {numbersDisplay}
        </div>
        
        {/* Taxa de vitória */}
        <div className="mt-1 mb-3">
          <WinRateDisplay 
            wins={strategyWins || wins} 
            losses={strategyLosses || losses} 
          />
          <RouletteTrendChart data={trend} />
        </div>
        
        {/* Análise de padrão */}
        <div className="mb-3">
          <div className="flex items-center gap-1">
            <Target size={10} className="text-[#00ff00]" />
            <span className="text-[8px] text-[#00ff00] font-medium">Análise de Padrão</span>
          </div>
          <div className="text-[10px] text-gray-300">
            {hasData && lastNumbers.length > 0 ? 
              getInsightMessage(lastNumbers, strategyWins || wins, strategyLosses || losses) : 
              "Aguardando dados..."
            }
          </div>
        </div>
        
        {/* Status atual */}
        <div className="mb-4">
          <div className="flex items-center gap-1">
            <Target size={10} className="text-[#00ff00]" />
            <span className="text-[8px] text-[#00ff00] font-medium">Status</span>
          </div>
          <div className="text-[10px] text-gray-300">
            {strategyState === 'TRIGGER' ? 'Aguardando padrão...' :
             strategyState === 'ACTIVE' ? (
               <SuggestionDisplay
                suggestion={strategyDisplay || "Estratégia ativa, mas sem sugestão"}
                isActive={true}
                terminals={strategyTerminals}
                isBlurred={isBlurred && showSuggestions}
              />
             ) : 'Aguardando padrão...'}
          </div>
        </div>
        
        {/* Botões de ação */}
        <RouletteActionButtons 
          onDetailsClick={() => setStatsOpen(true)} 
          onPlayClick={() => navigate(`/roleta/${roletaId}`)}
          isConnected={isConnected}
          hasData={hasData}
        />
        
        {/* Modal de estatísticas */}
        <RouletteStatsModal 
          open={statsOpen} 
          onClose={setStatsOpen} 
          roletaNome={roletaNome}
          lastNumbers={lastNumbers}
          wins={strategyWins || wins}
          losses={strategyLosses || losses}
        />
      </div>
    );
  }, [
    isBlurred, 
    roletaNome, 
    strategyState, 
    showSuggestions, 
    isLoading, 
    lastNumbers, 
    trend, 
    strategyWins, 
    strategyLosses, 
    wins, 
    losses, 
    strategyDisplay, 
    strategyTerminals, 
    isConnected, 
    hasData, 
    statsOpen,
    navigate,
    numbersDisplay
  ]);

  return cardContent;
}, (prevProps, nextProps) => {
  // Função de comparação personalizada para React.memo
  // Retorna true se o componente NÃO deve ser renderizado novamente
  return prevProps.roletaId === nextProps.roletaId &&
         prevProps.name === nextProps.name &&
         prevProps.roleta_nome === nextProps.roleta_nome;
});

export default RouletteCardRealtime; 