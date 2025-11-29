import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserEffectivePermissions,
  togglePermission,
  getAllPermissions,
  getPermissionLabel,
  getDefaultRolePermissions,
  PermissionType
} from "@/services/user-permissions-api";
import { fetchUsersWithPermissions } from "@/services/user-permissions-api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Shield, Star, Ban, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

// Permission categories for better organization
const PERMISSION_CATEGORIES = {
  "Matérias": [
    'criar_materia',
    'editar_materia',
    'excluir_materia',
    'duplicar_materia',
    'copiar_materia',
    'colar_materia',
    'reordenar_materias',
    'transferir_materias',
  ],
  "Blocos": [
    'criar_bloco',
    'editar_bloco',
    'excluir_bloco',
    'copiar_bloco',
    'colar_bloco',
    'renomear_bloco',
  ],
  "Telejornais": [
    'criar_telejornal',
    'editar_telejornal',
    'excluir_telejornal',
  ],
  "Espelhos": [
    'gerenciar_espelho',
    'fechar_espelho',
    'abrir_espelho',
    'salvar_espelho',
    'editar_espelho_salvo',
    'excluir_espelho_salvo',
  ],
  "Pautas": [
    'criar_pauta',
    'editar_pauta',
    'excluir_pauta',
    'visualizar_todas_pautas',
  ],
  "Snapshots": [
    'visualizar_snapshots',
    'excluir_snapshots',
    'criar_snapshot',
    'editar_snapshot',
  ],
  "Modelos": [
    'salvar_modelo',
    'aplicar_modelo',
    'excluir_modelo',
    'visualizar_modelos',
  ],
  "Exportações": [
    'exportar_gc',
    'exportar_playout',
    'exportar_lauda',
    'exportar_clip_retranca',
    'exportar_rss',
  ],
  "Ferramentas": [
    'visualizar_teleprompter',
    'visualizar_laudas',
    'busca_profunda',
    'visualizar_historico_espelhos',
  ],
  "Administração": [
    'gerenciar_usuarios',
    'gerenciar_permissoes',
  ],
} as const;

export function UserPermissionsTab() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users-with-permissions"],
    queryFn: fetchUsersWithPermissions
  });

  const { data: effectivePerms, isLoading: isLoadingPerms } = useQuery({
    queryKey: ["effective-permissions", selectedUserId],
    queryFn: () => getUserEffectivePermissions(selectedUserId),
    enabled: !!selectedUserId
  });

  const toggleMutation = useMutation({
    mutationFn: ({ userId, permission, grant }: { userId: string; permission: PermissionType; grant: boolean }) =>
      togglePermission(userId, permission, grant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["effective-permissions", selectedUserId] });
      toast.success("Permissão atualizada");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar permissão");
    }
  });

  const selectedUser = users?.find(u => u.id === selectedUserId);

  const handleTogglePermission = (permission: PermissionType) => {
    if (!selectedUserId || !effectivePerms) return;

    const isCurrentlyActive = effectivePerms.effectivePermissions.includes(permission);
    
    toggleMutation.mutate({ 
      userId: selectedUserId, 
      permission, 
      grant: !isCurrentlyActive 
    });
  };

  const getPermissionStatus = (permission: PermissionType) => {
    if (!effectivePerms) return { active: false, origin: 'none' as const };
    
    const isActive = effectivePerms.effectivePermissions.includes(permission);
    const isFromRole = effectivePerms.rolePermissions.includes(permission);
    const isGrantedExtra = effectivePerms.grantedExtras.includes(permission);
    const isRevoked = effectivePerms.revokedDefaults.includes(permission);
    
    if (!isActive && isRevoked) {
      return { active: false, origin: 'revoked' as const };
    }
    if (isActive && isGrantedExtra) {
      return { active: true, origin: 'extra' as const };
    }
    if (isActive && isFromRole) {
      return { active: true, origin: 'role' as const };
    }
    
    return { active: false, origin: 'none' as const };
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
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
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Gerenciamento de Permissões Unificado</h3>
        <p className="text-sm text-muted-foreground">
          Controle total sobre as permissões de cada usuário. O role global define o template base, mas você pode adicionar ou remover qualquer permissão individualmente.
        </p>
      </div>

      {/* User Selection */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecione um usuário</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um usuário..." />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || "Sem nome"} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && effectivePerms && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <div className="text-sm text-muted-foreground">Role Global</div>
                <div className="text-lg font-semibold capitalize">{selectedUser.role}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Permissões do Role</div>
                <div className="text-lg font-semibold">{effectivePerms.rolePermissions.length}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Permissões Efetivas</div>
                <div className="text-lg font-semibold text-primary">{effectivePerms.effectivePermissions.length}</div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Permissions Table */}
      {selectedUserId && (
        <>
          {effectivePerms && (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span><strong>Via Role:</strong> Permissão do cargo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span><strong>Extra:</strong> Permissão adicional concedida</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ban className="h-4 w-4 text-red-500" />
                  <span><strong>Revogada:</strong> Permissão do cargo que foi removida</span>
                </div>
              </div>
            </div>
          )}

          {isLoadingPerms ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : effectivePerms ? (
            <div className="space-y-4">
              {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => {
                const isExpanded = expandedCategories[category] !== false; // Default open
                
                return (
                  <Card key={category} className="overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{category}</h4>
                        <Badge variant="secondary">{permissions.length}</Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Permissão</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Origem</TableHead>
                            <TableHead className="text-right">Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {permissions.map((perm) => {
                            const status = getPermissionStatus(perm as PermissionType);
                            
                            return (
                              <TableRow key={perm}>
                                <TableCell className="font-medium">
                                  {getPermissionLabel(perm as PermissionType)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={status.active ? "default" : "secondary"}>
                                    {status.active ? "✅ Ativo" : "❌ Inativo"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {status.origin === 'role' && (
                                    <Badge variant="outline" className="gap-1">
                                      <Shield className="h-3 w-3 text-blue-500" />
                                      Via Role
                                    </Badge>
                                  )}
                                  {status.origin === 'extra' && (
                                    <Badge variant="outline" className="gap-1">
                                      <Star className="h-3 w-3 text-yellow-500" />
                                      Extra
                                    </Badge>
                                  )}
                                  {status.origin === 'revoked' && (
                                    <Badge variant="outline" className="gap-1">
                                      <Ban className="h-3 w-3 text-red-500" />
                                      Revogada
                                    </Badge>
                                  )}
                                  {status.origin === 'none' && (
                                    <Badge variant="secondary">—</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Switch
                                    checked={status.active}
                                    onCheckedChange={() => handleTogglePermission(perm as PermissionType)}
                                    disabled={toggleMutation.isPending}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : null}
        </>
      )}

      {!selectedUserId && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            Selecione um usuário acima para visualizar e gerenciar suas permissões
          </div>
        </Card>
      )}
    </div>
  );
}