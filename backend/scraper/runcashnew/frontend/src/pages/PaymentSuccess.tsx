import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock } from 'lucide-react';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isFree, setIsFree] = useState(false);
  
  useEffect(() => {
    // Verificar se é um plano gratuito através da URL
    const params = new URLSearchParams(location.search);
    setIsFree(params.get('free') === 'true');
    
    // Redirecionar para a página inicial após 10 segundos para planos gratuitos
    if (params.get('free') === 'true') {
      const timer = setTimeout(() => {
        navigate('/');
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);
  
  return (
    <div className="container mx-auto py-16 px-4 flex flex-col items-center">
      <div className="max-w-2xl w-full text-center p-8 bg-gray-800 rounded-lg shadow-lg">
        {isFree ? (
          <>
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
            <h1 className="text-3xl font-bold mb-4">Plano Gratuito Ativado!</h1>
            <p className="text-xl text-gray-300 mb-8">
              Sua assinatura do plano gratuito foi ativada com sucesso.
              Você já pode começar a usar todos os recursos incluídos.
            </p>
            <p className="text-gray-400 mb-8">
              Você será redirecionado para a página inicial em alguns segundos...
            </p>
          </>
        ) : (
          <>
            <Clock className="mx-auto h-16 w-16 text-vegas-gold mb-6" />
            <h1 className="text-3xl font-bold mb-4">Estamos processando seu pagamento!</h1>
            <p className="text-xl text-gray-300 mb-4">
              O QR Code do PIX foi gerado e está aguardando seu pagamento.
            </p>
            <div className="bg-gray-700 p-4 rounded-md mb-8">
              <p className="text-gray-300">
                Assim que o pagamento for confirmado, sua assinatura será ativada automaticamente.
                Este processo geralmente leva apenas alguns minutos.
              </p>
            </div>
            <p className="text-gray-400 mb-4">
              Verifique no seu aplicativo de banco se o pagamento PIX foi concluído com sucesso.
            </p>
            <p className="text-gray-400 mb-8">
              Se você fechou a janela de pagamento, pode acessar seu perfil a qualquer momento para visualizar ou gerenciar sua assinatura.
            </p>
          </>
        )}
        
        <Button 
          className="bg-vegas-gold hover:bg-yellow-600 text-black font-medium"
          onClick={() => navigate('/')}
        >
          Voltar para a página inicial
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccess; 