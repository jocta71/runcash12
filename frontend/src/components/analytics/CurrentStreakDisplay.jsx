import React from 'react';

export function CurrentStreakDisplay({ streak }) {
  // Se não tiver sequência ou for uma sequência pequena, não mostrar
  if (!streak || !streak.type || streak.count < 3) {
    return null;
  }

  // Função para determinar o estilo baseado no tipo e valor da sequência
  const getStyles = () => {
    if (streak.type === 'cor') {
      switch (streak.value) {
        case 'vermelho':
          return {
            bgClass: 'bg-red-600/20',
            borderClass: 'border-red-600',
            textClass: 'text-red-500',
            icon: '🔴',
            label: 'vermelhos'
          };
        case 'preto':
          return {
            bgClass: 'bg-black/20',
            borderClass: 'border-black',
            textClass: 'text-gray-300',
            icon: '⚫',
            label: 'pretos'
          };
        case 'verde':
          return {
            bgClass: 'bg-green-600/20',
            borderClass: 'border-green-600',
            textClass: 'text-green-500',
            icon: '🟢',
            label: 'zeros'
          };
        default:
          return {
            bgClass: 'bg-gray-600/20',
            borderClass: 'border-gray-600',
            textClass: 'text-gray-400',
            icon: '⚪',
            label: ''
          };
      }
    } else if (streak.type === 'paridade') {
      switch (streak.value) {
        case 'par':
          return {
            bgClass: 'bg-blue-600/20',
            borderClass: 'border-blue-600',
            textClass: 'text-blue-500',
            icon: '🔵',
            label: 'pares'
          };
        case 'impar':
          return {
            bgClass: 'bg-purple-600/20',
            borderClass: 'border-purple-600',
            textClass: 'text-purple-500',
            icon: '🟣',
            label: 'ímpares'
          };
        default:
          return {
            bgClass: 'bg-gray-600/20',
            borderClass: 'border-gray-600',
            textClass: 'text-gray-400',
            icon: '⚪',
            label: ''
          };
      }
    }
    return {
      bgClass: 'bg-gray-600/20',
      borderClass: 'border-gray-600',
      textClass: 'text-gray-400',
      icon: '⚪',
      label: ''
    };
  };

  const styles = getStyles();
  
  // Determinar nível de alerta baseado no comprimento da sequência
  const getAlertLevel = () => {
    if (streak.count >= 7) return 'ALERTA MÁXIMO';
    if (streak.count >= 5) return 'ATENÇÃO';
    if (streak.count >= 3) return 'OBSERVAR';
    return '';
  };

  return (
    <div className={`p-3 rounded-lg border ${styles.borderClass} ${styles.bgClass}`}>
      <div className="flex items-center">
        <div className="text-2xl mr-2">{styles.icon}</div>
        <div>
          <h3 className={`text-sm font-bold ${styles.textClass}`}>{getAlertLevel()}</h3>
          <p className="text-white text-sm">
            Sequência de <span className="font-bold">{streak.count}</span> {styles.label} seguidos
          </p>
        </div>
      </div>
      
      {streak.count >= 5 && (
        <div className="mt-2 text-xs text-white/80">
          <p>
            {streak.type === 'cor' 
              ? `A cor oposta (${streak.value === 'vermelho' ? 'preto' : 'vermelho'}) pode ter maior probabilidade`
              : `A paridade oposta (${streak.value === 'par' ? 'ímpar' : 'par'}) pode ter maior probabilidade`
            }
          </p>
        </div>
      )}
    </div>
  );
} 