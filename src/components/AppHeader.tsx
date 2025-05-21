
import { UserMenu } from "./auth/UserMenu";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

export const AppHeader = () => {
  const { user, profile } = useAuth();

  const translateRole = (role: string) => {
    const roles: Record<string, string> = {
      'editor_chefe': 'Editor-chefe',
      'editor': 'Editor',
      'reporter': 'Repórter',
      'produtor': 'Produtor',
    };
    return roles[role] || role;
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
      <div className="text-lg font-semibold">Sistema de Redação</div>
      
      {user ? (
        <div className="flex items-center gap-4">
          {profile && (
            <div className="text-sm hidden md:block">
              <span className="text-gray-500 mr-1">Conectado como:</span>
              <span className="font-medium">{profile.full_name}</span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 ml-2 rounded-full">
                {translateRole(profile.role)}
              </span>
            </div>
          )}
          <UserMenu />
        </div>
      ) : (
        <Link to="/auth">
          <Button size="sm">Entrar</Button>
        </Link>
      )}
    </header>
  );
};
