import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { getAllPermissions, getPermissionLabel } from "@/services/user-permissions-api";
import { UserRole } from "@/types/auth";

// Default permissions by role (based on existing permission.ts)
const defaultPermissionsByRole: Record<UserRole, string[]> = {
  reporter: [
    'criar_materia',
    'editar_materia',
    'visualizar_snapshots'
  ],
  produtor: [
    'criar_pauta',
    'editar_pauta',
    'excluir_pauta'
  ],
  editor: [
    'criar_materia',
    'editar_materia',
    'excluir_materia',
    'criar_bloco',
    'editar_bloco',
    'criar_telejornal',
    'editar_telejornal',
    'gerenciar_espelho',
    'visualizar_snapshots'
  ],
  editor_chefe: [
    'criar_materia',
    'editar_materia',
    'excluir_materia',
    'criar_bloco',
    'editar_bloco',
    'excluir_bloco',
    'criar_telejornal',
    'editar_telejornal',
    'excluir_telejornal',
    'gerenciar_espelho',
    'fechar_espelho',
    'criar_pauta',
    'editar_pauta',
    'excluir_pauta',
    'visualizar_todas_pautas',
    'gerenciar_usuarios',
    'gerenciar_permissoes',
    'visualizar_snapshots',
    'excluir_snapshots'
  ]
};

const roleLabels: Record<UserRole, string> = {
  reporter: "Repórter",
  editor: "Editor",
  editor_chefe: "Editor-Chefe",
  produtor: "Produtor"
};

export function PermissionsMatrixTab() {
  const allPermissions = getAllPermissions();
  const roles: UserRole[] = ['reporter', 'produtor', 'editor', 'editor_chefe'];

  const hasPermission = (role: UserRole, permission: string): boolean => {
    return defaultPermissionsByRole[role].includes(permission);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Matriz de referência mostrando permissões padrão por role. Permissões individuais podem complementar ou substituir estas permissões.
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px] bg-muted/50">Permissão</TableHead>
              {roles.map((role) => (
                <TableHead key={role} className="text-center bg-muted/50">
                  <Badge variant="outline">{roleLabels[role]}</Badge>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {allPermissions.map((permission) => (
              <TableRow key={permission}>
                <TableCell className="font-medium">
                  {getPermissionLabel(permission)}
                </TableCell>
                {roles.map((role) => (
                  <TableCell key={`${permission}-${role}`} className="text-center">
                    {hasPermission(role, permission) ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
        <p><strong>Nota:</strong> Esta matriz mostra as permissões <em>padrão</em> baseadas em roles.</p>
        <p>• Use a aba "Permissões" para atribuir permissões adicionais específicas a usuários</p>
        <p>• Use a aba "Telejornal" para definir exceções de acesso por telejornal</p>
      </div>
    </div>
  );
}
