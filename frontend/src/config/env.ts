/**
 * Configuração centralizada das variáveis de ambiente
 * 
 * Este arquivo fornece acesso centralizado a todas as variáveis de ambiente
 * utilizadas pelo aplicativo. As variáveis DEVEM ser configuradas no Vercel
 * ou no arquivo .env para desenvolvimento local.
 */

// Interface para tipagem das variáveis de ambiente
interface EnvConfig {
  // URL da API de eventos SSE
  sseServerUrl: string;
  
  // URL base da API REST
  apiBaseUrl: string;
  
  // URL do servidor WebSocket
  wsUrl: string;
  
  // Indica se estamos em ambiente de produção
  isProduction: boolean;
}

// Verifica se estamos em ambiente de produção
const isProduction = window.location.hostname !== 'localhost' && 
                     window.location.hostname !== '127.0.0.1';

// Função para obter variáveis de ambiente sem fallback
function getRequiredEnvVar(key: string): string {
  // @ts-ignore - Ignorando erro de tipagem do Vite
  const value = import.meta.env[key];
  
  // Valores mock para desenvolvimento local
  const mockValues: Record<string, string> = {
    'VITE_SSE_SERVER_URL': 'https://black-starfish-12.loca.lt/api/events',
    'VITE_API_BASE_URL': 'https://black-starfish-12.loca.lt/api',
    'VITE_WS_URL': 'https://black-starfish-12.loca.lt'
  };
  
  if (value === undefined || value === '') {
    // Em desenvolvimento, usar valor mock se disponível
    if (!isProduction && mockValues[key]) {
      console.warn(`[Config Mock] Usando valor mock para ${key}: ${mockValues[key]}`);
      return mockValues[key];
    }
    
    // Em desenvolvimento, mostrar um erro útil
    if (!isProduction) {
      console.error(`[Config Error] Variável de ambiente ${key} não está definida. Usando valor padrão.`);
    }
    
    // Fornecer um valor padrão para evitar erros
    return mockValues[key] || '';
  }
  
  return value;
}

// Configuração com variáveis de ambiente do Vercel/env
const config: EnvConfig = {
  // URL do servidor SSE
  sseServerUrl: (function() {
    try {
      // @ts-ignore
      return getRequiredEnvVar('VITE_SSE_SERVER_URL');
    } catch (e) {
      // Fallback para desenvolvimento apenas
      if (!isProduction) {
        console.warn('[Config] Fallback para SSE local, defina VITE_SSE_SERVER_URL para produção');
        return 'http://localhost:5000/api/events';
      }
      throw e;
    }
  })(),
  
  // URL base da API REST
  apiBaseUrl: (function() {
    try {
      // @ts-ignore
      return getRequiredEnvVar('VITE_API_BASE_URL');
    } catch (e) {
      // Fallback para desenvolvimento apenas
      if (!isProduction) {
        console.warn('[Config] Fallback para API local, defina VITE_API_BASE_URL para produção');
        return 'http://localhost:5000/api';
      }
      throw e;
    }
  })(),
  
  // URL do servidor WebSocket
  wsUrl: (function() {
    try {
      // @ts-ignore
      return getRequiredEnvVar('VITE_WS_URL');
    } catch (e) {
      // Fallback para desenvolvimento apenas
      if (!isProduction) {
        console.warn('[Config] Fallback para WebSocket local, defina VITE_WS_URL para produção');
        return 'http://localhost:5000';
      }
      throw e;
    }
  })(),
  
  // Flag de ambiente
  isProduction
};

// Log das configurações carregadas em desenvolvimento
if (!isProduction) {
  console.log('[Config] Variáveis de ambiente carregadas:', {
    sseServerUrl: config.sseServerUrl,
    apiBaseUrl: config.apiBaseUrl,
    wsUrl: config.wsUrl,
    isProduction: config.isProduction
  });
}

export default config; 