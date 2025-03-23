const Stripe = require('stripe');

// Importante: não deixar a chave exposta em código no lado do cliente
module.exports = async (req, res) => {
  // Configurar CORS para permitir apenas o domínio da sua aplicação
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Lidar com solicitações OPTIONS (para CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const { planId, userId } = req.body;
    
    if (!planId || !userId) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes' });
    }
    
    // Mapeamento de planos para preços do Stripe
    const planPriceMap = {
      'free': { priceId: null, amount: 0 },
      'basic': { priceId: 'price_1OyKxFGLEdW1oQ9EwKkXIHfC', amount: 1990 },
      'pro': { priceId: 'price_1OyKxWGLEdW1oQ9ELpKNTNbp', amount: 4990 },
      'premium': { priceId: 'price_1OyKxlGLEdW1oQ9EuaDyiHsz', amount: 9990 },
    };
    
    const planInfo = planPriceMap[planId];
    
    if (!planInfo) {
      return res.status(400).json({ error: 'Plano inválido' });
    }
    
    // Se for plano gratuito, retornar URL especial
    if (planId === 'free') {
      return res.json({ url: '/payment-success?free=true' });
    }
    
    // Criar checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: planInfo.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin || 'https://runcashnew-frontend.vercel.app'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://runcashnew-frontend.vercel.app'}/plans`,
      metadata: {
        userId,
        planId
      }
    });
    
    return res.json({ url: session.url });
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    return res.status(500).json({ error: 'Erro ao criar sessão de checkout', details: error.message });
  }
}; 