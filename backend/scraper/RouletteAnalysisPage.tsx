import React, { useState, useEffect } from 'react';
import { RoletaAnalyticsDashboard } from '@/components/RoletaAnalyticsDashboard';
import { supabase } from '@/integrations/supabase/client';

interface Roleta {
  nome: string;
  provedor: string;
  tipo: string;
}

export const RouletteAnalysisPage: React.FC = () => {
  const [selectedRoleta, setSelectedRoleta] = useState<string>('');
  const [roletas, setRoletas] = useState<Roleta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Buscar roletas disponíveis
  useEffect(() => {
    const fetchRoletas = async () => {
      try {
        // Verificar roletas cadastradas na tabela roletas
        const { data: roletasData, error: roletasError } = await supabase
          .from('roletas')
          .select('nome, provedor, tipo')
          .eq('ativa', true);

        if (roletasError) throw roletasError;

        // Se não houver roletas cadastradas, buscar as disponíveis na tabela de números
        if (!roletasData || roletasData.length === 0) {
          const { data: distinctRoletas, error: distinctError } = await supabase
            .from('roleta_numeros')
            .select('roleta_nome')
            .limit(100);

          if (distinctError) throw distinctError;

          // Extrair nomes únicos
          const uniqueNames = [...new Set(distinctRoletas.map(r => r.roleta_nome))];
          
          // Transformar em objetos para exibição
          const formattedRoletas = uniqueNames.map(nome => ({
            nome,
            provedor: 'Desconhecido',
            tipo: 'Automática'
          }));

          setRoletas(formattedRoletas);
          
          // Selecionar a primeira roleta automaticamente
          if (formattedRoletas.length > 0) {
            setSelectedRoleta(formattedRoletas[0].nome);
          }
        } else {
          setRoletas(roletasData);
          
          // Selecionar a primeira roleta automaticamente
          if (roletasData.length > 0) {
            setSelectedRoleta(roletasData[0].nome);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar roletas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoletas();
  }, []);

  // Seletor de roletas
  const RoletaSelector = () => (
    <div className="mb-6">
      <label htmlFor="roleta-select" className="block text-sm font-medium text-gray-300 mb-2">
        Selecione a Roleta
      </label>
      <select
        id="roleta-select"
        value={selectedRoleta}
        onChange={(e) => setSelectedRoleta(e.target.value)}
        className="w-full md:w-64 bg-[#17161e] text-white border border-gray-700 rounded-lg p-2.5 focus:ring-[#00ff00]/50 focus:border-[#00ff00]/50"
      >
        {roletas.map((roleta) => (
          <option key={roleta.nome} value={roleta.nome}>
            {roleta.nome} ({roleta.provedor})
          </option>
        ))}
      </select>
    </div>
  );

  // Estado de carregamento
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-[#00ff00] mb-8">Análise de Roletas</h1>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-700 rounded w-64 mb-8"></div>
          <div className="h-96 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Se não houver roletas disponíveis
  if (roletas.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-[#00ff00] mb-8">Análise de Roletas</h1>
        <div className="p-6 bg-[#1a1922] rounded-xl border border-yellow-500/20">
          <h2 className="text-xl font-bold text-white mb-2">Nenhuma roleta disponível</h2>
          <p className="text-gray-300">
            Não foram encontradas roletas para análise no banco de dados. Certifique-se de que o scraper está ativo e coletando dados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-[#00ff00] mb-8">Análise de Roletas</h1>
      
      <RoletaSelector />
      
      {selectedRoleta && (
        <RoletaAnalyticsDashboard roletaNome={selectedRoleta} />
      )}
    </div>
  );
};

export default RouletteAnalysisPage; 