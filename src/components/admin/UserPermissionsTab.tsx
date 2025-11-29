import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUsersWithPermissions,
  grantPermission,
  revokePermission,
  getAllPermissions,
  getPermissionLabel,
  PermissionType
} from "@/services/user-permissions-api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

export function UserPermissionsTab() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedPermission, setSelectedPermission] = useState<PermissionType | "">("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["users-with-permissions"],
    queryFn: fetchUsersWithPermissions
  });

  const grantMutation = useMutation({
    mutationFn: ({ userId, permission }: { userId: string; permission: PermissionType }) =>
      grantPermission(userId, permission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-permissions"] });
      toast.success("Permissão concedida");
      setSelectedPermission("");
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
      toast.success("Permissão removida");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover permissão");
    }
  });

  const selectedUser = users?.find(u => u.id === selectedUserId);
  const allPermissions = getAllPermissions();
  const availablePermissions = allPermissions.filter(
    p => !selectedUser?.permissions.includes(p)
  );

  const handleGrantPermission = () => {
    if (!selectedUserId || !selectedPermission) return;
    grantMutation.mutate({ userId: selectedUserId, permission: selectedPermission });
  };

  const handleRevokePermission = (permission: PermissionType) => {
    if (!selectedUserId) return;
    revokeMutation.mutate({ userId: selectedUserId, permission });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Atribua permissões específicas para usuários individuais, complementando seus roles globais.
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium">{selectedUser.full_name || "Sem nome"}</h4>
                  <p className="text-sm text-muted-foreground">
                    Role: <span className="font-medium">{selectedUser.role}</span>
                  </p>
                </div>
              </div>

              {/* Add Permission */}
              <div className="flex gap-2 mb-4">
                <Select
                  value={selectedPermission}
                  onValueChange={(v) => setSelectedPermission(v as PermissionType)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Adicionar permissão..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePermissions.map((perm) => (
                      <SelectItem key={perm} value={perm}>
                        {getPermissionLabel(perm)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleGrantPermission}
                  disabled={!selectedPermission || grantMutation.isPending}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {/* Current Permissions */}
              <div>
                <h5 className="text-sm font-medium mb-2">Permissões Atuais:</h5>
                {selectedUser.permissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma permissão extra atribuída</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.permissions.map((perm) => (
                      <Badge key={perm} variant="secondary" className="gap-1">
                        {getPermissionLabel(perm)}
                        <button
                          onClick={() => handleRevokePermission(perm)}
                          className="ml-1 hover:text-destructive"
                          disabled={revokeMutation.isPending}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
