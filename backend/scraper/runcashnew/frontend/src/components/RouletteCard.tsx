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
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import RouletteStatsModal from './roulette/RouletteStatsModal';
import { fetchRouletteLatestNumbersByName } from '@/integrations/api/rouletteService';
import { useRoletaAnalytics } from '@/hooks/useRoletaAnalytics';

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

const RouletteCard = ({ name, roleta_nome, lastNumbers: initialLastNumbers, wins, losses, trend }: RouletteCardProps) => {
  const navigate = useNavigate();
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestion, setSuggestion] = useState<number[]>([]);
  const [isBlurred, setIsBlurred] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState(strategies[0]);
  const [selectedGroup, setSelectedGroup] = useState<string>("grupo-123");
  
  // Verificar se o nome da roleta é válido, com fallback para roleta_nome
  const roletaNome = name || roleta_nome || "Roleta Desconhecida";
  
  // Log para depuração dos valores recebidos
  console.log(`[RouletteCard] Props recebidas - name: ${name}, roleta_nome: ${roleta_nome}, nome final: ${roletaNome}`);
  
  // Inicializamos o estado a partir do estado persistente, se existir
  const [lastNumbers, setLastNumbers] = useState<number[]>(() => {
    if (persistentState[roletaNome]?.lastNumbers?.length > 0) {
      console.log(`[PERSISTÊNCIA][${roletaNome}] Recuperando estado salvo:`, 
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
  
  // Referência para o intervalo de polling (desativado por padrão)
  const pollingIntervalRef = useRef<number | null>(null);
  
  // Referência para a assinatura do Supabase Realtime
  const supabaseSubscriptionRef = useRef<any>(null);
  
  // Registra o componente como montado
  const isMounted = useRef(true);
  
  // Controle para ativar/desativar o polling
  const ENABLE_POLLING = false; // Desativado por padrão
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
      console.log(`[EVENTO][${roletaNome}] Retorno à página detectado, tempo fora:`, 
        Math.round(event.detail.timeAway / 1000), 'segundos');
        
      // Se os componentes estão congelados, não fazer nada
      if (areComponentsFrozen()) {
        console.log(`[EVENTO][${roletaNome}] Componentes congelados, mantendo estado atual`);
        return;
      }
      
      // Verificar se precisamos atualizar dados
      const lastUpdated = persistentState[roletaNome]?.lastUpdated || 0;
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;
      
      // Só atualizar se ficar mais de 30 minutos fora
      if (event.detail.timeAway > thirtyMinutes) {
        console.log(`[EVENTO][${roletaNome}] Tempo fora maior que 30 minutos, atualizando dados`);
    
        // Atualização silenciosa em segundo plano, sem alterar UI imediatamente
        fetchRouletteLatestNumbersByName(roletaNome, 20)
          .then(numbers => {
            if (!isMounted.current) return;
            
            if (numbers && numbers.length > 0) {
              const processedNumbers = numbers.map(n => Number(n));
              
              // Comparar com os dados atuais para verificar se há novidades
              if (JSON.stringify(processedNumbers) !== JSON.stringify(lastNumbers)) {
                console.log(`[EVENTO][${roletaNome}] Novos dados disponíveis, atualizando silenciosamente`);
                setLastNumbers(processedNumbers);
              } else {
                console.log(`[EVENTO][${roletaNome}] Dados iguais, mantendo estado atual`);
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
            console.error(`[ERRO][${roletaNome}] Erro ao atualizar dados:`, error);
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
      console.log(`[UPDATE][${roletaNome}] Atualizando apenas o último número: ${novoNumero}`);
      
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
    console.log(`[CICLO][${roletaNome}] Componente montado`);
    
    // Se os componentes estão congelados, não fazer nada além de carregar do estado persistente
    if (areComponentsFrozen()) {
      console.log(`[CICLO][${roletaNome}] Componentes congelados, usando apenas estado persistente`);
      
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
          console.log(`[CICLO][${roletaNome}] Dados ainda recentes (${Math.round((now - lastUpdated)/1000)}s), pulando busca`);
          return false;
        }
      }
      
      // Se não estiver visível, não precisamos atualizar agora
      if (!isDocumentVisible()) {
        console.log(`[CICLO][${roletaNome}] Documento não visível, adiando atualização`);
        return false;
      }
      
      return true;
    };
    
    if (needsUpdate()) {
      // Buscar dados iniciais do Supabase
      console.log(`[CICLO][${roletaNome}] Buscando dados iniciais no Supabase...`);
      
      fetchRouletteLatestNumbersByName(roletaNome, 20)
        .then(numbers => {
          if (!isMounted.current) return;
          
          if (numbers && numbers.length > 0) {
            console.log(`[CICLO][${roletaNome}] Recebidos ${numbers.length} números`);
            const processedNumbers = numbers.map(n => Number(n));
            setLastNumbers(processedNumbers);
            setUsingSupabaseData(true);
            
            // Atualizar estado persistente
            persistentState[roletaNome] = {
              lastNumbers: processedNumbers,
              lastUpdated: Date.now(),
              hasLoaded: true
            };
          } else if (initialLastNumbers && initialLastNumbers.length > 0) {
            console.log(`[CICLO][${roletaNome}] Sem dados do Supabase, usando iniciais`);
            setLastNumbers(initialLastNumbers);
          }
          
          setIsLoading(false);
          setDataSeeded(true);
        })
        .catch(error => {
          if (!isMounted.current) return;
          
          console.error(`[ERRO][${roletaNome}] Erro ao buscar dados:`, error);
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
    
    // Configurar assinatura do Supabase Realtime para a tabela roleta_numeros
    let subscription: any = null;
    
    if (isDocumentVisible()) {
      try {
        console.log(`[REALTIME][${roletaNome}] Configurando canal Realtime...`);
        
        // Verificar se as variáveis de ambiente estão disponíveis
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          console.error(`[REALTIME][${roletaNome}] Erro: Variáveis de ambiente do Supabase não configuradas corretamente.`);
          console.error('VITE_SUPABASE_URL e VITE_SUPABASE_API_KEY são necessárias no arquivo .env');
        } else {
          console.log(`[REALTIME][${roletaNome}] Conectando ao Supabase em: ${supabaseUrl.substring(0, 20)}...`);
        }
        
        // Canal com um nome único baseado na roleta e timestamp
        const channelName = `roleta_numeros_changes_${roletaNome}_${Date.now()}`;
        console.log(`[REALTIME][${roletaNome}] Nome do canal: ${channelName}`);
        
        subscription = supabase
          .channel(channelName)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'roleta_numeros',
            filter: 'roleta_nome=eq.' + roletaNome
          }, (payload) => {
            if (!isMounted.current) return;
            
            console.log(`[REALTIME][${roletaNome}] Recebido payload:`, payload);
            
            if (payload.new && payload.new.roleta_nome === roletaNome) {
              const novoNumero = Number(payload.new.numero);
              console.log(`[REALTIME][${roletaNome}] Novo número: ${novoNumero} (${typeof novoNumero})`);
              
              // Validar número antes de atualizar
              if (!isNaN(novoNumero) && novoNumero >= 0 && novoNumero <= 36) {
                // Usar a função updateLastNumber para atualizar apenas o último número
                updateLastNumber(novoNumero);
                
                // Notificação visual para o usuário
                toast({
                  title: "Novo número!",
                  description: `${roletaNome}: ${novoNumero}`,
                  duration: 3000
                });
              } else {
                console.error(`[REALTIME][${roletaNome}] Número inválido recebido: ${novoNumero}`);
              }
            } else {
              console.log(`[REALTIME][${roletaNome}] Payload recebido mas não corresponde ao filtro atual:`, payload);
            }
          })
          .subscribe((status: string) => {
            console.log(`[REALTIME][${roletaNome}] Status da assinatura: ${status}`);
            if (status === 'SUBSCRIBED') {
              console.log(`[REALTIME][${roletaNome}] Inscrição bem-sucedida! Aguardando eventos.`);
              // Indicar visualmente que a assinatura está ativa
              toast({
                title: "Conectado!",
                description: `Monitorando ${roletaNome} em tempo real`,
                duration: 2000
              });
            } else if (status === 'CHANNEL_ERROR') {
              console.error(`[REALTIME][${roletaNome}] Erro no canal. Verifique se a replicação está ativada no Supabase.`);
              toast({
                title: "Erro de conexão",
                description: "Não foi possível conectar ao serviço em tempo real",
                variant: "destructive",
                duration: 5000
              });
            } else if (status === 'TIMED_OUT') {
              console.error(`[REALTIME][${roletaNome}] Tempo esgotado ao conectar ao Supabase Realtime.`);
              toast({
                title: "Timeout",
                description: "Conexão com o serviço em tempo real expirou",
                variant: "destructive",
                duration: 5000
              });
            }
          });
          
        supabaseSubscriptionRef.current = subscription;
        
        // Verificar após 5 segundos se houve alguma atividade
        setTimeout(() => {
          console.log(`[REALTIME][${roletaNome}] Verificação de atividade após 5s: Canal ativo e aguardando eventos.`);
          console.log(`[REALTIME][${roletaNome}] Dica: Verifique se a replicação está ativada no dashboard do Supabase.`);
        }, 5000);
      } catch (error) {
        console.error(`[REALTIME][${roletaNome}] Erro ao configurar Realtime:`, error);
      }
    }
    
    // Registrar evento de visibilidade
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log(`[VISIBILIDADE][${roletaNome}] Documento visível, verificando estado`);
        
        // Verificar se precisamos atualizar dados
        const lastUpdated = persistentState[roletaNome]?.lastUpdated || 0;
        const now = Date.now();
        
        // Aumentar o intervalo para 30 minutos em vez de 10 minutos para reduzir recargas
        const thirtyMinutes = 30 * 60 * 1000;
        
        // Verificar se o sistema está congelado (bloqueio anti-recarga)
        if (areComponentsFrozen()) {
          console.log(`[VISIBILIDADE][${roletaNome}] Componentes congelados, mantendo estado atual`);
          return;
        }
        
        // Só atualizar se os dados forem muito antigos
        if (now - lastUpdated > thirtyMinutes) {
          console.log(`[VISIBILIDADE][${roletaNome}] Dados antigos, atualizando...`);
          
          fetchRouletteLatestNumbersByName(roletaNome, 1)
            .then(numbers => {
              if (!isMounted.current) return;
              
              if (numbers && numbers.length > 0) {
                const novoNumero = Number(numbers[0]);
                
                // Comparar com o número atual antes de atualizar
                if (lastNumbers.length === 0 || lastNumbers[0] !== novoNumero) {
                  // Atualizar apenas o último número
                  updateLastNumber(novoNumero);
                } else {
                  console.log(`[VISIBILIDADE][${roletaNome}] Mesmo número, não atualizando UI`);
                  // Apenas atualizar o timestamp sem recarregar a UI
                  persistentState[roletaNome] = {
                    ...(persistentState[roletaNome] || {}),
                    lastNumbers: lastNumbers,  // Garantir que lastNumbers está presente
                    lastUpdated: now,
                    hasLoaded: true
                  };
                }
              }
            })
            .catch(error => {
              console.error(`[ERRO][${roletaNome}] Erro ao atualizar dados:`, error);
            });
        } else {
          console.log(`[VISIBILIDADE][${roletaNome}] Dados recentes (${Math.round((now - lastUpdated)/1000)}s), mantendo estado`);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Limpeza
    return () => {
      console.log(`[CICLO][${roletaNome}] Componente desmontado`);
      isMounted.current = false;
      
      if (subscription) {
        console.log(`[REALTIME][${roletaNome}] Removendo assinatura`);
        supabase.removeChannel(subscription);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [roletaNome]); // Dependência apenas do nome da roleta

  const verificarEstrategia = (numero: number) => {
    // Placeholder para verificação de estratégia
    console.log(`[${roletaNome}] Verificando estratégia para número: ${numero}`);
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
    />
  ), [suggestion, selectedGroup, isBlurred]);

  const memoizedWinRate = useMemo(() => (
    <WinRateDisplay wins={wins} losses={losses} />
  ), [wins, losses]);

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
        </div>
        
        <div className="flex items-center gap-1">
          {/* Pequena visualização do trend */}
          <div className="text-xs text-green-400 flex items-center gap-1">
            <TrendingUp size={12} />
            <span>{wins}</span>
          </div>
          <div className="mx-1 text-gray-400">/</div>
          <div className="text-xs text-red-400 flex items-center gap-1">
            <TrendingUp size={12} className="transform rotate-180" />
            <span>{losses}</span>
          </div>
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="flex flex-col h-full">
        {/* Números Recentes */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <History size={12} />
              <span>Números Recentes</span>
            </div>
          </div>
          {memoizedNumbers}
        </div>
        
        {/* Sugestões */}
        {showSuggestions && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Target size={12} />
                <span>Sugestões</span>
              </div>
              <button 
                className="text-xs text-gray-400 hover:text-white transition-colors"
                onClick={toggleVisibility}
              >
                {isBlurred ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
            {memoizedSuggestion}
          </div>
        )}
        
        {/* Win Rate e Trend juntos numa linha */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-xs text-gray-400 flex items-center gap-1 mb-1">
              <Percent size={12} />
              <span>Taxa de Acerto</span>
            </div>
            {memoizedWinRate}
          </div>
          
          <div>
            <div className="text-xs text-gray-400 flex items-center gap-1 mb-1">
              <ChartBar size={12} />
              <span>Tendência</span>
            </div>
            {memoizedTrendChart}
          </div>
        </div>
        
        {/* Insights */}
        <div className="mb-3">
          <div className="text-xs text-gray-400 flex items-center gap-1 mb-1">
            <AlertTriangle size={12} />
            <span>Insights</span>
          </div>
          <div className="text-sm bg-[#221f2e]/50 rounded-lg p-2 border border-indigo-500/20">
            <div className="flex gap-1 items-center">
              <Star className="text-yellow-500" size={14} />
              <span className="text-white">
                {getInsightMessage(lastNumbers, wins, losses)}
              </span>
            </div>
          </div>
        </div>
        
        {memoizedActionButtons}

        <RouletteStatsModal
          open={statsOpen}
          onOpenChange={setStatsOpen}
          name={roletaNome}
          lastNumbers={lastNumbers}
          wins={wins}
          losses={losses}
          trend={trend}
        />
      </div>
    </div>
  );
};

// Funções auxiliares para insights
const getColorName = (num: number): string => {
  num = Number(num); // Garantir que o número está no formato correto
  if (num === 0) return "Verde";
  if ([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num)) return "Vermelho";
  return "Preto";
};

const getColorStreak = (numbers: number[]): number => {
  const firstColor = getColorName(numbers[0]);
  let streak = 1;
  
  for (let i = 1; i < numbers.length; i++) {
    if (getColorName(numbers[i]) === firstColor) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

const getInsightMessage = (numbers: number[], wins: number, losses: number): string => {
  const lastNum = numbers[0];
  const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(lastNum);
  const isBlack = lastNum !== 0 && !isRed;
  const winRate = wins / (wins + losses);
  
  if (winRate > 0.65) {
    return "Momento favorável para apostar em números " + (isRed ? "pretos" : "vermelhos");
  } else if (numbers.filter(n => n % 2 === 0).length > numbers.length * 0.7) {
    return "Tendência de números pares nas últimas rodadas";
  } else if (numbers.filter(n => n % 2 !== 0).length > numbers.length * 0.7) {
    return "Tendência de números ímpares nas últimas rodadas";
  } else if (numbers.filter(n => n <= 18).length > numbers.length * 0.7) {
    return "Tendência de números baixos (1-18) nas últimas rodadas";
  } else if (numbers.filter(n => n > 18 && n <= 36).length > numbers.length * 0.7) {
    return "Tendência de números altos (19-36) nas últimas rodadas";
  } else {
    return "Distribua suas apostas em diferentes setores da mesa";
  }
};

export default RouletteCard;
