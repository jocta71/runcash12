import React, { memo, useMemo } from 'react';

interface RouletteNumberProps {
  number: number;
  className?: string;
}

// Os números vermelhos na roleta
const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Função para determinar a cor do número movida para fora do componente
const getRouletteNumberColor = (num: number) => {
  // Garantir que o número está no formato correto
  num = Number(num);
  
  if (num === 0) return "bg-vegas-green text-black";
  
  if (redNumbers.includes(num)) {
    return "bg-red-600 text-white";
  } else {
    return "bg-black text-white";
  }
};

// Componente otimizado com memo para evitar re-renderizações desnecessárias
const RouletteNumber = memo(({ number, className = '' }: RouletteNumberProps) => {
  // Converter o número para o formato numérico correto
  const convertedNumber = typeof number === 'string' ? parseInt(number, 10) : Number(number);
  
  // Usando useMemo para calcular a classe de cor apenas quando o número muda
  const colorClass = useMemo(() => getRouletteNumberColor(convertedNumber), [convertedNumber]);

  return (
    <div
      className={`w-5 h-5 rounded-full ${colorClass} flex items-center justify-center text-[9px] font-medium ${className}`}
    >
      {convertedNumber}
    </div>
  );
});

// Adiciona um nome de exibição para melhorar a depuração
RouletteNumber.displayName = 'RouletteNumber';

export default RouletteNumber;
