/**
 * Script para resolver o problema de duplicação de roletas no frontend
 * 
 * Este script analisa os dados da tabela roleta_numeros no Supabase,
 * identifica roletas únicas e cria uma estrutura de dados consolidada.
 */

const SUPABASE_URL = "https://evzqzghxuttctbxgohpx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2enF6Z2h4dXR0Y3RieGdvaHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzc5OTEsImV4cCI6MjA1Njc1Mzk5MX0.CmoM_y0i36nbBx2iN0DlOIob3yAgVRM1xY_XiOFBZLQ";

interface RouletteNumber {
  id: string;
  roleta_id: string;
  roleta_nome: string;
  numero: number;
  created_at: string;
}

interface UniqueRoulette {
  id: string;
  nome: string;
  numeros: number[];
  created_at: string[];
}

/**
 * Busca todos os números de roletas do Supabase
 * @returns Uma promessa que resolve para um array de RouletteNumber
 */
const fetchAllRouletteNumbers = async (): Promise<RouletteNumber[]> => {
  try {
    console.log("Buscando todos os registros da tabela roleta_numeros...");
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/roleta_numeros?select=*&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar dados: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Encontrados ${data.length} registros no total.`);
    return data;
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return [];
  }
};

/**
 * Identifica roletas únicas a partir dos registros de números
 * @param numbers Array de RouletteNumber
 * @returns Um objeto com roletas únicas
 */
const identifyUniqueRoulettes = (numbers: RouletteNumber[]): Record<string, UniqueRoulette> => {
  const uniqueRoulettes: Record<string, UniqueRoulette> = {};
  
  for (const record of numbers) {
    const { roleta_nome, roleta_id, numero, created_at } = record;
    
    // Usa o nome como chave única para consolidar
    if (!uniqueRoulettes[roleta_nome]) {
      uniqueRoulettes[roleta_nome] = {
        id: roleta_id, // Mantém o ID do primeiro registro encontrado
        nome: roleta_nome,
        numeros: [],
        created_at: []
      };
    }
    
    // Adiciona o número se ainda não existir
    if (!uniqueRoulettes[roleta_nome].numeros.includes(numero)) {
      uniqueRoulettes[roleta_nome].numeros.push(numero);
      uniqueRoulettes[roleta_nome].created_at.push(created_at);
    }
  }
  
  return uniqueRoulettes;
};

/**
 * Gera uma proposta de migração para resolver a duplicação
 */
const generateMigrationProposal = async () => {
  try {
    // 1. Buscar todos os dados
    const allNumbers = await fetchAllRouletteNumbers();
    if (allNumbers.length === 0) {
      console.log("Nenhum dado encontrado. Verifique a conexão com o Supabase.");
      return;
    }
    
    // 2. Identificar roletas únicas
    const uniqueRoulettes = identifyUniqueRoulettes(allNumbers);
    const rouletteCount = Object.keys(uniqueRoulettes).length;
    console.log(`Identificadas ${rouletteCount} roletas únicas:`);
    
    // 3. Mostrar estatísticas de cada roleta
    Object.entries(uniqueRoulettes).forEach(([nome, data]) => {
      console.log(`- ${nome}: ${data.numeros.length} números únicos`);
    });
    
    // 4. Gerar SQL para criar novas tabelas
    console.log("\n--- SCRIPT SQL PARA MIGRAÇÃO ---");
    console.log(`
-- 1. Criar nova tabela para roletas únicas
CREATE TABLE roletas_unicas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT UNIQUE NOT NULL,
  vitorias INTEGER DEFAULT 0,
  derrotas INTEGER DEFAULT 0,
  estado_estrategia TEXT DEFAULT 'NEUTRAL',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserir roletas únicas
INSERT INTO roletas_unicas (nome) VALUES
${Object.keys(uniqueRoulettes).map(nome => `  ('${nome.replace(/'/g, "''")}')`).join(",\n")};

-- 3. Criar tabela de mapeamento temporária
CREATE TABLE temp_roleta_mapping (
  old_id TEXT NOT NULL,
  old_nome TEXT NOT NULL,
  new_id UUID NOT NULL
);

-- 4. Preencher o mapeamento
INSERT INTO temp_roleta_mapping (old_id, old_nome, new_id)
SELECT 
  '${Object.values(uniqueRoulettes)[0]?.id || 'default-id'}' as old_id, 
  nome, 
  id 
FROM roletas_unicas;

-- 5. Atualizar a tabela roleta_numeros para usar os novos IDs
UPDATE roleta_numeros
SET roleta_id = (
  SELECT m.new_id 
  FROM temp_roleta_mapping m 
  WHERE m.old_nome = roleta_numeros.roleta_nome
)::text;

-- 6. Limpeza
DROP TABLE temp_roleta_mapping;
    `);
    
    // 5. Propor mudanças no frontend
    console.log("\n--- MUDANÇAS NECESSÁRIAS NO FRONTEND ---");
    console.log(`
1. Modificar o arquivo frontend/src/integrations/api/rouletteService.ts:
   - Atualizar fetchAvailableRoulettesFromNumbers para buscar roletas da tabela roletas_unicas
   - Modificar fetchRouletteLatestNumbersByName para usar o ID da roleta_unicas

2. Modificar o arquivo frontend/src/pages/Index.tsx:
   - Garantir que apenas uma instância de cada roleta seja exibida

3. Atualizar o scraper (backend/scraper/app.py):
   - Modificar para usar a tabela roletas_unicas para obter o ID correto da roleta
    `);
    
  } catch (error) {
    console.error("Erro ao gerar proposta de migração:", error);
  }
};

// Função para executar a migração (ainda não implementada)
const executeMigration = async () => {
  console.log("AVISO: Esta função ainda não está implementada.");
  console.log("Execute o script SQL manualmente no dashboard do Supabase.");
};

// Executa a geração da proposta se estiver em um ambiente de navegador
if (typeof window !== 'undefined') {
  generateMigrationProposal().then(() => {
    console.log("Análise concluída.");
  });
}

export { generateMigrationProposal, executeMigration }; 