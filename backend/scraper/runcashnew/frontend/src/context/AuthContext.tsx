import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Função para recuperar o estado de autenticação armazenado
    const checkAuthState = async () => {
      try {
        // Verificar se temos dados de usuário em sessionStorage
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          return; // Retorna imediatamente se temos dados em cache
        }

        // Apenas define loading=true se não temos dados em cache
        setLoading(true);
        
        // Verificar estado de autenticação no Supabase
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          const { user } = data.session;
          setUser(user);
          // Armazenar em sessionStorage para acesso rápido futuro
          sessionStorage.setItem('user', JSON.stringify(user));
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthState();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: "Login falhou",
        description: error.message || "Não foi possível fazer login. Verifique suas credenciais.",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log("Iniciando login com Google...");
      
      // Certifique-se de que esta URL corresponde exatamente à URL de redirecionamento 
      // configurada no console do Google Cloud
      const redirectTo = `${window.location.origin}/auth`;
      console.log("URL de redirecionamento configurada:", redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          }
        }
      });
      
      if (error) {
        console.error("Erro na autenticação com Google:", error);
        throw error;
      }
      
      if (data?.url) {
        console.log("Redirecionando para:", data.url);
        // Opcional: forçar a navegação para a URL de redirecionamento
        window.location.href = data.url;
      } else {
        console.warn("URL de redirecionamento não disponível");
      }
    } catch (error) {
      console.error('Erro detalhado ao fazer login com Google:', error);
      toast({
        title: "Login com Google falhou",
        description: error.message || "Não foi possível fazer login com Google. Verifique as configurações de OAuth.",
        variant: "destructive"
      });
    }
  };

  const signInWithGitHub = async () => {
    try {
      console.log("Iniciando login com GitHub...");
      
      const redirectTo = `${window.location.origin}/auth`;
      console.log("URL de redirecionamento configurada:", redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectTo
        }
      });
      
      if (error) {
        console.error("Erro na autenticação com GitHub:", error);
        throw error;
      }
      
      if (data?.url) {
        console.log("Redirecionando para:", data.url);
        // Opcional: forçar a navegação para a URL de redirecionamento
        window.location.href = data.url;
      } else {
        console.warn("URL de redirecionamento não disponível");
      }
    } catch (error) {
      console.error('Erro detalhado ao fazer login com GitHub:', error);
      toast({
        title: "Login com GitHub falhou",
        description: error.message || "Não foi possível fazer login com GitHub.",
        variant: "destructive"
      });
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      toast({
        title: "Cadastro realizado",
        description: "Verifique seu email para confirmar a conta.",
      });
      return { error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      toast({
        title: "Cadastro falhou",
        description: error.message || "Não foi possível criar a conta.",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Limpar o estado do usuário e sessão após logout
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Erro ao sair",
        description: "Não foi possível encerrar a sessão.",
        variant: "destructive"
      });
    }
  };

  const value = {
    session: null,
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
