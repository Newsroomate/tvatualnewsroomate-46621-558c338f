import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PermissionType } from "@/services/user-permissions-api";
import { useAuth } from "@/context/AuthContext";

export const useUserPermissions = () => {
  const { user } = useAuth();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["user-permissions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get user profile to know their role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) return [];

      // Start with role's default permissions
      const rolePermissions = new Set(
        await import("@/services/user-permissions-api").then(m => 
          m.getDefaultRolePermissions(profile.role)
        )
      );

      // Get permission overrides
      const { data, error } = await supabase
        .from("user_permissions")
        .select("permission, is_granted")
        .eq("user_id", user.id);

      if (error) throw error;

      // Apply overrides
      if (data) {
        for (const override of data) {
          if (override.is_granted) {
            rolePermissions.add(override.permission as PermissionType);
          } else {
            rolePermissions.delete(override.permission as PermissionType);
          }
        }
      }

      return Array.from(rolePermissions);
    },
    enabled: !!user?.id,
  });

  const hasPermission = (permission: PermissionType): boolean => {
    return permissions.includes(permission);
  };

  return {
    permissions,
    hasPermission,
    isLoading,
  };
};
