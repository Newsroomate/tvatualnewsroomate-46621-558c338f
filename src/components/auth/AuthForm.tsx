
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const AuthForm = () => {
  const { signIn, signUp, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [activeTab, setActiveTab] = useState("login");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(email, password, fullName);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Sistema de Redação</CardTitle>
        <CardDescription>
          Entre com sua conta ou crie uma nova
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="register">Cadastrar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input 
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    autoComplete="current-password"
                    disabled={isLoading}
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleSignup}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input 
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="João Silva"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="registerEmail">Email</Label>
                  <Input 
                    id="registerEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="registerPassword">Senha</Label>
                  <Input 
                    id="registerPassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    autoComplete="new-password"
                    disabled={isLoading}
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        Sistema de Gerenciamento de Telejornal
      </CardFooter>
    </Card>
  );
};
