import React from 'react';

export function MissingDozensAlert({ dozens }) {
  // Se não houver dados, não mostrar nada
  if (!dozens || dozens.length === 0) {
    return null;
  }

  // Verificar se alguma dúzia está ausente por mais de 20 rodadas
  const significantAbsence = dozens.some(dozen => dozen.ausencia >= 20);
  
  if (!significantAbsence) {
    return null;
  }

  // Mapeamento para nomes mais amigáveis
  const dozenNames = {
    'primeira': '1-12',
    'segunda': '13-24',
    'terceira': '25-36'
  };

  // Determinar cores para cada dúzia
  const getDozenStyles = (dozen) => {
    const ausencia = dozen.ausencia;
    
    if (ausencia >= 30) {
      return {
        bgClass: 'bg-red-600/20',
        borderClass: 'border-red-600',
        textClass: 'text-red-500',
        alertLevel: 'ALTA EXPECTATIVA'
      };
    } else if (ausencia >= 20) {
      return {
        bgClass: 'bg-yellow-600/20',
        borderClass: 'border-yellow-600',
        textClass: 'text-yellow-500',
        alertLevel: 'ATENÇÃO'
      };
    } else {
      return {
        bgClass: 'bg-blue-600/20',
        borderClass: 'border-blue-600',
        textClass: 'text-blue-500',
        alertLevel: 'NORMAL'
      };
    }
  };

  return (
    <div className="space-y-2">
      {dozens.filter(dozen => dozen.ausencia >= 20).map(dozen => {
        const styles = getDozenStyles(dozen);
        return (
          <div 
            key={dozen.dezena}
            className={`p-3 rounded-lg border ${styles.borderClass} ${styles.bgClass}`}
          >
            <h3 className={`text-sm font-bold ${styles.textClass}`}>{styles.alertLevel}</h3>
            <p className="text-white text-sm">
              Dúzia <span className="font-bold">{dozenNames[dozen.dezena]}</span> ausente há{' '}
              <span className="font-bold">{dozen.ausencia}</span> rodadas
            </p>
            
            {dozen.ausencia >= 25 && (
              <div className="mt-1 text-xs text-white/80">
                Esta dúzia pode ter maior probabilidade de aparecer nas próximas rodadas.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 