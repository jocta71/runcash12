/**
 * Lista de IDs de roletas permitidas para exibição no frontend
 * Estes IDs devem corresponder aos configurados no scraper
 */
export const ROLETAS_PERMITIDAS = [
  "*",  // Permitir todas as roletas
  "2010016",  // Immersive Roulette
  "2380335",  // Brazilian Mega Roulette
  "2010065",  // Bucharest Auto-Roulette
  "2010096",  // Speed Auto Roulette
  "2010017",  // Auto-Roulette
  "2010098"   // Auto-Roulette VIP
];

/**
 * Verifica se uma roleta está na lista de roletas permitidas
 * @param rouletteId ID da roleta a ser verificada
 * @returns boolean indicando se a roleta está permitida
 */
export const isRouletteAllowed = (rouletteId: string): boolean => {
  // Se "*" estiver na lista, todas as roletas são permitidas
  if (ROLETAS_PERMITIDAS.includes("*")) {
    return true;
  }
  return ROLETAS_PERMITIDAS.includes(rouletteId);
};

/**
 * Filtra um array de roletas para incluir apenas as permitidas
 * @param roulettes Array de roletas
 * @returns Array filtrado contendo apenas roletas permitidas
 */
export const filterAllowedRoulettes = <T extends { id: string }>(roulettes: T[]): T[] => {
  // Se "*" estiver na lista, retorne todas as roletas sem filtrar
  if (ROLETAS_PERMITIDAS.includes("*")) {
    return roulettes;
  }
  return roulettes.filter(roulette => isRouletteAllowed(roulette.id));
}; 