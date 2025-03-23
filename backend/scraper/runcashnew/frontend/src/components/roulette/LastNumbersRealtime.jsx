import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getRouletteNumberColor } from '@/utils/rouletteUtils';

export function LastNumbersRealtime({ roletaNome, limit = 20 }) {
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNumberIndicator, setNewNumberIndicator] = useState(false);
  
  useEffect(() => {
    // Buscar números iniciais
    const fetchInitialNumbers = async () => {
      try {
        const { data, error } = await supabase
          .from('roleta_numeros')
          .select('numero, timestamp, cor')
          .eq('roleta_nome', roletaNome)
          .order('timestamp', { ascending: false })
          .limit(limit);
          
        if (error) throw error;
        
        setNumbers(data.map(n => ({
          number: n.numero,
          color: n.cor,
          timestamp: new Date(n.timestamp)
        })));
      } catch (error) {
        console.error('[LastNumbersRealtime] Erro ao buscar números:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialNumbers();
    
    // Configurar subscription em tempo real
    const subscription = supabase
      .channel('roleta_numeros_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'roleta_numeros',
        filter: 'roleta_nome=eq.' + roletaNome
      }, (payload) => {
        // Adicionar novo número ao estado
        console.log('[LastNumbersRealtime] Novo número recebido:', payload.new);
        
        const newNumber = {
          number: payload.new.numero,
          color: payload.new.cor,
          timestamp: new Date(payload.new.timestamp),
          isNew: true
        };
        
        setNumbers(prev => [newNumber, ...prev.slice(0, limit - 1)]);
        
        // Mostrar indicador de novo número
        setNewNumberIndicator(true);
        setTimeout(() => setNewNumberIndicator(false), 3000);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [roletaNome, limit]);
  
  // Renderizar skeleton loading
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-5 w-32 bg-gray-700 rounded animate-pulse"></div>
        <div className="flex flex-wrap gap-1.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <h3 className="text-sm font-medium text-white/70">Últimos números:</h3>
        {newNumberIndicator && (
          <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full animate-pulse">
            Novo número
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {numbers.map((item, idx) => (
          <div 
            key={`${item.number}-${idx}`}
            className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getRouletteNumberColor(item.number)} ${item.isNew ? 'animate-bounce' : ''}`}
            title={`${item.number} - ${item.timestamp.toLocaleTimeString()}`}
          >
            {item.number}
            {idx === 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            )}
          </div>
        ))}
        
        {numbers.length === 0 && (
          <div className="text-sm text-gray-400">
            Nenhum número disponível
          </div>
        )}
      </div>
    </div>
  );
} 