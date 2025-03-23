import React from 'react';

// Componente para exibir a distribuição de cores em um gráfico circular
export function ColorDistributionChart({ data }) {
  // Verificar se temos dados para exibir
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-32 text-gray-400">
        Sem dados disponíveis
      </div>
    );
  }

  // Função para determinar a cor de exibição baseada na cor da roleta
  const getDisplayColor = (cor) => {
    switch (cor) {
      case 'vermelho':
        return 'bg-red-600';
      case 'preto':
        return 'bg-black';
      case 'verde':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  // Ordenar os dados por porcentagem (decrescente)
  const sortedData = [...data].sort((a, b) => b.porcentagem - a.porcentagem);

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* Gráfico visual (simples) */}
      <div className="relative w-32 h-32 md:w-40 md:h-40">
        {sortedData.map((item, index) => {
          // Calcular tamanho proporcional ao valor
          const size = 100 - (index * 10);
          return (
            <div
              key={item.cor}
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full ${getDisplayColor(item.cor)}`}
              style={{
                width: `${size}%`,
                height: `${size}%`,
                zIndex: 10 - index,
                opacity: 0.9 - (index * 0.1)
              }}
            />
          );
        })}
        {/* Círculo central com valor principal */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2/5 h-2/5 rounded-full bg-[#17161e] flex items-center justify-center z-20 text-xs font-medium text-white">
          {sortedData[0]?.porcentagem}%
        </div>
      </div>

      {/* Legendas e estatísticas */}
      <div className="grid grid-cols-1 gap-2 text-sm">
        {sortedData.map((item) => (
          <div key={item.cor} className="flex items-center">
            <div className={`w-4 h-4 rounded-sm ${getDisplayColor(item.cor)} mr-2`} />
            <div className="flex-1 text-gray-300 capitalize">{item.cor}</div>
            <div className="font-medium text-right ml-4 w-14 text-white">{item.total}x</div>
            <div className="font-bold text-right ml-4 w-12 text-[#00ff00]">{item.porcentagem}%</div>
          </div>
        ))}
      </div>
    </div>
  );
} 