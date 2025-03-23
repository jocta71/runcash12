// Versão de teste para depuração
const axios = require('axios');

// URL de teste do Asaas - usando ambiente de homologação
const API_BASE_URL = 'https://sandbox.asaas.com/api/v3';

/**
 * Handler da função serverless para criar clientes no Asaas
 */
module.exports = async (req, res) => {
  console.log('[ASAAS] Endpoint chamado: /api/asaas-create-customer');
  console.log('[ASAAS] Método:', req.method);
  console.log('[ASAAS] URL:', req.url);
  console.log('[ASAAS] Cabeçalhos:', JSON.stringify(req.headers));

  // Configurar CORS para aceitar qualquer origem
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', '*');

  // Responder a requisições preflight OPTIONS imediatamente
  if (req.method === 'OPTIONS') {
    console.log('[ASAAS] Respondendo requisição OPTIONS com 200 OK');
    return res.status(200).end();
  }

  // Apenas aceitar método POST
  if (req.method !== 'POST') {
    console.error('[ASAAS] Método não permitido:', req.method);
    console.error('[ASAAS] Erro 405 - Método Não Permitido');
    return res.status(405).json({ 
      error: 'Method Not Allowed', 
      message: `O endpoint apenas aceita requisições POST, mas recebeu ${req.method}`,
      method: req.method 
    });
  }

  // Debug dos dados recebidos
  console.log('[ASAAS] Body da requisição:', req.body);
  
  try {
    // Extrair dados do corpo
    const { name, email, cpfCnpj, mobilePhone } = req.body;
    
    // Validação básica
    if (!name || !email || !cpfCnpj) {
      console.error('[ASAAS] Dados incompletos:', { name, email, cpfCnpj });
      return res.status(400).json({ 
        error: 'Dados obrigatórios não fornecidos',
        missing: !name ? 'name' : !email ? 'email' : 'cpfCnpj'
      });
    }

    // Usar a chave de API das variáveis de ambiente
    const apiKey = process.env.ASAAS_API_KEY;
    
    if (!apiKey) {
      console.error('[ASAAS] API key do Asaas não configurada');
      return res.status(500).json({ 
        error: 'Erro de configuração', 
        message: 'A chave de API do Asaas não está configurada no servidor'
      });
    }
    
    console.log('[ASAAS] Usando API Key (início):', apiKey.substring(0, 10) + '...');

    // Preparar dados para envio
    const requestData = {
      name,
      email,
      cpfCnpj: cpfCnpj.replace(/\D/g, ''), // Remover pontos, traços, etc.
      mobilePhone: mobilePhone ? mobilePhone.replace(/\D/g, '') : undefined,
      notificationDisabled: false
    };

    console.log('[ASAAS] Dados para envio:', requestData);
    
    // Fazer a chamada real para a API do Asaas
    console.log('[ASAAS] Chamando API do Asaas para criar cliente...');
    const response = await axios({
      method: 'post',
      url: `${API_BASE_URL}/customers`,
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
      },
      data: requestData
    });

    console.log('[ASAAS] Cliente criado com sucesso! Status:', response.status);
    console.log('[ASAAS] ID do cliente:', response.data.id);
    
    // Retornar resposta de sucesso
    return res.status(200).json({
      success: true,
      customerId: response.data.id,
      message: 'Cliente criado com sucesso'
    });
  } catch (error) {
    // Log detalhado do erro
    console.error('[ASAAS] Erro na operação:');
    console.error('[ASAAS] Mensagem:', error.message);
    
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um status diferente de 2xx
      console.error('[ASAAS] Status do erro:', error.response.status);
      console.error('[ASAAS] Corpo da resposta:', JSON.stringify(error.response.data));
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('[ASAAS] Sem resposta da API do Asaas');
    } else {
      // Algo aconteceu ao configurar a requisição
      console.error('[ASAAS] Erro na configuração da requisição');
    }

    // Se o erro for devido a CPF duplicado, tentar recuperar o cliente
    try {
      if (error.response?.data?.errors?.[0]?.code === 'invalid_cpfCnpj' && 
          error.response?.data?.errors?.[0]?.description?.includes('já utilizado')) {
        const cpfCnpj = req.body.cpfCnpj.replace(/\D/g, '');
        console.log('[ASAAS] CPF já utilizado, buscando cliente:', cpfCnpj);
        
        const apiKey = process.env.ASAAS_API_KEY;
        
        if (!apiKey) {
          throw new Error('API key do Asaas não configurada');
        }
        
        const searchResponse = await axios({
          method: 'get',
          url: `${API_BASE_URL}/customers?cpfCnpj=${cpfCnpj}`,
          headers: {
            'access_token': apiKey
          }
        });
        
        if (searchResponse.data.data && searchResponse.data.data.length > 0) {
          const customer = searchResponse.data.data[0];
          console.log('[ASAAS] Cliente existente encontrado:', customer.id);
          
          return res.status(200).json({
            success: true,
            customerId: customer.id,
            message: 'Cliente existente recuperado com sucesso'
          });
        }
      }
    } catch (searchError) {
      console.error('[ASAAS] Erro ao tentar recuperar cliente:', searchError.message);
    }

    return res.status(500).json({
      error: 'Erro ao criar cliente no Asaas',
      message: error.message,
      details: error.response?.data
    });
  }
}; 