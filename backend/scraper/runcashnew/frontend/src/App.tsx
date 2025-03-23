import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import PlansPage from "./pages/PlansPage";
import ProfilePage from "./pages/ProfilePage";
import SeedPage from "./pages/SeedPage";
import { AuthProvider } from "./context/AuthContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRoute from "./components/AuthRoute";
import { RouletteAnalysisPage } from '@/pages/RouletteAnalysisPage';
import { useState } from "react";

// Configuração melhorada do QueryClient para evitar recarregamentos desnecessários
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Aumentar o stale time para reduzir recarregamentos desnecessários
      staleTime: 5 * 60 * 1000, // 5 minutos
      // Manter dados no cache mesmo se não estiverem sendo usados (ex: quando você volta para a página)
      cacheTime: 10 * 60 * 1000, // 10 minutos
      // Não refetch automaticamente quando a janela recupera o foco
      refetchOnWindowFocus: false,
      // Não refetch quando você volta para a página
      refetchOnMount: false,
      // Evita refetch ao reconectar
      refetchOnReconnect: false,
    },
  },
});

const App = () => {
  // Criar uma única instância do QueryClient que seja mantida mesmo após re-renders
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Rota pública - apenas para não-autenticados */}
                <Route path="/auth" element={
                  <AuthRoute>
                    <AuthPage />
                  </AuthRoute>
                } />
                
                {/* Página para popular números das roletas */}
                <Route path="/seed-numbers" element={<SeedPage />} />
                
                {/* Rotas protegidas - apenas para usuários autenticados */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                
                {/* Rotas relacionadas a planos e pagamentos */}
                <Route path="/planos" element={
                  <ProtectedRoute>
                    <PlansPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/payment-success" element={
                  <ProtectedRoute>
                    <PaymentSuccess />
                  </ProtectedRoute>
                } />
                
                <Route path="/payment-canceled" element={
                  <ProtectedRoute>
                    <PaymentCanceled />
                  </ProtectedRoute>
                } />
                
                {/* Rota de perfil do usuário */}
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                
                {/* Rota para página não encontrada - também protegida */}
                <Route path="*" element={
                  <ProtectedRoute>
                    <NotFound />
                  </ProtectedRoute>
                } />

                {/* Adicionar a nova rota para a página de análise */}
                <Route path="/analise" element={<RouletteAnalysisPage />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
