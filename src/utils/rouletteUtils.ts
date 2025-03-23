/**
 * Utilitários para trabalhar com números de roleta
 */

/**
 * Determina a classe CSS de cor para um número de roleta
 * @param num Número da roleta (0-36)
 * @returns String com classes CSS para aplicar a cor correta
 */
export const getRouletteNumberColor = (num: number): string => {
  num = Number(num); // Garantir que o número está no formato correto
  if (num === 0) {
    return 'bg-green-600 text-white'; // Verde para o zero
  } else if ([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num)) {
    return 'bg-red-600 text-white'; // Vermelho para números específicos
  } else {
    return 'bg-black text-white'; // Preto para os demais números
  }
};

/**
 * Verifica se um número é vermelho na roleta
 * @param num Número da roleta
 * @returns true se o número for vermelho
 */
export const isRedNumber = (num: number): boolean => {
  return [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(Number(num));
};

/**
 * Verifica se um número é preto na roleta
 * @param num Número da roleta
 * @returns true se o número for preto
 */
export const isBlackNumber = (num: number): boolean => {
  return !isRedNumber(num) && num !== 0;
};

/**
 * Verifica se um número é par
 * @param num Número da roleta
 * @returns true se o número for par
 */
export const isEvenNumber = (num: number): boolean => {
  return num !== 0 && num % 2 === 0;
};

/**
 * Verifica se um número é ímpar
 * @param num Número da roleta
 * @returns true se o número for ímpar
 */
export const isOddNumber = (num: number): boolean => {
  return num !== 0 && num % 2 !== 0;
}; 