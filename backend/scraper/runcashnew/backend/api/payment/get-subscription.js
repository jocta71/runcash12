const { createClient } = require('@supabase/supabase-js');

/**
 * Endpoint para obter os detalhes da assinatura ativa do usuário
 */
module.exports = async (req, res) => {
  // Configurações CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  // Tratamento de requisições preflight
  if (req.method === 'OPTIONS') {
    console.log('[SUBSCRIPTION] Respondendo requisição OPTIONS com 200 OK');
    return res.status(200).end();
  }

  // Validar método HTTP
  if (req.method !== 'GET') {
    console.error('[SUBSCRIPTION] Método não permitido:', req.method);
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: `Este endpoint aceita apenas GET, mas recebeu ${req.method}`
    });
  }

  try {
    console.log('[SUBSCRIPTION] Buscando assinatura para usuário:', req.query.userId);
    
    // Validar parâmetro userId
    const userId = req.query.userId;
    if (!userId) {
      console.error('[SUBSCRIPTION] Erro: userId não fornecido');
      return res.status(400).json({ 
        error: 'Parâmetro obrigatório ausente', 
        message: 'O parâmetro userId é obrigatório' 
      });
    }

    // Inicializar cliente do Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[SUBSCRIPTION] Erro: variáveis de ambiente do Supabase não configuradas');
      return res.status(500).json({ 
        error: 'Erro de configuração', 
        message: 'As credenciais do Supabase não estão configuradas no servidor' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Buscar assinatura ativa
    console.log('[SUBSCRIPTION] Consultando banco de dados...');
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('[SUBSCRIPTION] Erro ao consultar Supabase:', error);
      
      // Se o erro for de registro não encontrado, retornar 404
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Assinatura não encontrada', 
          message: 'Não foi encontrada nenhuma assinatura para este usuário' 
        });
      }
      
      return res.status(500).json({ 
        error: 'Erro ao buscar assinatura', 
        message: error.message 
      });
    }

    // Formatar datas para exibição amigável
    const formattedData = {
      ...data,
      start_date_formatted: data.start_date ? new Date(data.start_date).toLocaleDateString('pt-BR') : null,
      next_billing_date_formatted: data.next_billing_date ? new Date(data.next_billing_date).toLocaleDateString('pt-BR') : null,
      // Manter as datas originais para cálculos, se necessário
      created_at_formatted: data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR') : null
    };

    console.log('[SUBSCRIPTION] Assinatura encontrada:', formattedData.id);
    return res.status(200).json(formattedData);
  } catch (error) {
    console.error('[SUBSCRIPTION] Erro interno:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor', 
      message: error.message 
    });
  }
}; 