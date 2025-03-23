import { useState, useEffect, useCallback, useRef } from 'react';
import SocketService from '@/services/SocketService';
import { RouletteNumberEvent } from '@/services/EventService';
import { fetchRouletteLatestNumbers, fetchRouletteStrategy, RouletteStrategy as ApiRouletteStrategy } from '@/integrations/api/rouletteService';
import { toast } from '@/components/ui/use-toast';

// Debug flag - set to true para facilitar depuração durante desenvolvimento
const DEBUG_ENABLED = true;

// Helper function for controlled logging
const debugLog = (...args: any[]) => {
  if (DEBUG_ENABLED) {
    console.log(...args);
  }
};

// Interface para número da roleta
export interface RouletteNumber {
  numero: number;
  cor: string;
  timestamp: string;
}

// Interface para o estado da estratégia - usando a mesma definição da API
export type RouletteStrategy = ApiRouletteStrategy;

// Interface para o resultado do hook
export interface UseRouletteDataResult {
  numbers: RouletteNumber[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  hasData: boolean;
  strategy: RouletteStrategy | null;
  strategyLoading: boolean;
  refreshNumbers: () => Promise<boolean>;
}

/**
 * Função auxiliar para determinar a cor de um número da roleta
 */
const determinarCorNumero = (numero: number): string => {
  if (numero === 0) return 'verde';
  
  // Números vermelhos na roleta europeia
  const numerosVermelhos = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return numerosVermelhos.includes(numero) ? 'vermelho' : 'preto';
};

// Generate fallback numbers for UI testing/display
const generateFallbackNumbers = (amount: number = 12): RouletteNumber[] => {
  const now = new Date();
  // Some predefined numbers for a consistent display
  const predefinedNumbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 8, 5, 13];
  
  return Array(amount).fill(0).map((_, index) => {
    const numero = predefinedNumbers[index % predefinedNumbers.length];
    return {
      numero,
      cor: determinarCorNumero(numero),
      timestamp: new Date(now.getTime() - (index * 60000)).toISOString()
    };
  });
};

/**
 * Hook para obter e atualizar dados da roleta em tempo real
 * @param roletaId - ID da roleta
 * @param roletaNome - Nome da roleta (para subscrição de eventos)
 * @param limit - Limite de números a serem exibidos
 * @returns Objeto com números, estado de carregamento, erro e status de conexão
 */
