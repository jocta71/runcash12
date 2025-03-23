import axios from 'axios';
import config from '@/config/env';

// Usar a variável de ambiente centralizada do config
const API_URL = config.apiBaseUrl;
console.log('[API] Usando URL da API:', API_URL);

// Configuração do axios com headers padrão
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',  // Adicionar este header para ignorar a tela de proteção do ngrok
    'bypass-tunnel-reminder': 'true'       // Ignorar lembrete do serviço de túnel
  },
  // Adicionar timeout mais longo para permitir conexões mais lentas
  timeout: 10000,
});

// Tipos e interfaces necessárias
export interface RouletteData {
  id: string;
  nome: string;
  roleta_nome?: string;
  numeros: number[];
  updated_at: string;
  estado_estrategia: string;
  numero_gatilho: number;
  numero_gatilho_anterior: number;
  terminais_gatilho: number[];
  terminais_gatilho_anterior: number[];
  vitorias: number;
  derrotas: number;
  sugestao_display?: string;
}

export interface LatestRouletteNumber {
  id: string;
  nome: string;
  numero_recente: number | null;
  estado_estrategia: string;
  numero_gatilho: number;
  vitorias: number;
  derrotas: number;
  sugestao_display: string;
  updated_at: string;
}

export interface RouletteNumberRecord {
  id: string;
  roleta_id: string;
  roleta_nome: string;
  numero: number;
  timestamp: string;
}

export interface RouletteStrategy {
  estado: string;
  numero_gatilho: number | null;
  terminais_gatilho: number[];
  vitorias: number;
  derrotas: number;
  sugestao_display?: string;
}

// Função para listar todas as roletas disponíveis 
export const fetchAvailableRoulettesFromNumbers = async (): Promise<string[]> => {
  try {
    console.log('[API] Buscando roletas disponíveis no MongoDB...');
    
    // Fazer requisição ao backend para obter roletas disponíveis
    const response = await api.get('/roulettes');
    
    if (response.data && Array.isArray(response.data)) {
      const rouletteNames = response.data.map((roleta: any) => roleta.nome);
      console.log('[API] Roletas disponíveis:', rouletteNames);
      return rouletteNames;
    }
    
    // Se não há dados ou resposta inválida, retornar array vazio
    console.warn('[API] Formato de resposta inválido ou sem roletas');
    return [];
  } catch (error) {
    console.error('[API] Erro ao buscar roletas disponíveis:', error);
    return [];
  }
};

// Função para buscar todas as roletas
export const fetchAllRoulettes = async (): Promise<RouletteData[]> => {
  try {
    console.log('[API] Buscando todas as roletas no MongoDB...');
    
    // Fazer requisição ao backend para buscar todas as roletas
    const response = await api.get('/roulettes');
    
    if (response.data && Array.isArray(response.data)) {
      // Formatar os dados para o tipo RouletteData
      const formattedData: RouletteData[] = response.data.map((roleta: any) => ({
        id: roleta.id || roleta._id,
        nome: roleta.nome,
        roleta_nome: roleta.roleta_nome || roleta.nome,
        numeros: roleta.numeros || [],
        updated_at: roleta.updated_at || new Date().toISOString(),
        estado_estrategia: roleta.estado_estrategia || 'NEUTRAL',
        numero_gatilho: roleta.numero_gatilho || 0,
        numero_gatilho_anterior: roleta.numero_gatilho_anterior || 0,
        terminais_gatilho: roleta.terminais_gatilho || [],
        terminais_gatilho_anterior: roleta.terminais_gatilho_anterior || [],
        vitorias: roleta.vitorias || 0,
        derrotas: roleta.derrotas || 0,
        sugestao_display: roleta.sugestao_display || ''
      }));
      
      console.log(`[API] Processadas ${formattedData.length} roletas`);
      return formattedData;
    }
    
    console.warn('[API] Formato de resposta inválido ou sem roletas');
    return [];
  } catch (error) {
    console.error('[API] Erro ao buscar roletas:', error);
    return [];
  }
};

// Função para buscar números mais recentes por nome da roleta
export const fetchRouletteLatestNumbersByName = async (roletaNome: string, limit = 10): Promise<number[]> => {
  try {
    console.log(`[API] Buscando números para roleta '${roletaNome}'...`);
    
    // Fazer requisição ao backend para buscar números por nome da roleta
    const response = await api.get(`/numbers/${encodeURIComponent(roletaNome)}?limit=${limit}`);
    
    if (response.data && Array.isArray(response.data)) {
      // Extrair apenas os números do array de objetos
      const numbers = response.data.map((item: any) => item.numero);
      console.log(`[API] Retornando ${numbers.length} números para roleta '${roletaNome}'`);
      return numbers;
    }
    
    console.warn(`[API] Nenhum número encontrado para roleta '${roletaNome}'`);
    return [];
  } catch (error) {
    console.error(`[API] Erro ao buscar números para roleta '${roletaNome}':`, error);
    return [];
  }
};

