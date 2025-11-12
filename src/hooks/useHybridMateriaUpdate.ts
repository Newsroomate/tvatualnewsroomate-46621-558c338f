
import { useState } from "react";
import { updateMateria } from "@/services/materias-api";
import { updateMateriaSnapshot, MateriaSnapshot } from "@/services/materias-snapshots-api";
import { Materia } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface HybridMateriaData {
  id: string;
  retranca: string;
  clip?: string;
  duracao: number;
  texto?: string;
  cabeca?: string;
  gc?: string;
  status?: string;
  pagina?: string;
  reporter?: string;
  ordem: number;
  tags?: string[];
  local_gravacao?: string;
  bloco_id?: string;
  bloco_nome?: string;
  bloco_ordem?: number;
  tipo_material?: string;
  tempo_clip?: string;
}

export const useHybridMateriaUpdate = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const updateMateriaHybrid = async (
    materiaData: HybridMateriaData,
    isFromSnapshot: boolean = false,
    snapshotId?: string
  ): Promise<Materia | MateriaSnapshot> => {
    setIsSaving(true);
    
    try {
      console.log("Hybrid update:", { materiaData, isFromSnapshot, snapshotId });

      // Se não é de snapshot ou se tem bloco_id válido, tenta atualizar na tabela normal
      if (!isFromSnapshot && materiaData.bloco_id) {
        try {
          const updatePayload = {
            retranca: materiaData.retranca.trim(),
            clip: materiaData.clip || null,
            duracao: materiaData.duracao || 0,
            texto: materiaData.texto || null,
            cabeca: materiaData.cabeca || null,
            gc: materiaData.gc || null,
            status: materiaData.status || 'draft',
            pagina: materiaData.pagina || null,
            reporter: materiaData.reporter || null,
            tags: materiaData.tags || [],
            local_gravacao: materiaData.local_gravacao || null,
            tempo_clip: materiaData.clip || null,
            ordem: materiaData.ordem,
            bloco_id: materiaData.bloco_id,
            tipo_material: materiaData.tipo_material || null
          };

          const updatedMateria = await updateMateria(materiaData.id, updatePayload);
          
          toast({
            title: "Sucesso",
            description: "Matéria atualizada com sucesso.",
          });

          return updatedMateria;
        } catch (error: any) {
          console.warn("Failed to update in materias table, trying snapshots:", error);
          // Se falhar por FK constraint, continua para snapshot
          if (!error.message?.includes('foreign key') && !error.message?.includes('violates')) {
            throw error; // Re-throw se não for erro de FK
          }
        }
      }

      // Atualiza ou cria na tabela de snapshots
      const snapshotPayload = {
        retranca: materiaData.retranca.trim(),
        clip: materiaData.clip || null,
        duracao: materiaData.duracao || 0,
        texto: materiaData.texto || null,
        cabeca: materiaData.cabeca || null,
        gc: materiaData.gc || null,
        status: materiaData.status || 'draft',
        pagina: materiaData.pagina || null,
        reporter: materiaData.reporter || null,
        tags: materiaData.tags || [],
        local_gravacao: materiaData.local_gravacao || null,
        tempo_clip: materiaData.tempo_clip || null,
        ordem: materiaData.ordem,
        bloco_nome: materiaData.bloco_nome || 'Bloco',
        bloco_ordem: materiaData.bloco_ordem || 1,
        tipo_material: materiaData.tipo_material || null,
        snapshot_id: snapshotId,
        materia_original_id: materiaData.id
      };

      const updatedSnapshot = await updateMateriaSnapshot(materiaData.id, snapshotPayload);
      
      toast({
        title: "Sucesso",
        description: "Matéria de snapshot atualizada com sucesso.",
      });

      return updatedSnapshot;
      
    } catch (error: any) {
      console.error("Erro no hybrid update:", error);
      
      let errorMessage = "Erro desconhecido ao salvar as alterações.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    updateMateriaHybrid,
    isSaving
  };
};
