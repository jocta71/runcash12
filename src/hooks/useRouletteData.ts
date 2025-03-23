import { useState, useEffect, useCallback } from 'react';
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
  limit: number = 50
): UseRouletteDataResult {
  const [numbers, setNumbers] = useState<RouletteNumber[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [hasData, setHasData] = useState<boolean>(false);
  const [strategy, setStrategy] = useState<RouletteStrategy | null>(null);
  const [strategyLoading, setStrategyLoading] = useState<boolean>(true);
  
  // Carregar números iniciais da API
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Obter números iniciais da API (retorna um array de números)
        const numerosArray = await fetchRouletteLatestNumbers(roletaId, limit);
        
        if (numerosArray && numerosArray.length > 0) {
          // Converter array de números para o formato RouletteNumber
          const formattedNumbers: RouletteNumber[] = numerosArray.map((numero, index) => {
            // Para números da API que não têm timestamp, usar timestamps decrescentes fictícios
            // para simular a ordem cronológica (mais recente primeiro)
            const now = new Date();
            const timestamp = new Date(now.getTime() - (index * 60000)).toISOString(); // 1 minuto de diferença
            
            return {
              numero,
              cor: determinarCorNumero(numero),
              timestamp
            };
          });
          
          setNumbers(formattedNumbers);
          setHasData(true);
          debugLog(`[useRouletteData] Carregados ${formattedNumbers.length} números iniciais para ${roletaNome}`);
        } else {
          debugLog(`[useRouletteData] Nenhum número encontrado no banco de dados para ${roletaNome}`);
          setHasData(false);
          
          toast({
            title: `Sem dados para ${roletaNome}`,
            description: "Aguardando dados reais da roleta",
            variant: "default",
            duration: 5000
          });
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error(`[useRouletteData] Erro ao carregar dados iniciais: ${err.message}`);
        setError(`Erro ao carregar dados: ${err.message}`);
        setHasData(false);
        
        toast({
          title: `Erro de conexão: ${roletaNome}`,
          description: "Não foi possível obter dados da roleta",
          variant: "destructive",
          duration: 3000
        });
        
        setLoading(false);
      }
    };
    
    // Carregar o estado da estratégia
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
        
        setStrategyLoading(false);
      } catch (err: any) {
        console.error(`[useRouletteData] Erro ao carregar estratégia: ${err.message}`);
        setStrategy(null);
        setStrategyLoading(false);
      }
    };
    
    loadInitialData();
    loadStrategyData();
  }, [roletaId, roletaNome, limit]);
  
  // Handler para novos números
  const handleNewNumber = useCallback((event: RouletteNumberEvent) => {
    // Verificar se é um evento de novo número
    if (event.type !== 'new_number') return;
    
    // Converter para número inteiro se for string
    const numero = typeof event.numero === 'string' ? parseInt(event.numero, 10) : event.numero;
    
    debugLog(`[useRouletteData] Número recebido via evento para ${roletaNome}: ${numero}`);
    
    // Adicionar à lista de números
    setNumbers(prev => {
      // Verificar se já temos este número para evitar duplicação
      const isDuplicate = prev.some(num => 
        num.numero === numero && 
        num.timestamp === event.timestamp
      );
      
      if (isDuplicate) {
        debugLog(`[useRouletteData] Ignorando número duplicado: ${numero}`);
        return prev;
      }
      
      // Adicionar o novo número no início do array
      const newNumber: RouletteNumber = {
        numero: numero,
        cor: determinarCorNumero(numero),
        timestamp: event.timestamp
      };
      
      setHasData(true);
      
      // Limitar ao número máximo de elementos
      return [newNumber, ...prev].slice(0, limit);
    });
    
    // Atualizar status de conexão
    setIsConnected(true);
  }, [roletaId, limit]);
  
  // Subscrever para eventos da roleta
  useEffect(() => {
    const socketService = SocketService.getInstance();
    
    // Subscrever para eventos
    socketService.subscribe(roletaNome, handleNewNumber);
    
    // Atualizar status de conexão
    setIsConnected(socketService.isSocketConnected());
    
    return () => {
      // Remover subscrição ao desmontar
      socketService.unsubscribe(roletaNome, handleNewNumber);
    };
  }, [roletaNome, handleNewNumber]);
  
  // Função para atualizar manualmente os números
  const refreshNumbers = useCallback(async () => {
    debugLog(`[useRouletteData] Atualizando números para ${roletaNome} (ID: ${roletaId})`);
    setLoading(true);
    
    try {
      // Buscar números mais recentes
      const latestNumbers = await fetchRouletteLatestNumbers(roletaId, limit);
      
      if (latestNumbers && latestNumbers.length > 0) {
        debugLog(`[useRouletteData] Recebidos ${latestNumbers.length} números atualizados para ${roletaNome}`);
        
        // Mapear números simples para objetos RouletteNumber
        const formattedNumbers: RouletteNumber[] = latestNumbers.map(numero => ({
          numero: numero,
          cor: determinarCorNumero(numero),
          timestamp: new Date().toISOString() // Usar timestamp atual já que a API não fornece
        }));
        
        // Atualizar estado
        setNumbers(formattedNumbers);
        setHasData(formattedNumbers.length > 0);
        setError(null);
        
        return true;
      } else {
        debugLog(`[useRouletteData] Nenhum número recebido para ${roletaNome}`);
        return false;
      }
    } catch (err) {
      const errorMessage = `Erro ao atualizar números: ${err}`;
      debugLog(`[useRouletteData] ${errorMessage}`);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [roletaId, roletaNome, limit]);
  
  return {
    numbers,
    loading,
    error,
    isConnected,
    hasData,
    strategy,
    strategyLoading,
    refreshNumbers
  };
}