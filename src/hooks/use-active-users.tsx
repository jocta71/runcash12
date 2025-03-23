
import { useState, useEffect } from 'react';
import { ActiveUsers } from '@/components/chat/types';

export const useActiveUsers = (initialCount: number = 124) => {
  const [activeUsers, setActiveUsers] = useState<ActiveUsers>({
    count: initialCount,
    trend: 'stable',
    lastUpdate: new Date()
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Gerar uma mudança aleatória entre -3 e +5
      const shouldChange = Math.random() > 0.3; // 70% de chance de mudar
      
      if (shouldChange) {
        const change = Math.floor(Math.random() * 9) - 3; // Entre -3 e +5
        let newCount = activeUsers.count + change;
        
        // Manter entre um mínimo e máximo razoável
        newCount = Math.max(80, Math.min(200, newCount));
        
        setActiveUsers({
          count: newCount,
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
          lastUpdate: new Date()
        });
      }
    }, 5000); // Atualizar a cada 5 segundos
    
    return () => clearInterval(interval);
  }, [activeUsers]);

  return activeUsers;
};
