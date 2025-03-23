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
  
  // Configurações do Supabase
  supabaseUrl: string;
  supabaseApiKey: string;

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
  
  if (value === undefined || value === '') {
    // Em desenvolvimento, mostrar um erro útil
    if (!isProduction) {
      console.error(`[Config Error] Variável de ambiente ${key} não está definida. Configure-a no arquivo .env ou nas variáveis de ambiente do Vercel.`);
    }
    throw new Error(`Variável de ambiente ${key} não está definida`);
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
        return 'http://localhost:5000/events';
      }
      throw e;
    }
  })(),
  
  // Configurações do Supabase - sem fallbacks hardcoded
  supabaseUrl: getRequiredEnvVar('VITE_SUPABASE_URL'),
  supabaseApiKey: getRequiredEnvVar('VITE_SUPABASE_API_KEY'),
  
  // Flag de ambiente
  isProduction
};

// Log das configurações carregadas em desenvolvimento
if (!isProduction) {
  console.log('[Config] Variáveis de ambiente carregadas:', {
    sseServerUrl: config.sseServerUrl,
    supabaseUrl: config.supabaseUrl,
    // Não logamos a chave de API completa por segurança
    supabaseApiKey: config.supabaseApiKey.substring(0, 10) + '...',
    isProduction: config.isProduction
  });
}

export default config; 