import React, { memo, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getRouletteNumberColor } from '@/utils/rouletteUtils';

interface LastNumbersProps {
  numbers: number[];
  isLoading?: boolean;
  className?: string;
}

const LastNumbers = memo(({ numbers, isLoading = false, className = '' }: LastNumbersProps) => {
  // Garantir que numbers é um array válido
  const safeNumbers = Array.isArray(numbers) ? numbers : [];
  
  // Manter uma referência aos números exibidos para evitar oscilações
  const displayNumbersRef = useRef<number[]>([]);
  
  // Atualizar os números de exibição apenas quando houver novos números
  useEffect(() => {
    // Só atualizamos os números se:
    // 1. Temos números novos E
    // 2. Os números são diferentes dos que já estamos exibindo
    if (safeNumbers.length > 0 && 
        JSON.stringify(safeNumbers) !== JSON.stringify(displayNumbersRef.current)) {
      displayNumbersRef.current = [...safeNumbers];
    }
  }, [safeNumbers]);
  
  // Se temos números na ref de exibição, usamos eles (mesmo durante loading)
  // Isso garante que os números permaneçam visíveis mesmo durante refreshes
  const hasStoredNumbers = displayNumbersRef.current.length > 0;
  
  // Usamos template apenas se não tivermos números reais após o carregamento inicial
  const shouldUseTemplateData = !isLoading && !hasStoredNumbers;
  
  // Array final de números para exibição
  const displayNumbers = hasStoredNumbers
    ? displayNumbersRef.current
    : shouldUseTemplateData 
      ? [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27] // Fallback
      : [];
  
  // Verificar qual número é novo (para animação)
  const previousRenderRef = useRef<number[]>([]);
  const newNumberIndex = displayNumbers.length > 0 && previousRenderRef.current.length > 0 
    ? (displayNumbers[0] !== previousRenderRef.current[0] ? 0 : -1) 
    : -1;
  
  // Após renderizar, atualizar a referência do render anterior para detectar novos números
  useEffect(() => {
    if (displayNumbers.length > 0) {
      previousRenderRef.current = [...displayNumbers];
    }
  }, [displayNumbers]);
  
  // Mostrar loading apenas no carregamento inicial e quando não temos números armazenados
  if (isLoading && !hasStoredNumbers) {
    return (
      <div className={`flex flex-wrap gap-1.5 my-2 ${className}`}>
        {Array(10).fill(0).map((_, i) => (
          <Skeleton key={i} className="w-7 h-7 rounded-full" />
        ))}
      </div>
    );
  }
  
  // Se não temos dados para exibir (nem armazenados, nem template)
  if (displayNumbers.length === 0) {
    return (
      <div className={`flex flex-wrap gap-1.5 my-2 ${className}`}>
        {Array(10).fill(0).map((_, i) => (
          <Skeleton key={i} className="w-7 h-7 rounded-full opacity-40" />
        ))}
      </div>
    );
  }
  
  // Renderizar números (reais ou template)
  return (
    <div 
      className={`h-[74px] flex flex-wrap content-start gap-1 my-2 w-full overflow-hidden ${className}`} 
      data-testid="last-numbers"
      data-template={shouldUseTemplateData ? 'true' : 'false'}
      data-static="true"
    >
      {displayNumbers.slice(0, 12).map((num, idx) => (
        <div
          key={`${num}-${idx}`}
          className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs font-bold 
            ${getRouletteNumberColor(num)}
            ${newNumberIndex === 0 && idx === 0 ? 'animate-pulse shadow-lg transition-all duration-500 scale-110' : ''}
            ${shouldUseTemplateData ? 'opacity-40' : ''}
          `}
          data-number={num}
          data-new={newNumberIndex === 0 && idx === 0 ? 'true' : 'false'}
          data-template={shouldUseTemplateData ? 'true' : 'false'}
        >
          {num}
        </div>
      ))}
    </div>
  );
});

LastNumbers.displayName = 'LastNumbers';

export default LastNumbers;
