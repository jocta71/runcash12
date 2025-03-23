import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const PaymentCanceled = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    // Mostrar mensagem de cancelamento
    toast({
      title: "Pagamento cancelado",
      description: "O processo de pagamento foi cancelado. Nenhuma cobrança foi realizada.",
    });
    
    // Redirecionar após alguns segundos
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [navigate, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-vegas-dark">
      <div className="bg-vegas-darkgray p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gray-600 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Pagamento Cancelado</h2>
        <p className="text-gray-300 mb-6">
          O processo de pagamento foi cancelado. Nenhuma cobrança foi realizada em seu cartão.
        </p>
        <div className="w-full bg-vegas-black rounded-md p-4 mb-6">
          <p className="text-gray-400 text-sm">
            Você pode tentar novamente ou escolher outro método de pagamento quando estiver pronto.
          </p>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Você será redirecionado para a página inicial em alguns segundos...
        </p>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/')}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-md flex-1"
          >
            Voltar para a página inicial
          </button>
          <button 
            onClick={() => navigate('/planos')}
            className="bg-vegas-gold hover:bg-vegas-gold/80 text-black font-medium py-2 px-6 rounded-md flex-1"
          >
            Ver planos
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCanceled; 