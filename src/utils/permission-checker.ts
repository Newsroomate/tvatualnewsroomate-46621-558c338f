
import { UserProfile } from "@/types/auth";

export const canDeleteMaterias = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  return profile.role === 'editor_chefe';
};

export const canBatchDeleteMaterias = (profile: UserProfile | null): boolean => {
  return canDeleteMaterias(profile);
};

export const getPermissionErrorMessage = (action: string): string => {
  switch (action) {
    case 'delete_materia':
      return 'Apenas o Editor-Chefe pode excluir matérias.';
    case 'batch_delete_materias':
      return 'Apenas o Editor-Chefe pode excluir matérias em lote.';
    default:
      return 'Você não tem permissão para realizar esta ação.';
  }
};
