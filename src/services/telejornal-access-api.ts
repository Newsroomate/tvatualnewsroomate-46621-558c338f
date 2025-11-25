import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";

export interface TelejornalAccessWithDetails {
  id: string;
  user_id: string;
  telejornal_id: string;
  role: UserRole;
  created_at: string;
  user_name?: string;
  telejornal_nome?: string;
}

export interface TelejornalAccessCreateInput {
  user_id: string;
  telejornal_id: string;
  role: UserRole;
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
}

export const fetchTelejornalAccess = async (): Promise<TelejornalAccessWithDetails[]> => {
  const { data: accessData, error: accessError } = await supabase
    .from("user_telejornal_access")
    .select("*")
    .order("created_at", { ascending: false });

  if (accessError) throw accessError;

  // Fetch profiles and telejornais to enrich the data
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name");

  const { data: telejornais } = await supabase
    .from("telejornais")
    .select("id, nome");

  const profileMap = new Map(profiles?.map(p => [p.id, p.full_name || "Sem nome"]) || []);
  const telejornalMap = new Map(telejornais?.map(t => [t.id, t.nome]) || []);

  return (accessData || []).map(access => ({
    ...access,
    user_name: profileMap.get(access.user_id),
    telejornal_nome: telejornalMap.get(access.telejornal_id),
  }));
};

export const createTelejornalAccess = async (
  data: TelejornalAccessCreateInput
): Promise<TelejornalAccessWithDetails> => {
  const { data: newAccess, error } = await supabase
    .from("user_telejornal_access")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return newAccess;
};

export const updateTelejornalAccess = async (
  id: string,
  updates: Partial<TelejornalAccessCreateInput>
): Promise<TelejornalAccessWithDetails> => {
  const { data: updatedAccess, error } = await supabase
    .from("user_telejornal_access")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return updatedAccess;
};

export const deleteTelejornalAccess = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("user_telejornal_access")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

export const fetchAllProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name");

  if (error) throw error;
  return data || [];
};
