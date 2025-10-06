import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, Users, BarChart3, ShoppingCart } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ 
    username: "", 
    password: "", 
    displayName: ""
  });

  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerForm);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Neitansh Vendas</h1>
              <p className="text-muted-foreground">Sistema de Vendas Profissional</p>
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Entrar</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Registrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Entrar na sua conta</CardTitle>
                  <CardDescription>
                    Digite suas credenciais para acessar o sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Usuário</Label>
                      <Input
                        id="username"
                        type="text"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                        required
                        data-testid="input-username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                        data-testid="input-password"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Registrar novo usuário</CardTitle>
                  <CardDescription>
                    Crie sua conta para começar a usar o sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-username">Usuário</Label>
                      <Input
                        id="reg-username"
                        type="text"
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                        required
                        data-testid="input-register-username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Senha</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                        data-testid="input-register-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-display-name">Nome de Exibição</Label>
                      <Input
                        id="reg-display-name"
                        type="text"
                        value={registerForm.displayName}
                        onChange={(e) => setRegisterForm({ ...registerForm, displayName: e.target.value })}
                        required
                        data-testid="input-display-name"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending ? "Registrando..." : "Registrar"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="flex-1 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 flex items-center justify-center p-8 relative overflow-hidden">
        <div className="text-center z-10">
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            Gerencie suas vendas com facilidade
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-md">
            Sistema completo para controle de vendas, produtos e clientes com relatórios em tempo real.
          </p>
          
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="bg-card/80 backdrop-blur p-4 rounded-lg border border-border">
              <ShoppingCart className="w-8 h-8 text-primary mb-2 mx-auto" />
              <p className="text-sm font-medium">Vendas Rápidas</p>
            </div>
            <div className="bg-card/80 backdrop-blur p-4 rounded-lg border border-border">
              <Users className="w-8 h-8 text-accent mb-2 mx-auto" />
              <p className="text-sm font-medium">Clientes</p>
            </div>
            <div className="bg-card/80 backdrop-blur p-4 rounded-lg border border-border">
              <Store className="w-8 h-8 text-primary mb-2 mx-auto" />
              <p className="text-sm font-medium">Produtos</p>
            </div>
            <div className="bg-card/80 backdrop-blur p-4 rounded-lg border border-border">
              <BarChart3 className="w-8 h-8 text-accent mb-2 mx-auto" />
              <p className="text-sm font-medium">Relatórios</p>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
