import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CreditCard, Calendar, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Interface para os dados da assinatura
interface Subscription {
  id: string;
  plan_id: string;
  plan_type: string;
  status: string;
  start_date: string;
  next_billing_date: string;
  payment_provider: string;
  payment_id: string;
  start_date_formatted: string;
  next_billing_date_formatted: string;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/get-subscription?userId=${user.id}`);
        setSubscription(response.data);
      } catch (err: any) {
        console.error('Erro ao carregar assinatura:', err);
        
        // Ignorar erro 404 (sem assinatura) para não mostrar como erro
        if (err.response?.status !== 404) {
          setError(err.response?.data?.message || 'Erro ao carregar dados da assinatura');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  // Função para obter o nome amigável do plano
  const getPlanName = (planId: string) => {
    const plans = {
      'free': 'Gratuito',
      'basic': 'Básico',
      'pro': 'Profissional',
      'premium': 'Premium'
    };
    return plans[planId as keyof typeof plans] || planId;
  };

  // Função para obter a cor do status
  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'text-green-500',
      'pending': 'text-yellow-500',
      'canceled': 'text-red-500',
      'expired': 'text-gray-500'
    };
    return colors[status as keyof typeof colors] || 'text-gray-400';
  };

  // Função para obter o nome do provedor de pagamento
  const getPaymentProviderName = (provider: string) => {
    const providers = {
      'asaas': 'Asaas (PIX)',
      'stripe': 'Stripe',
      'manual': 'Manual',
      'free': 'Gratuito'
    };
    return providers[provider as keyof typeof providers] || provider;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Meu Perfil</h1>
      
      {/* Informações do usuário */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <CheckCircle className="mr-2 h-5 w-5 text-vegas-gold" /> 
          Informações Pessoais
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-400 mb-1">Nome</p>
            <p className="text-lg">{user?.user_metadata?.name || 'Nome não informado'}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">E-mail</p>
            <p className="text-lg">{user?.email || 'Email não informado'}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">ID do usuário</p>
            <p className="text-sm text-gray-400">{user?.id || 'ID não disponível'}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Conta criada em</p>
            <p className="text-sm text-gray-400">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Card da Assinatura */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <CreditCard className="mr-2 h-5 w-5 text-vegas-gold" /> 
          Minha Assinatura
        </h2>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-vegas-gold mb-4" />
            <p className="text-center text-gray-400">Carregando dados da assinatura...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : subscription ? (
          <div className="space-y-8">
            {/* Status da assinatura */}
            <div className="bg-gray-700/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-gray-400 mb-1">Plano atual</p>
                  <h3 className="text-2xl text-vegas-gold font-bold">{getPlanName(subscription.plan_id)}</h3>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 mb-1">Status</p>
                  <p className={`text-lg font-bold capitalize ${getStatusColor(subscription.status)}`}>
                    {subscription.status === 'active' ? 'Ativo' : 
                     subscription.status === 'pending' ? 'Pendente' : 
                     subscription.status === 'canceled' ? 'Cancelado' : 
                     subscription.status}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Data de início</p>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    <p>{subscription.start_date_formatted || 'Não disponível'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Próxima cobrança</p>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    <p>{subscription.next_billing_date_formatted || 'Não disponível'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Forma de pagamento</p>
                  <p>{getPaymentProviderName(subscription.payment_provider)}</p>
                </div>
              </div>
            </div>
            
            {/* Benefícios do plano */}
            <div>
              <h3 className="text-lg font-bold mb-3">Benefícios do seu plano</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subscription.plan_id === 'free' && (
                  <>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p>Acesso a 10 estatísticas básicas</p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p>Histórico de 7 dias</p>
                    </div>
                  </>
                )}
                
                {subscription.plan_id === 'basic' && (
                  <>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p>Acesso a 20 estatísticas</p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p>Histórico de 30 dias</p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p>Alertas personalizados</p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p>Suporte por email</p>
                    </div>
                  </>
                )}
                
                {subscription.plan_id === 'pro' && (
                  <>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p>Acesso a todas estatísticas</p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p>Histórico de 90 dias</p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p>Alertas personalizados avançados</p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p>Suporte prioritário</p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p>Análises preditivas</p>
                    </div>
                  </>
                )}
                
                {subscription.plan_id === 'premium' && (
                  <>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p>Acesso a todas estatísticas</p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p>Histórico ilimitado</p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p>Alertas premium</p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p>Suporte VIP 24/7</p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p>Análises avançadas e IA</p>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p>API de acesso aos dados</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Botão de gerenciamento */}
            <div className="flex justify-center mt-8">
              <Button 
                className="bg-vegas-gold hover:bg-yellow-600 text-black py-2 px-6 rounded font-medium"
                onClick={() => window.location.href = '/plans'}
              >
                {subscription.status === 'active' ? 'Alterar Plano' : 'Ver Planos Disponíveis'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-xl mb-6">Você ainda não possui um plano ativo.</p>
            <Button 
              className="bg-vegas-gold hover:bg-yellow-600 text-black py-2 px-6 rounded font-medium"
              onClick={() => window.location.href = '/plans'}
            >
              Ver Planos Disponíveis
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 