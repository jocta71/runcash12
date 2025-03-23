import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { currentPlan, loading: subscriptionLoading } = useSubscription();
  const location = useLocation();

  // Páginas que não requerem plano ativo
  const planExemptRoutes = ['/planos', '/payment-success', '/payment-canceled', '/auth'];

  // Verificar se a rota atual está na lista de isentas
  const isExemptRoute = planExemptRoutes.some(route => location.pathname.startsWith(route));

  // Remover completamente a tela de carregamento
  if (authLoading || subscriptionLoading) {
    // Não mostrar nada durante o carregamento
    return null;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Verificar se o usuário tem um plano e redirecionar para a página de planos se necessário
  if (!currentPlan && !isExemptRoute) {
    return <Navigate to="/planos" replace />;
  }

  // Show children if authenticated and has a plan (or is on an exempt route)
  return <>{children}</>;
};

export default ProtectedRoute;
