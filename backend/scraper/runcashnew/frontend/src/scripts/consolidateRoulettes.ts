/**
 * Script para consolidar roletas duplicadas no frontend
 * 
 * Esta solução modifica o processamento dos dados no frontend,
 * para que roletas com o mesmo nome sejam agrupadas, sem precisar
 * alterar a estrutura do banco de dados.
 */

import { RouletteData } from '../integrations/api/rouletteService';

/**
 * Agrupa roletas com o mesmo nome
 * @param roulettes Lista de roletas a serem agrupadas
 * @returns Lista consolidada de roletas
 */
export const consolidateRoulettesByName = (roulettes: RouletteData[]): RouletteData[] => {
  const uniqueRoulettes = new Map<string, RouletteData>();
  
  // Agrupar por nome
  for (const roulette of roulettes) {
    const nome = roulette.nome;
    
    if (!uniqueRoulettes.has(nome)) {
      // Se é a primeira vez que encontramos esta roleta, adicionamos ao mapa
      uniqueRoulettes.set(nome, { ...roulette });
    } else {
      // Se a roleta já existe, combinamos seus números
      const existingRoulette = uniqueRoulettes.get(nome)!;
      
      // Combinar os números sem duplicar
      const combinedNumbers = [...existingRoulette.numeros];
      for (const num of roulette.numeros) {
        if (!combinedNumbers.includes(num)) {
          combinedNumbers.push(num);
        }
      }
      
      // Ordenar números do mais recente para o mais antigo
      // (assumindo que os números mais recentes estão no início do array)
      combinedNumbers.sort((a, b) => b - a);
      
      // Atualizar a roleta existente
      uniqueRoulettes.set(nome, {
        ...existingRoulette,
        numeros: combinedNumbers,
        // Combine outros campos conforme necessário
        vitorias: existingRoulette.vitorias + roulette.vitorias,
        derrotas: existingRoulette.derrotas + roulette.derrotas,
        // Use o timestamp mais recente
        updated_at: new Date(
          Math.max(
            new Date(existingRoulette.updated_at).getTime(),
            new Date(roulette.updated_at).getTime()
          )
        ).toISOString()
      });
    }
  }
  
  // Converter o mapa de volta para um array
  return Array.from(uniqueRoulettes.values());
};

/**
 * Função auxiliar para aplicar à função fetchAllRoulettes
 * @param originalFetchFunction Função original de busca
 * @returns Função modificada que consolida os resultados
 */
export const withRouletteConsolidation = (
  originalFetchFunction: () => Promise<RouletteData[]>
): (() => Promise<RouletteData[]>) => {
  return async () => {
    const originalRoulettes = await originalFetchFunction();
    console.log(`[Consolidação] Recebidas ${originalRoulettes.length} roletas do backend.`);
    
    const consolidatedRoulettes = consolidateRoulettesByName(originalRoulettes);
    console.log(`[Consolidação] Após agrupamento: ${consolidatedRoulettes.length} roletas únicas.`);
    
    return consolidatedRoulettes;
  };
};

/**
 * Modifica as funções de API existentes para consolidar roletas
 * @param serviceModule Módulo que contém as funções de serviço
 */
export const applyConsolidationToService = (serviceModule: any) => {
  if (serviceModule.fetchAllRoulettes) {
    const originalFetchAllRoulettes = serviceModule.fetchAllRoulettes;
    serviceModule.fetchAllRoulettes = withRouletteConsolidation(originalFetchAllRoulettes);
    console.log("[Consolidação] Aplicada consolidação à função fetchAllRoulettes");
  }
};

// Exporta a função principal
export default consolidateRoulettesByName; 