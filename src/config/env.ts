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
  
  // URL do servidor WebSocket
  wsServerUrl: string;
  
  // URL base da API REST
  apiBaseUrl: string;
  
  // Indica se estamos em ambiente de produção
  isProduction: boolean;
}

// Verifica se estamos em ambiente de produção
const isProduction = window.location.hostname !== 'localhost' && 
                     window.location.hostname !== '127.0.0.1';

// Exibir todas as variáveis disponíveis
console.log('[Config] Variáveis de ambiente disponíveis:', import.meta.env);

// Função para garantir que uma URL tenha o protocolo correto
function ensureValidProtocol(url: string): string {
  if (!url) return url;
  
  console.log(`[Config] Verificando protocolo da URL: "${url}"`);
  
  // Corrigir caso específico de ttps://
  if (url.includes('ttps://')) {
    console.warn(`[Config] Protocolo inválido ttps:// detectado, corrigindo para https://`);
    return url.replace('ttps://', 'https://');
  }
  
  // Se a URL não começar com http:// ou https://, presumir https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.warn(`[Config] URL inválida detectada: ${url}, adicionando protocolo https://`);
    return `https://${url}`;
  }
  
  return url;
}

// Função para obter variáveis de ambiente com fallback
function getEnvVar(key: string, fallback: string): string {
  // @ts-ignore - Ignorando erro de tipagem do Vite
  const value = import.meta.env[key];
  
  if (value === undefined || value === '') {
    // Em desenvolvimento, mostrar um aviso
    if (!isProduction) {
      console.warn(`[Config] Variável ${key} não definida, usando fallback: ${fallback}`);
    }
    
    return fallback;
  }
  
  return ensureValidProtocol(value);
}

// URL do túnel atual para desenvolvimento
const TUNNEL_URL = 'https://evil-moth-31.loca.lt';

// Configuração centralizada
const config: EnvConfig = {
  // URL do servidor SSE
  sseServerUrl: getEnvVar('VITE_SSE_SERVER_URL', `${TUNNEL_URL}/api/events`),
  
  // URL do servidor WebSocket
  wsServerUrl: getEnvVar('VITE_WS_URL', TUNNEL_URL),
  
  // URL base da API REST
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', `${TUNNEL_URL}/api`),
  
  // Flag de ambiente
  isProduction
};

// Configuração para contornar problemas de SSL/autenticação durante desenvolvimento
if (!isProduction) {
  // Ignorar erros de certificado SSL em desenvolvimento (NÃO FAZER ISSO EM PRODUÇÃO!)
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Log das configurações carregadas
console.log('[Config] Configuração carregada:', config);

export default config; 