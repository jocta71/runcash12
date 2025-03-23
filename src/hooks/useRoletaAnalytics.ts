import { useState, useEffect } from 'react';

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

/**
 * Versão mock do hook useRoletaAnalytics que não depende do Supabase
 * Fornece dados simulados para análises de roleta
 */
export function useRoletaAnalytics(roletaNome: string, refreshInterval: number = 15000) {
  const [analytics, setAnalytics] = useState<RoletaAnalytics>({
    colorDistribution: [],
    numberFrequency: [],
    currentStreak: { type: null, value: null, count: 0 },
    missingDozens: [],
    loading: true,
    error: null
  });
  
  // Função para gerar dados de distribuição de cores mock
  const generateMockColorDistribution = (): ColorDistribution[] => {
    return [
      { cor: 'vermelho', total: 48, porcentagem: 48.0 },
      { cor: 'preto', total: 46, porcentagem: 46.0 },
      { cor: 'verde', total: 6, porcentagem: 6.0 }
    ];
  };
  
  // Função para gerar dados de frequência de números mock
  const generateMockNumberFrequency = (): NumberFrequency[] => {
    const result: NumberFrequency[] = [];
    
    // Gerar dados para todos os números de 0 a 36
    for (let i = 0; i <= 36; i++) {
      // Determinar a cor do número
      let cor = 'verde';
      if (i > 0) {
        const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        cor = redNumbers.includes(i) ? 'vermelho' : 'preto';
      }
      
      // Gerar um valor aleatório para a frequência
      const total = Math.floor(Math.random() * 6) + 1; // 1-6
      
      result.push({
        numero: i,
        total,
        porcentagem: Number(((total / 100) * 100).toFixed(1)),
        cor
      });
    }
    
    // Ordenar por frequência (total) decrescente
    return result.sort((a, b) => b.total - a.total);
  };
  
  // Função para gerar dados de sequência atual mock
  const generateMockCurrentStreak = (): CurrentStreak => {
    const types = ['cor', 'paridade'];
    const values = ['vermelho', 'preto', 'par', 'ímpar'];
    
    const randomType = types[Math.floor(Math.random() * types.length)];
    let randomValue;
    
    if (randomType === 'cor') {
      randomValue = values[Math.floor(Math.random() * 2)]; // vermelho ou preto
    } else {
      randomValue = values[2 + Math.floor(Math.random() * 2)]; // par ou ímpar
    }
    
    return {
      type: randomType,
      value: randomValue,
      count: Math.floor(Math.random() * 5) + 1 // 1-5
    };
  };
  
  // Função para gerar dados de dúzias ausentes mock
  const generateMockMissingDozens = (): MissingDozen[] => {
    const dozens = ['primeira', 'segunda', 'terceira'];
    const result: MissingDozen[] = [];
    
    for (const dozen of dozens) {
      const ausencia = Math.floor(Math.random() * 20) + 1; // 1-20
      
      result.push({
        dezena: dozen,
        ultima_aparicao: ausencia,
        ausencia
      });
    }
    
    return result.sort((a, b) => b.ausencia - a.ausencia);
  };
  
  // Função principal para gerar todas as análises mock
  const generateMockAnalytics = () => {
    try {
      console.log(`[MOCK] Gerando dados de análise para roleta: ${roletaNome}`);
      
      setAnalytics({
        colorDistribution: generateMockColorDistribution(),
        numberFrequency: generateMockNumberFrequency(),
        currentStreak: generateMockCurrentStreak(),
        missingDozens: generateMockMissingDozens(),
        loading: false,
        error: null
      });
      
      console.log(`[MOCK] Dados de análise gerados com sucesso para: ${roletaNome}`);
    } catch (error: any) {
      console.error('[MOCK] Erro ao gerar análises:', error);
      setAnalytics(prev => ({ 
        ...prev, 
        error: error.message || 'Erro ao gerar análises', 
        loading: false 
      }));
    }
  };
  
  // Efeito para gerar dados iniciais e configurar interval para atualizações
  useEffect(() => {
    // Gerar dados iniciais
    generateMockAnalytics();
    
    // Intervalo de refresh para simular atualizações
    const interval = setInterval(generateMockAnalytics, refreshInterval);
    
    // Limpeza
    return () => {
      clearInterval(interval);
    };
  }, [roletaNome, refreshInterval]);
  
  return analytics;
} 