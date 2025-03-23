import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useRoletaAnalytics(roletaNome, refreshInterval = 15000) {
  const [analytics, setAnalytics] = useState({
    colorDistribution: [],
    numberFrequency: [],
    currentStreak: { type: null, count: 0 },
    missingDozens: [],
    loading: true,
    error: null
  });
  
  // Função para buscar distribuição de cores
  const fetchColorDistribution = async () => {
    try {
      const { data, error } = await supabase
        .from('roleta_numeros')
        .select('cor')
        .eq('roleta_nome', roletaNome)
        .order('timestamp', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Calcular distribuição de cores
      const colorCounts = data.reduce((acc, item) => {
        acc[item.cor] = (acc[item.cor] || 0) + 1;
        return acc;
      }, {});
      
      const colorDistribution = Object.entries(colorCounts).map(([cor, total]) => ({
        cor,
        total,
        porcentagem: parseFloat((total * 100 / data.length).toFixed(1))
      }));
      
      return colorDistribution;
    } catch (error) {
      console.error('Erro ao buscar distribuição de cores:', error);
      throw error;
    }
  };
  
  // Função para buscar frequência de números
  const fetchNumberFrequency = async () => {
    try {
      const { data, error } = await supabase
        .from('roleta_numeros')
        .select('numero, cor')
        .eq('roleta_nome', roletaNome)
        .order('timestamp', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Calcular frequência de números
      const numberCounts = data.reduce((acc, item) => {
        if (!acc[item.numero]) {
          acc[item.numero] = {
            numero: item.numero,
            total: 0,
            cor: item.cor
          };
        }
        acc[item.numero].total += 1;
        return acc;
      }, {});
      
      const numberFrequency = Object.values(numberCounts).map(item => ({
        ...item,
        porcentagem: parseFloat((item.total * 100 / data.length).toFixed(1))
      })).sort((a, b) => b.total - a.total);
      
      return numberFrequency;
    } catch (error) {
      console.error('Erro ao buscar frequência de números:', error);
      throw error;
    }
  };
  
  // Função para detectar sequências atuais
  const detectCurrentStreak = async () => {
    try {
      const { data, error } = await supabase
        .from('roleta_numeros')
        .select('cor, paridade, dezena, numero')
        .eq('roleta_nome', roletaNome)
        .order('timestamp', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      if (!data || data.length === 0) return { type: null, count: 0 };
      
      // Verificar sequências de cor
      let colorStreak = 1;
      const firstColor = data[0].cor;
      for (let i = 1; i < data.length; i++) {
        if (data[i].cor === firstColor) {
          colorStreak++;
        } else {
          break;
        }
      }
      
      // Verificar sequências de paridade
      let parityStreak = 1;
      const firstParity = data[0].paridade;
      for (let i = 1; i < data.length; i++) {
        if (data[i].paridade === firstParity) {
          parityStreak++;
        } else {
          break;
        }
      }
      
      // Retornar a sequência mais longa
      if (colorStreak >= parityStreak) {
        return { type: 'cor', value: firstColor, count: colorStreak };
      } else {
        return { type: 'paridade', value: firstParity, count: parityStreak };
      }
    } catch (error) {
      console.error('Erro ao detectar sequências:', error);
      throw error;
    }
  };
  
  // Função para identificar dúzias ausentes
  const identifyMissingDozens = async () => {
    try {
      const { data, error } = await supabase
        .from('roleta_numeros')
        .select('dezena')
        .eq('roleta_nome', roletaNome)
        .order('timestamp', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      const dozens = ['primeira', 'segunda', 'terceira'];
      const result = [];
      
      for (const dozen of dozens) {
        const firstOccurrence = data.findIndex(item => item.dezena === dozen);
        
        result.push({
          dezena: dozen,
          ultima_aparicao: firstOccurrence >= 0 ? firstOccurrence + 1 : 0,
          ausencia: firstOccurrence >= 0 ? firstOccurrence : 100
        });
      }
      
      return result.sort((a, b) => b.ausencia - a.ausencia);
    } catch (error) {
      console.error('Erro ao identificar dúzias ausentes:', error);
      throw error;
    }
  };
  
  // Função para buscar todas as análises
  const fetchAllAnalytics = async () => {
    try {
      setAnalytics(prev => ({ ...prev, loading: true }));
      
      // Buscar todos os dados em paralelo
      const [colorDistribution, numberFrequency, currentStreak, missingDozens] = await Promise.all([
        fetchColorDistribution(),
        fetchNumberFrequency(),
        detectCurrentStreak(),
        identifyMissingDozens()
      ]);
      
      setAnalytics({
        colorDistribution,
        numberFrequency,
        currentStreak,
        missingDozens,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Erro ao buscar análises:', error);
      setAnalytics(prev => ({ 
        ...prev, 
        error: error.message || 'Erro ao buscar análises',
        loading: false 
      }));
    }
  };
  
  // Efeito para buscar dados iniciais e configurar subscription
  useEffect(() => {
    // Buscar dados iniciais
    fetchAllAnalytics();
    
    // Intervalo de refresh como fallback
    const interval = setInterval(fetchAllAnalytics, refreshInterval);
    
    // Configurar subscription do Supabase
    const subscription = supabase
      .channel('roleta_analytics_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'roleta_numeros',
        filter: 'roleta_nome=eq.' + roletaNome
      }, () => {
        // Atualizar análises quando novos números forem inseridos
        fetchAllAnalytics();
      })
      .subscribe();
    
    // Limpeza
    return () => {
      clearInterval(interval);
      supabase.removeChannel(subscription);
    };
  }, [roletaNome, refreshInterval]);
  
  return analytics;
} 