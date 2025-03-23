import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Componente mock que substitui a versão original de ProtectedRoute
 * Esta versão sempre permite o acesso às rotas protegidas
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Permitir acesso direto ao conteúdo sem verificação
  return <>{children}</>;
};

export default ProtectedRoute;
