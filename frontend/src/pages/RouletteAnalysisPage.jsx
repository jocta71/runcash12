import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RoletaAnalyticsDashboard } from '@/components/RoletaAnalyticsDashboard';
import { LastNumbersRealtime } from '@/components/roulette/LastNumbersRealtime';

export function RouletteAnalysisPage() {
  const [selectedRoleta, setSelectedRoleta] = useState('');
  const [availableRoletas, setAvailableRoletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Buscar roletas disponíveis
  useEffect(() => {
    const fetchRoletas = async () => {
      try {
        const { data, error } = await supabase
          .from('roleta_numeros')
          .select('roleta_nome')
          .order('timestamp', { ascending: false });
          
        if (error) throw error;
        
        // Extrair nomes únicos de roletas
        const uniqueRoletas = Array.from(new Set(data.map(item => item.roleta_nome)));
        setAvailableRoletas(uniqueRoletas);
        
        // Selecionar a primeira roleta por padrão
        if (uniqueRoletas.length > 0 && !selectedRoleta) {
          setSelectedRoleta(uniqueRoletas[0]);
        }
      } catch (error) {
        console.error('Erro ao buscar roletas:', error);
        setError('Não foi possível carregar a lista de roletas.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoletas();
  }, [selectedRoleta]);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-[#00ff00] mb-6">Análise de Roletas</h1>
      
      {/* Seletor de roletas */}
      <div className="mb-8">
        <label htmlFor="roleta-select" className="block text-sm font-medium text-gray-300 mb-2">
          Selecione uma roleta:
        </label>
        <div className="relative">
          <select
            id="roleta-select"
            value={selectedRoleta}
            onChange={(e) => setSelectedRoleta(e.target.value)}
            className="block w-full md:w-64 bg-[#17161e] border border-[#00ff00]/30 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-[#00ff00] focus:border-[#00ff00]"
            disabled={loading || availableRoletas.length === 0}
          >
            {loading ? (
              <option>Carregando roletas...</option>
            ) : availableRoletas.length === 0 ? (
              <option>Nenhuma roleta disponível</option>
            ) : (
              availableRoletas.map(roleta => (
                <option key={roleta} value={roleta}>
                  {roleta}
                </option>
              ))
            )}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 20 20" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {/* Sem roleta selecionada */}
      {!selectedRoleta && !loading && !error && (
        <div className="bg-blue-500/20 border border-blue-500 text-blue-400 p-4 rounded-md mb-6">
          Selecione uma roleta para ver as análises.
        </div>
      )}
      
      {/* Conteúdo principal */}
      {selectedRoleta && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar com últimos números */}
          <div className="lg:col-span-3">
            <div className="bg-[#17161e] p-4 rounded-xl border border-white/10">
              <h2 className="text-xl font-semibold mb-4 text-white">Últimos Números</h2>
              <LastNumbersRealtime roletaNome={selectedRoleta} limit={30} />
            </div>
          </div>
          
          {/* Dashboard principal */}
          <div className="lg:col-span-9">
            <RoletaAnalyticsDashboard roletaNome={selectedRoleta} />
          </div>
        </div>
      )}
    </div>
  );
} 