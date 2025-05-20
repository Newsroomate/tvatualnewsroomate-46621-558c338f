
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";

export const UserMenu = () => {
  const { user, profile, signOut } = useAuth();

  // Função para obter as iniciais do nome do usuário
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Função para traduzir o papel do usuário
  const translateRole = (role: string) => {
    const roles: Record<string, string> = {
      'editor_chefe': 'Editor-chefe',
      'editor': 'Editor',
      'reporter': 'Repórter',
      'produtor': 'Produtor',
    };
    return roles[role] || role;
  };

  // Nome de exibição
  const displayName = profile?.full_name || user?.email?.split('@')[0] || "Usuário";
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 pr-3 border border-gray-300 hover:bg-gray-100"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline text-sm font-medium">{displayName}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {/* Sempre mostrar informações do usuário, mesmo com fallback */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {profile && (
              <p className="text-xs leading-none text-muted-foreground">
                {translateRole(profile.role)}
              </p>
            )}
            {user && !profile && (
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Sempre mostrar a opção de logout se o usuário estiver logado */}
        {user && (
          <DropdownMenuItem
            onClick={() => signOut()}
            className="cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
