
import { UserMenu } from "./auth/UserMenu";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

export const AppHeader = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
      <div className="text-lg font-semibold">Sistema de Redação</div>
      
      {user ? (
        <UserMenu />
      ) : (
        <Link to="/auth">
          <Button size="sm">Entrar</Button>
        </Link>
      )}
    </header>
  );
};
