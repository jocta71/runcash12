// Script para limpar os dados da tabela 'roletas' no Supabase
const https = require('https');

// Informações da instância do backend
const backendApiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqcnZrbWxqcnpxcWVxbWZwcWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU0NTM1NzYsImV4cCI6MjAzMTAyOTU3Nn0.Gg5hMJ9iqkPEZUCKWNt0jWGDnxwjAL2h4dOQwLnrJGg';
const backendUrl = 'vjrvkmljrzqqeqmfpqbk.supabase.co';

// Função para limpar a tabela roletas do Supabase
function clearRoulettesTable() {
  console.log('Iniciando limpeza da tabela roletas...');

  const options = {
    hostname: backendUrl,
    path: '/rest/v1/roletas',
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'apikey': backendApiKey,
      'Authorization': `Bearer ${backendApiKey}`,
      'Prefer': 'return=minimal'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    if (res.statusCode === 200 || res.statusCode === 204) {
      console.log('Tabela roletas limpa com sucesso!');
    } else {
      console.error(`Erro ao limpar tabela. Código de status: ${res.statusCode}`);
    }

    res.on('data', (chunk) => {
      console.log(`Resposta: ${chunk}`);
    });
  });

  req.on('error', (e) => {
    console.error(`Erro na requisição: ${e.message}`);
  });

  req.end();
}

// Executar a limpeza
clearRoulettesTable();

console.log('Script de limpeza iniciado. Aguarde a conclusão...'); 