export function useRouletteData(
  roletaId: string, 
  roletaNome: string, 
  limit: number = 500
): UseRouletteDataResult {
  const [numbers, setNumbers] = useState<RouletteNumber[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // Only for initial loading
  const [refreshLoading, setRefreshLoading] = useState<boolean>(false); // For refresh operations
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [hasData, setHasData] = useState<boolean>(false);
  const [strategy, setStrategy] = useState<RouletteStrategy | null>(null);
  const [strategyLoading, setStrategyLoading] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(0);
  const maxRetries = 3;
  const initialLoadCompleted = useRef<boolean>(false);
  
  // Carregar números iniciais da API - Somente na montagem inicial
  useEffect(() => {
    // Só carregamos dados iniciais uma vez
    if (initialLoadCompleted.current) return;
    
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!roletaId) {
          debugLog(`[useRouletteData] ID de roleta inválido: ${roletaId}`);
          setLoading(false);
          setHasData(false);
          return;
        }
        
        debugLog(`[useRouletteData] Buscando números para ${roletaNome} (ID: ${roletaId})`);
        const numerosArray = await fetchRouletteLatestNumbers(roletaId, limit);
        
        if (numerosArray && Array.isArray(numerosArray) && numerosArray.length > 0) {
          const formattedNumbers: RouletteNumber[] = numerosArray.map((numero, index) => {
            const now = new Date();
            const timestamp = new Date(now.getTime() - (index * 60000)).toISOString();
            
            return {
              numero,
              cor: determinarCorNumero(numero),
              timestamp
            };
          });
          
          setNumbers(formattedNumbers);
          setHasData(true);
          setRetryCount(0);
          initialLoadCompleted.current = true;
          debugLog(`[useRouletteData] Carregados ${formattedNumbers.length} números iniciais para ${roletaNome}`);
        } else {
          if (retryCount >= maxRetries) {
            debugLog(`[useRouletteData] Gerando dados de fallback para ${roletaNome} após ${retryCount} tentativas`);
            const fallbackNumbers = generateFallbackNumbers(12);
            setNumbers(fallbackNumbers);
            setHasData(true);
            initialLoadCompleted.current = true;
          } else {
            setHasData(false);
            setRetryCount(prev => prev + 1);
          }
        }
      } catch (err: any) {
        console.error(`[useRouletteData] Erro ao carregar dados iniciais: ${err.message}`);
        setError(`Erro ao carregar dados: ${err.message}`);
        
        if (retryCount >= maxRetries) {
          debugLog(`[useRouletteData] Gerando dados de fallback após erro para ${roletaNome}`);
          const fallbackNumbers = generateFallbackNumbers(12);
          setNumbers(fallbackNumbers);
          setHasData(true);
          initialLoadCompleted.current = true;
        } else {
          setRetryCount(prev => prev + 1);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [roletaId, roletaNome, limit, retryCount, maxRetries]);
  
  // Handler para novos números - Adiciona sem recarregar tudo
  const handleNewNumber = useCallback((event: RouletteNumberEvent) => {
    if (event.type !== 'new_number') return;
    
    const numero = typeof event.numero === 'string' ? parseInt(event.numero, 10) : event.numero;
    debugLog(`[useRouletteData] Número recebido via evento para ${roletaNome}: ${numero}`);
    
    setNumbers(prev => {
      const isDuplicate = prev.some(num => 
        num.numero === numero && 
        num.timestamp === event.timestamp
      );
      
      if (isDuplicate) {
        return prev;
      }
      
      const newNumber: RouletteNumber = {
        numero,
        cor: determinarCorNumero(numero),
        timestamp: event.timestamp || new Date().toISOString()
      };
      
      // Adicionar ao topo sem recarregar toda a lista
      const updatedNumbers = [newNumber, ...prev].slice(0, limit);
      return updatedNumbers;
    });
    
    setHasData(true);
    setIsConnected(true);
  }, [roletaNome, limit]);
  
  // Função para atualizar manualmente os números - Não afeta o estado de loading principal
  const refreshNumbers = useCallback(async () => {
    debugLog(`[useRouletteData] Atualizando números em segundo plano para ${roletaNome}`);
    setRefreshLoading(true);
    
    try {
      const latestNumbers = await fetchRouletteLatestNumbers(roletaId, limit);
      
      if (latestNumbers && latestNumbers.length > 0) {
        const formattedNumbers: RouletteNumber[] = latestNumbers.map((numero, index) => {
          // Usar timestamps relativos baseados no índice (mais recente primeiro)
          const now = new Date();
          const timestamp = new Date(now.getTime() - (index * 60000)).toISOString();
          
          return {
            numero,
            cor: determinarCorNumero(numero),
            timestamp
          };
        });
        
        // Atualizar sem disparar loading UI
        setNumbers(formattedNumbers);
        setHasData(true);
        return true;
      }
      return false;
    } catch (error: any) {
      debugLog(`[useRouletteData] Erro ao atualizar números: ${error.message}`);
      return false;
    } finally {
      setRefreshLoading(false);
    }
  }, [roletaId, roletaNome, limit]);
  
  // Carregar o estado da estratégia
  useEffect(() => {
    const loadStrategyData = async () => {
      try {
        setStrategyLoading(true);
        
        // Obter estado da estratégia da API
        const strategyData = await fetchRouletteStrategy(roletaId);
        
        if (strategyData) {
          setStrategy(strategyData);
          debugLog(`[useRouletteData] Estado da estratégia carregado para ${roletaNome}`);
        } else {
          debugLog(`[useRouletteData] Nenhum dado de estratégia encontrado para ${roletaNome}`);
          setStrategy(null);
        }
      } catch (err: any) {
        console.error(`[useRouletteData] Erro ao carregar estratégia: ${err.message}`);
        setStrategy(null);
      } finally {
        setStrategyLoading(false);
      }
    };
    
    loadStrategyData();
  }, [roletaId]);
  
  // Subscrever para eventos da roleta
  useEffect(() => {
    const socketService = SocketService.getInstance();
    
    // Subscrever para eventos
    debugLog(`[useRouletteData] Inscrevendo para eventos da roleta: ${roletaNome}`);
    socketService.subscribe(roletaNome, handleNewNumber);
    
    // Atualizar status de conexão
    const isSocketConnected = socketService.isSocketConnected();
    debugLog(`[useRouletteData] Status da conexão Socket.IO: ${isSocketConnected ? 'Conectado' : 'Desconectado'}`);
    setIsConnected(isSocketConnected);
    
    // Função para verificar e atualizar status da conexão periodicamente
    const connectionCheckInterval = setInterval(() => {
      const currentStatus = socketService.isSocketConnected();
      if (currentStatus !== isConnected) {
        debugLog(`[useRouletteData] Mudança no status da conexão: ${currentStatus}`);
        setIsConnected(currentStatus);
      }
      
      // Se a conexão está OK mas não temos dados, tentar refresh
      if (currentStatus && !hasData && !loading) {
        debugLog(`[useRouletteData] Conectado mas sem dados, tentando refresh para ${roletaNome}`);
        refreshNumbers();
      }
    }, 10000);
    
    return () => {
      // Remover subscrição ao desmontar
      debugLog(`[useRouletteData] Removendo inscrição para eventos da roleta: ${roletaNome}`);
      socketService.unsubscribe(roletaNome, handleNewNumber);
      clearInterval(connectionCheckInterval);
    };
  }, [roletaNome, handleNewNumber, hasData, loading, isConnected]);
  
  return {
    numbers,
    loading, // This will only be true during initial loading
    error,
    isConnected,
    hasData,
    strategy,
    strategyLoading,
    refreshNumbers
  };
}