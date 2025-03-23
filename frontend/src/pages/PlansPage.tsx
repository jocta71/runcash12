import { useState } from 'react';
import { useSubscription } from '@/context/SubscriptionContext';
import { PlanType } from '@/types/plans';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from '@/context/AuthContext';
import { PaymentForm } from '@/components/PaymentForm';

const PlansPage = () => {
  const { availablePlans, currentPlan, loading } = useSubscription();
  const { user } = useAuth();
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'annual'>('monthly');
  const { toast } = useToast();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  const handleSelectPlan = async (planId: string) => {
    // Se já for o plano atual, apenas mostrar mensagem
    if (currentPlan?.id === planId) {
      toast({
        title: "Plano já ativo",
        description: "Você já está inscrito neste plano.",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para assinar um plano.",
        variant: "destructive"
      });
      return;
    }
    
    // Mostrar formulário de pagamento
    setSelectedPlanId(planId);
    setShowPaymentForm(true);
  };
  
  const handlePaymentSuccess = () => {
    // Fechar o modal de pagamento
    setShowPaymentForm(false);
    setSelectedPlanId(null);
    
    // Mostrar mensagem de sucesso
    toast({
      title: "Assinatura realizada com sucesso!",
      description: "Seu plano foi atualizado e você já pode acessar todos os recursos.",
    });
    
    // Redirecionar para a página inicial após alguns segundos
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  };
  
  const handlePaymentCancel = () => {
    // Fechar o modal de pagamento
    setShowPaymentForm(false);
    setSelectedPlanId(null);
  };
  
  // Calcular preço anual (com desconto)
  const getAnnualPrice = (monthlyPrice: number) => {
    // 20% de desconto no plano anual
    return (monthlyPrice * 12 * 0.8).toFixed(2);
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Escolha o plano ideal para você</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Desbloqueie recursos avançados e melhore sua experiência de jogo com nossos planos premium.
          Cancele a qualquer momento.
        </p>
        
        {/* Alternar entre mensal e anual */}
        <div className="flex items-center justify-center mt-8 space-x-2">
          <div 
            className={`px-4 py-2 rounded-l-md cursor-pointer ${
              selectedInterval === 'monthly' 
                ? 'bg-vegas-gold text-black font-medium' 
                : 'bg-vegas-darkgray text-gray-300'
            }`}
            onClick={() => setSelectedInterval('monthly')}
          >
            Mensal
          </div>
          <div 
            className={`px-4 py-2 rounded-r-md cursor-pointer ${
              selectedInterval === 'annual' 
                ? 'bg-vegas-gold text-black font-medium' 
                : 'bg-vegas-darkgray text-gray-300'
            }`}
            onClick={() => setSelectedInterval('annual')}
          >
            Anual <span className="text-xs">(-20%)</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {availablePlans.map((plan) => {
          const isCurrentPlan = currentPlan?.id === plan.id;
          const displayPrice = selectedInterval === 'monthly' 
            ? plan.price 
            : getAnnualPrice(plan.price);
          
          return (
            <div 
              key={plan.id}
              className={`bg-vegas-darkgray rounded-xl overflow-hidden border ${
                isCurrentPlan 
                  ? 'border-vegas-gold' 
                  : 'border-gray-700'
              }`}
            >
              {/* Cabeçalho do plano */}
              <div className={`p-6 ${
                plan.type === PlanType.PREMIUM 
                  ? 'bg-gradient-to-r from-vegas-gold to-yellow-500' 
                  : 'bg-vegas-black'
              }`}>
                <h3 className={`text-xl font-bold ${
                  plan.type === PlanType.PREMIUM ? 'text-black' : 'text-white'
                }`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${
                  plan.type === PlanType.PREMIUM ? 'text-black/70' : 'text-gray-400'
                }`}>
                  {plan.description}
                </p>
              </div>
              
              {/* Preço */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-baseline">
                  {plan.type !== PlanType.FREE && (
                    <>
                      <span className="text-3xl font-bold">
                        R${displayPrice}
                      </span>
                      <span className="text-gray-400 ml-1 text-sm">
                        /{selectedInterval === 'monthly' ? 'mês' : 'ano'}
                      </span>
                    </>
                  )}
                  {plan.type === PlanType.FREE && (
                    <span className="text-3xl font-bold">Grátis</span>
                  )}
                </div>
                
                {/* Botão */}
                <Button 
                  className={`w-full mt-4 ${
                    plan.type === PlanType.PREMIUM 
                      ? 'bg-vegas-gold hover:bg-vegas-gold/80 text-black' 
                      : isCurrentPlan 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : ''
                  }`}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrentPlan || loading || processingPlan !== null}
                >
                  {isCurrentPlan ? (
                    'Plano Atual'
                  ) : processingPlan === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Selecionar Plano'
                  )}
                </Button>
              </div>
              
              {/* Lista de recursos */}
              <div className="p-6">
                <h4 className="font-medium mb-4">Inclui:</h4>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Badge do plano atual */}
              {isCurrentPlan && (
                <div className="bg-green-600 py-2 text-center text-sm font-medium">
                  Seu plano atual
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Informação sobre pagamentos */}
      <div className="max-w-7xl mx-auto mt-12 p-4 bg-vegas-darkgray rounded-lg border border-gray-700">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <AlertCircle className="h-4 w-4" />
          <p>
            Todos os pagamentos são processados de forma segura via Asaas. 
            Aceitamos pagamentos via PIX.
            Você pode cancelar sua assinatura a qualquer momento.
          </p>
        </div>
      </div>
      
      {/* Modal de pagamento */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="bg-vegas-black border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Assinar Plano</DialogTitle>
          </DialogHeader>
          
          {selectedPlanId && (
            <PaymentForm
              planId={selectedPlanId}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlansPage; 