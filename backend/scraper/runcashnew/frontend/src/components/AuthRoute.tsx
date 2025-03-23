import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface AuthRouteProps {
  children: React.ReactNode;
}

/**
 * Componente para proteger a rota de autenticação
 * Redireciona para a página inicial se o usuário já estiver autenticado
 */
const AuthRoute = ({ children }: AuthRouteProps) => {
  const { user, loading } = useAuth();

  // Remover completamente a tela de carregamento
  if (loading) {
    // Não mostrar nada durante o carregamento
    return null;
  }

  // Redirecionar para a página inicial se já estiver autenticado
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Mostrar a página de autenticação se não estiver autenticado
  return <>{children}</>;
};

export default AuthRoute; 