
import { useState, useEffect } from 'react';
import { fetchMateriaSnapshotsBySnapshot } from '@/services/materias-snapshots-api';
import { ClosedRundownSnapshot } from '@/services/snapshots-api';
import { EditableMateria } from '@/components/general-schedule/types';
import { useToast } from '@/hooks/use-toast';

interface UseHybridSnapshotDataProps {
  snapshot: ClosedRundownSnapshot;
}

interface HybridBloco {
  id: string;
  nome: string;
  ordem: number;
  materias: any[];
}

export const useHybridSnapshotData = ({ snapshot }: UseHybridSnapshotDataProps) => {
  const [hybridData, setHybridData] = useState<HybridBloco[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadHybridData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Carregando dados híbridos para snapshot:', snapshot.id);

      // Primeiro, tentar buscar matérias da tabela materias_snapshots
      const snapshotMaterias = await fetchMateriaSnapshotsBySnapshot(snapshot.id);
      
      console.log('Matérias do snapshot encontradas:', {
        total: snapshotMaterias.length,
        comGC: snapshotMaterias.filter(m => m.gc && m.gc.length > 0).length,
        materias: snapshotMaterias.map(m => ({
          retranca: m.retranca,
          gc: m.gc,
          gcLength: m.gc?.length || 0
        }))
      });

      // Se encontrou matérias na tabela de snapshots, usar essas
      if (snapshotMaterias.length > 0) {
        const blocosAgrupados: { [key: string]: HybridBloco } = {};

        snapshotMaterias.forEach(materia => {
          const blocoNome = materia.bloco_nome || 'Bloco Sem Nome';
          const blocoOrdem = materia.bloco_ordem || 1;
          const blocoId = `snapshot-${blocoNome}-${blocoOrdem}`;

          if (!blocosAgrupados[blocoId]) {
            blocosAgrupados[blocoId] = {
              id: blocoId,
              nome: blocoNome,
              ordem: blocoOrdem,
              materias: []
            };
          }

          // Garantir que todos os campos sejam preservados, incluindo GC
          const materiaCompleta = {
            id: materia.id,
            retranca: materia.retranca,
            clip: materia.clip,
            duracao: materia.duracao || 0,
            texto: materia.texto,
            cabeca: materia.cabeca,
            gc: materia.gc, // Preservar GC
            status: materia.status || 'draft',
            pagina: materia.pagina,
            reporter: materia.reporter,
            ordem: materia.ordem,
            tags: materia.tags || [],
            local_gravacao: materia.local_gravacao,
            equipamento: materia.equipamento,
            tipo_material: materia.tipo_material,
            tempo_clip: materia.tempo_clip,
            bloco_nome: blocoNome,
            bloco_ordem: blocoOrdem,
            is_snapshot: true
          };

          console.log('Matéria processada (verificando GC):', {
            retranca: materiaCompleta.retranca,
            gc: materiaCompleta.gc,
            gcPresente: !!materiaCompleta.gc,
            gcLength: materiaCompleta.gc?.length || 0
          });

          blocosAgrupados[blocoId].materias.push(materiaCompleta);
        });

        // Ordenar blocos e matérias
        const blocosOrdenados = Object.values(blocosAgrupados)
          .sort((a, b) => a.ordem - b.ordem)
          .map(bloco => ({
            ...bloco,
            materias: bloco.materias.sort((a, b) => a.ordem - b.ordem)
          }));

        console.log('Dados híbridos processados:', {
          blocos: blocosOrdenados.length,
          totalMaterias: blocosOrdenados.reduce((sum, b) => sum + b.materias.length, 0),
          materiasComGC: blocosOrdenados.flatMap(b => b.materias).filter(m => m.gc && m.gc.length > 0).length
        });

        setHybridData(blocosOrdenados);
      } else {
        // Fallback: usar estrutura_completa do snapshot
        console.log('Usando estrutura_completa como fallback');
        
        const blocos = snapshot.estrutura_completa?.blocos || [];
        const blocosProcessados = blocos.map(bloco => ({
          id: bloco.id,
          nome: bloco.nome,
          ordem: bloco.ordem,
          materias: (bloco.materias || bloco.items || []).map(materia => ({
            ...materia,
            // Garantir que GC seja preservado mesmo no fallback
            gc: materia.gc,
            bloco_nome: bloco.nome,
            bloco_ordem: bloco.ordem,
            is_snapshot: true
          }))
        }));

        console.log('Dados de fallback processados (verificando GC):', {
          blocos: blocosProcessados.length,
          materiasComGC: blocosProcessados.flatMap(b => b.materias).filter(m => m.gc && m.gc.length > 0).length
        });

        setHybridData(blocosProcessados);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados híbridos:', err);
      setError(err.message || 'Erro ao carregar dados');
      toast({
        title: "Erro ao carregar dados",
        description: err.message || "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocalMateria = (materiaId: string, updates: Partial<EditableMateria>) => {
    console.log('Atualizando matéria local (incluindo GC):', {
      id: materiaId,
      updates: updates,
      gcUpdate: updates.gc,
      gcLength: updates.gc?.length || 0
    });

    setHybridData(prevData => 
      prevData.map(bloco => ({
        ...bloco,
        materias: bloco.materias.map(materia => 
          materia.id === materiaId 
            ? { 
                ...materia, 
                ...updates,
                // Garantir que GC seja atualizado localmente
                gc: updates.gc !== undefined ? updates.gc : materia.gc,
                isEdited: true 
              }
            : materia
        )
      }))
    );
  };

  const refreshData = () => {
    console.log('Recarregando dados híbridos...');
    loadHybridData();
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
