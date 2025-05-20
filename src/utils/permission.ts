
import { UserProfile, UserRole } from "@/types/auth";

// Check if user has specific role
export const hasRole = (profile: UserProfile | null, role: UserRole): boolean => {
  if (!profile) return false;
  return profile.role === role;
};

// Check if user is at least an editor (editor or editor-chefe)
export const isAtLeastEditor = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  return ['editor', 'editor_chefe'].includes(profile.role);
};

// Check if user is editor-chefe
export const isEditorChefe = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  return profile.role === 'editor_chefe';
};

// Check if user can modify pautas
export const canModifyPautas = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  return ['produtor', 'editor_chefe'].includes(profile.role);
};

// Check if user can create espelhos (telejornal)
export const canCreateEspelhos = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  return ['editor', 'editor_chefe'].includes(profile.role);
};

// Check if user can create/modify matérias
export const canModifyMaterias = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  return ['reporter', 'editor', 'editor_chefe'].includes(profile.role);
};
