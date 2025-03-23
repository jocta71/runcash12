const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Importante: não deixar a chave exposta em código no lado do cliente
module.exports = async (req, res) => {
  // Configurar CORS para permitir apenas o domínio do Stripe
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');
  
  // Lidar com solicitações OPTIONS (para CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Para requisições GET (verificação do webhook)
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'Webhook endpoint ativo. Use POST para eventos do Stripe.' });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  
  // Configurar cliente do Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Verificar assinatura do webhook
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
      const rawBody = await readRawBody(req);
      event = stripe.webhooks.constructEvent(
        rawBody, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`⚠️  Erro de webhook: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Processar eventos específicos
    console.log(`✅ Evento recebido: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const planId = session.metadata.planId;
        
        console.log(`💰 Checkout concluído: ${userId}, Plano: ${planId}`);
        
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
              throw updateError;
            }
            
            console.log(`✅ Assinatura atualizada: ${existingSubscription.id}`);
          } else {
            // Criar nova assinatura
            const { data: newSubscription, error: insertError } = await supabase
              .from('subscriptions')
              .insert({
                user_id: userId,
                ...subscriptionData
              })
              .select()
              .single();
              
            if (insertError) {
              throw insertError;
            }
            
            console.log(`✅ Nova assinatura criada: ${newSubscription?.id}`);
          }
        } catch (error) {
          console.error('❌ Erro ao processar assinatura:', error);
        }
        break;
      }
      
      // Adicionar outros eventos conforme necessário
      
    }
    
    // Retornar confirmação para o Stripe
    return res.json({ received: true });
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função para ler o corpo raw da requisição
async function readRawBody(req) {
  return new Promise((resolve) => {
    const bodyParts = [];
    req.on('data', (chunk) => {
      bodyParts.push(chunk);
    });
    req.on('end', () => {
      const body = Buffer.concat(bodyParts).toString();
      resolve(body);
    });
  });
} 