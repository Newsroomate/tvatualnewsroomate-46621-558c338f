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

      const { data, error } = await supabase
        .from("user_permissions")
        .select("permission")
        .eq("user_id", user.id);

      if (error) throw error;

      return (data || []).map(p => p.permission as PermissionType);
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
