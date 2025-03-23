const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

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

  // Para requisições GET (verificação do webhook)
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'Webhook endpoint ativo. Use POST para eventos do Asaas.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', method: req.method });
  }

  // Debug dos headers e corpo recebidos
  console.log('Headers recebidos:', req.headers);
  console.log('Corpo da requisição:', req.body);

  try {
    const webhookData = req.body;
    console.log('Evento recebido do Asaas:', webhookData);
    
    // Configurar Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Variáveis do Supabase não configuradas. Usando modo simulado.');
      return res.status(200).json({ 
        success: true, 
        message: 'Evento processado em modo simulado (sem Supabase)' 
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Processar diferentes tipos de eventos
    const eventType = webhookData.event;
    const payment = webhookData.payment;
    
    if (!payment) {
      return res.status(400).json({ error: 'Dados de pagamento não fornecidos' });
    }
    
    // Obter ID da assinatura do pagamento
    const subscriptionId = payment.subscription;
    
    if (!subscriptionId) {
      console.log('Pagamento não relacionado a uma assinatura', payment);
      return res.status(200).json({ message: 'Evento ignorado - não é uma assinatura' });
    }
    
    // Buscar informações atualizadas da assinatura
    try {
      const apiKey = process.env.ASAAS_API_KEY;
      
      if (!apiKey) {
        console.error('API key do Asaas não configurada');
        throw new Error('A chave de API do Asaas não está configurada no servidor');
      }
      
      const subscriptionResponse = await axios({
        method: 'get',
        url: `${API_BASE_URL}/subscriptions/${subscriptionId}`,
        headers: {
          'access_token': apiKey
        }
      });
      
      const subscriptionDetails = subscriptionResponse.data;
      console.log('Detalhes da assinatura:', subscriptionDetails);
      
      // Buscar assinatura no Supabase pelo payment_id
      const { data: subscriptionData, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('payment_id', subscriptionId)
        .single();
      
      if (fetchError || !subscriptionData) {
        console.error('Assinatura não encontrada no banco de dados:', subscriptionId);
        return res.status(404).json({ error: 'Assinatura não encontrada', subscription_id: subscriptionId });
      }
      
      // Processar eventos
      switch (eventType) {
        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_RECEIVED': {
          // Atualizar assinatura para ativa quando o pagamento é confirmado
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ 
              status: 'active',
              updated_at: new Date().toISOString() 
            })
            .eq('id', subscriptionData.id);
          
          if (updateError) {
            console.error('Erro ao atualizar status da assinatura:', updateError);
            return res.status(500).json({ error: 'Erro ao atualizar assinatura' });
          }
          
          console.log(`Assinatura ${subscriptionData.id} ativada com sucesso`);
          break;
        }
        
        case 'PAYMENT_OVERDUE': {
          // Atualizar assinatura para atrasada
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ 
              status: 'overdue',
              updated_at: new Date().toISOString() 
            })
            .eq('id', subscriptionData.id);
          
          if (updateError) {
            console.error('Erro ao atualizar status da assinatura:', updateError);
            return res.status(500).json({ error: 'Erro ao atualizar assinatura' });
          }
          
          console.log(`Assinatura ${subscriptionData.id} marcada como atrasada`);
          break;
        }
        
        case 'PAYMENT_DELETED':
        case 'PAYMENT_REFUNDED':
        case 'PAYMENT_REFUND_REQUESTED':
        case 'SUBSCRIPTION_CANCELLED': {
          // Cancelar assinatura
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ 
              status: 'canceled',
              end_date: new Date().toISOString(),
              updated_at: new Date().toISOString() 
            })
            .eq('id', subscriptionData.id);
          
          if (updateError) {
            console.error('Erro ao cancelar assinatura:', updateError);
            return res.status(500).json({ error: 'Erro ao cancelar assinatura' });
          }
          
          console.log(`Assinatura ${subscriptionData.id} cancelada`);
          break;
        }
        
        default:
          console.log(`Evento não processado: ${eventType}`);
      }
      
      return res.status(200).json({ 
        success: true, 
        message: `Evento ${eventType} processado com sucesso` 
      });
    } catch (apiError) {
      console.error('Erro ao buscar detalhes da assinatura na API Asaas:', apiError.message);
      
      // Continuar processando mesmo sem os detalhes da API
      // Isso permite que o webhook funcione mesmo com problemas temporários na API
      // Vamos trabalhar apenas com os dados do webhook
      
      // Processar eventos diretamente do webhook
      processWebhookWithoutApiDetails(eventType, subscriptionId, webhookData, supabase, res);
    }
  } catch (error) {
    console.error('Erro ao processar webhook do Asaas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
  }
};

// Função auxiliar para processar o webhook sem chamar a API do Asaas
async function processWebhookWithoutApiDetails(eventType, subscriptionId, webhookData, supabase, res) {
  try {
    // Buscar assinatura no Supabase pelo payment_id
    const { data: subscriptionData, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('payment_id', subscriptionId)
      .single();
    
    if (fetchError || !subscriptionData) {
      console.error('Assinatura não encontrada no banco de dados (fallback):', subscriptionId);
      return res.status(404).json({ error: 'Assinatura não encontrada', subscription_id: subscriptionId });
    }
    
    let newStatus;
    let endDate = null;
    
    // Determinar o novo status com base no tipo de evento
    switch (eventType) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        newStatus = 'active';
        break;
      case 'PAYMENT_OVERDUE':
        newStatus = 'overdue';
        break;
      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_REFUND_REQUESTED':
      case 'SUBSCRIPTION_CANCELLED':
        newStatus = 'canceled';
        endDate = new Date().toISOString();
        break;
      default:
        return res.status(200).json({ 
          success: true, 
          message: `Evento ${eventType} não requer atualização de status` 
        });
    }
    
    // Atualizar assinatura
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    
    if (endDate) {
      updateData.end_date = endDate;
    }
    
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionData.id);
    
    if (updateError) {
      console.error('Erro ao atualizar assinatura (fallback):', updateError);
      return res.status(500).json({ error: 'Erro ao atualizar assinatura', details: updateError });
    }
    
    console.log(`Assinatura ${subscriptionData.id} atualizada para ${newStatus} (fallback)`);
    
    return res.status(200).json({ 
      success: true, 
      message: `Evento ${eventType} processado com sucesso (fallback)` 
    });
  } catch (error) {
    console.error('Erro no processamento fallback:', error);
    return res.status(500).json({ error: 'Erro no processamento fallback', message: error.message });
  }
} 