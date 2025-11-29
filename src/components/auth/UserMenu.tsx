
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Shield, User } from "lucide-react";
import { isEditorChefe } from "@/utils/permission";
import { PermissionsManagementModal } from "@/components/admin";

export const UserMenu = () => {
  const { profile, signOut } = useAuth();
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {profile && (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {translateRole(profile.role)}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isEditorChefe(profile) && (
              <>
                <DropdownMenuItem
                  onClick={() => setIsAccessModalOpen(true)}
                  className="cursor-pointer"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Gerenciar Permissões</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => signOut()}
              className="cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
      <PermissionsManagementModal
        open={isAccessModalOpen}
        onOpenChange={setIsAccessModalOpen}
      />
    </DropdownMenu>
  );
};
