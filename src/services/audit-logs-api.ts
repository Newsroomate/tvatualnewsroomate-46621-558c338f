import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";
import { PermissionType } from "./user-permissions-api";

export interface AuditLog {
  id: string;
  timestamp: string;
  actor_user_id: string;
  action: string;
  target_user_id: string;
  permission_type?: PermissionType;
  old_role?: UserRole;
  new_role?: UserRole;
  telejornal_id?: string;
  details?: any;
  created_at: string;
  actor_name?: string;
  target_name?: string;
  telejornal_nome?: string;
}

export const fetchAuditLogs = async (filters?: {
  startDate?: Date;
  endDate?: Date;
  actorUserId?: string;
  targetUserId?: string;
  action?: string;
}): Promise<AuditLog[]> => {
  let query = supabase
    .from("permission_audit_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(500);

  if (filters?.startDate) {
    query = query.gte("timestamp", filters.startDate.toISOString());
  }
  if (filters?.endDate) {
    query = query.lte("timestamp", filters.endDate.toISOString());
  }
  if (filters?.actorUserId) {
    query = query.eq("actor_user_id", filters.actorUserId);
  }
  if (filters?.targetUserId) {
    query = query.eq("target_user_id", filters.targetUserId);
  }
  if (filters?.action) {
    query = query.eq("action", filters.action);
  }

  const { data: logs, error } = await query;

  if (error) throw error;

  // Enrich with user names and telejornal names
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name");

  const { data: telejornais } = await supabase
    .from("telejornais")
    .select("id, nome");

  const profileMap = new Map(profiles?.map(p => [p.id, p.full_name || "Sem nome"]) || []);
  const telejornalMap = new Map(telejornais?.map(t => [t.id, t.nome]) || []);

  return (logs || []).map(log => ({
    ...log,
    actor_name: profileMap.get(log.actor_user_id),
    target_name: profileMap.get(log.target_user_id),
    telejornal_nome: log.telejornal_id ? telejornalMap.get(log.telejornal_id) : undefined,
  }));
};

export const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    grant_permission: "Permissão Concedida",
    revoke_permission: "Permissão Removida",
    update_role: "Role Atualizado",
    grant_telejornal_access: "Acesso ao Telejornal Concedido",
    revoke_telejornal_access: "Acesso ao Telejornal Removido",
    update_telejornal_role: "Role do Telejornal Atualizado",
  };
  return labels[action] || action;
};

export const getActionColor = (action: string): string => {
  if (action.includes("grant")) return "text-green-600 dark:text-green-400";
  if (action.includes("revoke")) return "text-red-600 dark:text-red-400";
  if (action.includes("update")) return "text-blue-600 dark:text-blue-400";
  return "text-muted-foreground";
};
