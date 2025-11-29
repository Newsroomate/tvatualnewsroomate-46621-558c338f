import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserEffectivePermissions,
  grantPermission,
  revokePermission,
  getAllPermissions,
  getPermissionLabel,
  PermissionType
} from "@/services/user-permissions-api";
import { fetchUsersWithPermissions } from "@/services/user-permissions-api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Shield, Star } from "lucide-react";

export function UserPermissionsTab() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users-with-permissions"],
    queryFn: fetchUsersWithPermissions
  });

  const { data: effectivePerms, isLoading: isLoadingPerms } = useQuery({
    queryKey: ["effective-permissions", selectedUserId],
    queryFn: () => getUserEffectivePermissions(selectedUserId),
    enabled: !!selectedUserId
  });

  const grantMutation = useMutation({
    mutationFn: ({ userId, permission }: { userId: string; permission: PermissionType }) =>
      grantPermission(userId, permission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["effective-permissions", selectedUserId] });
      toast.success("Permissão concedida");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao conceder permissão");
    }
  });

  const revokeMutation = useMutation({
    mutationFn: ({ userId, permission }: { userId: string; permission: PermissionType }) =>
      revokePermission(userId, permission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["effective-permissions", selectedUserId] });
      toast.success("Permissão removida");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover permissão");
    }
  });

  const selectedUser = users?.find(u => u.id === selectedUserId);
  const allPermissions = getAllPermissions();

  const handleTogglePermission = (permission: PermissionType, isActive: boolean) => {
    if (!selectedUserId) return;

    const isRolePermission = effectivePerms?.rolePermissions.includes(permission);
    
    // Se é permissão do role, não pode desativar (apenas via mudança de role)
    if (isRolePermission && isActive) {
      toast.info("Esta permissão vem do role global e não pode ser removida diretamente");
      return;
    }

    if (isActive) {
      // Remover permissão extra
      revokeMutation.mutate({ userId: selectedUserId, permission });
    } else {
      // Adicionar permissão extra
      grantMutation.mutate({ userId: selectedUserId, permission });
    }
  };

  if (isLoadingUsers) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Visualize e gerencie permissões granulares por usuário. Permissões extras complementam as permissões do role global.
      </div>

      {/* User Selection */}
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Selecionar Usuário</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um usuário..." />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || "Sem nome"} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="font-medium text-lg">{selectedUser.full_name || "Sem nome"}</h4>
                  <p className="text-sm text-muted-foreground">
                    Role Global: <Badge variant="outline" className="ml-1">{selectedUser.role}</Badge>
                  </p>
                </div>
                {effectivePerms && (
                  <div className="text-right text-sm text-muted-foreground">
                    <div>
                      Permissões do Role: <span className="font-medium">{effectivePerms.rolePermissions.length}</span>
                    </div>
                    <div>
                      Permissões Extras: <span className="font-medium text-primary">{effectivePerms.extraPermissions.length}</span>
                    </div>
                  </div>
                )}
              </div>

              {isLoadingPerms ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50%]">Permissão</TableHead>
                        <TableHead className="w-[25%]">Status</TableHead>
                        <TableHead className="w-[25%] text-center">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPermissions.map((permission) => {
                        const isRolePermission = effectivePerms?.rolePermissions.includes(permission);
                        const isExtraPermission = effectivePerms?.extraPermissions.includes(permission);
                        const isActive = effectivePerms?.allPermissions.includes(permission);

                        return (
                          <TableRow key={permission}>
                            <TableCell className="font-medium">
                              {getPermissionLabel(permission)}
                            </TableCell>
                            <TableCell>
                              {isActive ? (
                                <div className="flex items-center gap-2">
                                  {isRolePermission && !isExtraPermission && (
                                    <Badge variant="secondary" className="gap-1">
                                      <Shield className="h-3 w-3" />
                                      Via Role
                                    </Badge>
                                  )}
                                  {isExtraPermission && (
                                    <Badge variant="default" className="gap-1 bg-primary">
                                      <Star className="h-3 w-3" />
                                      Extra
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Inativo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={isActive || false}
                                onCheckedChange={() => handleTogglePermission(permission, isActive || false)}
                                disabled={
                                  grantMutation.isPending || 
                                  revokeMutation.isPending ||
                                  (isRolePermission && !isExtraPermission) // Disable if only from role
                                }
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Dica:</strong> Permissões marcadas como "Via Role" são herdadas do role global do usuário. 
                  Para removê-las, você precisa alterar o role do usuário na aba "Usuários". 
                  Permissões "Extra" podem ser ativadas/desativadas independentemente.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
