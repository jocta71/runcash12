// Versão ultra-simplificada que utiliza a API do Stripe diretamente
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Lidar com solicitações preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificar método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { planId, userId } = req.body;
    
    if (!planId) {
      return res.status(400).json({ error: 'planId é obrigatório' });
    }

    // Log de debug
    console.log(`Recebida solicitação de checkout: planId=${planId}, userId=${userId || 'não informado'}`);
    
    // Mapeamento de IDs de preço do Stripe
    const prices = {
      'basic': 'price_1OyKxFGLEdW1oQ9EwKkXIHfC',
      'pro': 'price_1OyKxWGLEdW1oQ9ELpKNTNbp',
      'premium': 'price_1OyKxlGLEdW1oQ9EuaDyiHsz',
    };
    
    // Verificar se é plano gratuito
    if (planId === 'free') {
      return res.json({ 
        url: '/payment-success?free=true',
        simulated: false
      });
    }
    
    // Verificar se o plano existe
    if (!prices[planId]) {
      return res.status(400).json({ error: `Plano "${planId}" inválido` });
    }
    
    // Criar checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: prices[planId],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin || 'https://runcashnew-frontend.vercel.app'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://runcashnew-frontend.vercel.app'}/plans`,
      metadata: {
        userId: userId || 'anonymous',
        planId
      }
    });
    
    // Log de sucesso
    console.log(`Sessão de checkout criada com sucesso: ${session.id}`);
    
    // Retornar URL do checkout
    return res.json({ 
      url: session.url,
      id: session.id,
      simulated: false
    });
  } catch (error) {
    // Log de erro
    console.error('Erro ao criar sessão:', error.message);
    
    // Retornar erro
    return res.status(500).json({ 
      error: 'Erro ao criar sessão de checkout', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 