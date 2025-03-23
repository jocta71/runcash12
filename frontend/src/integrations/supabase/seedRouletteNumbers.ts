/**
 * Mock da função de seeding para inserir números de teste nas roletas
 * Esta versão não depende do Supabase e apenas simula a inserção de dados
 */

import { toast } from '@/components/ui/use-toast';

interface SeedRoulettesOptions {
  count?: number;
  roletaNome?: string;
  batchSize?: number;
  onProgress?: (progress: number) => void;
}

/**
 * Gera uma cor para um número da roleta
 */
const getRouletteColor = (number: number): 'verde' | 'vermelho' | 'preto' => {
  if (number === 0) return 'verde';
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return redNumbers.includes(number) ? 'vermelho' : 'preto';
};

/**
 * Versão mock para inserir números de teste nas roletas
 * Não realiza operações reais de banco de dados
 */
const seedRouletteNumbers = async ({
  count = 100,
  roletaNome = 'Auto-Roulette',
  batchSize = 10,
  onProgress = () => {}
}: SeedRoulettesOptions = {}) => {
  try {
    console.log(`[MOCK] Iniciando seed de ${count} números para ${roletaNome}`);
    
    // Lista de roletas pré-definidas
    const roletas = [
      { id: '23d683ae-7b17-89e3-eccb-30a3083338f0', nome: 'Lightning Roulette' },
      { id: '48f8b26b-4dfa-5c87-a372-6f69e2902c57', nome: 'Auto-Roulette' },
      { id: '1a3ae55f-534e-5d99-8ef8-16d20466fc36', nome: 'Speed Auto Roulette' },
      { id: '72a4217f-a3c4-5f81-a0ad-41c307110c99', nome: 'Immersive Roulette' },
      { id: '3a90c765-f34d-547f-81c0-f99b9f11a61f', nome: 'Roulette Live' },
      { id: 'b5c26323-67ab-5576-aa17-88da4ced1a86', nome: 'Brazilian Mega Roulette' }
    ];
    
    // Encontrar a roleta especificada ou usar a primeira
    const roleta = roletas.find(r => r.nome === roletaNome) || roletas[0];
    
    // Simular processamento em lotes
    const batches = Math.ceil(count / batchSize);
    
    for (let batch = 0; batch < batches; batch++) {
      const batchCount = Math.min(batchSize, count - batch * batchSize);
      const batchNumbers = [];
      
      for (let i = 0; i < batchCount; i++) {
        // Gerar número aleatório entre 0 e 36
        const numero = Math.floor(Math.random() * 37);
        const cor = getRouletteColor(numero);
        
        batchNumbers.push({
          roleta_id: roleta.id,
          roleta_nome: roleta.nome,
          numero,
          cor,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`[MOCK] Lote ${batch + 1}/${batches}: ${batchNumbers.length} números gerados`);
      
      // Simular um delay para dar feedback visual
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Atualizar progresso
      const progress = Math.min(((batch + 1) * batchSize) / count, 1);
      onProgress(progress);
    }
    
    // Mostrar notificação de sucesso
    toast({
      title: "Números inseridos com sucesso",
      description: `Foram gerados ${count} números para a roleta ${roleta.nome}`,
      variant: "default"
    });
    
    console.log(`[MOCK] Seed concluído para ${roleta.nome}`);
    return true;
    
  } catch (error) {
    console.error('Erro ao inserir números:', error);
    
    toast({
      title: "Erro ao inserir números",
      description: "Ocorreu um erro ao tentar inserir os números. Tente novamente.",
      variant: "destructive"
    });
    
    return false;
  }
};

export default seedRouletteNumbers; 