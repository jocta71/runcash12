import { buffer } from 'micro';
import { createClient } from '@supabase/supabase-js';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Configurar cliente do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Desabilitar o parser de corpo padrão do Next.js
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'Webhook endpoint ativo. Use POST para eventos do Stripe.' });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  try {
    // Verificar a assinatura do webhook
    event = stripe.webhooks.constructEvent(
      buf.toString(),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Processar eventos específicos
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
          await supabase
            .from('subscriptions')
            .update(subscriptionData)
            .eq('id', existingSubscription.id);
        } else {
          // Criar nova assinatura
          await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              ...subscriptionData
            });
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
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('payment_id', subscriptionId)
          .single();
          
        if (!subscription) {
          break;
        }
        
        // Atualizar a data do próximo pagamento
        await supabase
          .from('subscriptions')
          .update({
            next_billing_date: new Date(invoice.lines.data[0].period.end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);
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
        const { data: dbSubscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('payment_id', subscription.id)
          .single();
          
        if (!dbSubscription) {
          break;
        }
        
        // Atualizar o status da assinatura
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            end_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', dbSubscription.id);
      } catch (error) {
        console.error('Erro ao processar cancelamento de assinatura:', error);
      }
      break;
    }
  }
  
  // Retornar com sucesso
  return res.json({ received: true });
} 