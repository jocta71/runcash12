import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  const [isResetPassword, setIsResetPassword] = useState(false);
  const { signIn, signUp, signInWithGoogle, signInWithGitHub, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect to home if already logged in
    if (user) {
      navigate('/');
    }
    
    // Check for password reset parameters in URL
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsResetPassword(true);
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          setErrorMessage('Email ou senha incorretos. Verifique suas credenciais.');
        } else if (error.message?.includes('Email not confirmed')) {
          setErrorMessage('Por favor, confirme seu email antes de fazer login.');
        } else {
          setErrorMessage(error.message || 'Erro ao fazer login. Tente novamente.');
        }
      } else {
        toast({
          title: "Login bem-sucedido",
          description: "Bem-vindo de volta!",
        });
        navigate('/');
      }
    } catch (err) {
      setErrorMessage('Ocorreu um erro inesperado. Tente novamente mais tarde.');
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    // Validar senha
    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }
    
    // Validar confirmação de senha
    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }
    
    try {
      const { error } = await signUp(email, password);
      if (error) {
        if (error.message?.includes('already registered')) {
          setErrorMessage('Este email já está registrado. Tente fazer login.');
        } else {
          setErrorMessage(error.message || 'Erro ao criar conta. Tente novamente.');
        }
      } else {
        toast({
          title: "Conta criada com sucesso",
          description: "Verifique seu email para confirmar a conta.",
        });
        setActiveTab('login');
      }
    } catch (err) {
      setErrorMessage('Ocorreu um erro inesperado. Tente novamente mais tarde.');
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      
      if (error) {
        setErrorMessage(error.message || 'Erro ao solicitar redefinição de senha.');
      } else {
        toast({
          title: "Email enviado",
          description: "Verifique seu email para redefinir sua senha.",
        });
        setIsResetPassword(false);
      }
    } catch (err) {
      setErrorMessage('Ocorreu um erro inesperado. Tente novamente mais tarde.');
      console.error("Password reset error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    // Validar senha
    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }
    
    // Validar confirmação de senha
    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        setErrorMessage(error.message || 'Erro ao atualizar senha.');
      } else {
        toast({
          title: "Senha atualizada",
          description: "Sua senha foi atualizada com sucesso.",
        });
        // Limpar hash da URL
        window.location.hash = '';
        setIsResetPassword(false);
        setActiveTab('login');
      }
    } catch (err) {
      setErrorMessage('Ocorreu um erro inesperado. Tente novamente mais tarde.');
      console.error("Set new password error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMessage('Erro ao fazer login com Google.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await signInWithGitHub();
    } catch (err) {
      setErrorMessage('Erro ao fazer login com GitHub.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Se estamos no fluxo de recuperação de senha
  if (isResetPassword) {
    // Verificar se estamos no passo de definir nova senha
    const isSettingNewPassword = window.location.hash && window.location.hash.includes('type=recovery');
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {isSettingNewPassword ? "Definir nova senha" : "Recuperar senha"}
            </CardTitle>
            <CardDescription>
              {isSettingNewPassword 
                ? "Digite sua nova senha"
                : "Enviaremos um link para redefinir sua senha"}
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={isSettingNewPassword ? handleSetNewPassword : handlePasswordReset}>
            <CardContent className="space-y-4 pt-4">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}
              
              {!isSettingNewPassword && (
                <div className="space-y-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Seu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              )}
              
              {isSettingNewPassword && (
                <>
                  <div className="space-y-2">
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Nova senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirmar nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSettingNewPassword 
                  ? "Definir nova senha" 
                  : "Enviar email de recuperação"}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setIsResetPassword(false);
                  window.location.hash = '';
                }}
              >
                Voltar para o login
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Bem-vindo</CardTitle>
          <CardDescription>
            Faça login ou crie uma conta para continuar
          </CardDescription>
        </CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Cadastro</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleSignIn}>
              <CardContent className="space-y-4 pt-4">
                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto font-normal text-sm text-right w-full"
                  onClick={() => setIsResetPassword(true)}
                >
                  Esqueceu sua senha?
                </Button>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
                
                <div className="flex items-center w-full gap-2 my-2">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">OU</span>
                  <Separator className="flex-1" />
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Entrar com Google
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleGitHubSignIn}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Entrar com GitHub
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4 pt-4">
                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirmar senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar conta
                </Button>
                
                <div className="flex items-center w-full gap-2 my-2">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">OU</span>
                  <Separator className="flex-1" />
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Cadastrar com Google
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleGitHubSignIn}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Cadastrar com GitHub
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AuthPage;
