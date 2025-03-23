const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;
// Simplificando: usando '*' para permitir todas as origens
// Podemos adicionar restrições mais tarde quando o app for público
const CORS_ORIGIN = '*';
// Mantendo a constante API_KEY para uso futuro
const API_KEY = process.env.API_KEY || 'runcash-default-key';

// Configuração de CORS simplificada
app.use(cors({
  origin: CORS_ORIGIN, // Permite todas as origens
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Middleware
app.use(express.json());

/* 
// Middleware para verificar API key - DESATIVADO TEMPORARIAMENTE
// Adicionaremos novamente quando o aplicativo for público
const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  // Pular verificação de API key para o endpoint de health check
  if (req.path === '/api/health') {
    return next();
  }
  
  // Verificar se a API key foi fornecida e é válida
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'API key inválida ou não fornecida' });
  }
  
  next();
};

// Aplicar middleware de API key a todas as rotas
app.use(apiKeyMiddleware);
*/

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "https://evzqzghxuttctbxgohpx.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;

// Verificar se as variáveis de ambiente obrigatórias estão definidas
if (!supabaseKey) {
  console.error('ERRO: SUPABASE_KEY não está definida!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Endpoint para obter dados das roletas
app.get('/api/roletas', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('roletas')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar roletas:', error);
      return res.status(500).json({ error: 'Erro ao buscar dados das roletas' });
    }
    
    // Garantir que os números mais recentes apareçam primeiro em cada roleta
    const formattedData = data.map(roleta => ({
      ...roleta,
      // Garantir que numeros seja sempre um array, mesmo se for null
      numeros: Array.isArray(roleta.numeros) ? roleta.numeros : [],
      // Calcular win rate
      win_rate: roleta.vitorias + roleta.derrotas > 0 
        ? ((roleta.vitorias / (roleta.vitorias + roleta.derrotas)) * 100).toFixed(1) + '%' 
        : 'N/A'
    }));
    
    return res.json(formattedData);
  } catch (err) {
    console.error('Erro na API:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para obter apenas o número mais recente de cada roleta
// Importante: este endpoint deve vir antes do endpoint com parâmetro :id
app.get('/api/roletas/latest', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('roletas')
      .select('id, nome, numeros, estado_estrategia, numero_gatilho, vitorias, derrotas, sugestao_display, updated_at')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar roletas:', error);
      return res.status(500).json({ error: 'Erro ao buscar dados das roletas' });
    }
    
    // Extrair apenas o número mais recente de cada roleta e incluir dados da estratégia
    const latestNumbers = data.map(roleta => ({
      id: roleta.id,
      nome: roleta.nome,
      numero_recente: Array.isArray(roleta.numeros) && roleta.numeros.length > 0 ? roleta.numeros[0] : null,
      estado_estrategia: roleta.estado_estrategia || 'NEUTRAL',
      numero_gatilho: roleta.numero_gatilho || -1,
      vitorias: roleta.vitorias || 0,
      derrotas: roleta.derrotas || 0,
      win_rate: roleta.vitorias + roleta.derrotas > 0 
        ? ((roleta.vitorias / (roleta.vitorias + roleta.derrotas)) * 100).toFixed(1) + '%' 
        : 'N/A',
      sugestao_display: roleta.sugestao_display || '',
      updated_at: roleta.updated_at
    }));
    
    return res.json(latestNumbers);
  } catch (err) {
    console.error('Erro na API:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para obter dados de uma roleta específica
app.get('/api/roletas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('roletas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Erro ao buscar roleta ${id}:`, error);
      return res.status(500).json({ error: `Erro ao buscar dados da roleta ${id}` });
    }
    
    // Garantir que numeros seja sempre um array, mesmo se for null
    const formattedData = {
      ...data,
      numeros: Array.isArray(data.numeros) ? data.numeros : [],
      // Calcular win rate
      win_rate: data.vitorias + data.derrotas > 0 
        ? ((data.vitorias / (data.vitorias + data.derrotas)) * 100).toFixed(1) + '%' 
        : 'N/A'
    };
    
    return res.json(formattedData);
  } catch (err) {
    console.error('Erro na API:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Endpoint GET para o webhook (para verificação do Stripe)
app.get('/api/webhook', (req, res) => {
  res.json({ status: 'Webhook endpoint ativo. Use POST para eventos do Stripe.' });
});

// Rota para criar uma sessão de checkout do Stripe
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    console.log('Recebida solicitação para criar sessão de checkout:', req.body);
    const { planId, userId } = req.body;
    
    if (!planId || !userId) {
      console.error('planId ou userId não fornecidos');
      return res.status(400).json({ error: 'planId e userId são obrigatórios' });
    }
    
    // Buscar informações do plano no banco de dados ou usar um mapeamento fixo
    const planPriceMap = {
      'free': { priceId: null, amount: 0 },
      'basic': { priceId: 'price_1R0UgNGLEdW1oQ9Eu2YWBi3Y', amount: 1990 }, // R$ 19,90
      'pro': { priceId: 'price_1R0UgNGLEdW1oQ9Eu2YWBi3Y', amount: 4990 }, // R$ 49,90
      'premium': { priceId: 'price_1R0UgNGLEdW1oQ9Eu2YWBi3Y', amount: 9990 }, // R$ 99,90
    };
    
    const planInfo = planPriceMap[planId];
    
    if (!planInfo) {
      console.error(`Plano inválido: ${planId}`);
      return res.status(400).json({ error: 'Plano inválido' });
    }
    
    console.log(`Informações do plano ${planId}:`, planInfo);
    
    // Se for o plano gratuito, crie/atualize a assinatura diretamente
    if (planId === 'free') {
      // Verificar se já existe uma assinatura
      const { data: existingSubscription, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 é o código para "nenhum resultado encontrado"
        console.error('Erro ao buscar assinatura existente:', fetchError);
        return res.status(500).json({ error: 'Erro ao buscar assinatura existente', details: fetchError });
      }
      
      if (existingSubscription) {
        // Atualizar assinatura existente
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            plan_id: 'free',
            plan_type: 'FREE',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id);
          
        if (updateError) {
          return res.status(500).json({ error: 'Erro ao atualizar assinatura', details: updateError });
        }
      } else {
        // Criar nova assinatura
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan_id: 'free',
            plan_type: 'FREE',
            start_date: new Date().toISOString(),
            status: 'active'
          });
          
        if (insertError) {
          return res.status(500).json({ error: 'Erro ao criar assinatura', details: insertError });
        }
      }
      
      return res.json({ success: true, redirectUrl: '/payment-success?free=true' });
    }
    
    // Para planos pagos, criar uma sessão de checkout do Stripe
    try {
      console.log('Criando sessão de checkout do Stripe com:', {
        modo: 'subscription',
        priceId: planInfo.priceId,
        userId,
        planId
      });
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: planInfo.priceId, // Usar o ID do preço real do Stripe
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/payment-canceled`,
        client_reference_id: userId,
        metadata: {
          userId,
          planId
        }
      });
      
      console.log('Sessão de checkout criada com sucesso:', {
        sessionId: session.id,
        url: session.url
      });
      
      res.json({ url: session.url, sessionId: session.id });
    } catch (stripeError) {
      console.error('Erro ao criar sessão de checkout do Stripe:', stripeError);
      return res.status(500).json({ 
        error: 'Erro ao criar sessão de checkout', 
        details: stripeError.message,
        code: stripeError.code || 'unknown'
      });
    }
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({ error: 'Erro ao criar sessão de checkout', details: error.message });
  }
});

// Webhook para processar eventos do Stripe
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Tratar eventos específicos
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const planId = session.metadata.planId;
      
      if (!userId || !planId) {
        console.error('Metadados incompletos na sessão:', session);
        return res.status(400).json({ error: 'Metadados incompletos' });
      }
      
      try {
        // Verificar se já existe uma assinatura
        const { data: existingSubscription, error: fetchError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();
          
        const planTypeMap = {
          'basic': 'BASIC',
          'pro': 'PRO',
          'premium': 'PREMIUM'
        };
        
        const subscriptionData = {
          plan_id: planId,
          plan_type: planTypeMap[planId],
          payment_provider: 'stripe',
          payment_id: session.subscription,
          status: 'active',
          start_date: new Date().toISOString(),
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 dias
          updated_at: new Date().toISOString()
        };
        
        if (existingSubscription) {
          // Atualizar assinatura existente
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update(subscriptionData)
            .eq('id', existingSubscription.id);
            
          if (updateError) {
            console.error('Erro ao atualizar assinatura:', updateError);
          }
        } else {
          // Criar nova assinatura
          const { error: insertError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              ...subscriptionData
            });
            
          if (insertError) {
            console.error('Erro ao criar assinatura:', insertError);
          }
        }
      } catch (error) {
        console.error('Erro ao processar assinatura:', error);
      }
      break;
    }
    
    case 'invoice.payment_succeeded': {
      // Atualizar a data do próximo pagamento
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      
      try {
        // Buscar a assinatura pelo ID do Stripe
        const { data: subscription, error: fetchError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('payment_id', subscriptionId)
          .single();
          
        if (fetchError || !subscription) {
          console.error('Assinatura não encontrada:', fetchError);
          break;
        }
        
        // Atualizar a data do próximo pagamento
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            next_billing_date: new Date(invoice.lines.data[0].period.end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);
          
        if (updateError) {
          console.error('Erro ao atualizar data do próximo pagamento:', updateError);
        }
      } catch (error) {
        console.error('Erro ao processar pagamento de fatura:', error);
      }
      break;
    }
    
    case 'customer.subscription.deleted': {
      // Cancelar a assinatura
      const subscription = event.data.object;
      
      try {
        // Buscar a assinatura pelo ID do Stripe
        const { data: dbSubscription, error: fetchError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('payment_id', subscription.id)
          .single();
          
        if (fetchError || !dbSubscription) {
          console.error('Assinatura não encontrada:', fetchError);
          break;
        }
        
        // Atualizar o status da assinatura
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            end_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', dbSubscription.id);
          
        if (updateError) {
          console.error('Erro ao cancelar assinatura:', updateError);
        }
      } catch (error) {
        console.error('Erro ao processar cancelamento de assinatura:', error);
      }
      break;
    }
  }
  
  res.json({ received: true });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
