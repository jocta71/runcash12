const axios = require('axios');

// Configurações da API Asaas
const API_BASE_URL = 'https://sandbox.asaas.com/api/v3';
const API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjNjMjMwZTZiLTYwNzYtNGMwYS05NjA3LWU2NjYyMDMxZTNlOTo6JGFhY2hfNmYzNDFjZDktZmUwMy00MzdmLWE1ODQtNDA0MjcxMThjZjI0';

// Função de teste
async function testarAPI() {
  try {
    console.log('Iniciando teste da API do Asaas...');
    
    // 1. Criar cliente
    console.log('Testando criação de cliente...');
    const customerResponse = await axios({
      method: 'post',
      url: `${API_BASE_URL}/customers`,
      headers: {
        'access_token': API_KEY,
        'Content-Type': 'application/json'
      },
      data: {
        name: "Cliente Teste Script",
        email: "teste@exemplo.com",
        cpfCnpj: "07476630335",
        mobilePhone: "88999887766"
      }
    });
    
    console.log('Cliente criado com sucesso!');
    console.log('ID do cliente:', customerResponse.data.id);
    
    // Salvar ID do cliente para próximo teste
    const customerId = customerResponse.data.id;
    
    // 2. Criar assinatura
    console.log('\nTestando criação de assinatura...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDateString = tomorrow.toISOString().split('T')[0];
    
    const subscriptionResponse = await axios({
      method: 'post',
      url: `${API_BASE_URL}/subscriptions`,
      headers: {
        'access_token': API_KEY,
        'Content-Type': 'application/json'
      },
      data: {
        customer: customerId,
        billingType: 'PIX',
        value: 49.90,
        nextDueDate: dueDateString,
        cycle: 'MONTHLY',
        description: 'Plano Pro de Teste',
        maxPayments: 12
      }
    });
    
    console.log('Assinatura criada com sucesso!');
    console.log('ID da assinatura:', subscriptionResponse.data.id);
    
    console.log('\nTeste concluído com sucesso! A API do Asaas está funcionando corretamente.');
    
  } catch (error) {
    console.log('ERRO NO TESTE:');
    console.log('Mensagem:', error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Detalhes:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Executar o teste
testarAPI();