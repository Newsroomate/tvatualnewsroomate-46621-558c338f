import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";

export type PermissionType =
  | 'criar_materia'
  | 'editar_materia'
  | 'excluir_materia'
  | 'criar_bloco'
  | 'editar_bloco'
  | 'excluir_bloco'
  | 'criar_telejornal'
  | 'editar_telejornal'
  | 'excluir_telejornal'
  | 'gerenciar_espelho'
  | 'fechar_espelho'
  | 'criar_pauta'
  | 'editar_pauta'
  | 'excluir_pauta'
  | 'visualizar_todas_pautas'
  | 'gerenciar_usuarios'
  | 'gerenciar_permissoes'
  | 'visualizar_snapshots'
  | 'excluir_snapshots';

export interface UserPermission {
  id: string;
  user_id: string;
  permission: PermissionType;
  created_at: string;
  assigned_by: string | null;
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

  // Get auth users for emails (using RPC or direct query)
  const authUsers: Array<{ id: string; email?: string }> = [];
  
  // Get all permissions
  const { data: permissions, error: permError } = await supabase
    .from("user_permissions")
    .select("user_id, permission");

  if (permError) throw permError;

  // Build permission map
  const permissionMap = new Map<string, PermissionType[]>();
  permissions?.forEach(p => {
    if (!permissionMap.has(p.user_id)) {
      permissionMap.set(p.user_id, []);
    }
    permissionMap.get(p.user_id)?.push(p.permission as PermissionType);
  });

  // Combine data
  return (profiles || []).map(profile => {
    const authUser = authUsers?.find(u => u.id === profile.id);
    return {
      id: profile.id,
      full_name: profile.full_name,
      role: profile.role,
      email: authUser?.email,
      permissions: permissionMap.get(profile.id) || []
    };
  });
};

// Grant permission to user
export const grantPermission = async (
  userId: string,
  permission: PermissionType
): Promise<void> => {
  const { error } = await supabase
    .from("user_permissions")
    .insert({
      user_id: userId,
      permission,
      assigned_by: (await supabase.auth.getUser()).data.user?.id
    });

  if (error) throw error;
};

// Revoke permission from user
export const revokePermission = async (
  userId: string,
  permission: PermissionType
): Promise<void> => {
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

  // Also update in user_roles table
  const { error: roleError } = await supabase
    .from("user_roles")
    .update({ role: newRole })
    .eq("user_id", userId);

  if (roleError) throw roleError;
};

// Get permission labels for display
export const getPermissionLabel = (permission: PermissionType): string => {
  const labels: Record<PermissionType, string> = {
    criar_materia: "Criar Matéria",
    editar_materia: "Editar Matéria",
    excluir_materia: "Excluir Matéria",
    criar_bloco: "Criar Bloco",
    editar_bloco: "Editar Bloco",
    excluir_bloco: "Excluir Bloco",
    criar_telejornal: "Criar Telejornal",
    editar_telejornal: "Editar Telejornal",
    excluir_telejornal: "Excluir Telejornal",
    gerenciar_espelho: "Gerenciar Espelho",
    fechar_espelho: "Fechar Espelho",
    criar_pauta: "Criar Pauta",
    editar_pauta: "Editar Pauta",
    excluir_pauta: "Excluir Pauta",
    visualizar_todas_pautas: "Visualizar Todas Pautas",
    gerenciar_usuarios: "Gerenciar Usuários",
    gerenciar_permissoes: "Gerenciar Permissões",
    visualizar_snapshots: "Visualizar Snapshots",
    excluir_snapshots: "Excluir Snapshots"
  };
  return labels[permission];
};

// Get all available permissions
export const getAllPermissions = (): PermissionType[] => {
  return [
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
  ];
};

// Get default permissions for a given role
export const getDefaultRolePermissions = (role: UserRole): PermissionType[] => {
  const rolePermissions: Record<UserRole, PermissionType[]> = {
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
    ],
    editor: [
      'criar_materia',
      'editar_materia',
      'excluir_materia',
      'criar_bloco',
      'editar_bloco',
      'excluir_bloco',
      'criar_telejornal',
      'editar_telejornal',
      'gerenciar_espelho',
      'visualizar_snapshots'
    ],
    reporter: [
      'criar_materia',
      'editar_materia'
    ],
    produtor: [
      'criar_pauta',
      'editar_pauta',
      'excluir_pauta'
    ]
  };

  return rolePermissions[role] || [];
};

// Get user's effective permissions (role + extra permissions)
export const getUserEffectivePermissions = async (userId: string): Promise<{
  rolePermissions: PermissionType[];
  extraPermissions: PermissionType[];
  allPermissions: PermissionType[];
}> => {
  // Get user's role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  const rolePermissions = getDefaultRolePermissions(profile.role);

  // Get user's extra permissions
  const { data: userPerms, error: permsError } = await supabase
    .from("user_permissions")
    .select("permission")
    .eq("user_id", userId);

  if (permsError) throw permsError;

  const extraPermissions = (userPerms || []).map(p => p.permission as PermissionType);

  // Combine all unique permissions
  const allPermissions = Array.from(new Set([...rolePermissions, ...extraPermissions]));

  return {
    rolePermissions,
    extraPermissions,
    allPermissions
  };
};
