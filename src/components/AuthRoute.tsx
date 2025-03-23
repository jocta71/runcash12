import React from 'react';

interface AuthRouteProps {
  children: React.ReactNode;
}

/**
 * Componente mock que substitui a versão original de AuthRoute
 * Esta versão sempre permite o acesso às rotas de autenticação
 */
const AuthRoute: React.FC<AuthRouteProps> = ({ children }) => {
  // Permitir acesso direto ao conteúdo sem verificação
  return <>{children}</>;
};

export default AuthRoute; 