import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { translateAuthError } from "@/utils/auth-error-utils";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Supabase coloca os tokens no hash da URL após o redirect do email.
    // O cliente processa automaticamente e dispara PASSWORD_RECOVERY.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true);
        setChecking(false);
      }
    });

    // Caso o evento já tenha sido disparado, verifica a sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      const hash = window.location.hash;
      if (session && (hash.includes("type=recovery") || hash.includes("access_token"))) {
        setIsValidSession(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "Confirme a mesma senha nos dois campos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      toast({
        title: "Erro ao redefinir senha",
        description: translateAuthError(error.message),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Senha redefinida",
      description: "Sua senha foi atualizada com sucesso.",
    });

    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-muted">
      <div className="w-full max-w-md px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Redefinir senha</CardTitle>
            <CardDescription>
              {isValidSession
                ? "Digite sua nova senha abaixo"
                : "Link inválido ou expirado"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isValidSession ? (
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="password">Nova senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      autoComplete="new-password"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="********"
                      autoComplete="new-password"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Salvando..." : "Redefinir senha"}
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Solicite um novo link de redefinição na tela de login.
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => navigate("/auth")}
            >
              Voltar para o login
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
