import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";

export type PermissionType =
  // Matérias - base
  | 'criar_materia'
  | 'editar_materia'
  | 'excluir_materia'
  // Matérias - avançado
  | 'duplicar_materia'
  | 'copiar_materia'
  | 'colar_materia'
  | 'reordenar_materias'
  | 'transferir_materias'
  // Blocos - base
  | 'criar_bloco'
  | 'editar_bloco'
  | 'excluir_bloco'
  // Blocos - avançado
  | 'copiar_bloco'
  | 'colar_bloco'
  | 'renomear_bloco'
  // Telejornais
  | 'criar_telejornal'
  | 'editar_telejornal'
  | 'excluir_telejornal'
  // Espelhos
  | 'gerenciar_espelho'
  | 'fechar_espelho'
  | 'abrir_espelho'
  | 'salvar_espelho'
  | 'editar_espelho_salvo'
  | 'excluir_espelho_salvo'
  // Pautas
  | 'criar_pauta'
  | 'editar_pauta'
  | 'excluir_pauta'
  | 'visualizar_todas_pautas'
  // Snapshots
  | 'visualizar_snapshots'
  | 'excluir_snapshots'
  | 'criar_snapshot'
  | 'editar_snapshot'
  // Modelos
  | 'salvar_modelo'
  | 'aplicar_modelo'
  | 'excluir_modelo'
  | 'visualizar_modelos'
  // Exportações
  | 'exportar_gc'
  | 'exportar_playout'
  | 'exportar_lauda'
  | 'exportar_clip_retranca'
  | 'exportar_rss'
  // Visualizações e ferramentas
  | 'visualizar_teleprompter'
  | 'visualizar_laudas'
  | 'busca_profunda'
  | 'visualizar_historico_espelhos'
  // Administração
  | 'gerenciar_usuarios'
  | 'gerenciar_permissoes';

export interface UserPermission {
  id: string;
  user_id: string;
  permission: PermissionType;
  is_granted: boolean;
  assigned_by: string | null;
  created_at: string;
}

export interface UserWithPermissions {
  id: string;
  full_name: string | null;
  role: UserRole;
  email?: string;
  permissions: PermissionType[];
}

// Fetch all users with their permissions
export const fetchUsersWithPermissions = async (): Promise<UserWithPermissions[]> => {
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name");

  if (profilesError) throw profilesError;

  const authUsers: Array<{ id: string; email?: string }> = [];
  
  const { data: permissions, error: permError } = await supabase
    .from("user_permissions")
    .select("user_id, permission, is_granted");

  if (permError) throw permError;

  // Build effective permissions map
  const effectivePermsMap = new Map<string, PermissionType[]>();
  
  for (const profile of profiles || []) {
    const rolePerms = new Set(getDefaultRolePermissions(profile.role));
    
    // Apply overrides
    const userOverrides = permissions?.filter(p => p.user_id === profile.id) || [];
    for (const override of userOverrides) {
      if (override.is_granted) {
        rolePerms.add(override.permission as PermissionType);
      } else {
        rolePerms.delete(override.permission as PermissionType);
      }
    }
    
    effectivePermsMap.set(profile.id, Array.from(rolePerms));
  }

  return (profiles || []).map(profile => {
    const authUser = authUsers?.find(u => u.id === profile.id);
    return {
      id: profile.id,
      full_name: profile.full_name,
      role: profile.role,
      email: authUser?.email,
      permissions: effectivePermsMap.get(profile.id) || []
    };
  });
};

// Toggle a permission for a user (grant or revoke)
export const togglePermission = async (
  userId: string, 
  permission: PermissionType, 
  grant: boolean
) => {
  const currentUser = (await supabase.auth.getUser()).data.user;
  
  const { data: existing } = await supabase
    .from("user_permissions")
    .select("*")
    .eq("user_id", userId)
    .eq("permission", permission)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("user_permissions")
      .update({ 
        is_granted: grant,
        assigned_by: currentUser?.id 
      })
      .eq("user_id", userId)
      .eq("permission", permission);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("user_permissions")
      .insert({
        user_id: userId,
        permission,
        is_granted: grant,
        assigned_by: currentUser?.id,
      });

    if (error) throw error;
  }
};

// Remove permission override (return to role default)
export const removePermissionOverride = async (userId: string, permission: PermissionType) => {
  const { error } = await supabase
    .from("user_permissions")
    .delete()
    .eq("user_id", userId)
    .eq("permission", permission);

  if (error) throw error;
};

