import React from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';

interface RouletteTrendChartProps {
  data: { value: number }[];
  className?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value.toFixed(2);
    const isPositive = value >= 5;
    
    return (
      <div className="custom-tooltip bg-[#111827] p-1.5 text-xs border border-[#00ff00]/30 rounded-sm shadow-md">
        <p className={`font-medium ${isPositive ? 'text-[#00ff00]' : 'text-red-500'}`}>
          {value} {isPositive ? '↑' : '↓'}
        </p>
      </div>
    );
  }
  
  return null;
};

const RouletteTrendChart = ({ data, className = '' }: RouletteTrendChartProps) => {
  // Calcular médias móveis
  const enhancedData = data.map((item, index) => {
    // Média móvel simples de 5 períodos
    let sma5 = 0;
    if (index >= 4) {
      const last5 = data.slice(index - 4, index + 1);
      sma5 = last5.reduce((sum, item) => sum + item.value, 0) / 5;
    }
    
    return {
      ...item,
      sma5,
      // Adicionando indicadores de alta/baixa para criar a aparência de trading
      high: item.value + (Math.random() * 1.5),
      low: item.value - (Math.random() * 1.5),
      open: index > 0 ? data[index - 1].value : item.value - (Math.random() * 0.5),
      close: item.value
    };
  });
  
  // Calcular valor médio para usar como linha de referência
  const avgValue = data.reduce((sum, item) => sum + item.value, 0) / data.length;
  
  return (
    <div className={`h-12 w-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={enhancedData}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ff00" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#00ff00" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="2 2" 
            vertical={false} 
            stroke="#333"
            opacity={0.2}
          />
          
          <XAxis 
            dataKey="name" 
            hide={true}
            domain={['dataMin', 'dataMax']}
          />
          
          <YAxis 
            domain={['dataMin - 1', 'dataMax + 1']} 
            hide={true} 
            padding={{ top: 0, bottom: 0 }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Area
            type="monotone"
            dataKey="value"
            stroke="#00ff00"
            strokeWidth={1}
            fillOpacity={1}
            fill="url(#colorGradient)"
            dot={false}
            activeDot={{ r: 2, fill: '#00ff00', stroke: '#FFF' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RouletteTrendChart;
