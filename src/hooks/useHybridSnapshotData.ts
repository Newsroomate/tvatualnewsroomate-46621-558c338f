
import { useState, useEffect } from "react";
import { fetchMateriaSnapshotsBySnapshot, MateriaSnapshot } from "@/services/materias-snapshots-api";
import { ClosedRundownSnapshot } from "@/services/snapshots-api";

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
  isEdited?: boolean; // Flag para indicar se foi editada
}

interface UseHybridSnapshotDataProps {
  snapshot: ClosedRundownSnapshot;
}

export const useHybridSnapshotData = ({ snapshot }: UseHybridSnapshotDataProps) => {
  const [hybridData, setHybridData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHybridData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Loading hybrid data for snapshot:", snapshot.id);
      
      // Buscar matérias editadas da tabela materias_snapshots
      const editedMaterias = await fetchMateriaSnapshotsBySnapshot(snapshot.id);
      console.log("Found edited materias:", editedMaterias.length);
      
      // Criar mapa de matérias editadas por ID
      const editedMateriasMap = new Map<string, MateriaSnapshot>();
      editedMaterias.forEach(materia => {
        if (materia.materia_original_id) {
          editedMateriasMap.set(materia.materia_original_id, materia);
        } else {
          editedMateriasMap.set(materia.id, materia);
        }
      });
      
      // Processar blocos do snapshot original
      const blocos = snapshot.estrutura_completa.blocos || [];
      const processedBlocos = blocos.map((bloco, blocoIndex) => {
        const materias = getMateriasList(bloco);
        
        const processedMaterias = materias.map(materia => {
          // Verificar se existe versão editada
          const editedVersion = editedMateriasMap.get(materia.id);
          
          if (editedVersion) {
            console.log("Using edited version for materia:", materia.id);
            // Usar dados editados, mas manter estrutura de bloco
            return {
              ...materia,
              retranca: editedVersion.retranca,
              clip: editedVersion.clip,
              duracao: editedVersion.duracao,
              texto: editedVersion.texto,
              cabeca: editedVersion.cabeca,
              gc: editedVersion.gc,
              status: editedVersion.status,
              pagina: editedVersion.pagina,
              reporter: editedVersion.reporter,
              tags: editedVersion.tags,
              local_gravacao: editedVersion.local_gravacao,
              tipo_material: editedVersion.tipo_material,
              tempo_clip: editedVersion.tempo_clip,
              isEdited: true
            } as HybridMateriaData;
          }
          
          // Usar dados originais
          return {
            ...materia,
            isEdited: false
          } as HybridMateriaData;
        });
        
        return {
          ...bloco,
          materias: processedMaterias,
          items: processedMaterias // Para compatibilidade
        };
      });
      
      setHybridData(processedBlocos);
      console.log("Hybrid data loaded successfully:", processedBlocos.length, "blocos");
      
    } catch (err: any) {
      console.error("Error loading hybrid data:", err);
      setError(err.message || "Erro ao carregar dados híbridos");
      
      // Fallback para dados originais
      const originalBlocos = snapshot.estrutura_completa.blocos || [];
      const fallbackBlocos = originalBlocos.map(bloco => ({
        ...bloco,
        materias: getMateriasList(bloco).map(materia => ({
          ...materia,
          isEdited: false
        })),
        items: getMateriasList(bloco).map(materia => ({
          ...materia,
          isEdited: false
        }))
      }));
      
      setHybridData(fallbackBlocos);
    } finally {
      setIsLoading(false);
    }
  };

  const getMateriasList = (bloco: any) => {
    if (bloco.materias && Array.isArray(bloco.materias)) {
      return bloco.materias;
    }
    if (bloco.items && Array.isArray(bloco.items)) {
      return bloco.items;
    }
    return [];
  };

  const refreshData = () => {
    loadHybridData();
  };

  const updateLocalMateria = (materiaId: string, updates: Partial<HybridMateriaData>) => {
    setHybridData(prevBlocos => 
      prevBlocos.map(bloco => ({
        ...bloco,
        materias: bloco.materias?.map((materia: HybridMateriaData) =>
          materia.id === materiaId
            ? { ...materia, ...updates, isEdited: true }
            : materia
        ),
        items: bloco.items?.map((materia: HybridMateriaData) =>
          materia.id === materiaId
            ? { ...materia, ...updates, isEdited: true }
            : materia
        )
      }))
    );
  };

  useEffect(() => {
    loadHybridData();
  }, [snapshot.id]);

  return {
    hybridData,
    isLoading,
    error,
    refreshData,
    updateLocalMateria
  };
};