// Update user role
export const updateUserRole = async (
  userId: string,
  newRole: UserRole
): Promise<void> => {
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) throw error;

  const { error: roleError } = await supabase
    .from("user_roles")
    .update({ role: newRole })
    .eq("user_id", userId);

  if (roleError) throw roleError;
};

// Get permission labels for display
export const getPermissionLabel = (permission: PermissionType): string => {
  const labels: Record<PermissionType, string> = {
    // Matérias - base
    criar_materia: "Criar Matérias",
    editar_materia: "Editar Matérias",
    excluir_materia: "Excluir Matérias",
    // Matérias - avançado
    duplicar_materia: "Duplicar Matérias",
    copiar_materia: "Copiar Matérias",
    colar_materia: "Colar Matérias",
    reordenar_materias: "Reordenar Matérias",
    transferir_materias: "Transferir Matérias",
    // Blocos - base
    criar_bloco: "Criar Blocos",
    editar_bloco: "Editar Blocos",
    excluir_bloco: "Excluir Blocos",
    // Blocos - avançado
    copiar_bloco: "Copiar Blocos",
    colar_bloco: "Colar Blocos",
    renomear_bloco: "Renomear Blocos",
    // Telejornais
    criar_telejornal: "Criar Telejornais",
    editar_telejornal: "Editar Telejornais",
    excluir_telejornal: "Excluir Telejornais",
    // Espelhos
    gerenciar_espelho: "Gerenciar Espelhos",
    fechar_espelho: "Fechar Espelhos",
    abrir_espelho: "Abrir Espelhos",
    salvar_espelho: "Salvar Espelhos",
    editar_espelho_salvo: "Editar Espelhos Salvos",
    excluir_espelho_salvo: "Excluir Espelhos Salvos",
    // Pautas
    criar_pauta: "Criar Pautas",
    editar_pauta: "Editar Pautas",
    excluir_pauta: "Excluir Pautas",
    visualizar_todas_pautas: "Visualizar Todas as Pautas",
    // Snapshots
    visualizar_snapshots: "Visualizar Snapshots",
    excluir_snapshots: "Excluir Snapshots",
    criar_snapshot: "Criar Snapshots",
    editar_snapshot: "Editar Snapshots",
    // Modelos
    salvar_modelo: "Salvar Modelos",
    aplicar_modelo: "Aplicar Modelos",
    excluir_modelo: "Excluir Modelos",
    visualizar_modelos: "Visualizar Modelos",
    // Exportações
    exportar_gc: "Exportar GC",
    exportar_playout: "Exportar Playout",
    exportar_lauda: "Exportar Laudas",
    exportar_clip_retranca: "Exportar Clip/Retranca PDF",
    exportar_rss: "Exportar RSS",
    // Visualizações e ferramentas
    visualizar_teleprompter: "Visualizar Teleprompter",
    visualizar_laudas: "Visualizar Laudas",
    busca_profunda: "Busca Profunda",
    visualizar_historico_espelhos: "Visualizar Histórico de Espelhos",
    // Administração
    gerenciar_usuarios: "Gerenciar Usuários",
    gerenciar_permissoes: "Gerenciar Permissões",
  };
  return labels[permission];
};

// Get all available permissions
export const getAllPermissions = (): PermissionType[] => {
  return [
    // Matérias - base
    'criar_materia',
    'editar_materia',
    'excluir_materia',
    // Matérias - avançado
    'duplicar_materia',
    'copiar_materia',
    'colar_materia',
    'reordenar_materias',
    'transferir_materias',
    // Blocos - base
    'criar_bloco',
    'editar_bloco',
    'excluir_bloco',
    // Blocos - avançado
    'copiar_bloco',
    'colar_bloco',
    'renomear_bloco',
    // Telejornais
    'criar_telejornal',
    'editar_telejornal',
    'excluir_telejornal',
    // Espelhos
    'gerenciar_espelho',
    'fechar_espelho',
    'abrir_espelho',
    'salvar_espelho',
    'editar_espelho_salvo',
    'excluir_espelho_salvo',
    // Pautas
    'criar_pauta',
    'editar_pauta',
    'excluir_pauta',
    'visualizar_todas_pautas',
    // Snapshots
    'visualizar_snapshots',
    'excluir_snapshots',
    'criar_snapshot',
    'editar_snapshot',
    // Modelos
    'salvar_modelo',
    'aplicar_modelo',
    'excluir_modelo',
    'visualizar_modelos',
    // Exportações
    'exportar_gc',
    'exportar_playout',
    'exportar_lauda',
    'exportar_clip_retranca',
    'exportar_rss',
    // Visualizações e ferramentas
    'visualizar_teleprompter',
    'visualizar_laudas',
    'busca_profunda',
    'visualizar_historico_espelhos',
    // Administração
    'gerenciar_usuarios',
    'gerenciar_permissoes',
  ];
};

