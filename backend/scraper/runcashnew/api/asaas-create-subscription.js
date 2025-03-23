const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Configurações da API Asaas
const API_BASE_URL = 'https://sandbox.asaas.com/api/v3';

module.exports = async (req, res) => {
  // Configurar CORS para aceitar qualquer origem
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  // Responder a requisições preflight OPTIONS imediatamente
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas aceitar método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', method: req.method });
  }

  // Debug dos headers recebidos
  console.log('Headers recebidos:', req.headers);
  console.log('Corpo da requisição:', req.body);

  try {
    const { planId, customerId, userId } = req.body;
    
    // Log detalhado dos parâmetros recebidos
    console.log('Parâmetros recebidos:', { planId, customerId, userId });
    
    // Validação básica mais completa
    if (!planId || !userId) {
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos: planId ou userId' });
    }

    if (!customerId) {
      console.error('customerId não fornecido na requisição');
      return res.status(400).json({ error: 'ID do cliente (customerId) é obrigatório' });
    }

    // Mapeamento de planos
    const planDetails = {
      'free': { value: 0, name: 'Plano Gratuito RunCash' },
      'basic': { value: 19.90, name: 'Plano Básico RunCash' },
      'pro': { value: 49.90, name: 'Plano Profissional RunCash' },
      'premium': { value: 99.90, name: 'Plano Premium RunCash' }
    };

    // Verificar se o plano é gratuito
    if (planId === 'free') {
      console.log('Processando plano gratuito para usuário:', userId);
      
      // Configure o cliente do Supabase
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.warn('Variáveis do Supabase não configuradas. Usando modo simulado.');
        
        return res.status(200).json({
          success: true,
          subscriptionId: `free_${Date.now()}`,
          redirectUrl: `${req.headers.origin || 'https://runcashnew-frontend.vercel.app'}/payment-success?free=true`,
          message: 'Assinatura gratuita simulada'
        });
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Registrar assinatura gratuita diretamente no Supabase
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan_id: 'free',
            plan_type: 'FREE',
            status: 'active',
            start_date: new Date().toISOString(),
            payment_provider: 'manual',
            payment_id: `free_${Date.now()}`
          })
          .select();
        
        if (error) {
          console.error('Erro ao criar assinatura gratuita:', error);
          throw error;
        }
        
        return res.status(200).json({
          success: true,
          subscriptionId: data[0]?.id,
          redirectUrl: `${req.headers.origin || 'https://runcashnew-frontend.vercel.app'}/payment-success?free=true`,
          message: 'Assinatura gratuita ativada com sucesso'
        });
      } catch (supabaseError) {
        console.error('Erro com Supabase:', supabaseError);
        
        // Falha segura - retorna sucesso simulado mesmo com erro
        return res.status(200).json({
          success: true,
          subscriptionId: `free_${Date.now()}`,
          redirectUrl: `${req.headers.origin || 'https://runcashnew-frontend.vercel.app'}/payment-success?free=true`,
          message: 'Assinatura gratuita simulada (fallback)'
        });
      }
    }

    // Calcular data de vencimento (próximo dia útil)
    const today = new Date();
    const nextDueDate = new Date(today);
    nextDueDate.setDate(today.getDate() + 1); // Próximo dia
    
    // Converter para formato YYYY-MM-DD
    const formattedDueDate = nextDueDate.toISOString().split('T')[0];

    // Usar a chave de API das variáveis de ambiente
    const apiKey = process.env.ASAAS_API_KEY;
    
    if (!apiKey) {
      console.error('API key do Asaas não configurada');
      return res.status(500).json({ 
        error: 'Erro de configuração', 
        message: 'A chave de API do Asaas não está configurada no servidor'
      });
    }

    // Criar assinatura no Asaas
    const response = await axios({
      method: 'post',
      url: `${API_BASE_URL}/subscriptions`,
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
      },
      data: {
        customer: customerId,
        billingType: 'PIX', // Usar PIX como método de pagamento
        value: planDetails[planId].value,
        nextDueDate: formattedDueDate,
        cycle: 'MONTHLY',
        description: planDetails[planId].name,
        maxPayments: 12, // 12 meses
        externalReference: userId // Referência ao usuário no seu sistema
      }
    });

    console.log('Assinatura criada com sucesso:', response.data);
    
    // Buscar informações da primeira cobrança para obter o link de pagamento
    const paymentResponse = await axios({
      method: 'get',
      url: `${API_BASE_URL}/payments?subscription=${response.data.id}&status=PENDING`,
      headers: {
        'access_token': apiKey
      }
    });
    
    let paymentUrl = null;
    if (paymentResponse.data.data && paymentResponse.data.data.length > 0) {
      // Obter link de pagamento PIX
      const paymentId = paymentResponse.data.data[0].id;
      const pixResponse = await axios({
        method: 'get',
        url: `${API_BASE_URL}/payments/${paymentId}/pixQrCode`,
        headers: {
          'access_token': apiKey
        }
      });
      
      // Obter URL de pagamento
      paymentUrl = pixResponse.data.success ? 
                  pixResponse.data.encodedImage : 
                  paymentResponse.data.data[0].invoiceUrl;
    }

    // Salvar informações da assinatura no Supabase
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      
      const planTypeMap = {
        'basic': 'BASIC',
        'pro': 'PRO',
        'premium': 'PREMIUM'
      };
      
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_id: planId,
          plan_type: planTypeMap[planId],
          status: 'pending',
          start_date: new Date().toISOString(),
          payment_provider: 'asaas',
          payment_id: response.data.id,
          next_billing_date: formattedDueDate
        });
    }
    
    return res.status(200).json({
      success: true,
      subscriptionId: response.data.id,
      redirectUrl: paymentUrl || response.data.invoiceUrl,
      message: 'Assinatura criada com sucesso'
    });
  } catch (error) {
    console.error('Erro detalhado na operação de assinatura:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    return res.status(500).json({ 
      error: 'Erro ao criar assinatura', 
      details: error.response?.data || error.message 
    });
  }
}; 