// Script para inserir números de exemplo para as roletas existentes no Supabase
// Este script deve ser executado para popular a tabela roleta_numeros

const SUPABASE_URL = "https://evzqzghxuttctbxgohpx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2enF6Z2h4dXR0Y3RieGdvaHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzc5OTEsImV4cCI6MjA1Njc1Mzk5MX0.CmoM_y0i36nbBx2iN0DlOIob3yAgVRM1xY_XiOFBZLQ";

interface Roleta {
  id: string;
  nome: string;
}

// Função para gerar um número aleatório entre 0 e 36 (números da roleta)
const generateRandomRouletteNumber = () => {
  return Math.floor(Math.random() * 37); // 0-36
};

// Função para buscar todas as roletas existentes
const fetchRoletas = async (): Promise<Roleta[]> => {
  try {
    console.log('Buscando todas as roletas do Supabase...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/roletas?select=id,nome`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar roletas: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Encontradas ${data.length} roletas.`);
    return data;
  } catch (error) {
    console.error('Erro ao buscar roletas:', error);
    return [];
  }
};

// Função para adicionar um número para uma roleta
const addNumberToRoleta = async (roletaId: string, roletaNome: string, numero: number) => {
  try {
    const now = new Date().toISOString();
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/roleta_numeros`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        roleta_id: roletaId,
        roleta_nome: roletaNome,
        numero: numero,
        created_at: now
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao adicionar número ${numero} para roleta ${roletaNome}: ${response.statusText}`);
    }
    
    console.log(`Número ${numero} adicionado com sucesso para a roleta ${roletaNome}`);
    return true;
  } catch (error) {
    console.error(`Erro ao adicionar número para roleta ${roletaNome}:`, error);
    return false;
  }
};

// Função principal para adicionar números para todas as roletas
export const seedRouletteNumbers = async (numbersPerRoulette = 20) => {
  try {
    console.log(`Iniciando população da tabela roleta_numeros com ${numbersPerRoulette} números por roleta...`);
    
    // 1. Buscar todas as roletas
    const roletas = await fetchRoletas();
    
    if (roletas.length === 0) {
      console.log('Nenhuma roleta encontrada. Verifique se a tabela roletas possui registros.');
      return;
    }
    
    // 2. Para cada roleta, adicionar números aleatórios
    for (const roleta of roletas) {
      console.log(`Adicionando ${numbersPerRoulette} números para a roleta ${roleta.nome} (${roleta.id})...`);
      
      // Adicionar com um atraso entre os números para manter a ordem cronológica
      for (let i = 0; i < numbersPerRoulette; i++) {
        const numero = generateRandomRouletteNumber();
        await addNumberToRoleta(roleta.id, roleta.nome, numero);
        
        // Pequeno atraso para garantir ordem cronológica nos timestamps
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`Concluída a adição de números para roleta ${roleta.nome}`);
    }
    
    console.log('População da tabela roleta_numeros concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a população da tabela roleta_numeros:', error);
  }
};

// Execute a função se este arquivo for executado diretamente
if (typeof window !== 'undefined' && window.location.pathname.includes('seed-numbers')) {
  console.log('Executando script de população de números...');
  seedRouletteNumbers().then(() => {
    console.log('Script concluído.');
  });
}

export default seedRouletteNumbers; 