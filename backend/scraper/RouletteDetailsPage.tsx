
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChartBar, ArrowLeft, TrendingUp, BarChart, ArrowDown, ArrowUp, PercentIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useAuth } from '@/context/AuthContext';

// Simulate historical data - in a real app this would come from an API
const generateHistoricalNumbers = () => {
  const numbers = [];
  for (let i = 0; i < 120; i++) {
    numbers.push(Math.floor(Math.random() * 37)); // 0-36 for roulette
  }
  return numbers;
};

// Generate frequency data for numbers
const generateFrequencyData = (numbers: number[]) => {
  const frequency: Record<number, number> = {};
  
  // Initialize all roulette numbers (0-36)
  for (let i = 0; i <= 36; i++) {
    frequency[i] = 0;
  }
  
  // Count occurrences
  numbers.forEach(num => {
    frequency[num] += 1;
  });
  
  // Convert to array for recharts
  return Object.entries(frequency).map(([number, count]) => ({
    number: Number(number),
    frequency: count,
  }));
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

const RouletteDetailsPage = () => {
  const { rouletteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Mock data - would be fetched from API in real app
  const name = rouletteId || "Roleta";
  const wins = 65;
  const losses = 35;
  const trend = Array.from({ length: 10 }, (_, i) => ({ value: Math.random() * 10 }));
  
  const historicalNumbers = generateHistoricalNumbers();
  const frequencyData = generateFrequencyData(historicalNumbers);
  const { hot, cold } = getHotColdNumbers(frequencyData);
  const pieData = generateGroupDistribution(historicalNumbers);
  
  const winRate = (wins / (wins + losses)) * 100;

  return (
    <div className="min-h-screen bg-vegas-black text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-2 text-gray-400 hover:text-white"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-[#00ff00] flex items-center">
            <BarChart className="mr-2" /> Estatísticas da {name}
          </h1>
        </div>
        
        <p className="text-gray-400 mb-8">
          Análise detalhada dos últimos 120 números e tendências
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
          {/* Historical Numbers Section */}
          <div className="glass-card p-4 md:p-6 space-y-4 rounded-lg border border-white/10 bg-[#17161e]/90">
            <h3 className="text-lg md:text-xl font-semibold flex items-center">
              <TrendingUp size={20} className="text-[#00ff00] mr-2" /> Últimos 120 Números
            </h3>
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-2 md:gap-3">
              {historicalNumbers.map((num, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 md:w-9 md:h-9 rounded-full ${getRouletteNumberColor(num)} flex items-center justify-center text-xs md:text-sm font-medium`}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>

          {/* Win Rate Chart */}
          <div className="glass-card p-4 md:p-6 space-y-4 rounded-lg border border-white/10 bg-[#17161e]/90">
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
                    innerRadius={60}
                    outerRadius={90}
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
          <div className="glass-card p-4 md:p-6 space-y-4 rounded-lg border border-white/10 bg-[#17161e]/90">
            <h3 className="text-lg md:text-xl font-semibold flex items-center">
              <ChartBar size={20} className="text-[#00ff00] mr-2" /> Frequência de Números
            </h3>
            <div className="h-60 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={frequencyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="number" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
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
          <div className="glass-card p-4 md:p-6 space-y-4 rounded-lg border border-white/10 bg-[#17161e]/90">
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
                    outerRadius={90}
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
          <div className="glass-card p-4 md:p-6 space-y-4 rounded-lg border border-white/10 bg-[#17161e]/90 col-span-1 lg:col-span-2">
            <h3 className="text-lg md:text-xl font-semibold">Números Quentes & Frios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="p-4 bg-vegas-darkgray rounded-lg">
                <h4 className="text-md md:text-lg font-semibold flex items-center text-red-500 mb-3">
                  <ArrowUp size={16} className="mr-2" /> Números Quentes (Mais Frequentes)
                </h4>
                <div className="flex flex-wrap gap-2 md:gap-3">
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
              
              <div className="p-4 bg-vegas-darkgray rounded-lg">
                <h4 className="text-md md:text-lg font-semibold flex items-center text-blue-500 mb-3">
                  <ArrowDown size={16} className="mr-2" /> Números Frios (Menos Frequentes)
                </h4>
                <div className="flex flex-wrap gap-2 md:gap-3">
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
        </div>
        
        <div className="flex justify-center mt-8">
          <Button 
            className="w-full max-w-md text-black font-medium animate-pulse-neon bg-gradient-to-b from-[#00ff00] to-[#8bff00] hover:from-[#00ff00]/90 hover:to-[#8bff00]/90 text-base"
          >
            Ir para a Roleta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RouletteDetailsPage;
