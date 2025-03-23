// Script para limpar os dados da tabela 'roletas' na instância do Supabase usada pelo frontend
const https = require('https');

// Informações da instância do frontend
const frontendApiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2enF6Z2h4dXR0Y3RieGdvaHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzc5OTEsImV4cCI6MjA1Njc1Mzk5MX0.CmoM_y0i36nbBx2iN0DlOIob3yAgVRM1xY_XiOFBZLQ';
const frontendUrl = 'evzqzghxuttctbxgohpx.supabase.co';

// Função para limpar a tabela roletas do Supabase (frontend)
function clearFrontendRoulettesTable() {
  console.log('Iniciando limpeza da tabela roletas na instância do frontend...');

  const options = {
    hostname: frontendUrl,
    path: '/rest/v1/roletas',
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'apikey': frontendApiKey,
      'Authorization': `Bearer ${frontendApiKey}`,
      'Prefer': 'return=minimal'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    if (res.statusCode === 200 || res.statusCode === 204) {
      console.log('Tabela roletas (frontend) limpa com sucesso!');
    } else {
      console.error(`Erro ao limpar tabela do frontend. Código de status: ${res.statusCode}`);
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
clearFrontendRoulettesTable();

console.log('Script de limpeza do frontend iniciado. Aguarde a conclusão...'); 