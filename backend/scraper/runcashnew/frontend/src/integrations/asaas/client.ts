/**
 * Cliente para integração com Asaas
 */

import axios from 'axios';

/**
 * Cria um cliente no Asaas ou recupera um existente
 * @param userData Dados do usuário (nome, email, cpf/cnpj, telefone)
 */
export const createAsaasCustomer = async (userData: {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
}): Promise<string> => {
  try {
    console.log('Criando/recuperando cliente no Asaas:', userData);
    
    const response = await axios.post('/api/asaas-create-customer', {
      name: userData.name,
      email: userData.email,
      cpfCnpj: userData.cpfCnpj,
      mobilePhone: userData.mobilePhone
    });
    
    console.log('Resposta da API de criação de cliente:', response.data);
    
    if (response.data && response.data.customerId) {
      return response.data.customerId;
    }
    
    throw new Error('ID de cliente não recebido');
  } catch (error) {
    console.error('Erro ao criar cliente no Asaas:', error);
    
    if (error instanceof Error) {
      throw new Error(`Falha ao criar cliente: ${error.message}`);
    }
    
    throw new Error('Falha ao criar cliente no Asaas');
  }
};

/**
 * Cria uma assinatura no Asaas
 * @param planId ID do plano a ser assinado
 * @param userId ID do usuário no seu sistema
 * @param customerId ID do cliente no Asaas
 */
export const createAsaasSubscription = async (
  planId: string,
  userId: string,
  customerId: string
): Promise<{ subscriptionId: string, redirectUrl: string }> => {
  try {
    console.log(`Criando assinatura: planId=${planId}, userId=${userId}, customerId=${customerId}`);
    
    const response = await axios.post('/api/asaas-create-subscription', {
      planId,
      userId,
      customerId
    });
    
    console.log('Resposta da API de criação de assinatura:', response.data);
    
    if (response.data && response.data.redirectUrl) {
      return {
        subscriptionId: response.data.subscriptionId || '',
        redirectUrl: response.data.redirectUrl
      };
    }
    
    throw new Error('URL de redirecionamento não recebida');
  } catch (error) {
    console.error('Erro ao criar assinatura no Asaas:', error);
    
    if (error instanceof Error) {
      throw new Error(`Falha ao criar assinatura: ${error.message}`);
    }
    
    throw new Error('Falha ao criar assinatura no Asaas');
  }
}; 