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
        console.log(`[LastNumbersRealtime] Buscando números iniciais para ${roletaNome}...`);
        
        const { data, error } = await supabase
          .from('roleta_numeros')
          .select('numero, timestamp, cor')
          .eq('roleta_nome', roletaNome)
          .order('timestamp', { ascending: false })
          .limit(limit);
          
        if (error) {
          console.error(`[LastNumbersRealtime] Erro ao buscar números:`, error);
          throw error;
        }
        
        console.log(`[LastNumbersRealtime] Números obtidos do Supabase:`, data);
        
        // Aplicar validação para garantir que todos os números são válidos
        const validData = data.filter(n => 
          n.numero !== null && !isNaN(Number(n.numero)) && 
          Number(n.numero) >= 0 && Number(n.numero) <= 36
        );
        
        console.log(`[LastNumbersRealtime] Números válidos:`, validData.length);
        
        setNumbers(validData.map(n => ({
          number: Number(n.numero),
          color: n.cor || getRouletteNumberColor(Number(n.numero)),
          timestamp: new Date(n.timestamp || Date.now())
        })));
      } catch (error) {
        console.error('[LastNumbersRealtime] Erro ao buscar números:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Função auxiliar para determinar a cor do número
    const getRouletteNumberColor = (num) => {
      if (num === 0) return 'verde';
      
      // Números vermelhos na roleta europeia
      const numerosVermelhos = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      return numerosVermelhos.includes(num) ? 'vermelho' : 'preto';
    };
    
    fetchInitialNumbers();
    
    // Configurar subscription em tempo real
    console.log(`[LastNumbersRealtime] Configurando subscription para ${roletaNome}...`);
    
    const channelName = `roleta_numeros_${roletaNome}_${Date.now()}`;
    console.log(`[LastNumbersRealtime] Canal: ${channelName}`);
    
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'roleta_numeros',
        filter: 'roleta_nome=eq.' + roletaNome
      }, (payload) => {
        // Adicionar novo número ao estado
        console.log('[LastNumbersRealtime] Novo número recebido:', payload.new);
        
        // Validar o número recebido
        if (!payload.new || payload.new.numero === undefined || payload.new.numero === null) {
          console.error('[LastNumbersRealtime] Payload inválido:', payload);
          return;
        }
        
        const num = Number(payload.new.numero);
        if (isNaN(num) || num < 0 || num > 36) {
          console.error('[LastNumbersRealtime] Número inválido:', num);
          return;
        }
        
        const newNumber = {
          number: num,
          color: payload.new.cor || getRouletteNumberColor(num),
          timestamp: new Date(payload.new.timestamp || Date.now()),
          isNew: true
        };
        
        console.log('[LastNumbersRealtime] Adicionando novo número ao estado:', newNumber);
        
        setNumbers(prev => [newNumber, ...prev.slice(0, limit - 1)]);
        
        // Mostrar indicador de novo número
        setNewNumberIndicator(true);
        setTimeout(() => setNewNumberIndicator(false), 3000);
      })
      .subscribe((status) => {
        console.log(`[LastNumbersRealtime] Status da subscription: ${status}`);
      });
    
    return () => {
      console.log(`[LastNumbersRealtime] Removendo subscription para ${roletaNome}...`);
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