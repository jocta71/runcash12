const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId, userId } = req.body;
    
    if (!planId || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
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
      return res.status(400).json({ error: 'Invalid plan' });
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
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/plans`,
      metadata: {
        userId,
        planId
      }
    });
    
    return res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Error creating checkout session' });
  }
} 