import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import PlansPage from "./pages/PlansPage";
import ProfilePage from "./pages/ProfilePage";
import SeedPage from "./pages/SeedPage";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { RouletteAnalysisPage } from '@/pages/RouletteAnalysisPage';
import { useState } from "react";

// Configuração melhorada do QueryClient para evitar recarregamentos desnecessários
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Aumentar o stale time para reduzir recarregamentos desnecessários
      staleTime: 5 * 60 * 1000, // 5 minutos
      // Manter dados no cache mesmo se não estiverem sendo usados (ex: quando você volta para a página)
      gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)
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
      <SubscriptionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Rota de autenticação */}
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Página para popular números das roletas */}
              <Route path="/seed-numbers" element={<SeedPage />} />
              
              {/* Rota principal (com dados reais do MongoDB) */}
              <Route path="/" element={<Index />} />
              
              {/* Rotas relacionadas a planos e pagamentos */}
              <Route path="/planos" element={<PlansPage />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-canceled" element={<PaymentCanceled />} />
              
              {/* Rota de perfil do usuário */}
              <Route path="/profile" element={<ProfilePage />} />
              
              {/* Rota para página não encontrada */}
              <Route path="*" element={<NotFound />} />

              {/* Rota para página de análise */}
              <Route path="/analise" element={<RouletteAnalysisPage />} />
              
              {/* Redirecionamento da antiga rota de tempo real para a página principal */}
              <Route path="/realtime" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SubscriptionProvider>
    </QueryClientProvider>
  );
};

export default App;