// Get default permissions for a given role
export const getDefaultRolePermissions = (role: UserRole): PermissionType[] => {
  const rolePermissions: Record<UserRole, PermissionType[]> = {
    reporter: [
      'criar_materia',
      'editar_materia',
      'duplicar_materia',
      'copiar_materia',
      'colar_materia',
      'criar_pauta',
      'editar_pauta',
      'visualizar_teleprompter',
      'visualizar_laudas',
      'busca_profunda',
    ],
    produtor: [
      'criar_pauta',
      'editar_pauta',
      'excluir_pauta',
      'visualizar_todas_pautas',
      'visualizar_teleprompter',
      'visualizar_laudas',
      'busca_profunda',
    ],
    editor: [
      'criar_materia',
      'editar_materia',
      'excluir_materia',
      'duplicar_materia',
      'copiar_materia',
      'colar_materia',
      'reordenar_materias',
      'transferir_materias',
      'criar_bloco',
      'editar_bloco',
      'excluir_bloco',
      'copiar_bloco',
      'colar_bloco',
      'renomear_bloco',
      'gerenciar_espelho',
      'abrir_espelho',
      'salvar_espelho',
      'criar_pauta',
      'editar_pauta',
      'excluir_pauta',
      'visualizar_todas_pautas',
      'visualizar_snapshots',
      'criar_snapshot',
      'editar_snapshot',
      'visualizar_modelos',
      'aplicar_modelo',
      'exportar_gc',
      'exportar_playout',
      'exportar_lauda',
      'exportar_clip_retranca',
      'exportar_rss',
      'visualizar_teleprompter',
      'visualizar_laudas',
      'busca_profunda',
      'visualizar_historico_espelhos',
    ],
    editor_chefe: [
      'criar_materia',
      'editar_materia',
      'excluir_materia',
      'duplicar_materia',
      'copiar_materia',
      'colar_materia',
      'reordenar_materias',
      'transferir_materias',
      'criar_bloco',
      'editar_bloco',
      'excluir_bloco',
      'copiar_bloco',
      'colar_bloco',
      'renomear_bloco',
      'criar_telejornal',
      'editar_telejornal',
      'excluir_telejornal',
      'gerenciar_espelho',
      'fechar_espelho',
      'abrir_espelho',
      'salvar_espelho',
      'editar_espelho_salvo',
      'excluir_espelho_salvo',
      'criar_pauta',
      'editar_pauta',
      'excluir_pauta',
      'visualizar_todas_pautas',
      'visualizar_snapshots',
      'excluir_snapshots',
      'criar_snapshot',
      'editar_snapshot',
      'salvar_modelo',
      'aplicar_modelo',
      'excluir_modelo',
      'visualizar_modelos',
      'exportar_gc',
      'exportar_playout',
      'exportar_lauda',
      'exportar_clip_retranca',
      'exportar_rss',
      'visualizar_teleprompter',
      'visualizar_laudas',
      'busca_profunda',
      'visualizar_historico_espelhos',
      'gerenciar_usuarios',
      'gerenciar_permissoes',
    ],
  };

  return rolePermissions[role] || [];
};

// Get user's effective permissions (role + overrides with is_granted)
export const getUserEffectivePermissions = async (userId: string): Promise<{
  rolePermissions: PermissionType[];
  grantedExtras: PermissionType[];
  revokedDefaults: PermissionType[];
  effectivePermissions: PermissionType[];
}> => {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  const rolePermissions = getDefaultRolePermissions(profile.role);
  const rolePermSet = new Set(rolePermissions);

  const { data: overrides, error: overridesError } = await supabase
    .from("user_permissions")
    .select("permission, is_granted")
    .eq("user_id", userId);

  if (overridesError) throw overridesError;

  const grantedExtras: PermissionType[] = [];
  const revokedDefaults: PermissionType[] = [];
  const effective = new Set(rolePermissions);

  (overrides || []).forEach(override => {
    const perm = override.permission as PermissionType;
    if (override.is_granted) {
      effective.add(perm);
      if (!rolePermSet.has(perm)) {
        grantedExtras.push(perm);
      }
    } else {
      effective.delete(perm);
      if (rolePermSet.has(perm)) {
        revokedDefaults.push(perm);
      }
    }
  });

  return {
    rolePermissions,
    grantedExtras,
    revokedDefaults,
    effectivePermissions: Array.from(effective)
  };
};