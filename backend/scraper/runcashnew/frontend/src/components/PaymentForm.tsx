import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { createAsaasCustomer, createAsaasSubscription } from '@/integrations/asaas/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Função para formatar CPF
const formatCPF = (value: string) => {
  // Remove todos os caracteres não numéricos
  const cleanValue = value.replace(/\D/g, '');
  
  // Aplica a máscara do CPF: XXX.XXX.XXX-XX
  if (cleanValue.length <= 3) {
    return cleanValue;
  } else if (cleanValue.length <= 6) {
    return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3)}`;
  } else if (cleanValue.length <= 9) {
    return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6)}`;
  } else {
    return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6, 9)}-${cleanValue.slice(9, 11)}`;
  }
};

// Função para formatar telefone
const formatPhone = (value: string) => {
  // Remove todos os caracteres não numéricos
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length <= 2) {
    return cleanValue;
  } else if (cleanValue.length <= 7) {
    return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`;
  } else {
    return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7, 11)}`;
  }
};

interface PaymentFormProps {
  planId: string;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export const PaymentForm = ({ planId, onPaymentSuccess, onCancel }: PaymentFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
    cpf: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Limpa qualquer erro anterior quando o usuário começa a editar o formulário
    if (error) setError(null);
    
    const { name, value } = e.target;
    
    if (name === 'cpf') {
      setFormData(prev => ({ ...prev, [name]: formatCPF(value) }));
    } else if (name === 'phone') {
      setFormData(prev => ({ ...prev, [name]: formatPhone(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!user) {
      setError("Você precisa estar logado para assinar um plano.");
      return;
    }
    
    if (!formData.name || !formData.email || !formData.cpf) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    
    // Validação simples de CPF (remover formatação e verificar tamanho)
    const cpfClean = formData.cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      setError("Por favor, insira um CPF válido com 11 dígitos.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Iniciando criação de cliente no Asaas...');
      // Passo 1: Criar ou recuperar cliente no Asaas
      const customerId = await createAsaasCustomer({
        name: formData.name,
        email: formData.email,
        cpfCnpj: cpfClean,
        mobilePhone: formData.phone.replace(/\D/g, '')
      });
      
      console.log('Cliente criado/recuperado com ID:', customerId);
      
      // Passo 2: Criar assinatura
      console.log('Criando assinatura para o cliente...');
      const { redirectUrl } = await createAsaasSubscription(
        planId, 
        user.id,
        customerId
      );
      
      console.log('Assinatura criada, redirecionando para:', redirectUrl);
      
      // Se for plano gratuito, concluir diretamente
      if (planId === 'free' || redirectUrl.includes('free=true')) {
        toast({
          title: "Plano ativado com sucesso!",
          description: "Seu plano gratuito foi ativado com sucesso.",
        });
        onPaymentSuccess();
      } else {
        // Para planos pagos, abrir a página de pagamento do Asaas em nova janela
        toast({
          title: "Redirecionando para pagamento",
          description: "Uma nova janela foi aberta para concluir o pagamento via PIX.",
        });
        
        // Abrir em nova janela para não perder o contexto atual
        window.open(redirectUrl, '_blank');
        
        // Mostrar link de backup caso o popup seja bloqueado
        setError(
          `Se a janela de pagamento não abrir, clique neste link: ` + 
          `<a href="${redirectUrl}" target="_blank" class="text-blue-400 underline">Abrir página de pagamento</a>`
        );
      }
    } catch (error) {
      console.error('Erro no processo de assinatura:', error);
      
      // Exibir mensagem de erro detalhada
      let errorMessage = "Ocorreu um erro ao processar sua assinatura.";
      
      if (error instanceof Error) {
        setError(`${errorMessage} ${error.message}`);
        
        // Mostrar diferentes mensagens dependendo do erro
        if (error.message.includes('405')) {
          setError("Erro na comunicação com a API de pagamento. Por favor, entre em contato com o suporte.");
        } else if (error.message.includes('Network Error')) {
          setError("Erro de conexão. Verifique sua internet e tente novamente.");
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full p-6 mx-auto rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">Complete seus dados de pagamento</h2>
      <p className="text-gray-400 mb-4">
        O pagamento será processado via PIX através da plataforma Asaas
      </p>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription dangerouslySetInnerHTML={{ __html: error }} />
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
            Nome completo *
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Seu nome completo"
            className="w-full bg-vegas-black border-gray-700"
            required
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            E-mail *
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="seu@email.com"
            className="w-full bg-vegas-black border-gray-700"
            required
          />
        </div>
        
        <div>
          <label htmlFor="cpf" className="block text-sm font-medium text-gray-300 mb-1">
            CPF *
          </label>
          <Input
            id="cpf"
            name="cpf"
            value={formData.cpf}
            onChange={handleChange}
            placeholder="XXX.XXX.XXX-XX"
            maxLength={14}
            className="w-full bg-vegas-black border-gray-700"
            required
          />
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
            Telefone
          </label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(XX) XXXXX-XXXX"
            maxLength={15}
            className="w-full bg-vegas-black border-gray-700"
          />
        </div>
        
        <div className="pt-2 flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            className="flex-1 bg-vegas-gold hover:bg-vegas-gold/80 text-black"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Continuar para pagamento'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}; 