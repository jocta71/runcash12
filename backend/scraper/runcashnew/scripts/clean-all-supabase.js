// Script para limpar os dados da tabela 'roletas' em ambas as instâncias do Supabase
const https = require('https');

// Informações da instância do backend
const backendApiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqcnZrbWxqcnpxcWVxbWZwcWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU0NTM1NzYsImV4cCI6MjAzMTAyOTU3Nn0.Gg5hMJ9iqkPEZUCKWNt0jWGDnxwjAL2h4dOQwLnrJGg';
const backendUrl = 'vjrvkmljrzqqeqmfpqbk.supabase.co';

// Informações da instância do frontend
const frontendApiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2enF6Z2h4dXR0Y3RieGdvaHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzc5OTEsImV4cCI6MjA1Njc1Mzk5MX0.CmoM_y0i36nbBx2iN0DlOIob3yAgVRM1xY_XiOFBZLQ';
const frontendUrl = 'evzqzghxuttctbxgohpx.supabase.co';

// Função para limpar a tabela roletas usando uma API key e URL específicas
function clearRoulettesTable(apiKey, url, instanceName) {
  return new Promise((resolve, reject) => {
    console.log(`Iniciando limpeza da tabela roletas na instância ${instanceName}...`);

    const options = {
      hostname: url,
      path: '/rest/v1/roletas',
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`[${instanceName}] Status: ${res.statusCode}`);
      
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          console.log(`[${instanceName}] Tabela roletas limpa com sucesso!`);
          resolve();
        } else {
          console.error(`[${instanceName}] Erro ao limpar tabela. Código de status: ${res.statusCode}`);
          console.error(`[${instanceName}] Resposta: ${responseData}`);
          reject(new Error(`Erro ao limpar tabela ${instanceName}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error(`[${instanceName}] Erro na requisição: ${e.message}`);
      reject(e);
    });

    req.end();
  });
}

// Executar a limpeza em ambas as instâncias
async function cleanAllInstances() {
  console.log('Iniciando limpeza de todas as instâncias do Supabase...');
  
  try {
    // Limpa a instância do backend primeiro
    await clearRoulettesTable(backendApiKey, backendUrl, 'Backend');
    
    // Em seguida, limpa a instância do frontend
    await clearRoulettesTable(frontendApiKey, frontendUrl, 'Frontend');
    
    console.log('Limpeza concluída com sucesso em todas as instâncias!');
  } catch (error) {
    console.error('Erro durante o processo de limpeza:', error.message);
  }
}

// Iniciar o processo de limpeza
cleanAllInstances();

console.log('Script de limpeza iniciado. Aguarde a conclusão...'); 