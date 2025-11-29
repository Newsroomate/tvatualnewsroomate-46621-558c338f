import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs, getActionLabel, getActionColor } from "@/services/audit-logs-api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getPermissionLabel } from "@/services/user-permissions-api";

export function AuditLogsTab() {
  const [actionFilter, setActionFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs", actionFilter],
    queryFn: () => fetchAuditLogs({ action: actionFilter || undefined }),
  });

  const filteredLogs = logs?.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.actor_name?.toLowerCase().includes(searchLower) ||
      log.target_name?.toLowerCase().includes(searchLower) ||
      log.telejornal_nome?.toLowerCase().includes(searchLower)
    );
  });

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
        Histórico completo de todas as mudanças de permissões, roles e acessos no sistema.
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Filtros</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Buscar</Label>
            <Input
              placeholder="Nome do usuário, telejornal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Tipo de Ação</Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Todas as ações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as ações</SelectItem>
                <SelectItem value="grant_permission">Permissão Concedida</SelectItem>
                <SelectItem value="revoke_permission">Permissão Removida</SelectItem>
                <SelectItem value="update_role">Role Atualizado</SelectItem>
                <SelectItem value="grant_telejornal_access">Acesso ao Telejornal Concedido</SelectItem>
                <SelectItem value="revoke_telejornal_access">Acesso ao Telejornal Removido</SelectItem>
                <SelectItem value="update_telejornal_role">Role do Telejornal Atualizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Realizado por</TableHead>
                <TableHead>Usuário Afetado</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs && filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum log de auditoria encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">
                      {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getActionColor(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{log.actor_name}</TableCell>
                    <TableCell>{log.target_name}</TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {log.permission_type && (
                          <div>
                            <span className="text-muted-foreground">Permissão: </span>
                            <span className="font-medium">{getPermissionLabel(log.permission_type)}</span>
                          </div>
                        )}
                        {log.old_role && log.new_role && (
                          <div>
                            <span className="text-muted-foreground">De: </span>
                            <span className="font-medium">{log.old_role}</span>
                            <span className="text-muted-foreground"> → Para: </span>
                            <span className="font-medium">{log.new_role}</span>
                          </div>
                        )}
                        {log.telejornal_nome && (
                          <div>
                            <span className="text-muted-foreground">Telejornal: </span>
                            <span className="font-medium">{log.telejornal_nome}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {filteredLogs && filteredLogs.length > 0 && (
        <div className="text-xs text-muted-foreground text-right">
          Mostrando {filteredLogs.length} registro(s)
        </div>
      )}
    </div>
  );
}
