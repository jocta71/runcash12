// Endpoint do servidor WebSocket para emitir evento
const endpoint = 'http://localhost:5000/emit-event';

// Criar um evento de teste para enviar
const testEvent = {
  event: 'new_number',
  data: {
    type: 'new_number',
    roleta_id: 'test-roulette',
    roleta_nome: 'Test Roulette',
    numero: Math.floor(Math.random() * 37), // Número aleatório entre 0 e 36
    cor: 'vermelho',
    timestamp: new Date().toISOString()
  }
};

// Enviar o evento para o servidor WebSocket
console.log('Enviando evento de teste:', testEvent);

(async () => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEvent)
    });
    
    if (!response.ok) {
      throw new Error(`Status da resposta: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Evento enviado com sucesso!');
    console.log('Resposta:', data);
  } catch (error) {
    console.error('Erro ao enviar evento:', error.message);
  }
})(); 