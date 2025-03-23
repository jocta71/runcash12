import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plan, PlanType, UserSubscription } from '@/types/plans';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getStripeClient, createCheckoutSession } from '@/integrations/stripe/client';

// Lista de planos disponíveis
export const availablePlans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    type: PlanType.FREE,
    description: 'Acesso básico para experimentar a plataforma',
    price: 0,
    interval: 'monthly',
    features: [
      'Acesso a estatísticas básicas',
      'Visualização de até 5 roletas',
      'Atualizações a cada 10 minutos'
    ],
    allowedFeatures: ['view_basic_stats', 'view_limited_roulettes']
  },
  {
    id: 'basic',
    name: 'Básico',
    type: PlanType.BASIC,
    description: 'Plano ideal para iniciantes',
    price: 19.90,
    interval: 'monthly',
    features: [
      'Acesso a estatísticas padrão',
      'Visualização de até 15 roletas',
      'Atualizações a cada 5 minutos',
      'Suporte por email'
    ],
    allowedFeatures: ['view_basic_stats', 'view_standard_roulettes', 'email_support']
  },
  {
    id: 'pro',
    name: 'Profissional',
    type: PlanType.PRO,
    description: 'Para jogadores que querem levar o jogo a sério',
    price: 49.90,
    interval: 'monthly',
    features: [
      'Acesso a estatísticas avançadas',
      'Visualização de roletas ilimitadas',
      'Atualizações a cada 1 minuto',
      'Suporte prioritário',
      'Alertas personalizados'
    ],
    allowedFeatures: ['view_advanced_stats', 'view_unlimited_roulettes', 'priority_support', 'custom_alerts']
  },
  {
    id: 'premium',
    name: 'Premium',
    type: PlanType.PREMIUM,
    description: 'Experiência completa para profissionais',
    price: 99.90,
    interval: 'monthly',
    features: [
      'Acesso a estatísticas em tempo real',
      'Visualização de roletas ilimitadas',
      'Atualizações em tempo real',
      'Suporte VIP 24/7',
      'Alertas avançados personalizados',
      'Estratégias exclusivas',
      'Acesso antecipado a novas funcionalidades'
    ],
    allowedFeatures: [
      'view_realtime_stats', 
      'view_unlimited_roulettes', 
      'vip_support', 
      'advanced_alerts', 
      'exclusive_strategies', 
      'early_access'
    ]
  }
];

interface SubscriptionContextType {
  currentSubscription: UserSubscription | null;
  currentPlan: Plan | null;
  availablePlans: Plan[];
  loading: boolean;
  hasFeatureAccess: (featureId: string) => boolean;
  upgradePlan: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  loadUserSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para carregar a assinatura do usuário do Supabase
  const loadUserSubscription = async () => {
    // MODO TEMPORÁRIO: Sempre definir o plano gratuito para todos os usuários
    // Isso é uma solução temporária enquanto a tabela de assinaturas não está configurada
    
    // Encontrar o plano gratuito
    const freePlan = availablePlans.find(plan => plan.type === PlanType.FREE);
    
    // Se o usuário estiver logado, criar uma assinatura simulada
    if (user) {
      const mockSubscription: UserSubscription = {
        id: `temp-${user.id}`,
        userId: user.id,
        planId: 'free',
        planType: PlanType.FREE,
        startDate: new Date(),
        endDate: null,
        status: 'active',
      };
      
      setCurrentSubscription(mockSubscription);
    } else {
      setCurrentSubscription(null);
    }
    
    // Definir o plano gratuito para todos
    setCurrentPlan(freePlan || null);
    setLoading(false);
    
    // Log para indicar que estamos usando o modo temporário
    console.log('[ASSINATURA] Modo temporário ativado: todos os usuários têm plano gratuito');
  };

  // Carregar assinatura quando o usuário mudar
  useEffect(() => {
    loadUserSubscription();
  }, [user]);

  // Verificar se o usuário tem acesso a um recurso específico
  const hasFeatureAccess = (featureId: string): boolean => {
    if (!currentPlan) return false;
    return currentPlan.allowedFeatures.includes(featureId);
  };

  // Função para atualizar o plano - MODO TEMPORÁRIO
  const upgradePlan = async (planId: string): Promise<void> => {
    if (!user) {
      toast({
        title: "Erro ao atualizar plano",
        description: "Você precisa estar logado para atualizar seu plano.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Encontrar o plano selecionado
      const selectedPlan = availablePlans.find(p => p.id === planId);
      if (!selectedPlan) {
        throw new Error("Plano não encontrado");
      }

      // MODO TEMPORÁRIO: Exibir mensagem explicando a situação
      toast({
        title: "Funcionalidade temporariamente indisponível",
        description: "O sistema de assinaturas está em manutenção. Por enquanto, todos os usuários têm acesso ao plano gratuito.",
        duration: 5000,
      });

      // Simular um pequeno atraso para feedback visual
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Definir plano localmente (apenas para interface, sem persistência)
      // No modo temporário, sempre voltamos para o plano gratuito
      const freePlan = availablePlans.find(plan => plan.type === PlanType.FREE);
      setCurrentPlan(freePlan || null);
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast({
        title: "Erro ao processar pagamento",
        description: "Ocorreu um erro ao processar seu pagamento. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para cancelar assinatura - MODO TEMPORÁRIO
  const cancelSubscription = async (): Promise<void> => {
    if (!user) {
      toast({
        title: "Erro ao cancelar assinatura",
        description: "Você precisa estar logado para realizar esta ação.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // MODO TEMPORÁRIO: Exibir mensagem explicando a situação
      toast({
        title: "Funcionalidade temporariamente indisponível",
        description: "O sistema de assinaturas está em manutenção. Por enquanto, todos os usuários têm acesso ao plano gratuito.",
        duration: 5000,
      });

      // Simular um pequeno atraso para feedback visual
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // No modo temporário, não fazemos nada realmente, pois todos estão no plano gratuito
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      toast({
        title: "Erro ao cancelar assinatura",
        description: error.message || "Ocorreu um erro ao cancelar sua assinatura. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentSubscription,
    currentPlan,
    availablePlans,
    loading,
    hasFeatureAccess,
    upgradePlan,
    cancelSubscription,
    loadUserSubscription
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}; 