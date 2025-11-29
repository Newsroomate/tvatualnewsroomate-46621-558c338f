import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUsersWithPermissions, updateUserRole } from "@/services/user-permissions-api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserRole } from "@/types/auth";
import { Loader2 } from "lucide-react";

const roleLabels: Record<UserRole, string> = {
  reporter: "Repórter",
  editor: "Editor",
  editor_chefe: "Editor-Chefe",
  produtor: "Produtor"
};

const roleColors: Record<UserRole, string> = {
  reporter: "bg-blue-500",
  editor: "bg-green-500",
  editor_chefe: "bg-purple-500",
  produtor: "bg-orange-500"
};

export function UserManagementTab() {
  const queryClient = useQueryClient();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users-with-permissions"],
    queryFn: fetchUsersWithPermissions
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-permissions"] });
      toast.success("Role atualizado com sucesso");
      setUpdatingUserId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar role");
      setUpdatingUserId(null);
    }
  });

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId);
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Gerencie os roles globais dos usuários do sistema. Roles podem ser complementados com permissões específicas.
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role Global</TableHead>
            <TableHead>Permissões Extras</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name || "Sem nome"}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                  disabled={updatingUserId === user.id}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {user.permissions.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Nenhuma</span>
                  ) : (
                    <Badge variant="secondary">{user.permissions.length} permissões</Badge>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