// Função para buscar últimos números de uma roleta pelo ID
export const fetchRouletteLatestNumbers = async (roletaId: string, limit = 10): Promise<number[]> => {
  try {
    console.log(`[API] Buscando ${limit} números mais recentes para roleta ID ${roletaId}...`);
    
    // Fazer requisição ao backend para buscar números pelo ID da roleta
    const response = await api.get(`/numbers/byid/${encodeURIComponent(roletaId)}?limit=${limit}`);
    
    console.log(`[API] Resposta completa para roleta ID ${roletaId}:`, response);
    
    if (response.data && Array.isArray(response.data)) {
      // Extrair apenas os números do array de objetos
      const numbers = response.data.map((item: any) => {
        console.log(`[API] Processando item:`, item);
        return typeof item.numero === 'number' ? item.numero : parseInt(item.numero, 10);
      });
      console.log(`[API] Retornando ${numbers.length} números para roleta ID ${roletaId}:`, numbers);
      return numbers;
    }
    
    console.warn(`[API] Nenhum número encontrado para roleta ID ${roletaId}`);
    return [];
  } catch (error) {
    console.error(`[API] Erro ao buscar números para roleta ${roletaId}:`, error);
    return [];
  }
};

// Função para buscar os últimos números de todas as roletas
export const fetchLatestRouletteNumbers = async (): Promise<LatestRouletteNumber[]> => {
  try {
    console.log('[API] Buscando últimos números de todas as roletas...');

    // Fazer requisição ao backend para obter os últimos números
    const response = await api.get('/numbers/latest');
    
    if (response.data && Array.isArray(response.data)) {
      // Formatar a resposta para o tipo LatestRouletteNumber
      const formattedData: LatestRouletteNumber[] = response.data.map((item: any) => ({
        id: item.id || item._id,
        nome: item.nome,
        numero_recente: item.numero_recente,
        estado_estrategia: item.estado_estrategia || 'NEUTRAL',
        numero_gatilho: item.numero_gatilho || 0,
        vitorias: item.vitorias || 0,
        derrotas: item.derrotas || 0,
        sugestao_display: item.sugestao_display || '',
        updated_at: item.updated_at || new Date().toISOString()
      }));
      
      return formattedData;
    }
    
    console.warn('[API] Formato de resposta inválido para últimos números');
    return [];
  } catch (error) {
    console.error('[API] Falha ao buscar últimos números das roletas:', error);
    return [];
  }
};

// Função para buscar uma roleta pelo ID
export const fetchRouletteById = async (id: string): Promise<RouletteData> => {
  try {
    console.log(`[API] Buscando roleta ${id}...`);
    
    // Fazer requisição ao backend para buscar uma roleta pelo ID
    const response = await api.get(`/roulettes/${id}`);
    
    if (response.data) {
      const roleta = response.data;
      
      // Formatar os dados para o tipo RouletteData
      return {
        id: roleta.id || roleta._id,
        nome: roleta.nome,
        roleta_nome: roleta.roleta_nome || roleta.nome,
        numeros: roleta.numeros || [],
        updated_at: roleta.updated_at || new Date().toISOString(),
        estado_estrategia: roleta.estado_estrategia || 'NEUTRAL',
        numero_gatilho: roleta.numero_gatilho || 0,
        numero_gatilho_anterior: roleta.numero_gatilho_anterior || 0,
        terminais_gatilho: roleta.terminais_gatilho || [],
        terminais_gatilho_anterior: roleta.terminais_gatilho_anterior || [],
        vitorias: roleta.vitorias || 0,
        derrotas: roleta.derrotas || 0,
        sugestao_display: roleta.sugestao_display || ''
      };
    }
    
    throw new Error(`Roleta com ID ${id} não encontrada`);
  } catch (error) {
    console.error(`[API] Erro ao buscar roleta ${id}:`, error);
    throw error;
  }
};

// Função para buscar o estado atual da estratégia para uma roleta específica
export const fetchRouletteStrategy = async (roletaId: string): Promise<RouletteStrategy | null> => {
  try {
    console.log(`[API] Buscando estado atual da estratégia para roleta ID ${roletaId}...`);
    
    // Fazer requisição ao backend para buscar a estratégia atual
    const response = await api.get(`/strategy/${encodeURIComponent(roletaId)}`);
    
    if (response.data) {
      console.log(`[API] Estratégia obtida para roleta ID ${roletaId}:`, response.data);
      return {
        estado: response.data.estado || 'NEUTRAL',
        numero_gatilho: response.data.numero_gatilho || null,
        terminais_gatilho: response.data.terminais_gatilho || [],
        vitorias: response.data.vitorias || 0,
        derrotas: response.data.derrotas || 0,
        sugestao_display: response.data.sugestao_display || ''
      };
    }
    
    console.warn(`[API] Nenhum dado de estratégia encontrado para roleta ID ${roletaId}`);
    return null;
  } catch (error) {
    console.error(`[API] Erro ao buscar estratégia para roleta ID ${roletaId}:`, error);
    return null;
  }
};
