import React, { createContext, useContext } from 'react';

interface User {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    avatar_url?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<{ error: any }>;
  signUp: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Criar usuário mock
const mockUser: User = {
  id: 'mock-user-id',
  email: 'user@example.com',
  user_metadata: {
    name: 'Usuário Demo',
    avatar_url: 'https://ui-avatars.com/api/?name=User&background=random'
  }
};

// Criar contexto com valor padrão
const AuthContext = createContext<AuthContextType>({
  user: mockUser,
  loading: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInWithGoogle: async () => {},
  signInWithGitHub: async () => {},
  signOut: async () => {}
});

/**
 * Provedor de autenticação mock que não depende do Supabase
 * Sempre fornece um usuário autenticado
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Implementações mock dos métodos de autenticação
  const signIn = async () => {
    console.log('[MOCK] Simulando login com sucesso');
    return { error: null };
  };

  const signUp = async () => {
    console.log('[MOCK] Simulando cadastro com sucesso');
    return { error: null };
  };

  const signInWithGoogle = async () => {
    console.log('[MOCK] Simulando login com Google');
  };

  const signInWithGitHub = async () => {
    console.log('[MOCK] Simulando login com GitHub');
  };

  const signOut = async () => {
    console.log('[MOCK] Simulando logout');
  };

  // Valor do contexto sempre fornece um usuário autenticado
  const value = {
    user: mockUser,
    loading: false,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook para usar o contexto de autenticação mock
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
