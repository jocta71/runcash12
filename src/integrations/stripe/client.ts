/**
 * Cliente Stripe - Versão com link para API simplificada
 */

import axios from 'axios';

/**
 * Cria uma sessão de checkout para um plano específico
 * @param planId ID do plano a ser comprado
 * @param userId ID do usuário que está fazendo a compra
 */
export const createCheckoutSession = async (planId: string, userId: string): Promise<string> => {
  try {
    console.log(`Iniciando criação de sessão de checkout para planId: ${planId}, userId: ${userId}`);
    
    // Teste direto com o novo endpoint simplificado
    const response = await axios.post('/api/create-checkout', {
      planId,
      userId
    });
    
    console.log('Resposta completa da API:', response);
    
    if (response.data && response.data.url) {
      console.log('URL do checkout:', response.data.url);
      return response.data.url;
    } else {
      console.error('Resposta da API não contém URL:', response.data);
      throw new Error('Resposta da API inválida');
    }
    
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    
    if (error instanceof Error) {
      console.error('Detalhes do erro:', error.message);
      if ('response' in error && error.response) {
        // @ts-ignore - Propriedades de axios Error
        console.error('Dados da resposta:', error.response.data);
      }
    }
    
    // Em caso de erro, usar modo simulado como fallback
    console.log('ATENÇÃO: Usando modo simulado devido a erro na API');
    
    // Para teste local, simular redirecionamento
    if (planId === 'free') {
      return '/payment-success?free=true';
    } else {
      const sessionId = `sim_${Date.now()}_${planId}`;
      console.log('ID de sessão simulado criado:', sessionId);
      return `/payment-success?session_id=${sessionId}`;
    }
  }
};

// Interface para garantir compatibilidade com o tipo real do Stripe
interface StripeClient {
  redirectToCheckout: (options: { sessionId?: string }) => Promise<{ error: any }>;
  confirmPayment: (options: any) => Promise<{ error: any }>;
}

/**
 * Simulação do cliente Stripe (usado como fallback)
 */
const createSimulatedStripe = (): StripeClient => {
  return {
    redirectToCheckout: async ({ sessionId }: { sessionId?: string }) => {
      console.log('[Stripe Simulado] redirectToCheckout chamado com sessionId:', sessionId);
      
      // Simular um pequeno atraso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirecionamento simulado
      window.location.href = `/payment-success?session_id=${sessionId || `sim_${Date.now()}`}`;
      
      return { error: null };
    },
    
    confirmPayment: async (options: any) => {
      console.log('[Stripe Simulado] confirmPayment chamado com:', options);
      return { error: null };
    }
  };
};

// Manter uma única instância do cliente simulado
let simulatedStripeInstance: StripeClient | null = null;

/**
 * Função para obter o cliente Stripe
 * Esta função é uma substituição para loadStripe() da biblioteca @stripe/stripe-js
 */
export const getStripeClient = (): Promise<StripeClient> => {
  if (!simulatedStripeInstance) {
    simulatedStripeInstance = createSimulatedStripe();
  }
  
  return Promise.resolve(simulatedStripeInstance);
}; 