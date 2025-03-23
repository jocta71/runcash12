import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ColorDistribution {
  cor: string;
  total: number;
  porcentagem: number;
}

export interface NumberFrequency {
  numero: number;
  total: number;
  porcentagem: number;
  cor: string;
}

export interface CurrentStreak {
  type: string | null;
  value: string | null;
  count: number;
}

export interface MissingDozen {
  dezena: string;
  ultima_aparicao: number;
  ausencia: number;
}

export interface RoletaAnalytics {
  colorDistribution: ColorDistribution[];
  numberFrequency: NumberFrequency[];
  currentStreak: CurrentStreak;
  missingDozens: MissingDozen[];
  loading: boolean;
  error: string | null;
}

export function useRoletaAnalytics(roletaNome: string, refreshInterval: number = 15000) {
  const [analytics, setAnalytics] = useState<RoletaAnalytics>({
    colorDistribution: [],
    numberFrequency: [],
    currentStreak: { type: null, value: null, count: 0 },
    missingDozens: [],
    loading: true,
    error: null
  });
  
  // Função para buscar a distribuição de cores
  const fetchColorDistribution = async () => {
    try {
      const { data, error } = await supabase
        .from('roleta_numeros')
        .select('cor')
        .eq('roleta_nome', roletaNome)
        .order('timestamp', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      
      // Calcular distribuição
      const distribution: Record<string, number> = {};
      data.forEach(item => {
        distribution[item.cor] = (distribution[item.cor] || 0) + 1;
      });
      
      const result = Object.entries(distribution).map(([cor, total]) => ({
        cor,
        total,
        porcentagem: Number(((total / data.length) * 100).toFixed(1))
      }));
      
      return result;
    } catch (error: any) {
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
      
      // Calcular frequência
      const frequency: Record<number, { total: number, cor: string }> = {};
      data.forEach(item => {
        if (!frequency[item.numero]) {
          frequency[item.numero] = { total: 0, cor: item.cor };
        }
        frequency[item.numero].total++;
      });
      
      const result = Object.entries(frequency).map(([numero, { total, cor }]) => ({
        numero: Number(numero),
        total,
        porcentagem: Number(((total / data.length) * 100).toFixed(1)),
        cor
      }));
      
      return result.sort((a, b) => b.total - a.total);
    } catch (error: any) {
      console.error('Erro ao buscar frequência de números:', error);
      throw error;
    }
  };
  
  // Função para detectar sequências atuais
  const detectCurrentStreak = async () => {
    try {
      const { data, error } = await supabase
        .from('roleta_numeros')
        .select('numero, cor, paridade')
        .eq('roleta_nome', roletaNome)
        .order('timestamp', { ascending: false })
        .limit(20);
        
      if (error) throw error;
      if (!data.length) return { type: null, value: null, count: 0 };
      
      // Verificar sequência de cor
      let colorStreak = 1;
      const firstColor = data[0].cor;
      for (let i = 1; i < data.length; i++) {
        if (data[i].cor === firstColor) {
          colorStreak++;
        } else {
          break;
        }
      }
      
      // Verificar sequência de paridade
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
    } catch (error: any) {
      console.error('Erro ao detectar sequência atual:', error);
      throw error;
    }
  };
  
  // Função para verificar dúzias ausentes
  const checkMissingDozens = async () => {
    try {
      const { data, error } = await supabase
        .from('roleta_numeros')
        .select('numero, dezena')
        .eq('roleta_nome', roletaNome)
        .order('timestamp', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      
      const dozens = ['primeira', 'segunda', 'terceira'];
      const result: MissingDozen[] = [];
      
      for (const dozen of dozens) {
        const index = data.findIndex(item => item.dezena === dozen);
        
        result.push({
          dezena: dozen,
          ultima_aparicao: index >= 0 ? index + 1 : 0,
          ausencia: index >= 0 ? index : 100
        });
      }
      
      return result.sort((a, b) => b.ausencia - a.ausencia);
    } catch (error: any) {
      console.error('Erro ao verificar dúzias ausentes:', error);
      throw error;
    }
  };
  
  // Função principal para buscar todas as análises
  const fetchAnalytics = async () => {
    try {
      const [colors, numbers, streak, dozens] = await Promise.all([
        fetchColorDistribution(),
        fetchNumberFrequency(),
        detectCurrentStreak(),
        checkMissingDozens()
      ]);
      
      setAnalytics({
        colorDistribution: colors,
        numberFrequency: numbers,
        currentStreak: streak,
        missingDozens: dozens,
        loading: false,
        error: null
      });
    } catch (error: any) {
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
    fetchAnalytics();
    
    // Intervalo de refresh como fallback
    const interval = setInterval(fetchAnalytics, refreshInterval);
    
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
        fetchAnalytics();
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