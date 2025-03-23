import { useState } from 'react';
import seedRouletteNumbers from '@/integrations/supabase/seedRouletteNumbers';
import { Button } from '@/components/ui/button';

const SeedPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [numbersPerRoulette, setNumbersPerRoulette] = useState(20);

  const handleSeedNumbers = async () => {
    setIsLoading(true);
    setLogs(['Iniciando processo de população de números...']);

    // Sobrescrever a função console.log para capturar os logs
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = (...args) => {
      originalConsoleLog(...args);
      setLogs(prev => [...prev, args.join(' ')]);
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      setLogs(prev => [...prev, `ERRO: ${args.join(' ')}`]);
    };

    try {
      await seedRouletteNumbers(numbersPerRoulette);
      setLogs(prev => [...prev, 'Processo concluído com sucesso!']);
    } catch (error) {
      setLogs(prev => [...prev, `Erro ao executar script: ${error}`]);
    } finally {
      // Restaurar as funções originais do console
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-vegas-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#00ff00] mb-6">Ferramenta de População de Números das Roletas</h1>
        
        <div className="bg-[#17161e]/90 backdrop-filter backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configurações</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Números por roleta:
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={numbersPerRoulette}
                onChange={(e) => setNumbersPerRoulette(Number(e.target.value))}
                min="1"
                max="100"
                className="bg-[#1a1922] border border-white/10 rounded px-3 py-2 w-24 text-white"
              />
              <span className="text-sm text-gray-400">
                Defina quantos números serão inseridos para cada roleta existente.
              </span>
            </div>
          </div>
          
          <Button
            onClick={handleSeedNumbers}
            disabled={isLoading}
            className="bg-[#00ff00] hover:bg-[#00cc00] text-black font-medium py-2 px-4 rounded-md"
          >
            {isLoading ? 'Processando...' : 'Inserir Números'}
          </Button>
        </div>
        
        <div className="bg-[#17161e]/90 backdrop-filter backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Logs</h2>
          
          <div className="bg-black/50 rounded-md p-4 h-80 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">Nenhum log disponível. Clique em "Inserir Números" para iniciar.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log.includes('ERRO') ? (
                    <p className="text-red-400">{log}</p>
                  ) : (
                    <p className="text-green-400">{log}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6 text-sm text-gray-400">
          <p className="mb-2">
            <strong>Atenção:</strong> Este script insere números aleatórios para todas as roletas existentes na tabela 'roletas' do Supabase.
          </p>
          <p>O processo pode levar alguns minutos dependendo do número de roletas e da quantidade de números por roleta.</p>
        </div>
      </div>
    </div>
  );
};

export default SeedPage; 