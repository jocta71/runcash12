/**
 * Mock da função de seeding para inserir números de teste nas roletas
 * Esta versão não depende do Supabase e apenas simula a inserção de dados
 */

import { toast } from '@/components/ui/use-toast';

// Função para obter a cor de um número da roleta
const getRouletteColor = (numero: number): string => {
  if (numero === 0) return 'verde';
  
  // Números vermelhos na roleta europeia
  const numerosVermelhos = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return numerosVermelhos.includes(numero) ? 'vermelho' : 'preto';
};

// Interface para a roleta
interface Roleta {
  id: string;
  nome: string;
}

// Interface para as opções de seed
interface SeedOptions {
  roleta: Roleta;
  count: number;
  batchSize?: number;
  onProgress?: (progress: number) => void;
}

// Função para inserir números de roleta - desativada
const seedRouletteNumbers = async ({
  roleta,
  count,
  batchSize = 50,
  onProgress = () => {}
}: SeedOptions): Promise<boolean> => {
  
  toast({
    title: "Função desativada",
    description: "A geração de números aleatórios foi desativada nesta versão",
    variant: "destructive"
  });
  
  return false;
};

export default seedRouletteNumbers; 