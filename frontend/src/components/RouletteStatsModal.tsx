import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { ChartBar, X, TrendingUp, BarChart, ArrowDown, ArrowUp, PercentIcon } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RouletteStatsModalProps {
  open: boolean;
  onClose: (open: boolean) => void;
  roletaNome: string;
  lastNumbers: number[];
  wins: number;
  losses: number;
}

// Função para obter dados históricos - retorna array vazio quando não há dados
const getHistoricalNumbers = () => {
  return [];
};

// Função para buscar números do banco para uma roleta específica
const fetchRouletteHistoricalNumbers = async (rouletteName: string) => {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] Buscando histórico para ${rouletteName}...`);
    
    // Primeiro obtemos o ID da roleta
    const idResponse = await fetch(
      `https://evzqzghxuttctbxgohpx.supabase.co/rest/v1/roletas?nome=eq.${encodeURIComponent(rouletteName)}&select=id`,
      {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2enF6Z2h4dXR0Y3RieGdvaHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzc5OTEsImV4cCI6MjA1Njc1Mzk5MX0.CmoM_y0i36nbBx2iN0DlOIob3yAgVRM1xY_XiOFBZLQ',
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!idResponse.ok) {
      throw new Error(`Erro ao buscar ID da roleta: ${idResponse.statusText}`);
    }
    
    const idData = await idResponse.json();
    if (!idData || idData.length === 0) {
      console.log(`[${new Date().toLocaleTimeString()}] Roleta não encontrada: ${rouletteName}`);
      return [];
    }
    
    const roletaId = idData[0].id;
    console.log(`[${new Date().toLocaleTimeString()}] ID da roleta ${rouletteName}: ${roletaId}`);
    
    // Agora buscamos até 500 números da tabela roleta_numeros
    const response = await fetch(
      `https://evzqzghxuttctbxgohpx.supabase.co/rest/v1/roleta_numeros?roleta_id=eq.${roletaId}&select=numero,timestamp&order=timestamp.desc&limit=500`,
      {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2enF6Z2h4dXR0Y3RieGdvaHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzc5OTEsImV4cCI6MjA1Njc1Mzk5MX0.CmoM_y0i36nbBx2iN0DlOIob3yAgVRM1xY_XiOFBZLQ',
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Falha ao buscar dados históricos');
    }
    
    const data = await response.json();
    console.log(`[${new Date().toLocaleTimeString()}] Resposta do Supabase para ${rouletteName}:`, data);
    
    if (data && Array.isArray(data) && data.length > 0) {
      console.log(`[${new Date().toLocaleTimeString()}] Dados históricos encontrados para ${rouletteName}: ${data.length} números`);
      
      // Extrair apenas os números e converter para inteiros se necessário
      const validNumbers = data
        .map(item => typeof item.numero === 'string' ? parseInt(item.numero, 10) : Number(item.numero))
        .filter(num => !isNaN(num) && num >= 0 && num <= 36);
      
      // Invertemos a ordem para ter do mais antigo para o mais recente
      const reversedNumbers = validNumbers.reverse();
      
      console.log(`[${new Date().toLocaleTimeString()}] Números válidos para ${rouletteName}: ${reversedNumbers.length}`);
      
      return reversedNumbers;
    } else {
      console.log(`[${new Date().toLocaleTimeString()}] Nenhum dado encontrado para ${rouletteName}`);
    }
    
    return [];
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Erro ao buscar números históricos:`, error);
    return [];
  }
};

// Generate frequency data for numbers
const generateFrequencyData = (numbers: number[]) => {
  const frequency: Record<number, number> = {};
  
  // Initialize all roulette numbers (0-36)
  for (let i = 0; i <= 36; i++) {
    frequency[i] = 0;
  }
  
  // Count frequency of each number
  numbers.forEach(num => {
    if (frequency[num] !== undefined) {
      frequency[num]++;
    }
  });
  
  // Convert to array format needed for charts
  return Object.keys(frequency).map(key => ({
    number: parseInt(key),
    frequency: frequency[parseInt(key)]
  })).sort((a, b) => a.number - b.number);
};

// Calculate hot and cold numbers
const getHotColdNumbers = (frequencyData: {number: number, frequency: number}[]) => {
  const sorted = [...frequencyData].sort((a, b) => b.frequency - a.frequency);
  return {
    hot: sorted.slice(0, 5),  // 5 most frequent
    cold: sorted.slice(-5).reverse()  // 5 least frequent
  };
};

// Generate pie chart data for number groups
const generateGroupDistribution = (numbers: number[]) => {
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const groups = [
    { name: "Vermelhos", value: 0, color: "#ef4444" },
    { name: "Pretos", value: 0, color: "#111827" },
    { name: "Zero", value: 0, color: "#059669" },
  ];
  
  numbers.forEach(num => {
    if (num === 0) {
      groups[2].value += 1;
    } else if (redNumbers.includes(num)) {
      groups[0].value += 1;
    } else {
      groups[1].value += 1;
    }
  });
  
  return groups;
};

// Gerar dados de média de cores por hora
const generateColorHourlyStats = (numbers: number[]) => {
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const total = numbers.length;
  
  // Contar números por cor
  const redCount = numbers.filter(num => redNumbers.includes(num)).length;
  const blackCount = numbers.filter(num => num !== 0 && !redNumbers.includes(num)).length;
  const zeroCount = numbers.filter(num => num === 0).length;
  
  // Calcular média por hora (assumindo que temos dados de uma hora)
  // Para um cenário real, usaríamos dados com timestamps
  const redAverage = parseFloat((redCount / (total / 60)).toFixed(2));
  const blackAverage = parseFloat((blackCount / (total / 60)).toFixed(2));
  const zeroAverage = parseFloat((zeroCount / (total / 60)).toFixed(2));
  
  return [
    {
      name: "Média de vermelhos por hora",
      value: redAverage,
      color: "#ef4444",
      total: redCount,
      percentage: parseFloat(((redCount / total) * 100).toFixed(2))
    },
    {
      name: "Média de pretos por hora",
      value: blackAverage,
      color: "#111827",
      total: blackCount,
      percentage: parseFloat(((blackCount / total) * 100).toFixed(2))
    },
    {
      name: "Média de brancos por hora",
      value: zeroAverage,
      color: "#059669",
      total: zeroCount,
      percentage: parseFloat(((zeroCount / total) * 100).toFixed(2))
    }
  ];
};

// Determine color for a roulette number
const getRouletteNumberColor = (num: number) => {
  if (num === 0) return "bg-vegas-green text-black";
  
  // Red numbers
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  
  if (redNumbers.includes(num)) {
    return "bg-red-600 text-white";
  } else {
    return "bg-black text-white";
  }
};

const RouletteStatsModal = ({ 
  open, 
  onClose, 
  roletaNome, 
  lastNumbers, 
  wins, 
  losses 
}: RouletteStatsModalProps) => {
  const [historicalNumbers, setHistoricalNumbers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadHistoricalData = async () => {
      if (open) {
        setIsLoading(true);
        
        try {
          console.log(`Buscando histórico para ${roletaNome}...`);
          let numbers = await fetchRouletteHistoricalNumbers(roletaNome);
          
          // Se houver lastNumbers nas props, garantir que eles estão incluídos no início do histórico
          if (lastNumbers && lastNumbers.length > 0) {
            // Combinar lastNumbers com os números históricos, removendo duplicatas
            const combinedNumbers = [...lastNumbers];
            numbers.forEach(num => {
              if (!combinedNumbers.includes(num)) {
                combinedNumbers.push(num);
              }
            });
            numbers = combinedNumbers;
          }
          
          if (numbers && numbers.length > 20) {
            console.log(`Encontrados ${numbers.length} números históricos para ${roletaNome}`);
            setHistoricalNumbers(numbers);
          } else {
            console.log(`Histórico insuficiente para ${roletaNome}, usando dados gerados`);
            setHistoricalNumbers(lastNumbers && lastNumbers.length > 0 ? lastNumbers : getHistoricalNumbers());
          }
        } catch (error) {
          console.error('Erro ao carregar dados históricos:', error);
          // Se falhar, usar os lastNumbers passados nas props ou gerar números aleatórios
          setHistoricalNumbers(lastNumbers && lastNumbers.length > 0 ? lastNumbers : getHistoricalNumbers());
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadHistoricalData();
  }, [open, roletaNome, lastNumbers]);
  
  const frequencyData = generateFrequencyData(historicalNumbers);
  const { hot, cold } = getHotColdNumbers(frequencyData);
  const pieData = generateGroupDistribution(historicalNumbers);
  const colorHourlyStats = generateColorHourlyStats(historicalNumbers);
  
  const winRate = (wins / (wins + losses)) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] md:max-w-[95vw] lg:max-w-[95vw] h-[95vh] max-h-[95vh] p-0 gap-0 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#00ff00] flex items-center text-xl md:text-2xl px-4 pt-4">
            <BarChart className="mr-3" /> Estatísticas da {roletaNome}
          </DialogTitle>
          <DialogDescription className="text-sm md:text-base px-4">
            {isLoading ? (
              "Carregando dados históricos..."
            ) : (
              `Análise detalhada dos últimos ${historicalNumbers.length} números e tendências`
            )}
          </DialogDescription>
        </DialogHeader>
        
        <DialogClose className="absolute right-4 md:right-6 top-4 md:top-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground text-[#00ff00]">
          <X className="h-6 w-6" />
          <span className="sr-only">Fechar</span>
        </DialogClose>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8 p-4 md:p-6 lg:p-8">
          {/* Historical Numbers Section */}
          <div className="p-4 md:p-6 rounded-lg border border-[#00ff00]/20 bg-vegas-black-light">
            <h3 className="text-[#00ff00] flex items-center text-base md:text-lg mb-3 font-bold">
              <BarChart className="mr-2 h-5 w-5" /> Histórico de Números (Mostrando: {Math.min(historicalNumbers.length, 500)})
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-15 xl:grid-cols-18 gap-2 max-h-[500px] overflow-y-auto p-3">
              {historicalNumbers.map((num, idx) => (
                <div 
                  key={idx} 
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold ${getRouletteNumberColor(num)}`}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>

          {/* Win Rate Chart */}
          <div className="glass-card p-4 md:p-6 space-y-3 md:space-y-5">
            <h3 className="text-lg md:text-xl font-semibold flex items-center">
              <PercentIcon size={20} className="text-[#00ff00] mr-2" /> Taxa de Vitória
            </h3>
            <div className="h-60 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Vitórias", value: wins },
                      { name: "Derrotas", value: losses }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    fill="#00ff00"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell key="wins" fill="#00ff00" />
                    <Cell key="losses" fill="#ef4444" />
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Frequency Chart */}
          <div className="glass-card p-4 md:p-6 space-y-3 md:space-y-5">
            <h3 className="text-lg md:text-xl font-semibold flex items-center">
              <ChartBar size={20} className="text-[#00ff00] mr-2" /> Frequência de Números
            </h3>
            <div className="h-60 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={frequencyData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="number" stroke="#ccc" tick={{fontSize: 12}} />
                  <YAxis stroke="#ccc" tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#222', borderColor: '#00ff00' }} 
                    labelStyle={{ color: '#00ff00' }}
                  />
                  <Bar dataKey="frequency" fill="#00ff00" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Distribution Pie Chart */}
          <div className="glass-card p-4 md:p-6 space-y-3 md:space-y-5">
            <h3 className="text-lg md:text-xl font-semibold flex items-center">
              <ChartBar size={20} className="text-[#00ff00] mr-2" /> Distribuição por Cor
            </h3>
            <div className="h-60 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#00ff00"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Hot & Cold Numbers */}
          <div className="glass-card p-4 md:p-6 space-y-3 md:space-y-5 col-span-1 lg:col-span-2 xl:col-span-3">
            <h3 className="text-lg md:text-xl font-semibold">Números Quentes & Frios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="p-4 md:p-5 bg-vegas-darkgray rounded-lg">
                <h4 className="text-base md:text-lg font-semibold flex items-center text-red-500 mb-3">
                  <ArrowUp size={18} className="mr-2" /> Números Quentes (Mais Frequentes)
                </h4>
                <div className="flex flex-wrap gap-3 md:gap-4">
                  {hot.map((item, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${getRouletteNumberColor(item.number)} flex items-center justify-center text-sm md:text-base font-medium`}>
                        {item.number}
                      </div>
                      <span className="text-vegas-gold text-sm md:text-base">({item.frequency}x)</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 md:p-5 bg-vegas-darkgray rounded-lg">
                <h4 className="text-base md:text-lg font-semibold flex items-center text-blue-500 mb-3">
                  <ArrowDown size={18} className="mr-2" /> Números Frios (Menos Frequentes)
                </h4>
                <div className="flex flex-wrap gap-3 md:gap-4">
                  {cold.map((item, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${getRouletteNumberColor(item.number)} flex items-center justify-center text-sm md:text-base font-medium`}>
                        {item.number}
                      </div>
                      <span className="text-vegas-gold text-sm md:text-base">({item.frequency}x)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Média de cores por hora */}
          <div className="glass-card p-4 md:p-6 space-y-3 md:space-y-5 col-span-1 lg:col-span-2 xl:col-span-3">
            <h3 className="text-lg md:text-xl font-semibold">Média de cores por hora</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {colorHourlyStats.map((stat, index) => (
                <div key={`color-stat-${index}`} className="bg-gray-100/10 rounded-md p-4">
                  <div className="flex items-center mb-2">
                    <div 
                      className="w-10 h-10 rounded-md mr-3 flex items-center justify-center" 
                      style={{ backgroundColor: stat.color === "#111827" ? "black" : stat.color }}
                    >
                      <div className="w-6 h-6 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                      <p className="text-base font-medium">{stat.name}</p>
                      <p className="text-sm text-gray-400">Total de {stat.total} <span className="bg-gray-800 text-sm px-2 py-0.5 rounded ml-1">{stat.percentage}%</span> {stat.color === "#ef4444" ? "vermelhos" : stat.color === "#111827" ? "pretos" : "brancos"} no dia selecionado</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RouletteStatsModal;

