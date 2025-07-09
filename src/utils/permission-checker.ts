
import { UserProfile } from "@/types/auth";

export const canDeleteMaterias = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  return profile.role === 'editor_chefe';
};

export const canBatchDeleteMaterias = (profile: UserProfile | null): boolean => {
  return canDeleteMaterias(profile);
};

export const canCreateBlocks = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  return profile.role === 'editor_chefe' || profile.role === 'editor';
};

export const canCopyAndPasteBlocks = (profile: UserProfile | null): boolean => {
  return canCreateBlocks(profile);
};

export const getPermissionErrorMessage = (action: string): string => {
  switch (action) {
    case 'delete_materia':
      return 'Apenas o Editor-Chefe pode excluir matérias.';
    case 'batch_delete_materias':
      return 'Apenas o Editor-Chefe pode excluir matérias em lote.';
    case 'create_block':
      return 'Apenas Editores e Editor-Chefe podem criar blocos.';
    case 'copy_paste_block':
      return 'Apenas Editores e Editor-Chefe podem copiar e colar blocos.';
    default:
      return 'Você não tem permissão para realizar esta ação.';
  }
};
