
import { useEffect, useState } from "react";
import { TrendingUp, Star, Award, Users } from "lucide-react";

interface Insight {
  icon: JSX.Element;
  text: string;
  color: string;
}

const insights: Insight[] = [
  { 
    icon: <TrendingUp size={14} />, 
    text: "Roleta Brasileira em alta: 78% de vitórias hoje", 
    color: "text-[#00ff00]" 
  },
  { 
    icon: <Star size={14} />, 
    text: "Números quentes: 7, 11, 23", 
    color: "text-[#00ff00]" 
  },
  { 
    icon: <Award size={14} />, 
    text: "Maior sequência de vitórias: 9", 
    color: "text-[#00ff00]" 
  },
  { 
    icon: <Users size={14} />, 
    text: "2,458 jogadores online agora", 
    color: "text-[#00ff00]" 
  },
];

const AnimatedInsights = () => {
  const [currentInsight, setCurrentInsight] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % insights.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center overflow-hidden mx-4 h-full relative">
      {insights.map((insight, index) => (
        <div
          key={index}
          className={`flex items-center gap-1.5 whitespace-nowrap absolute transition-all duration-700 transform ${
            index === currentInsight
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <span className={`${insight.color}`}>{insight.icon}</span>
          <span className="text-xs font-medium">{insight.text}</span>
        </div>
      ))}
    </div>
  );
};

export default AnimatedInsights;
